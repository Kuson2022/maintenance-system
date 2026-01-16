//lib/api/work-order/types.ts
/**
 * Work Order Types & Interfaces
 * ประเภทข้อมูลสำหรับระบบแจ้งซ่อม
 */

import { User, Equipment } from "@prisma/client";

// Enums - ตรงกับ Prisma Schema
export enum WorkOrderPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum WorkOrderStatus {
  PENDING = "PENDING",
  ASSIGNED = "ASSIGNED",
  IN_PROGRESS = "IN_PROGRESS",
  ON_HOLD = "ON_HOLD",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

// Badge colors สำหรับแสดง UI
export const PRIORITY_CONFIG = {
  [WorkOrderPriority.LOW]: {
    label: "ต่ำ",
    color: "bg-green-100 text-green-800",
    icon: "🟢",
  },
  [WorkOrderPriority.MEDIUM]: {
    label: "ปานกลาง",
    color: "bg-yellow-100 text-yellow-800",
    icon: "🟡",
  },
  [WorkOrderPriority.HIGH]: {
    label: "สูง",
    color: "bg-orange-100 text-orange-800",
    icon: "🟠",
  },
  [WorkOrderPriority.CRITICAL]: {
    label: "ฉุกเฉิน",
    color: "bg-red-100 text-red-800",
    icon: "🔴",
  },
};

export const STATUS_CONFIG = {
  [WorkOrderStatus.PENDING]: {
    label: "รอดำเนินการ",
    color: "bg-yellow-100 text-yellow-800",
  },
  [WorkOrderStatus.ASSIGNED]: {
    label: "มอบหมายแล้ว",
    color: "bg-blue-100 text-blue-800",
  },
  [WorkOrderStatus.IN_PROGRESS]: {
    label: "กำลังดำเนินการ",
    color: "bg-orange-100 text-orange-800",
  },
  [WorkOrderStatus.ON_HOLD]: {
    label: "พักการดำเนินการ",
    color: "bg-purple-100 text-purple-800",
  },
  [WorkOrderStatus.COMPLETED]: {
    label: "เสร็จสิ้น",
    color: "bg-green-100 text-green-800",
  },
  [WorkOrderStatus.CANCELLED]: {
    label: "ยกเลิก",
    color: "bg-gray-100 text-gray-800",
  },
};

// Base Work Order interface
export interface WorkOrder {
  id: string;
  woNumber: string;
  equipmentId: string;
  title: string;
  description: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  reportedBy: string;
  assignedTo: string | null;
  reportedAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  dueDate: Date | null;
  resolutionTimeHours: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// Work Order with relations
export interface WorkOrderWithRelations extends WorkOrder {
  equipment: Equipment;
  reporter: Pick<User, "id" | "email" | "name">;
  assignee: Pick<User, "id" | "email" | "name"> | null;
  _count?: {
    comments: number;
    attachments: number;
    maintenanceLogs: number;
  };
}

// Create Work Order DTO
export interface CreateWorkOrderInput {
  equipmentId: string;
  title: string;
  description: string;
  priority: WorkOrderPriority;
  dueDate?: Date | null;
  assignedTo?: string | null;
}

// Update Work Order DTO
export interface UpdateWorkOrderInput {
  id: string;
  title?: string;
  description?: string;
  priority?: WorkOrderPriority;
  status?: WorkOrderStatus;
  assignedTo?: string | null;
  dueDate?: Date | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
}

// Filter & Pagination
export interface WorkOrderFilters {
  status?: WorkOrderStatus | WorkOrderStatus[];
  priority?: WorkOrderPriority | WorkOrderPriority[];
  equipmentId?: string;
  reportedBy?: string;
  assignedTo?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  location?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Stats for dashboard
export interface WorkOrderStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  byPriority: Record<WorkOrderPriority, number>;
  byStatus: Record<WorkOrderStatus, number>;
  avgResolutionTime: number | null;
}

// เพิ่มใน lib/api/work-orders/types.ts (ต่อจากโค้ดเดิม)

// =====================================
// EXTENDED TYPES FOR DETAIL PAGE
// =====================================

/**
 * Maintenance Log with relations
 */
export interface MaintenanceLog {
  id: string;
  workOrderId: string;
  technicianId: string;
  description: string;
  rootCause: string | null;
  solution: string | null;
  startTime: Date;
  endTime: Date | null;
  workHours: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  technician: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  parts: WorkOrderPart[];
  expenses?: WorkOrderExpense[]; 
}

/**
 * Work Order Parts (Spare parts used)
 */
export interface WorkOrderPart {
  id: string;
  workOrderId: string;
  sparePartId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: Date;
  sparePart: {
    id: string;
    code: string;
    name: string;
    unit: string;
  };
}

/**
 * Comment with user info
 */
export interface WorkOrderComment {
  id: string;
  workOrderId: string;
  userId: string;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    role: string;
  };
}

/**
 * Attachment with uploader info
 */
export interface WorkOrderAttachment {
  id: string;
  workOrderId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdAt: Date;
  uploadedBy: string;
  uploader: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Expense with type info
 */
export interface WorkOrderExpense {
  id: string;
  workOrderId: string;
  expenseTypeId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  date: Date;
  receiptUrl: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  expenseType: {
    id: string;
    name: string;
  };
}

/**
 * Full Work Order Detail with all relations
 */
export interface WorkOrderDetail extends WorkOrder {
  equipment: Equipment & {
    category: {
      id: string;
      name: string;
      icon: string | null;
    };
  };
  reporter: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    role: string;
  };
  assignee: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    role: string;
  } | null;
  maintenanceLogs: MaintenanceLog[];
  comments: WorkOrderComment[];
  attachments: WorkOrderAttachment[];
  expenses: WorkOrderExpense[];
}

