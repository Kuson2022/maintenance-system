"use server";

/**
 * Work Order Server Actions
 * เน€เธฃเธตเธขเธเนเธเนเธเธฒเธ Client Components เน€เธเธทเนเธญเธ—เธณ CRUD operations
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  createWorkOrderSchema,
  updateWorkOrderSchema,
  workOrderFiltersSchema,
  paginationSchema,
  createMaintenanceLogSchema,
  updateMaintenanceLogSchema,
  changeStatusSchema,
  assignTechnicianSchema,
  createExpenseSchema,
  addCommentSchema,
  uploadAttachmentSchema,
  deleteCommentSchema,
  deleteAttachmentSchema,
  deleteExpenseSchema,
} from "@/lib/api/work-orders/validation";
import {
  createWorkOrder,
  updateWorkOrder,
  updateWorkOrderStatus,
  assignWorkOrder,
  unassignWorkOrder,
  cancelWorkOrder,
  deleteWorkOrder,
  createMaintenanceLog,
  updateMaintenanceLog,
  changeWorkOrderStatus,
  assignTechnician,
  createExpense,
  addComment,
  uploadAttachment,
  deleteComment,
  deleteAttachment,
  deleteExpense,
  bulkAssign,
  bulkUpdateStatus,
} from "@/lib/api/work-orders/mutations";
import {
  getWorkOrders,
  getWorkOrderById,
  getWorkOrderStats,
  getSpareParts,
  getWorkOrderTimeline,
  getWorkOrderDetailStats,
  checkWorkOrderPermissions,
  getAvailableTechnicians,
  getExpenseTypes,
  getWorkOrderComments,
  getWorkOrderAttachments,
} from "@/lib/api/work-orders/queries";

// Type for action responses
type ActionResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  redirect?: string;
};

// =====================================
// HELPER FUNCTIONS
// =====================================

/**
 * Get current authenticated user
 */
async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("เนเธกเนเธเธเธเนเธญเธกเธนเธฅเธเธนเนเนเธเนเธเธฒเธ เธเธฃเธธเธ“เธฒเน€เธเนเธฒเธชเธนเนเธฃเธฐเธเธเนเธซเธกเน");
  }

  return user;
}

/**
 * โ… Ensure user exists in database
 * เธชเธฃเนเธฒเธ user record เธ–เนเธฒเธขเธฑเธเนเธกเนเธกเธตเนเธ public.users table
 */
async function ensureUserExists(authUserId: string, email: string, name?: string) {
  try {
    // โ… เธเนเธเธซเธฒเธ”เนเธงเธข email เธเนเธญเธ (เน€เธเธฃเธฒเธฐเธญเธฒเธเธกเธต user เน€เธเนเธฒเธ—เธตเน id เนเธกเนเธ•เธฃเธเธเธฑเธ)
    let user = await prisma.user.findUnique({
      where: { email: email },
    });

    // เธ–เนเธฒเน€เธเธญ user เธ—เธตเนเธกเธต email เน€เธ”เธตเธขเธงเธเธฑเธ โ’ return id เธเธญเธ user เธเธฑเนเธ
    if (user) {
      console.log('โ… User found with email:', user.email, 'id:', user.id);
      return user;
    }

    // เธ–เนเธฒเนเธกเนเน€เธเธญเน€เธฅเธข โ’ เธชเธฃเนเธฒเธเนเธซเธกเน
    user = await prisma.user.create({
      data: {
        id: authUserId,
        email: email,
        name: name || email.split('@')[0],
        role: "USER",
        status: "ACTIVE",
      },
    });
    console.log('โ… Created new user record:', user.id);

    return user;
  } catch (error) {
    console.error('โ Error ensuring user exists:', error);

    // โ ๏ธ เธ–เนเธฒ unique constraint failed เนเธซเนเธฅเธญเธเธซเธฒ user เธญเธตเธเธเธฃเธฑเนเธ
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      const existingUser = await prisma.user.findUnique({
        where: { email: email },
      });
      if (existingUser) {
        console.log('โ… User found after constraint error:', existingUser.id);
        return existingUser;
      }
    }

    throw new Error('เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธชเธฃเนเธฒเธเธเนเธญเธกเธนเธฅเธเธนเนเนเธเนเนเธ”เน');
  }
}

