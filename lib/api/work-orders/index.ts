//lib/api/work-orders/index.ts
/**
 * Work Orders API - Central Export
 * Import จากไฟล์นี้เพื่อใช้งาน Work Order functions
 */

// Types
export * from "./types";
export * from "./serialized-types"; // ✅ เพิ่ม serialized types

// Validation
// Validation
export {
  createWorkOrderSchema,
  updateWorkOrderSchema,
  workOrderFiltersSchema,
  paginationSchema,
  changeStatusSchema,
  assignTechnicianSchema,
  createMaintenanceLogSchema,
  createExpenseSchema,
  addCommentSchema,
  uploadAttachmentSchema,
  deleteCommentSchema,
  deleteAttachmentSchema,
  deleteExpenseSchema
} from "./validation";

// Queries
export {
  getWorkOrders,
  getWorkOrderById,
  getWorkOrderByNumber,
  getWorkOrderStats,
  getOverdueWorkOrders,
  getUserWorkOrders,
} from "./queries";

// Mutations
export {
  createWorkOrder,
  updateWorkOrder,
  updateWorkOrderStatus,
  assignWorkOrder,
  unassignWorkOrder,
  cancelWorkOrder,
  deleteWorkOrder,
  bulkUpdateStatus,
  bulkAssign,
} from "./mutations";

// Usage Example:
// import { getWorkOrders, createWorkOrder, WorkOrderPriority } from "@/lib/api/work-orders";
// import { SerializedWorkOrderWithRelations } from "@/lib/api/work-orders/serialized-types";