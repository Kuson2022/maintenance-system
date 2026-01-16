/**
 * Work Order Validation Schemas
 * ใช้ Zod สำหรับ validate input data
 */

import { z } from "zod";
import { WorkOrderPriority, WorkOrderStatus } from "./types";

// Schema สำหรับสร้าง Work Order ใหม่
export const createWorkOrderSchema = z.object({
  equipmentId: z
    .string({
      message: "กรุณาเลือกเครื่องจักร",
    })
    .uuid("รูปแบบ ID ไม่ถูกต้อง"),

  title: z
    .string({
      message: "กรุณากรอกหัวเรื่อง",
    })
    .min(5, "หัวเรื่องต้องมีอย่างน้อย 5 ตัวอักษร")
    .max(200, "หัวเรื่องต้องไม่เกิน 200 ตัวอักษร")
    .trim(),

  description: z
    .string({
      message: "กรุณากรอกรายละเอียดปัญหา",
    })
    .min(10, "รายละเอียดต้องมีอย่างน้อย 10 ตัวอักษร")
    .max(2000, "รายละเอียดต้องไม่เกิน 2000 ตัวอักษร")
    .trim(),

  priority: z.nativeEnum(WorkOrderPriority, {
    message: "ระดับความเร่งด่วนไม่ถูกต้อง",
  }),

  dueDate: z.coerce
    .date({
      message: "รูปแบบวันที่ไม่ถูกต้อง",
    })
    .optional()
    .nullable()
    .refine(
      (date) => {
        if (!date) return true;
        return date > new Date();
      },
      {
        message: "กำหนดเวลาเสร็จต้องเป็นวันในอนาคต",
      }
    ),

  assignedTo: z
    .string()
    .uuid("รูปแบบ ID ไม่ถูกต้อง")
    .optional()
    .nullable(),
});

// Schema สำหรับแก้ไข Work Order
export const updateWorkOrderSchema = z.object({
  id: z.string().uuid("รูปแบบ ID ไม่ถูกต้อง"),

  title: z
    .string()
    .min(5, "หัวเรื่องต้องมีอย่างน้อย 5 ตัวอักษร")
    .max(200, "หัวเรื่องต้องไม่เกิน 200 ตัวอักษร")
    .trim()
    .optional(),

  description: z
    .string()
    .min(10, "รายละเอียดต้องมีอย่างน้อย 10 ตัวอักษร")
    .max(2000, "รายละเอียดต้องไม่เกิน 2000 ตัวอักษร")
    .trim()
    .optional(),

  priority: z
    .nativeEnum(WorkOrderPriority, {
      message: "ระดับความเร่งด่วนไม่ถูกต้อง",
    })
    .optional(),

  status: z
    .nativeEnum(WorkOrderStatus, {
      message: "สถานะไม่ถูกต้อง",
    })
    .optional(),

  assignedTo: z.string().uuid().optional().nullable(),

  dueDate: z.coerce.date().optional().nullable(),

  startedAt: z.coerce.date().optional().nullable(),

  completedAt: z.coerce.date().optional().nullable(),
});

// Schema สำหรับ filter/search
export const workOrderFiltersSchema = z.object({
  status: z
    .union([
      z.nativeEnum(WorkOrderStatus),
      z.array(z.nativeEnum(WorkOrderStatus)),
    ])
    .optional(),

  priority: z
    .union([
      z.nativeEnum(WorkOrderPriority),
      z.array(z.nativeEnum(WorkOrderPriority)),
    ])
    .optional(),

  equipmentId: z.string().uuid().optional(),

  reportedBy: z.string().uuid().optional(),

  assignedTo: z.string().uuid().optional(),

  dateFrom: z.coerce.date().optional(),

  dateTo: z.coerce.date().optional(),

  // ✅ แก้ไข search field - ยอมรับ empty string
  search: z
    .string()
    .optional()
    .transform((val) => {
      // แปลง empty string เป็น undefined
      if (!val || val.trim() === "") return undefined;
      return val.trim();
    }),
});