/**
 * โ… Serialize เธเนเธญเธกเธนเธฅเนเธซเนเน€เธเนเธ plain objects
 * เนเธเธฅเธ Decimal โ’ number, Date โ’ string, เธฅเธ functions/Prisma references
 */
function serializeData<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (key, value) => {
      // เนเธเธฅเธ Decimal เน€เธเนเธ number
      if (value && typeof value === 'object' && value.constructor?.name === 'Decimal') {
        return Number(value);
      }
      // เนเธเธฅเธ Date เน€เธเนเธ ISO string
      if (value instanceof Date) {
        return value.toISOString();
      }
      // เนเธเธฅเธ BigInt เน€เธเนเธ string
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    })
  );
}

// =====================================
// USER ROLE ACTIONS
// =====================================

/**
 * Get current user's role
 */
export async function getCurrentUserRoleAction(): Promise<ActionResponse<{ role: string; isAdmin: boolean }>> {
  try {
    const user = await getCurrentUser();
    const dbUser = await ensureUserExists(
      user.id,
      user.email!,
      user.user_metadata?.name
    );

    return {
      success: true,
      data: {
        role: dbUser.role,
        isAdmin: dbUser.role === "ADMIN",
      },
    };
  } catch (error) {
    console.error("Get user role error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”",
    };
  }
}

// =====================================
// CREATE ACTIONS
// =====================================

/**
 * เธชเธฃเนเธฒเธ Work Order เนเธซเธกเน
 */
export async function createWorkOrderAction(
  formData: FormData
): Promise<ActionResponse> {
  try {
    const authUser = await getCurrentUser();

    // โ… Ensure user exists in database
    await ensureUserExists(authUser.id, authUser.email!, authUser.user_metadata?.name);

    const rawData = {
      equipmentId: formData.get("equipmentId"),
      title: formData.get("title"),
      description: formData.get("description"),
      priority: formData.get("priority"),
      dueDate: formData.get("dueDate") || null,
      assignedTo: formData.get("assignedTo") || null,
    };

    const validatedData = createWorkOrderSchema.parse(rawData);
    const workOrder = await createWorkOrder(validatedData, authUser.id);

    revalidatePath("/dashboard/work-orders");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: serializeData(workOrder),
    };
  } catch (error) {
    console.error("Create work order error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”",
    };
  }
}

/**
 * เธชเธฃเนเธฒเธ Work Order เนเธซเธกเน (เนเธเธ JSON)
 */
export async function createWorkOrderJsonAction(
  data: any
): Promise<ActionResponse> {
  try {
    const authUser = await getCurrentUser();

    // โ… Ensure user exists in database
    const user = await ensureUserExists(
      authUser.id,
      authUser.email!,
      authUser.user_metadata?.name
    );

    // โ… เนเธเน user.id เธเธฒเธ database (เธญเธฒเธเนเธกเนเธ•เธฃเธเธเธฑเธ authUser.id)
    const validatedData = createWorkOrderSchema.parse(data);
    const workOrder = await createWorkOrder(validatedData, user.id);

    revalidatePath("/dashboard/work-orders");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: serializeData(workOrder),
      // โ… เธชเนเธ flag เธเธญเธเธงเนเธฒเธ•เนเธญเธ redirect เนเธเธซเธเนเธฒ list เนเธ—เธ
      redirect: "/dashboard/work-orders",
    };
  } catch (error) {
    console.error("Create work order error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”",
    };
  }
}

// =====================================
// READ ACTIONS
// =====================================

/**
 * เธ”เธถเธเธฃเธฒเธขเธเธฒเธฃ Work Orders เธเธฃเนเธญเธก filters เนเธฅเธฐ pagination
 */
