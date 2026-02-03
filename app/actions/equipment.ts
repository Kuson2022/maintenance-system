"use server";

/**
 * Equipment Server Actions
 * Server actions for Equipment CRUD operations
 */

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  createEquipmentSchema,
  updateEquipmentSchema,
  equipmentFiltersSchema,
  paginationSchema,
  createCategorySchema,
  updateCategorySchema,
} from "@/lib/api/equipment/validation";
import {
  getEquipments,
  getEquipmentById,
  getEquipmentByQrCode,
  getEquipmentStats,
  getEquipmentDetailStats,
  getEquipmentCategories,
  getEquipmentLocations,
  getEquipmentFloors,
  isEquipmentCodeExists,
  isSerialNumberExists,
  createEquipment,
  updateEquipment,
  updateEquipmentStatus,
  retireEquipment,
  deleteEquipment,
  createCategory,
  updateCategory,
  deleteCategory,
  bulkUpdateStatus,
  bulkAssignResponsible,
  generateQrCodeImage,
  checkEquipmentPermissions,
} from "@/lib/api/equipment";
import { EquipmentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getCachedCategories,
  getCachedFloors,
  getCachedLocations,
} from "@/lib/api/equipment/cached-queries";
import {
  invalidateEquipmentCaches,
  invalidateCategoriesCache,
} from "@/lib/cache";

// =====================================
// TYPES
// =====================================

interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// =====================================
// HELPER FUNCTIONS
// =====================================

async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("กรุณาเข้าสู่ระบบ");
  }

  return user;
}

/**
 * Get current user with role from database
 */
async function getUserWithRole() {
  const authUser = await getCurrentUser();

  const dbUser = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: {
      id: true,
      role: true,
      status: true,
    },
  });

  if (!dbUser) {
    throw new Error("ไม่พบข้อมูลผู้ใช้งาน");
  }

  return {
    ...authUser,
    role: dbUser.role,
    dbStatus: dbUser.status,
  };
}

/**
 * Check if user has required role
 */
function requireRole(userRole: string, allowedRoles: string[]) {
  if (!allowedRoles.includes(userRole)) {
    throw new Error("คุณไม่มีสิทธิ์ดำเนินการนี้");
  }
}

/**
 * Serialize data for client (convert Decimal, Date to plain values)
 */
function serializeData<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_, value) => {
      if (typeof value === "bigint") {
        return value.toString();
      }
      if (value instanceof Date) {
        return value.toISOString();
      }
      if (value && typeof value === "object" && "toNumber" in value) {
        return value.toNumber();
      }
      return value;
    })
  );
}

// =====================================
// PERMISSION ACTIONS
// =====================================

/**
 * ตรวจสอบสิทธิ์การเข้าถึง Equipment
 */
export async function checkEquipmentPermissionsAction(
  equipmentId?: string
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();

    const permissions = await checkEquipmentPermissions(user.id, equipmentId);

    return {
      success: true,
      data: permissions,
    };
  } catch (error: any) {
    console.error("checkEquipmentPermissionsAction error:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์",
    };
  }
}

// =====================================
// INIT DATA ACTION (Combined for performance)
// =====================================

/**
 * ดึงข้อมูลเริ่มต้นสำหรับหน้า Equipment List (รวม categories, floors, permissions)
 * ใช้แทน 4 API calls แยกกันเพื่อลดเวลาโหลด
 */
export async function getEquipmentInitDataAction(): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();

    const [categories, floors, permissions] = await Promise.all([
      getCachedCategories(),
      getCachedFloors(),
      checkEquipmentPermissions(user.id),
    ]);

    return {
      success: true,
      data: {
        categories: serializeData(categories),
        floors,
        permissions,
      },
    };
  } catch (error: any) {
    console.error("getEquipmentInitDataAction error:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูลเริ่มต้น",
    };
  }
}

// =====================================
// READ ACTIONS
// =====================================

/**
 * ดึงรายการเครื่องจักร
 */
