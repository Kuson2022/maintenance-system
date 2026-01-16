/**
 * Equipment Queries
 * Database queries for Equipment CRUD operations
 */

import { prisma } from "@/lib/prisma";
import { Prisma, EquipmentStatus } from "@prisma/client";
import {
  EquipmentFilters,
  PaginationParams,
  PaginatedResponse,
  EquipmentWithRelations,
  EquipmentStats,
  EquipmentDetailStats,
} from "./types";

// =====================================
// HELPER: Build Where Clause
// =====================================

function buildWhereClause(filters: EquipmentFilters): Prisma.EquipmentWhereInput {
  const where: Prisma.EquipmentWhereInput = {};

  if (filters.search) {
    where.OR = [
      { code: { contains: filters.search, mode: "insensitive" } },
      { name: { contains: filters.search, mode: "insensitive" } },
      { serialNumber: { contains: filters.search, mode: "insensitive" } },
      { location: { contains: filters.search, mode: "insensitive" } },
      { manufacturer: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.location) {
    where.location = { contains: filters.location, mode: "insensitive" };
  }

  if (filters.responsiblePersonId) {
    where.responsiblePersonId = filters.responsiblePersonId;
  }

  if (filters.floor) {
    where.floor = filters.floor;
  }

  if (filters.warrantyExpired === true) {
    where.warrantyExpiry = { lt: new Date() };
  } else if (filters.warrantyExpired === false) {
    where.warrantyExpiry = { gte: new Date() };
  }

  if (filters.hasActiveWorkOrders) {
    where.workOrders = {
      some: {
        status: {
          in: ["PENDING", "ASSIGNED", "IN_PROGRESS", "ON_HOLD"],
        },
      },
    };
  }

  return where;
}

// =====================================
// READ OPERATIONS
// =====================================

/**
 * ดึงรายการเครื่องจักรพร้อม pagination และ filters
 */
export async function getEquipments(
  filters: EquipmentFilters = {},
  pagination: PaginationParams = {}
): Promise<PaginatedResponse<EquipmentWithRelations>> {
  const {
    page = 1,
    pageSize = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = pagination;

  const where = buildWhereClause(filters);
  const skip = (page - 1) * pageSize;

  // สร้าง orderBy object
  const orderBy: Prisma.EquipmentOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  };

  const [data, count] = await Promise.all([
    prisma.equipment.findMany({
      where,
      skip,
      take: pageSize,
      orderBy,
      include: {
        category: true,
        parent: true,
        locationRef: true,
        responsiblePerson: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            workOrders: true,
            maintenanceSchedules: true,
          },
        },
      },
    }),
    prisma.equipment.count({ where }),
  ]);

  return {
    data: data as EquipmentWithRelations[],
    count,
    page,
    pageSize,
    totalPages: Math.ceil(count / pageSize),
  };
}

/**
 * ดึงเครื่องจักรตาม ID พร้อม relations
 */
export async function getEquipmentById(
  id: string
): Promise<EquipmentWithRelations | null> {
  const equipment = await prisma.equipment.findUnique({
    where: { id },
    include: {
      category: true,
      parent: true,
      locationRef: true,
      responsiblePerson: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatarUrl: true,
          role: true,
        },
      },
      workOrders: {
        orderBy: { reportedAt: "desc" },
        take: 10,
        include: {
          reporter: {
            select: { id: true, name: true },
          },
          assignee: {
            select: { id: true, name: true },
          },
        },
      },
      maintenanceSchedules: {
        orderBy: { nextDueDate: "asc" },
        take: 5,
        include: {
          assignee: {
            select: { id: true, name: true },
          },
        },
      },
      maintenanceHistory: {
        orderBy: { performedAt: "desc" },
        take: 10,
        include: {
          performer: {
            select: { id: true, name: true },
          },
          schedule: {
            select: { activityName: true }
          }
        }
      },
      _count: {
        select: {
          workOrders: true,
          maintenanceSchedules: true,
        },
      },
    },
  });

  return equipment as EquipmentWithRelations | null;
}

/**
 * ดึงเครื่องจักรตาม QR Code
 */
export async function getEquipmentByQrCode(
  qrCode: string
): Promise<EquipmentWithRelations | null> {
  const equipment = await prisma.equipment.findUnique({
    where: { qrCode },
    include: {
      category: true,
      responsiblePerson: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      _count: {
        select: {
          workOrders: true,
          maintenanceSchedules: true,
        },
      },
    },
  });

  return equipment as EquipmentWithRelations | null;
}