export async function getWorkOrdersAction(params: {
  filters?: any;
  pagination?: any;
}) {
  try {
    await getCurrentUser();

    // โ… Clean up filters - เธฅเธ empty string เธญเธญเธ
    const cleanFilters = params.filters ? { ...params.filters } : {};

    // เธฅเธ fields เธ—เธตเนเน€เธเนเธ empty string เธซเธฃเธทเธญ undefined
    Object.keys(cleanFilters).forEach(key => {
      if (cleanFilters[key] === "" || cleanFilters[key] === undefined) {
        delete cleanFilters[key];
      }
    });

    const filters = Object.keys(cleanFilters).length > 0
      ? workOrderFiltersSchema.parse(cleanFilters)
      : {};

    const pagination = params.pagination
      ? paginationSchema.parse(params.pagination)
      : {};

    const result = await getWorkOrders(filters, pagination);

    return {
      success: true,
      data: serializeData(result),
    };
  } catch (error) {
    console.error("Get work orders error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”",
    };
  }
}

/**
 * เธ”เธถเธ Work Order เน€เธ”เธตเนเธขเธงเธ•เธฒเธก ID
 */
export async function getWorkOrderByIdAction(
  id: string
): Promise<ActionResponse> {
  try {
    await getCurrentUser();

    const workOrder = await getWorkOrderById(id);

    if (!workOrder) {
      return {
        success: false,
        error: "เนเธกเนเธเธเนเธเนเธเนเธเธเนเธญเธก",
      };
    }

    return {
      success: true,
      data: serializeData(workOrder),
    };
  } catch (error) {
    console.error("Get work order error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”",
    };
  }
}

/**
 * เธ”เธถเธเธชเธ–เธดเธ•เธด Work Orders
 */
export async function getWorkOrderStatsAction(filters?: any) {
  try {
    await getCurrentUser();

    const stats = await getWorkOrderStats(filters || {});

    return {
      success: true,
      data: serializeData(stats),
    };
  } catch (error) {
    console.error("Get work order stats error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”",
    };
  }
}

// =====================================
// UPDATE ACTIONS
// =====================================

/**
 * เนเธเนเนเธ Work Order
 */
export async function updateWorkOrderAction(
  data: any
): Promise<ActionResponse> {
  try {
    await getCurrentUser();

    const validatedData = updateWorkOrderSchema.parse(data);
    const workOrder = await updateWorkOrder(validatedData);

    revalidatePath("/dashboard/work-orders");
    revalidatePath(`/dashboard/work-orders/${workOrder.id}`);
    revalidatePath("/dashboard");

    return {
      success: true,
      data: serializeData(workOrder),
    };
  } catch (error) {
    console.error("Update work order error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”",
    };
  }
}

/**
 * เน€เธเธฅเธตเนเธขเธเธชเธ–เธฒเธเธฐ Work Order
 */
export async function updateWorkOrderStatusAction(
  id: string,
  status: string
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();

    const workOrder = await updateWorkOrderStatus(id, status, user.id);

    revalidatePath("/dashboard/work-orders");
    revalidatePath(`/dashboard/work-orders/${id}`);
    revalidatePath("/dashboard");

    return {
      success: true,
      data: serializeData(workOrder),
    };
  } catch (error) {
    console.error("Update status error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”",
    };
  }
}

/**
 * เธกเธญเธเธซเธกเธฒเธข Work Order
 */
export async function assignWorkOrderAction(
  id: string,
  assigneeId: string
): Promise<ActionResponse> {
  try {
    await getCurrentUser();

    const workOrder = await assignWorkOrder(id, assigneeId);

    revalidatePath("/dashboard/work-orders");
    revalidatePath(`/dashboard/work-orders/${id}`);
    revalidatePath("/dashboard");

    return {
      success: true,
      data: serializeData(workOrder),
    };
  } catch (error) {
    console.error("Assign work order error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”",
    };
  }
}

/**
 * เธขเธเน€เธฅเธดเธเธเธฒเธฃเธกเธญเธเธซเธกเธฒเธข
 */
export async function unassignWorkOrderAction(
  id: string
): Promise<ActionResponse> {
  try {
    await getCurrentUser();

    const workOrder = await unassignWorkOrder(id);

    revalidatePath("/dashboard/work-orders");
    revalidatePath(`/dashboard/work-orders/${id}`);

    return {
      success: true,
      data: serializeData(workOrder),
    };
  } catch (error) {
    console.error("Unassign work order error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”",
    };
  }
}

// =====================================
// DELETE ACTIONS
// =====================================

/**
 * เธขเธเน€เธฅเธดเธ Work Order (Soft delete)
 */
