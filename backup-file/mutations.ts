/**
 * Work Order Mutations
 * Create, Update, Delete operations
 */

import { prisma } from "@/lib/prisma";
import {
  CreateWorkOrderInput,
  UpdateWorkOrderInput,
  WorkOrderWithRelations,
} from "./types";

// =====================================
// HELPER FUNCTIONS
// =====================================

/**
 * ✅ Generate WO Number
 * Format: WO-YYYYMMDD-XXXX
 * Example: WO-20251018-0001
 */
async function generateWoNumber(): Promise<string> {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  
  // นับจำนวน Work Orders ที่สร้างวันนี้
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  
  const count = await prisma.workOrder.count({
    where: {
      createdAt: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
  });
  
  // Sequence number (count + 1) padded to 4 digits
  const sequenceNumber = (count + 1).toString().padStart(4, '0');
  
  return `WO-${dateStr}-${sequenceNumber}`;
}

// =====================================
// CREATE OPERATIONS
// =====================================

/**
 * สร้าง Work Order ใหม่
 */
export async function createWorkOrder(
  data: CreateWorkOrderInput,
  userId: string
): Promise<WorkOrderWithRelations> {
  // ✅ Generate WO Number
  const woNumber = await generateWoNumber();
  
  // สร้าง Work Order
  const workOrder = await prisma.workOrder.create({
    data: {
      woNumber, // ✅ เพิ่มบรรทัดนี้
      equipmentId: data.equipmentId,
      title: data.title,
      description: data.description,
      priority: data.priority,
      reportedBy: userId,
      assignedTo: data.assignedTo || null,
      dueDate: data.dueDate || null,
    },
    include: {
      equipment: true,
      reporter: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      assignee: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  return workOrder as WorkOrderWithRelations;
}

// =====================================
// UPDATE OPERATIONS
// =====================================

/**
 * แก้ไข Work Order
 */
export async function updateWorkOrder(
  data: UpdateWorkOrderInput
): Promise<WorkOrderWithRelations> {
  const { id, ...updateData } = data;

  // ถ้ามีการเปลี่ยนเป็น IN_PROGRESS และยังไม่มี startedAt ให้ set เป็นเวลาปัจจุบัน
  if (updateData.status === "IN_PROGRESS" && !updateData.startedAt) {
    updateData.startedAt = new Date();
  }

  // ถ้ามีการเปลี่ยนเป็น COMPLETED และยังไม่มี completedAt ให้ set เป็นเวลาปัจจุบัน
  if (updateData.status === "COMPLETED" && !updateData.completedAt) {
    updateData.completedAt = new Date();
  }

  const workOrder = await prisma.workOrder.update({
    where: { id },
    data: updateData as any,
    include: {
      equipment: true,
      reporter: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      assignee: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  return workOrder as WorkOrderWithRelations;
}

/**
 * เปลี่ยนสถานะ Work Order
 */
export async function updateWorkOrderStatus(
  id: string,
  status: string,
  userId?: string
): Promise<WorkOrderWithRelations> {
  const updateData: any = { status };

  // Auto-set timestamps based on status
  if (status === "IN_PROGRESS") {
    updateData.startedAt = new Date();
  } else if (status === "COMPLETED") {
    updateData.completedAt = new Date();
  }

  const workOrder = await prisma.workOrder.update({
    where: { id },
    data: updateData,
    include: {
      equipment: true,
      reporter: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      assignee: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  return workOrder as WorkOrderWithRelations;
}

/**
 * มอบหมาย Work Order ให้ช่าง
 */
export async function assignWorkOrder(
  id: string,
  assigneeId: string
): Promise<WorkOrderWithRelations> {
  const workOrder = await prisma.workOrder.update({
    where: { id },
    data: {
      assignedTo: assigneeId,
      status: "ASSIGNED",
    },
    include: {
      equipment: true,
      reporter: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      assignee: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  return workOrder as WorkOrderWithRelations;
}

/**
 * ยกเลิกการมอบหมาย Work Order
 */
export async function unassignWorkOrder(
  id: string
): Promise<WorkOrderWithRelations> {
  const workOrder = await prisma.workOrder.update({
    where: { id },
    data: {
      assignedTo: null,
      status: "PENDING",
    },
    include: {
      equipment: true,
      reporter: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      assignee: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  return workOrder as WorkOrderWithRelations;
}

// =====================================
// DELETE OPERATIONS
// =====================================

/**
 * ลบ Work Order (Soft delete by changing status to CANCELLED)
 */
export async function cancelWorkOrder(id: string): Promise<void> {
  await prisma.workOrder.update({
    where: { id },
    data: {
      status: "CANCELLED",
    },
  });
}

/**
 * ลบ Work Order จริง (Hard delete - ใช้ระวัง!)
 * ควรใช้เฉพาะกรณี Admin เท่านั้น
 */
export async function deleteWorkOrder(id: string): Promise<void> {
  // Delete related records first (CASCADE should handle this, but just in case)
  await prisma.$transaction([
    prisma.workOrderComment.deleteMany({ where: { workOrderId: id } }),
    prisma.workOrderAttachment.deleteMany({ where: { workOrderId: id } }),
    prisma.maintenanceLog.deleteMany({ where: { workOrderId: id } }),
    prisma.expense.deleteMany({ where: { workOrderId: id } }),
    prisma.workOrderPart.deleteMany({ where: { workOrderId: id } }),
    prisma.workOrder.delete({ where: { id } }),
  ]);
}

// =====================================
// BATCH OPERATIONS
// =====================================

/**
 * Bulk update status for multiple work orders
 */
export async function bulkUpdateStatus(
  ids: string[],
  status: string
): Promise<{ count: number }> {
  const result = await prisma.workOrder.updateMany({
    where: {
      id: {
        in: ids,
      },
    },
    data: {
      status: status as any,
    },
  });

  return { count: result.count };
}

/**
 * Bulk assign work orders to a technician
 */
export async function bulkAssign(
  ids: string[],
  assigneeId: string
): Promise<{ count: number }> {
  const result = await prisma.workOrder.updateMany({
    where: {
      id: {
        in: ids,
      },
    },
    data: {
      assignedTo: assigneeId,
      status: "ASSIGNED",
    },
  });

  return { count: result.count };
}

// เพิ่มใน lib/api/work-orders/mutations.ts (ต่อจากโค้ดเดิม)

// =====================================
// EXTENDED MUTATIONS FOR DETAIL PAGE
// =====================================

/**
 * เปลี่ยนสถานะ Work Order (พร้อม validation)
 */
export async function changeWorkOrderStatus(
  workOrderId: string,
  newStatus: string,
  userId: string,
  notes?: string
) {
  try {
    const updateData: any = { status: newStatus };

    // Auto-set timestamps based on status
    if (newStatus === "IN_PROGRESS" && !updateData.startedAt) {
      updateData.startedAt = new Date();
    } else if (newStatus === "COMPLETED" && !updateData.completedAt) {
      updateData.completedAt = new Date();
    }

    const workOrder = await prisma.workOrder.update({
      where: { id: workOrderId },
      data: updateData,
      include: {
        equipment: true,
        reporter: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    // TODO: Create activity log
    // TODO: Send notification

    return workOrder;
  } catch (error) {
    console.error("Error changing status:", error);
    throw new Error("ไม่สามารถเปลี่ยนสถานะได้");
  }
}

/**
 * มอบหมายช่าง (พร้อม due date)
 */
export async function assignTechnician(
  workOrderId: string,
  technicianId: string,
  dueDate?: Date | null,
  notes?: string
) {
  try {
    const updateData: any = {
      assignedTo: technicianId,
      status: "ASSIGNED",
    };

    if (dueDate) {
      updateData.dueDate = dueDate;
    }

    const workOrder = await prisma.workOrder.update({
      where: { id: workOrderId },
      data: updateData,
      include: {
        equipment: true,
        reporter: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    // TODO: Send notification to technician

    return workOrder;
  } catch (error) {
    console.error("Error assigning technician:", error);
    throw new Error("ไม่สามารถมอบหมายช่างได้");
  }
}

/**
 * บันทึก Maintenance Log
 */
export async function createMaintenanceLog(data: {
  workOrderId: string;
  technicianId: string;
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
}) {
  try {
    // Calculate work hours if not provided
    const workHours =
      data.workHours ||
      (data.endTime.getTime() - data.startTime.getTime()) / (1000 * 60 * 60);

    const maintenanceLog = await prisma.$transaction(async (tx) => {
      // Create maintenance log
      const log = await tx.maintenanceLog.create({
        data: {
          workOrderId: data.workOrderId,
          technicianId: data.technicianId,
          description: data.description,
          rootCause: data.rootCause,
          solution: data.solution,
          startTime: data.startTime,
          endTime: data.endTime,
          workHours,
          notes: data.notes,
        },
        include: {
          technician: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Create work order parts if spare parts provided
      if (data.spareParts && data.spareParts.length > 0) {
        await Promise.all(
          data.spareParts.map((part) =>
            tx.workOrderPart.create({
              data: {
                workOrderId: data.workOrderId,
                sparePartId: part.sparePartId,
                quantity: part.quantity,
                unitPrice: part.unitPrice,
                totalPrice: part.quantity * part.unitPrice,
              },
            })
          )
        );

        // Update spare parts stock
        await Promise.all(
          data.spareParts.map((part) =>
            tx.sparePart.update({
              where: { id: part.sparePartId },
              data: {
                stockQuantity: {
                  decrement: part.quantity,
                },
              },
            })
          )
        );
      }

      return log;
    });

    return maintenanceLog;
  } catch (error) {
    console.error("Error creating maintenance log:", error);
    throw new Error("ไม่สามารถบันทึก Maintenance Log ได้");
  }
}

/**
 * เพิ่มค่าใช้จ่าย
 */
export async function createExpense(data: {
  workOrderId: string;
  expenseTypeId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  date: Date;
  receiptUrl?: string;
  notes?: string;
}) {
  try {
    const total = data.quantity * data.unitPrice;

    const expense = await prisma.expense.create({
      data: {
        workOrderId: data.workOrderId,
        expenseTypeId: data.expenseTypeId,
        description: data.description,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        total,
        date: data.date,
        receiptUrl: data.receiptUrl,
        notes: data.notes,
      },
      include: {
        expenseType: true,
      },
    });

    return expense;
  } catch (error) {
    console.error("Error creating expense:", error);
    throw new Error("ไม่สามารถเพิ่มค่าใช้จ่ายได้");
  }
}

/**
 * เพิ่มความคิดเห็น
 */
export async function addComment(
  workOrderId: string,
  userId: string,
  comment: string
) {
  try {
    const newComment = await prisma.workOrderComment.create({
      data: {
        workOrderId,
        userId,
        comment,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });

    // TODO: Send notification to relevant users

    return newComment;
  } catch (error) {
    console.error("Error adding comment:", error);
    throw new Error("ไม่สามารถเพิ่มความคิดเห็นได้");
  }
}

/**
 * อัพโหลดไฟล์แนบ
 */
export async function uploadAttachment(data: {
  workOrderId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
}) {
  try {
    const attachment = await prisma.workOrderAttachment.create({
      data: {
        workOrderId: data.workOrderId,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        fileType: data.fileType,
        fileSize: data.fileSize,
        uploadedBy: data.uploadedBy,
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return attachment;
  } catch (error) {
    console.error("Error uploading attachment:", error);
    throw new Error("ไม่สามารถอัพโหลดไฟล์ได้");
  }
}

/**
 * ลบความคิดเห็น
 */
export async function deleteComment(commentId: string, userId: string) {
  try {
    // Check if user owns the comment or is admin
    const comment = await prisma.workOrderComment.findUnique({
      where: { id: commentId },
      select: { userId: true },
    });

    if (!comment) {
      throw new Error("ไม่พบความคิดเห็น");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (comment.userId !== userId && user?.role !== "ADMIN") {
      throw new Error("คุณไม่มีสิทธิ์ลบความคิดเห็นนี้");
    }

    await prisma.workOrderComment.delete({
      where: { id: commentId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting comment:", error);
    throw error;
  }
}

/**
 * ลบไฟล์แนบ
 */
export async function deleteAttachment(attachmentId: string, userId: string) {
  try {
    // Check if user owns the attachment or is admin
    const attachment = await prisma.workOrderAttachment.findUnique({
      where: { id: attachmentId },
      select: { uploadedBy: true, fileUrl: true },
    });

    if (!attachment) {
      throw new Error("ไม่พบไฟล์");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (attachment.uploadedBy !== userId && user?.role !== "ADMIN") {
      throw new Error("คุณไม่มีสิทธิ์ลบไฟล์นี้");
    }

    await prisma.workOrderAttachment.delete({
      where: { id: attachmentId },
    });

    // TODO: Delete file from storage (Supabase Storage)

    return { success: true };
  } catch (error) {
    console.error("Error deleting attachment:", error);
    throw error;
  }
}

/**
 * ลบค่าใช้จ่าย (Admin only)
 */
export async function deleteExpense(expenseId: string, userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      throw new Error("เฉพาะ Admin เท่านั้นที่สามารถลบค่าใช้จ่ายได้");
    }

    await prisma.expense.delete({
      where: { id: expenseId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting expense:", error);
    throw error;
  }
}