export async function getEquipmentsAction(params: {
  filters?: any;
  pagination?: any;
}): Promise<ActionResponse> {
  try {
    await getCurrentUser();

    const filters = equipmentFiltersSchema.parse(params.filters || {});
    const pagination = paginationSchema.parse(params.pagination || {});

    const result = await getEquipments(filters, pagination);

    return {
      success: true,
      data: serializeData(result),
    };
  } catch (error: any) {
    console.error("getEquipmentsAction error:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูล",
    };
  }
}

/**
 * ดึงเครื่องจักรที่ Active ทั้งหมด (สำหรับ dropdown/selector)
 */
export async function getActiveEquipmentAction(): Promise<ActionResponse> {
  try {
    await getCurrentUser();

    const result = await getEquipments(
      { status: "ACTIVE" as const },
      { pageSize: 1000, sortBy: "name", sortOrder: "asc" }
    );

    return {
      success: true,
      data: serializeData(result.data),
    };
  } catch (error: any) {
    console.error("getActiveEquipmentAction error:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูล",
    };
  }
}

/**
 * ดึงเครื่องจักรทั้งหมดที่ไม่ใช่ RETIRED (สำหรับ dropdown/selector)
 */
export async function getAvailableEquipmentAction(): Promise<ActionResponse> {
  try {
    await getCurrentUser();

    const result = await getEquipments(
      { status: { not: "RETIRED" } } as any,
      { pageSize: 1000, sortBy: "name", sortOrder: "asc" }
    );

    return {
      success: true,
      data: serializeData(result.data),
    };
  } catch (error: any) {
    console.error("getAvailableEquipmentAction error:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูล",
    };
  }
}

/**
 * ดึงเครื่องจักรตาม ID
 */
export async function getEquipmentByIdAction(
  id: string
): Promise<ActionResponse> {
  try {
    await getCurrentUser();

    const equipment = await getEquipmentById(id);

    if (!equipment) {
      return {
        success: false,
        error: "ไม่พบเครื่องจักร",
      };
    }

    return {
      success: true,
      data: serializeData(equipment),
    };
  } catch (error: any) {
    console.error("getEquipmentByIdAction error:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูล",
    };
  }
}

/**
 * ดึงเครื่องจักรตาม QR Code
 */
export async function getEquipmentByQrCodeAction(
  qrCode: string
): Promise<ActionResponse> {
  try {
    await getCurrentUser();

    const equipment = await getEquipmentByQrCode(qrCode);

    if (!equipment) {
      return {
        success: false,
        error: "ไม่พบเครื่องจักรจาก QR Code นี้",
      };
    }

    return {
      success: true,
      data: serializeData(equipment),
    };
  } catch (error: any) {
    console.error("getEquipmentByQrCodeAction error:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูล",
    };
  }
}

/**
 * ดึงสถิติเครื่องจักร
 */
export async function getEquipmentStatsAction(): Promise<ActionResponse> {
  try {
    await getCurrentUser();

    const stats = await getEquipmentStats();

    return {
      success: true,
      data: serializeData(stats),
    };
  } catch (error: any) {
    console.error("getEquipmentStatsAction error:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการดึงสถิติ",
    };
  }
}

/**
 * ดึงสถิติละเอียดของเครื่องจักร
 */
export async function getEquipmentDetailStatsAction(
  equipmentId: string
): Promise<ActionResponse> {
  try {
    await getCurrentUser();

    const stats = await getEquipmentDetailStats(equipmentId);

    return {
      success: true,
      data: serializeData(stats),
    };
  } catch (error: any) {
    console.error("getEquipmentDetailStatsAction error:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการดึงสถิติ",
    };
  }
}

/**
 * ดึงหมวดหมู่ทั้งหมด
 */
export async function getEquipmentCategoriesAction(): Promise<ActionResponse> {
  try {
    await getCurrentUser();

    const categories = await getEquipmentCategories();

    return {
      success: true,
      data: serializeData(categories),
    };
  } catch (error: any) {
    console.error("getEquipmentCategoriesAction error:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการดึงหมวดหมู่",
    };
  }
}