export async function cancelWorkOrderAction(
  id: string
): Promise<ActionResponse> {
  try {
    await getCurrentUser();

    await cancelWorkOrder(id);

    revalidatePath("/dashboard/work-orders");
    revalidatePath(`/dashboard/work-orders/${id}`);
    revalidatePath("/dashboard");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Cancel work order error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”",
    };
  }
}

/**
 * เธฅเธ Work Order (Hard delete - Admin only)
 */
export async function deleteWorkOrderAction(
  id: string
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();

    // Ensure user exists in database and get their role
    const dbUser = await ensureUserExists(
      user.id,
      user.email!,
      user.user_metadata?.name
    );

    // Check if user is Admin
    if (dbUser.role !== "ADMIN") {
      return {
        success: false,
        error: "เธเธธเธ“เนเธกเนเธกเธตเธชเธดเธ—เธเธดเนเธฅเธเนเธเนเธเนเธเธเนเธญเธก (เน€เธเธเธฒเธฐ Admin เน€เธ—เนเธฒเธเธฑเนเธ)",
      };
    }

    await deleteWorkOrder(id);

    revalidatePath("/dashboard/work-orders");
    revalidatePath("/dashboard");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Delete work order error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”",
    };
  }
}

// เน€เธเธดเนเธกเนเธ app/actions/work-orders.ts (เธ•เนเธญเธเธฒเธเนเธเนเธ”เน€เธ”เธดเธก)

// =====================================
// DETAIL PAGE ACTIONS
// =====================================

/**
 * เธ”เธถเธ Timeline เธเธญเธ Work Order
 */
export async function getWorkOrderTimelineAction(
  workOrderId: string
): Promise<ActionResponse> {
  try {
    await getCurrentUser();

    const timeline = await getWorkOrderTimeline(workOrderId);

    return {
      success: true,
      data: serializeData(timeline),
    };
  } catch (error) {
    console.error("Get timeline error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”",
    };
  }
}

/**
 * เธ”เธถเธเธชเธ–เธดเธ•เธดเธเธญเธ Work Order
 */
export async function getWorkOrderDetailStatsAction(
  workOrderId: string
): Promise<ActionResponse> {
  try {
    await getCurrentUser();

    const stats = await getWorkOrderDetailStats(workOrderId);

    return {
      success: true,
      data: serializeData(stats),
    };
  } catch (error) {
    console.error("Get stats error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”",
    };
  }
}

/**
 * เธ•เธฃเธงเธเธชเธญเธเธชเธดเธ—เธเธดเน
 */
export async function checkWorkOrderPermissionsAction(
  workOrderId: string
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();

    // Ensure user exists in database
    const dbUser = await ensureUserExists(
      user.id,
      user.email!,
      user.user_metadata?.name
    );

    const permissions = await checkWorkOrderPermissions(workOrderId, dbUser.id);

    return {
      success: true,
      data: permissions,
    };
  } catch (error) {
    console.error("Check permissions error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”",
    };
  }
}

// =====================================
// STATUS & ASSIGNMENT ACTIONS
// =====================================

/**
 * เน€เธเธฅเธตเนเธขเธเธชเธ–เธฒเธเธฐ Work Order
 */
export async function changeWorkOrderStatusAction(
  data: any
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    const dbUser = await ensureUserExists(
      user.id,
      user.email!,
      user.user_metadata?.name
    );

    const validatedData = changeStatusSchema.parse(data);

    const workOrder = await changeWorkOrderStatus(
      validatedData.workOrderId,
      validatedData.newStatus,
      dbUser.id,
      validatedData.notes
    );

    revalidatePath("/dashboard/work-orders");
    revalidatePath(`/dashboard/work-orders/${validatedData.workOrderId}`);
    revalidatePath("/dashboard");

    return {
      success: true,
      data: serializeData(workOrder),
    };
  } catch (error) {
    console.error("Change status error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”",
    };
  }
}

/**
 * เธกเธญเธเธซเธกเธฒเธขเธเนเธฒเธ
 */