/**
 * ดึงเครื่องจักรตามรหัส (code)
 */
export async function getEquipmentByCode(
  code: string
): Promise<EquipmentWithRelations | null> {
  const equipment = await prisma.equipment.findUnique({
    where: { code },
    include: {
      category: true,
      responsiblePerson: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  return equipment as EquipmentWithRelations | null;
}

/**
 * ดึงสถิติเครื่องจักรสำหรับ Dashboard
 */
export async function getEquipmentStats(): Promise<EquipmentStats> {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    total,
    activeCount,
    inactiveCount,
    maintenanceCount,
    retiredCount,
    categoryStats,
    warrantyExpiringSoon,
    recentlyAdded,
  ] = await Promise.all([
    // Total count
    prisma.equipment.count(),
    // By status
    prisma.equipment.count({ where: { status: "ACTIVE" } }),
    prisma.equipment.count({ where: { status: "INACTIVE" } }),
    prisma.equipment.count({ where: { status: "MAINTENANCE" } }),
    prisma.equipment.count({ where: { status: "RETIRED" } }),
    // By category
    prisma.equipmentCategory.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: { equipment: true },
        },
      },
    }),
    // Warranty expiring in 30 days
    prisma.equipment.count({
      where: {
        warrantyExpiry: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
      },
    }),
    // Recently added
    prisma.equipment.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
  ]);

  return {
    total,
    byStatus: {
      active: activeCount,
      inactive: inactiveCount,
      maintenance: maintenanceCount,
      retired: retiredCount,
    },
    byCategory: categoryStats.map((cat) => ({
      categoryId: cat.id,
      categoryName: cat.name,
      count: cat._count.equipment,
    })),
    warrantyExpiringSoon,
    recentlyAdded,
  };
}

/**
 * ดึงสถิติละเอียดของเครื่องจักร
 */
export async function getEquipmentDetailStats(
  equipmentId: string
): Promise<EquipmentDetailStats> {
  const now = new Date();

  const [
    totalWorkOrders,
    completedWorkOrders,
    pendingWorkOrders,
    expenses,
    lastCompletedWorkOrder,
    nextSchedule,
    completedWorkOrdersWithTime,
  ] = await Promise.all([
    // Total work orders
    prisma.workOrder.count({ where: { equipmentId } }),
    // Completed work orders
    prisma.workOrder.count({
      where: { equipmentId, status: "COMPLETED" },
    }),
    // Pending work orders
    prisma.workOrder.count({
      where: {
        equipmentId,
        status: { in: ["PENDING", "ASSIGNED", "IN_PROGRESS", "ON_HOLD"] },
      },
    }),
    // Total expenses
    prisma.expense.aggregate({
      where: {
        workOrder: { equipmentId },
      },
      _sum: { total: true },
    }),
    // Last completed work order
    prisma.workOrder.findFirst({
      where: { equipmentId, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      select: { completedAt: true },
    }),
    // Next scheduled maintenance
    prisma.maintenanceSchedule.findFirst({
      where: {
        equipmentId,
        status: "ACTIVE",
        nextDueDate: { gte: now },
      },
      orderBy: { nextDueDate: "asc" },
      select: { nextDueDate: true },
    }),
    // For average repair time calculation
    prisma.workOrder.findMany({
      where: {
        equipmentId,
        status: "COMPLETED",
        resolutionTimeHours: { not: null },
      },
      select: { resolutionTimeHours: true },
    }),
  ]);

  // Calculate average repair time
  let averageRepairTime: number | null = null;
  if (completedWorkOrdersWithTime.length > 0) {
    const totalHours = completedWorkOrdersWithTime.reduce(
      (sum, wo) => sum + (wo.resolutionTimeHours?.toNumber() || 0),
      0
    );
    averageRepairTime = totalHours / completedWorkOrdersWithTime.length;
  }

  // Calculate uptime (simplified)
  const uptime = totalWorkOrders > 0
    ? Math.round((completedWorkOrders / totalWorkOrders) * 100)
    : 100;

  return {
    totalWorkOrders,
    completedWorkOrders,
    pendingWorkOrders,
    totalMaintenanceCost: expenses._sum.total?.toNumber() || 0,
    lastMaintenanceDate: lastCompletedWorkOrder?.completedAt || null,
    nextScheduledMaintenance: nextSchedule?.nextDueDate || null,
    averageRepairTime,
    uptime,
  };
}

/**
 * ดึงหมวดหมู่เครื่องจักรทั้งหมด
 */
export async function getEquipmentCategories() {
  return prisma.equipmentCategory.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { equipment: true },
      },
    },
  });
}