// Schema สำหรับ pagination
export const paginationSchema = z.object({
  page: z.coerce
    .number()
    .int()
    .positive()
    .default(1)
    .catch(1),

  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .default(20)
    .catch(20),

  sortBy: z
    .enum([
      "woNumber",
      "title",
      "priority",
      "status",
      "reportedAt",
      "dueDate",
      "completedAt",
    ])
    .default("reportedAt")
    .catch("reportedAt"),

  sortOrder: z
    .enum(["asc", "desc"])
    .default("desc")
    .catch("desc"),
});

// Export inferred types
export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>;
export type UpdateWorkOrderInput = z.infer<typeof updateWorkOrderSchema>;
export type WorkOrderFilters = z.infer<typeof workOrderFiltersSchema>;
export type PaginationParams = z.infer<typeof paginationSchema>;

// เพิ่มใน lib/api/work-orders/validation.ts (ต่อจากโค้ดเดิม)

// =====================================
// EXTENDED VALIDATION SCHEMAS
// =====================================

/**
 * Schema สำหรับเปลี่ยนสถานะ
 */
export const changeStatusSchema = z.object({
  workOrderId: z.string().uuid("รูปแบบ ID ไม่ถูกต้อง"),

  newStatus: z.nativeEnum(WorkOrderStatus, {
    message: "สถานะไม่ถูกต้อง",
  }),

  notes: z
    .string()
    .max(500, "หมายเหตุต้องไม่เกิน 500 ตัวอักษร")
    .optional(),
});

/**
 * Schema สำหรับมอบหมายช่าง
 */
export const assignTechnicianSchema = z.object({
  workOrderId: z.string().uuid("รูปแบบ ID ไม่ถูกต้อง"),

  technicianId: z.string({
    message: "กรุณาเลือกช่าง",
  }).uuid("รูปแบบ ID ไม่ถูกต้อง"),

  dueDate: z.coerce
    .date()
    .optional()
    .nullable()
    .refine(
      (date) => {
        if (!date) return true;
        return date > new Date();
      },
      { message: "กำหนดเวลาเสร็จต้องเป็นวันในอนาคต" }
    ),

  notes: z
    .string()
    .max(500, "หมายเหตุต้องไม่เกิน 500 ตัวอักษร")
    .optional(),
});

/**
 * Schema สำหรับบันทึก Maintenance Log
 */
export const createMaintenanceLogSchema = z.object({
  workOrderId: z.string().uuid("รูปแบบ ID ไม่ถูกต้อง"),

  description: z
    .string({
      message: "กรุณากรอกรายละเอียดการซ่อม",
    })
    .min(10, "รายละเอียดต้องมีอย่างน้อย 10 ตัวอักษร")
    .max(2000, "รายละเอียดต้องไม่เกิน 2000 ตัวอักษร")
    .trim(),

  rootCause: z
    .string()
    .max(1000, "สาเหตุต้องไม่เกิน 1000 ตัวอักษร")
    .trim()
    .optional(),

  solution: z
    .string()
    .max(1000, "วิธีแก้ไขต้องไม่เกิน 1000 ตัวอักษร")
    .trim()
    .optional(),

  startTime: z.coerce.date({
    message: "กรุณาระบุเวลาเริ่มซ่อม",
  }).optional(),

  endTime: z.coerce.date({
    message: "กรุณาระบุเวลาเสร็จ",
  }).optional(),

  workHours: z
    .number()
    .positive("ชั่วโมงต้องมากกว่า 0")
    .max(24, "ชั่วโมงต้องไม่เกิน 24")
    .optional(),

  notes: z
    .string()
    .max(1000, "หมายเหตุต้องไม่เกิน 1000 ตัวอักษร")
    .optional(),

  spareParts: z
    .array(
      z.object({
        sparePartId: z.string().uuid("รูปแบบ ID ไม่ถูกต้อง"),
        quantity: z.number().int().positive("จำนวนต้องมากกว่า 0"),
        unitPrice: z.number().positive("ราคาต้องมากกว่า 0"),
      })
    )
    .optional(),
});

/**
 * Schema สำหรับแก้ไข Maintenance Log
 */