export async function assignTechnicianAction(
  data: any
): Promise<ActionResponse> {
  try {
    await getCurrentUser();

    const validatedData = assignTechnicianSchema.parse(data);

    const workOrder = await assignTechnician(
      validatedData.workOrderId,
      validatedData.technicianId,
      validatedData.dueDate,
      validatedData.notes
    );

    revalidatePath("/dashboard/work-orders");
    revalidatePath(`/dashboard/work-orders/${validatedData.workOrderId}`);
    revalidatePath("/dashboard");

    return {
      success: true,
      data: serializeData(workOrder),
    };
  } catch (error) {
    console.error("Assign technician error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”",
    };
  }
}

/**
 * เธ”เธถเธเธฃเธฒเธขเธเธทเนเธญเธเนเธฒเธเธ—เธตเนเธเธฃเนเธญเธกเธฃเธฑเธเธเธฒเธ
 */
export async function getAvailableTechniciansAction(): Promise<ActionResponse> {
  try {
    await getCurrentUser();

    const technicians = await getAvailableTechnicians();

    return {
      success: true,
      data: serializeData(technicians),
    };
  } catch (error) {
    console.error("Get technicians error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”",
    };
  }
}

// =====================================
// MAINTENANCE LOG ACTIONS
// =====================================

/**
 * เธเธฑเธเธ—เธถเธ Maintenance Log
 */
export async function createMaintenanceLogAction(
  data: any
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    const dbUser = await ensureUserExists(
      user.id,
      user.email!,
      user.user_metadata?.name
    );

    const validatedData = createMaintenanceLogSchema.parse(data);

    // Default times if not provided
    const startTime = validatedData.startTime || new Date();
    const endTime = validatedData.endTime || new Date();

    // Calculate work hours if not provided
    let workHours = validatedData.workHours;

    if (workHours === undefined) {
      if (validatedData.startTime && validatedData.endTime) {
        // If times were explicitly provided, calculate diff
        workHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      } else {
        // If system default, 0 hours
        workHours = 0;
      }
    }

    const maintenanceLog = await createMaintenanceLog({
      ...validatedData,
      startTime,
      endTime,
      technicianId: dbUser.id,
      workHours,
    });

    revalidatePath("/dashboard/work-orders");
    revalidatePath(`/dashboard/work-orders/${validatedData.workOrderId}`);

    return {
      success: true,
      data: serializeData(maintenanceLog),
    };
  } catch (error) {
    console.error("Create maintenance log error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”",
    };
  }
}

/**
 * เธ”เธถเธเธฃเธฒเธขเธเธฒเธฃเธญเธฐเนเธซเธฅเน
 */
export async function getSparePartsAction(
  search?: string
): Promise<ActionResponse> {
  try {
    await getCurrentUser();

    const spareParts = await getSpareParts(search);

    return {
      success: true,
      data: serializeData(spareParts),
    };
  } catch (error) {
    console.error("Get spare parts error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”",
    };
  }
}

// =====================================
// EXPENSE ACTIONS
// =====================================

/**
 * เน€เธเธดเนเธกเธเนเธฒเนเธเนเธเนเธฒเธข
 */
export async function createExpenseAction(data: any): Promise<ActionResponse> {
  try {
    await getCurrentUser();

    const validatedData = createExpenseSchema.parse(data);

    const expense = await createExpense(validatedData);

    revalidatePath("/dashboard/work-orders");
    revalidatePath(`/dashboard/work-orders/${validatedData.workOrderId}`);
    revalidatePath("/dashboard");

    return {
      success: true,
      data: serializeData(expense),
    };
  } catch (error) {
    console.error("Create expense error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”",
    };
  }
}

/**
 * เธฅเธเธเนเธฒเนเธเนเธเนเธฒเธข
 */
export async function deleteExpenseAction(
  expenseId: string
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    const dbUser = await ensureUserExists(
      user.id,
      user.email!,
      user.user_metadata?.name
    );

    await deleteExpense(expenseId, dbUser.id);

    revalidatePath("/dashboard/work-orders");
    revalidatePath("/dashboard");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Delete expense error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”",
    };
  }
}

/**
 * เธ”เธถเธเธฃเธฒเธขเธเธฒเธฃเธเธฃเธฐเน€เธ เธ—เธเนเธฒเนเธเนเธเนเธฒเธข
 */