/**
 * ดึงหมวดหมู่ตาม ID
 */
export async function getCategoryById(id: string) {
  return prisma.equipmentCategory.findUnique({
    where: { id },
    include: {
      _count: {
        select: { equipment: true },
      },
    },
  });
}

/**
 * ดึงรายชื่อ locations ที่มีในระบบ
 */
export async function getEquipmentLocations(floor?: string): Promise<string[]> {
  const where: Prisma.EquipmentWhereInput = {
    location: { not: null },
  };

  if (floor) {
    where.floor = floor;
  }

  const locations = await prisma.equipment.findMany({
    where,
    select: { location: true },
    distinct: ["location"],
    orderBy: { location: "asc" },
  });

  return locations
    .map((e) => e.location)
    .filter((loc): loc is string => loc !== null);
}

/**
 * ดึงรายชื่อชั้น (floor) ที่มีในระบบ
 */
export async function getEquipmentFloors(): Promise<string[]> {
  const floors = await prisma.equipment.findMany({
    where: {
      floor: { not: null },
    },
    select: { floor: true },
    distinct: ["floor"],
    orderBy: { floor: "asc" },
  });

  return floors
    .map((e) => e.floor)
    .filter((f): f is string => f !== null);
}

/**
 * ตรวจสอบว่ารหัสเครื่องจักรซ้ำหรือไม่
 */
export async function isEquipmentCodeExists(
  code: string,
  excludeId?: string
): Promise<boolean> {
  const count = await prisma.equipment.count({
    where: {
      code,
      id: excludeId ? { not: excludeId } : undefined,
    },
  });
  return count > 0;
}

/**
 * ตรวจสอบว่า serial number ซ้ำหรือไม่
 */
export async function isSerialNumberExists(
  serialNumber: string,
  excludeId?: string
): Promise<boolean> {
  const count = await prisma.equipment.count({
    where: {
      serialNumber,
      id: excludeId ? { not: excludeId } : undefined,
    },
  });
  return count > 0;
}

// =====================================
// PERMISSION CHECK
// =====================================

/**
 * ตรวจสอบสิทธิ์การเข้าถึง Equipment
 * @param userId - User ID ของผู้ใช้ปัจจุบัน
 * @param equipmentId - Equipment ID (optional) สำหรับตรวจสอบสิทธิ์เฉพาะเครื่อง
 */
export async function checkEquipmentPermissions(
  userId: string,
  equipmentId?: string
) {
  try {
    // Get user with role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        status: true,
      },
    });

    if (!user || user.status !== "ACTIVE") {
      return {
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canRetire: false,
        canBulkUpdate: false,
        canBulkAssign: false,
        canImport: false,
        canExport: false,
        canManageCategories: false,
      };
    }

    const isAdmin = user.role === "ADMIN";
    const isTechnician = user.role === "TECHNICIAN";

    // Check if user is responsible person for specific equipment
    let isResponsiblePerson = false;
    if (equipmentId) {
      const equipment = await prisma.equipment.findUnique({
        where: { id: equipmentId },
        select: { responsiblePersonId: true },
      });
      isResponsiblePerson = equipment?.responsiblePersonId === userId;
    }

    return {
      // ทุก role สามารถดูได้
      canView: true,

      // เฉพาะ Admin สามารถสร้างเครื่องจักรได้
      canCreate: isAdmin,

      // Admin และ Technician สามารถแก้ไขได้
      canEdit: isAdmin || isTechnician,

      // เฉพาะ Admin เท่านั้น
      canDelete: isAdmin,
      canRetire: isAdmin,
      canBulkUpdate: isAdmin,
      canBulkAssign: isAdmin,
      canImport: isAdmin,
      canExport: isAdmin || isTechnician, // Export อนุญาต Technician ได้
      canManageCategories: isAdmin,
    };
  } catch (error) {
    console.error("Error checking equipment permissions:", error);
    return {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canRetire: false,
      canBulkUpdate: false,
      canBulkAssign: false,
      canImport: false,
      canExport: false,
      canManageCategories: false,
    };
  }
}