export const updateMaintenanceLogSchema = createMaintenanceLogSchema.extend({
  id: z.string().uuid("รูปแบบ ID ไม่ถูกต้อง"),
  workOrderId: z.string().uuid().optional(), // Make workOrderId optional or ignore if not needed, but keep for consistency
});

/**
 * Schema สำหรับเพิ่มค่าใช้จ่าย
 */
export const createExpenseSchema = z.object({
  workOrderId: z.string().uuid("รูปแบบ ID ไม่ถูกต้อง"),

  expenseTypeId: z.string({
    message: "กรุณาเลือกประเภทค่าใช้จ่าย",
  }).uuid("รูปแบบ ID ไม่ถูกต้อง"),

  description: z
    .string({
      message: "กรุณากรอกรายละเอียด",
    })
    .min(3, "รายละเอียดต้องมีอย่างน้อย 3 ตัวอักษร")
    .max(200, "รายละเอียดต้องไม่เกิน 200 ตัวอักษร")
    .trim(),

  quantity: z
    .number({
      message: "กรุณาระบุจำนวน",
    })
    .int("จำนวนต้องเป็นจำนวนเต็ม")
    .positive("จำนวนต้องมากกว่า 0"),

  unitPrice: z
    .number({
      message: "กรุณาระบุราคาต่อหน่วย",
    })
    .positive("ราคาต้องมากกว่า 0"),

  date: z.coerce.date({
    message: "กรุณาเลือกวันที่",
  }),

  receiptUrl: z.string().url("URL ไม่ถูกต้อง").optional(),

  notes: z
    .string()
    .max(500, "หมายเหตุต้องไม่เกิน 500 ตัวอักษร")
    .optional(),
});

/**
 * Schema สำหรับเพิ่มความคิดเห็น
 */
export const addCommentSchema = z.object({
  workOrderId: z.string().uuid("รูปแบบ ID ไม่ถูกต้อง"),

  comment: z
    .string({
      message: "กรุณากรอกความคิดเห็น",
    })
    .min(1, "ความคิดเห็นต้องไม่ว่างเปล่า")
    .max(1000, "ความคิดเห็นต้องไม่เกิน 1000 ตัวอักษร")
    .trim(),
});

/**
 * Schema สำหรับอัพโหลดไฟล์
 */
export const uploadAttachmentSchema = z.object({
  workOrderId: z.string().uuid("รูปแบบ ID ไม่ถูกต้อง"),

  fileName: z
    .string({
      message: "กรุณาระบุชื่อไฟล์",
    })
    .min(1, "ชื่อไฟล์ต้องไม่ว่างเปล่า"),

  fileUrl: z
    .string({
      message: "กรุณาระบุ URL ไฟล์",
    })
    .url("URL ไม่ถูกต้อง"),

  fileType: z.string({
    message: "กรุณาระบุประเภทไฟล์",
  }),

  fileSize: z
    .number({
      message: "กรุณาระบุขนาดไฟล์",
    })
    .int()
    .positive("ขนาดไฟล์ต้องมากกว่า 0")
    .max(10 * 1024 * 1024, "ไฟล์ต้องไม่เกิน 10 MB"),
});

/**
 * Schema สำหรับลบความคิดเห็น
 */
export const deleteCommentSchema = z.object({
  commentId: z.string().uuid("รูปแบบ ID ไม่ถูกต้อง"),
});

/**
 * Schema สำหรับลบไฟล์แนบ
 */
export const deleteAttachmentSchema = z.object({
  attachmentId: z.string().uuid("รูปแบบ ID ไม่ถูกต้อง"),
});

/**
 * Schema สำหรับลบค่าใช้จ่าย
 */
export const deleteExpenseSchema = z.object({
  expenseId: z.string().uuid("รูปแบบ ID ไม่ถูกต้อง"),
});

// Export inferred types
export type ChangeStatusInput = z.infer<typeof changeStatusSchema>;
export type AssignTechnicianInput = z.infer<typeof assignTechnicianSchema>;
export type CreateMaintenanceLogInput = z.infer<typeof createMaintenanceLogSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type AddCommentInput = z.infer<typeof addCommentSchema>;
export type UploadAttachmentInput = z.infer<typeof uploadAttachmentSchema>;