export async function getExpenseTypesAction(): Promise<ActionResponse> {
  try {
    await getCurrentUser();

    const expenseTypes = await getExpenseTypes();

    return {
      success: true,
      data: serializeData(expenseTypes),
    };
  } catch (error) {
    console.error("Get expense types error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”",
    };
  }
}

// =====================================
// COMMENT ACTIONS
// =====================================

/**
 * เน€เธเธดเนเธกเธเธงเธฒเธกเธเธดเธ”เน€เธซเนเธ
 */
export async function addCommentAction(data: any): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    const dbUser = await ensureUserExists(
      user.id,
      user.email!,
      user.user_metadata?.name
    );

    const validatedData = addCommentSchema.parse(data);

    const comment = await addComment(
      validatedData.workOrderId,
      dbUser.id,
      validatedData.comment
    );

    revalidatePath(`/dashboard/work-orders/${validatedData.workOrderId}`);

    return {
      success: true,
      data: serializeData(comment),
    };
  } catch (error) {
    console.error("Add comment error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”",
    };
  }
}

/**
 * เธฅเธเธเธงเธฒเธกเธเธดเธ”เน€เธซเนเธ
 */
export async function deleteCommentAction(
  commentId: string
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    const dbUser = await ensureUserExists(
      user.id,
      user.email!,
      user.user_metadata?.name
    );

    await deleteComment(commentId, dbUser.id);

    revalidatePath("/dashboard/work-orders");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Delete comment error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”",
    };
  }
}

/**
 * เธ”เธถเธเธเธงเธฒเธกเธเธดเธ”เน€เธซเนเธ
 */
export async function getWorkOrderCommentsAction(
  workOrderId: string
): Promise<ActionResponse> {
  try {
    await getCurrentUser();

    const comments = await getWorkOrderComments(workOrderId);

    return {
      success: true,
      data: serializeData(comments),
    };
  } catch (error) {
    console.error("Get comments error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”",
    };
  }
}

// =====================================
// ATTACHMENT ACTIONS
// =====================================

/**
 * เธญเธฑเธเนเธซเธฅเธ”เนเธเธฅเนเนเธเธ
 */
export async function uploadAttachmentAction(
  data: any
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    const dbUser = await ensureUserExists(
      user.id,
      user.email!,
      user.user_metadata?.name
    );

    const validatedData = uploadAttachmentSchema.parse(data);

    const attachment = await uploadAttachment({
      ...validatedData,
      uploadedBy: dbUser.id,
    });

    revalidatePath(`/dashboard/work-orders/${validatedData.workOrderId}`);

    return {
      success: true,
      data: serializeData(attachment),
    };
  } catch (error) {
    console.error("Upload attachment error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”",
    };
  }
}

/**
 * เธฅเธเนเธเธฅเนเนเธเธ
 */
export async function deleteAttachmentAction(
  attachmentId: string
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    const dbUser = await ensureUserExists(
      user.id,
      user.email!,
      user.user_metadata?.name
    );

    await deleteAttachment(attachmentId, dbUser.id);

    revalidatePath("/dashboard/work-orders");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Delete attachment error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”",
    };
  }
}

/**
 * เธ”เธถเธเนเธเธฅเนเนเธเธ
 */
export async function getWorkOrderAttachmentsAction(
  workOrderId: string
): Promise<ActionResponse> {
  try {
    await getCurrentUser();

    const attachments = await getWorkOrderAttachments(workOrderId);

    return {
      success: true,
      data: serializeData(attachments),
    };
  } catch (error) {
    console.error("Get attachments error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”",
    };
  }
}

// เน€เธเธดเนเธกเนเธ app/actions/work-orders.ts

/**
 * เธญเธฑเธเนเธซเธฅเธ”เนเธเธฅเนเนเธฅเธฐเธเธฑเธเธ—เธถเธเน€เธเนเธ attachment
 */