/**
 * ดึงรายชื่อสถานที่
 */
export async function getEquipmentLocationsAction(
  floor?: string
): Promise<ActionResponse> {
  try {
    await getCurrentUser();

    const locations = await getCachedLocations(floor);

    return {
      success: true,
      data: locations,
    };
  } catch (error: any) {
    console.error("getEquipmentLocationsAction error:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการดึงสถานที่",
    };
  }
}

/**
 * ดึงรายชื่อชั้น
 */
export async function getEquipmentFloorsAction(): Promise<ActionResponse> {
  try {
    await getCurrentUser();

    const floors = await getEquipmentFloors();

    return {
      success: true,
      data: floors,
    };
  } catch (error: any) {
    console.error("getEquipmentFloorsAction error:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูลชั้น",
    };
  }
}

/**
 * สร้าง QR Code Image
 */
export async function generateQrCodeImageAction(
  qrCode: string
): Promise<ActionResponse> {
  try {
    await getCurrentUser();

    const imageDataUrl = await generateQrCodeImage(qrCode);

    return {
      success: true,
      data: imageDataUrl,
    };
  } catch (error: any) {
    console.error("generateQrCodeImageAction error:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการสร้าง QR Code",
    };
  }
}

/**
 * ดึงรายการเครื่องจักรที่ประกันใกล้หมดอายุ (90 วัน)
 */
export async function getWarrantyAlertsAction(): Promise<ActionResponse> {
  try {
    await getCurrentUser();

    const { prisma } = await import("@/lib/prisma");
    const now = new Date();
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const equipments = await prisma.equipment.findMany({
      where: {
        warrantyExpiry: {
          lte: ninetyDaysFromNow,
          not: null,
        },
        status: { not: "RETIRED" },
      },
      select: {
        id: true,
        code: true,
        name: true,
        warrantyExpiry: true,
      },
      orderBy: { warrantyExpiry: "asc" },
      take: 10,
    });

    const alerts = equipments.map((eq) => {
      const expiryDate = new Date(eq.warrantyExpiry!);
      const daysRemaining = Math.ceil(
        (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        id: eq.id,
        code: eq.code,
        name: eq.name,
        warrantyExpiry: eq.warrantyExpiry!.toISOString(),
        daysRemaining,
      };
    });

    return {
      success: true,
      data: alerts,
    };
  } catch (error: any) {
    console.error("getWarrantyAlertsAction error:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูลประกัน",
    };
  }
}

/**
 * ดึงสรุปค่าใช้จ่ายของเครื่องจักร
 */
export async function getEquipmentExpensesAction(
  equipmentId: string
): Promise<ActionResponse> {
  try {
    await getCurrentUser();

    const { prisma } = await import("@/lib/prisma");
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get total expenses
    const totalExpenses = await prisma.expense.aggregate({
      where: { equipmentId },
      _sum: { total: true },
    });

    // Get expenses by type
    const expensesByType = await prisma.expense.groupBy({
      by: ["expenseTypeId"],
      where: { equipmentId },
      _sum: { total: true },
    });

    // Get expense type names
    const expenseTypeIds = expensesByType.map((e) => e.expenseTypeId);
    const expenseTypes = await prisma.expenseType.findMany({
      where: { id: { in: expenseTypeIds } },
      select: { id: true, name: true },
    });

    const typeMap = new Map(expenseTypes.map((t) => [t.id, t.name]));

    const byType = expensesByType.map((item) => ({
      typeId: item.expenseTypeId,
      typeName: typeMap.get(item.expenseTypeId) || "ไม่ระบุ",
      total: item._sum.total?.toNumber() || 0,
    })).sort((a, b) => b.total - a.total);

    // Get recent expenses count
    const recentCount = await prisma.expense.count({
      where: {
        equipmentId,
        date: { gte: thirtyDaysAgo },
      },
    });

    return {
      success: true,
      data: {
        totalExpenses: totalExpenses._sum.total?.toNumber() || 0,
        byType,
        recentCount,
      },
    };
  } catch (error: any) {
    console.error("getEquipmentExpensesAction error:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูลค่าใช้จ่าย",
    };
  }
}

// =====================================
// CREATE ACTIONS
// =====================================

/**
 * สร้างเครื่องจักรใหม่
 */
export async function createEquipmentAction(
  data: any
): Promise<ActionResponse> {
  try {
    const user = await getUserWithRole();
    requireRole(user.role, ["ADMIN", "TECHNICIAN"]);

    // Validate input
    const validatedData = createEquipmentSchema.parse(data);

    // Check if code exists
    if (await isEquipmentCodeExists(validatedData.code)) {
      return {
        success: false,
        error: "รหัสเครื่องจักรนี้มีอยู่แล้วในระบบ",
      };
    }

    // Check if serial number exists (if provided)
    if (
      validatedData.serialNumber &&
      (await isSerialNumberExists(validatedData.serialNumber))
    ) {
      return {
        success: false,
        error: "หมายเลข Serial Number นี้มีอยู่แล้วในระบบ",
      };
    }

    const equipment = await createEquipment({
      ...validatedData,
      installationDate: validatedData.installationDate || null,
      warrantyExpiry: validatedData.warrantyExpiry || null,
    });

    revalidatePath("/dashboard/equipment");
    invalidateEquipmentCaches(); // Invalidate floors and locations cache

    return {
      success: true,
      data: serializeData(equipment),
    };
  } catch (error: any) {
    console.error("createEquipmentAction error:", error);

    if (error.name === "ZodError") {
      return {
        success: false,
        error: error.errors[0]?.message || "ข้อมูลไม่ถูกต้อง",
      };
    }

    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการสร้างเครื่องจักร",
    };
  }
}