/**
 * Timeline Event Types
 */
export type TimelineEventType =
  | "CREATED"
  | "STATUS_CHANGED"
  | "ASSIGNED"
  | "UNASSIGNED"
  | "COMMENT_ADDED"
  | "ATTACHMENT_UPLOADED"
  | "MAINTENANCE_LOG_ADDED"
  | "EXPENSE_ADDED"
  | "COMPLETED"
  | "CANCELLED";

/**
 * Timeline Event
 */
export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  timestamp: Date;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  } | null;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * Permission Check Result
 */
export interface WorkOrderPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canChangeStatus: boolean;
  canAssign: boolean;
  canAddExpense: boolean;
  canAddMaintenanceLog: boolean;
  canComment: boolean;
  canUploadAttachment: boolean;
}

/**
 * Work Order Statistics
 */
export interface WorkOrderDetailStats {
  totalExpenses: number;
  totalWorkHours: number;
  commentsCount: number;
  attachmentsCount: number;
  maintenanceLogsCount: number;
}

// =====================================
// INPUT TYPES FOR FORMS
// =====================================

/**
 * Change Status Input
 */
export interface ChangeStatusInput {
  workOrderId: string;
  newStatus: WorkOrderStatus;
  notes?: string;
}

/**
 * Assign Technician Input
 */
export interface AssignTechnicianInput {
  workOrderId: string;
  technicianId: string;
  dueDate?: Date | null;
  notes?: string;
}

/**
 * Create Maintenance Log Input
 */
export interface CreateMaintenanceLogInput {
  workOrderId: string;
  description: string;
  rootCause?: string;
  solution?: string;
  startTime: Date;
  endTime: Date;
  workHours?: number;
  notes?: string;
  spareParts?: {
    sparePartId: string;
    quantity: number;
    unitPrice: number;
  }[];
}

/**
 * Create Expense Input
 */
export interface CreateExpenseInput {
  workOrderId: string;
  expenseTypeId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  date: Date;
  receiptUrl?: string;
  notes?: string;
}

/**
 * Add Comment Input
 */
export interface AddCommentInput {
  workOrderId: string;
  comment: string;
}

/**
 * Upload Attachment Input
 */
export interface UploadAttachmentInput {
  workOrderId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

/**
 * Available Technician
 */
export interface AvailableTechnician {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  activeWorkOrders: number;
}

// =====================================
// TIMELINE EVENT CONFIG
// =====================================

export const TIMELINE_EVENT_CONFIG = {
  CREATED: {
    icon: "FileText",
    color: "text-blue-500",
    bgColor: "bg-blue-100",
  },
  STATUS_CHANGED: {
    icon: "Activity",
    color: "text-purple-500",
    bgColor: "bg-purple-100",
  },
  ASSIGNED: {
    icon: "UserCheck",
    color: "text-green-500",
    bgColor: "bg-green-100",
  },
  UNASSIGNED: {
    icon: "UserX",
    color: "text-orange-500",
    bgColor: "bg-orange-100",
  },
  COMMENT_ADDED: {
    icon: "MessageCircle",
    color: "text-gray-500",
    bgColor: "bg-gray-100",
  },
  ATTACHMENT_UPLOADED: {
    icon: "Paperclip",
    color: "text-indigo-500",
    bgColor: "bg-indigo-100",
  },
  MAINTENANCE_LOG_ADDED: {
    icon: "Wrench",
    color: "text-yellow-500",
    bgColor: "bg-yellow-100",
  },
  EXPENSE_ADDED: {
    icon: "DollarSign",
    color: "text-red-500",
    bgColor: "bg-red-100",
  },
  COMPLETED: {
    icon: "CheckCircle",
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  CANCELLED: {
    icon: "XCircle",
    color: "text-gray-600",
    bgColor: "bg-gray-100",
  },
};