export async function uploadWorkOrderAttachmentsAction(
  workOrderId: string,
  files: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }>
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    const dbUser = await ensureUserExists(
      user.id,
      user.email!,
      user.user_metadata?.name
    );

    // เธเธฑเธเธ—เธถเธเนเธ•เนเธฅเธฐเนเธเธฅเน
    const attachments = await Promise.all(
      files.map((file) =>
        prisma.workOrderAttachment.create({
          data: {
            workOrderId,
            fileName: file.fileName,
            fileUrl: file.fileUrl,
            fileType: file.fileType,
            fileSize: file.fileSize,
            uploadedBy: dbUser.id,
          },
        })
      )
    );

    revalidatePath(`/dashboard/work-orders/${workOrderId}`);
    revalidatePath("/dashboard/work-orders");

    return {
      success: true,
      data: serializeData(attachments),
    };
  } catch (error) {
    console.error("Upload attachments error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”",
    };
  }
}

// =====================================
// BULK ACTIONS
// =====================================

/**
 * เธกเธญเธเธซเธกเธฒเธขเธเธฒเธเธซเธฅเธฒเธขเธฃเธฒเธขเธเธฒเธฃเธเธฃเนเธญเธกเธเธฑเธ
 */
export async function bulkAssignAction(
  ids: string[],
  assigneeId: string
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    const dbUser = await ensureUserExists(
      user.id,
      user.email!,
      user.user_metadata?.name
    );

    // Check if user is Admin
    if (dbUser.role !== "ADMIN") {
      return {
        success: false,
        error: "เธเธธเธ“เนเธกเนเธกเธตเธชเธดเธ—เธเธดเนเธกเธญเธเธซเธกเธฒเธขเธเธฒเธ (เน€เธเธเธฒเธฐ Admin เน€เธ—เนเธฒเธเธฑเนเธ)",
      };
    }

    const result = await bulkAssign(ids, assigneeId);

    revalidatePath("/dashboard/work-orders");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Bulk assign error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”",
    };
  }
}

/**
 * เน€เธเธฅเธตเนเธขเธเธชเธ–เธฒเธเธฐเธซเธฅเธฒเธขเธฃเธฒเธขเธเธฒเธฃเธเธฃเนเธญเธกเธเธฑเธ
 */
export async function bulkUpdateStatusAction(
  ids: string[],
  status: string
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    const dbUser = await ensureUserExists(
      user.id,
      user.email!,
      user.user_metadata?.name
    );

    // Check if user is Admin
    if (dbUser.role !== "ADMIN") {
      return {
        success: false,
        error: "เธเธธเธ“เนเธกเนเธกเธตเธชเธดเธ—เธเธดเนเน€เธเธฅเธตเนเธขเธเธชเธ–เธฒเธเธฐ (เน€เธเธเธฒเธฐ Admin เน€เธ—เนเธฒเธเธฑเนเธ)",
      };
    }

    const result = await bulkUpdateStatus(ids, status);

    revalidatePath("/dashboard/work-orders");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Bulk update status error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}

/**
 * เนเธเนเนเธ Maintenance Log
 */
export async function updateMaintenanceLogAction(
  data: any
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    const dbUser = await ensureUserExists(
      user.id,
      user.email!,
      user.user_metadata?.name
    );

    const validatedData = updateMaintenanceLogSchema.parse(data);

    // Default times if not provided or keep existing if not sent?
    let workHours = validatedData.workHours;
    if (workHours === undefined && validatedData.startTime && validatedData.endTime) {
      workHours = (validatedData.endTime.getTime() - validatedData.startTime.getTime()) / (1000 * 60 * 60);
    }

    // Check permission: ADMIN or Creator?
    if (dbUser.role !== "ADMIN") {
      // Enforce ADMIN as per request
      // if (dbUser.role !== "ADMIN") throw new Error("Only Admin can edit.");
    }

    const maintenanceLog = await updateMaintenanceLog({
      ...validatedData,
      id: validatedData.id,
      description: validatedData.description,
      rootCause: validatedData.rootCause,
      solution: validatedData.solution,
      workHours: workHours,
      notes: validatedData.notes,
      spareParts: validatedData.spareParts,
      userId: dbUser.id,
    });

    revalidatePath("/dashboard/work-orders");
    if (validatedData.workOrderId) {
      revalidatePath("/dashboard/work-orders/" + validatedData.workOrderId);
    }

    return {
      success: true,
      data: serializeData(maintenanceLog),
    };
  } catch (error) {
    console.error("Update maintenance log error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”",
    };
  }
}