// =====================================
// UPDATE ACTIONS
// =====================================

/**
 * อัปเดตเครื่องจักร
 */
export async function updateEquipmentAction(
  data: any
): Promise<ActionResponse> {
  try {
    const user = await getUserWithRole();
    requireRole(user.role, ["ADMIN", "TECHNICIAN"]);

    // Validate input
    const validatedData = updateEquipmentSchema.parse(data);

    // Check if code exists (if code is being updated)
    if (validatedData.code) {
      if (await isEquipmentCodeExists(validatedData.code, validatedData.id)) {
        return {
          success: false,
          error: "รหัสเครื่องจักรนี้มีอยู่แล้วในระบบ",
        };
      }
    }

    // Check if serial number exists (if provided)
    if (validatedData.serialNumber) {
      if (
        await isSerialNumberExists(validatedData.serialNumber, validatedData.id)
      ) {
        return {
          success: false,
          error: "หมายเลข Serial Number นี้มีอยู่แล้วในระบบ",
        };
      }
    }

    // Check if image has changed and delete old image
    if (validatedData.image !== undefined) {
      const currentEquipment = await prisma.equipment.findUnique({
        where: { id: validatedData.id },
        select: { image: true },
      });

      if (
        currentEquipment?.image &&
        currentEquipment.image !== validatedData.image
      ) {
        // Extract file path from URL
        // Expected URL format: .../storage/v1/object/public/attachments/folder/filename
        // We need to extract: folder/filename
        try {
          const url = new URL(currentEquipment.image);
          const pathParts = url.pathname.split("/attachments/");
          if (pathParts.length > 1) {
            const filePath = decodeURIComponent(pathParts[1]); // e.g. "equipment/filename.jpg"

            console.log(`Deleting old equipment image: ${filePath}`);

            const supabase = createAdminClient();
            await supabase.storage
              .from("attachments")
              .remove([filePath]);
          }
        } catch (e) {
          console.error("Error deleting old image:", e);
        }
      }
    }

    const equipment = await updateEquipment(validatedData);

    revalidatePath("/dashboard/equipment");
    revalidatePath(`/dashboard/equipment/${validatedData.id}`);
    invalidateEquipmentCaches(); // Invalidate floors and locations cache

    return {
      success: true,
      data: serializeData(equipment),
    };
  } catch (error: any) {
    console.error("updateEquipmentAction error:", error);

    if (error.name === "ZodError") {
      return {
        success: false,
        error: error.errors[0]?.message || "ข้อมูลไม่ถูกต้อง",
      };
    }

    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการอัปเดตเครื่องจักร",
    };
  }
}

/**
 * อัปเดตสถานะเครื่องจักร
 */
export async function updateEquipmentStatusAction(
  id: string,
  status: EquipmentStatus
): Promise<ActionResponse> {
  try {
    await getCurrentUser();

    const equipment = await updateEquipmentStatus(id, status);

    revalidatePath("/dashboard/equipment");
    revalidatePath(`/dashboard/equipment/${id}`);

    return {
      success: true,
      data: serializeData(equipment),
    };
  } catch (error: any) {
    console.error("updateEquipmentStatusAction error:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการอัปเดตสถานะ",
    };
  }
}

// =====================================
// DELETE ACTIONS
// =====================================

/**
 * ปลดระวางเครื่องจักร (Soft delete)
 */
export async function retireEquipmentAction(
  id: string
): Promise<ActionResponse> {
  try {
    const user = await getUserWithRole();
    requireRole(user.role, ["ADMIN"]);

    await retireEquipment(id);

    revalidatePath("/dashboard/equipment");
    invalidateEquipmentCaches();

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("retireEquipmentAction error:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการปลดระวางเครื่องจักร",
    };
  }
}

/**
 * ลบเครื่องจักรถาวร
 */
export async function deleteEquipmentAction(
  id: string
): Promise<ActionResponse> {
  try {
    const user = await getUserWithRole();
    requireRole(user.role, ["ADMIN"]);

    await deleteEquipment(id);

    revalidatePath("/dashboard/equipment");
    invalidateEquipmentCaches();

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("deleteEquipmentAction error:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการลบเครื่องจักร",
    };
  }
}

// =====================================
// BATCH ACTIONS
// =====================================

/**
 * อัปเดตสถานะหลายเครื่อง
 */
export async function bulkUpdateStatusAction(
  ids: string[],
  status: EquipmentStatus
): Promise<ActionResponse> {
  try {
    const user = await getUserWithRole();
    requireRole(user.role, ["ADMIN"]);

    const result = await bulkUpdateStatus(ids, status);

    revalidatePath("/dashboard/equipment");

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    console.error("bulkUpdateStatusAction error:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการอัปเดตสถานะ",
    };
  }
}

/**
 * มอบหมายผู้รับผิดชอบหลายเครื่อง
 */
export async function bulkAssignResponsibleAction(
  ids: string[],
  userId: string | null
): Promise<ActionResponse> {
  try {
    const user = await getUserWithRole();
    requireRole(user.role, ["ADMIN"]);

    const result = await bulkAssignResponsible(ids, userId);

    revalidatePath("/dashboard/equipment");

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    console.error("bulkAssignResponsibleAction error:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการมอบหมายผู้รับผิดชอบ",
    };
  }
}

/**
 * สร้างเครื่องจักรหลายรายการ (สำหรับ Import)
 */
export async function bulkCreateEquipmentAction(
  equipmentList: {
    code: string;
    name: string;
    categoryId: string;
    manufacturer?: string;
    model?: string;
    serialNumber?: string;
    location?: string;
    floor?: string;
    installationDate?: string;
    warrantyExpiry?: string;
    cost?: number;
    description?: string;
    specifications?: Record<string, string>;
  }[]
): Promise<ActionResponse> {
  try {
    const user = await getUserWithRole();
    requireRole(user.role, ["ADMIN"]);

    const { prisma } = await import("@/lib/prisma");

    const results: { created: number; errors: string[] } = {
      created: 0,
      errors: [],
    };

    // Process each equipment
    for (const eq of equipmentList) {
      try {
        // Check if code exists
        const existingCode = await prisma.equipment.findUnique({
          where: { code: eq.code },
        });

        if (existingCode) {
          results.errors.push(`รหัส ${eq.code} มีอยู่แล้ว`);
          continue;
        }

        // Check serial number if provided
        if (eq.serialNumber) {
          const existingSerial = await prisma.equipment.findUnique({
            where: { serialNumber: eq.serialNumber },
          });

          if (existingSerial) {
            results.errors.push(`Serial ${eq.serialNumber} มีอยู่แล้ว`);
            continue;
          }
        }

        // Generate QR code using crypto.randomUUID
        const randomId = crypto.randomUUID().slice(0, 8).toUpperCase();
        const qrCode = `EQP-${randomId}`;


        // Create equipment
        await prisma.equipment.create({
          data: {
            code: eq.code,
            name: eq.name,
            categoryId: eq.categoryId,
            manufacturer: eq.manufacturer || null,
            model: eq.model || null,
            serialNumber: eq.serialNumber || null,
            location: eq.location || null,
            floor: eq.floor || null,
            installationDate: eq.installationDate
              ? new Date(eq.installationDate)
              : null,
            warrantyExpiry: eq.warrantyExpiry
              ? new Date(eq.warrantyExpiry)
              : null,
            cost: eq.cost || null,
            description: eq.description || null,
            specifications: eq.specifications || undefined,
            qrCode,
            status: "ACTIVE",
          },
        });

        results.created++;
      } catch (error: any) {
        results.errors.push(`${eq.code}: ${error.message}`);
      }
    }

    revalidatePath("/dashboard/equipment");

    return {
      success: true,
      data: results,
    };
  } catch (error: any) {
    console.error("bulkCreateEquipmentAction error:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการสร้างเครื่องจักร",
    };
  }
}

// =====================================
// CATEGORY ACTIONS
// =====================================

/**
 * สร้างหมวดหมู่ใหม่
 */
export async function createCategoryAction(
  data: any
): Promise<ActionResponse> {
  try {
    const user = await getUserWithRole();
    requireRole(user.role, ["ADMIN"]);

    const validatedData = createCategorySchema.parse(data);
    const category = await createCategory(validatedData);

    revalidatePath("/dashboard/equipment");
    revalidatePath("/dashboard/settings");

    return {
      success: true,
      data: serializeData(category),
    };
  } catch (error: any) {
    console.error("createCategoryAction error:", error);

    if (error.name === "ZodError") {
      return {
        success: false,
        error: error.errors[0]?.message || "ข้อมูลไม่ถูกต้อง",
      };
    }

    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการสร้างหมวดหมู่",
    };
  }
}

/**
 * อัปเดตหมวดหมู่
 */
export async function updateCategoryAction(
  data: any
): Promise<ActionResponse> {
  try {
    const user = await getUserWithRole();
    requireRole(user.role, ["ADMIN"]);

    const validatedData = updateCategorySchema.parse(data);
    const category = await updateCategory(validatedData);

    revalidatePath("/dashboard/equipment");
    revalidatePath("/dashboard/settings");

    return {
      success: true,
      data: serializeData(category),
    };
  } catch (error: any) {
    console.error("updateCategoryAction error:", error);

    if (error.name === "ZodError") {
      return {
        success: false,
        error: error.errors[0]?.message || "ข้อมูลไม่ถูกต้อง",
      };
    }

    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการอัปเดตหมวดหมู่",
    };
  }
}

/**
 * ลบหมวดหมู่
 */
export async function deleteCategoryAction(
  id: string
): Promise<ActionResponse> {
  try {
    const user = await getUserWithRole();
    requireRole(user.role, ["ADMIN"]);

    await deleteCategory(id);

    revalidatePath("/dashboard/equipment");
    revalidatePath("/dashboard/settings");

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("deleteCategoryAction error:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการลบหมวดหมู่",
    };
  }
}