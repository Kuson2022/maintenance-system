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
import { sendGroupNotification } from "@/lib/services/line-notification";
import { sendTelegramGroupNotification } from "@/lib/services/telegram-notification";

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

  // ส่งแจ้งเตือนเข้ากลุ่ม LINE - งานใหม่ยังไม่มอบหมาย
  await sendGroupNotification({
    type: 'WORK_ORDER_CREATED',
    workOrder: {
      id: workOrder.id,
      woNumber: workOrder.woNumber,
      title: workOrder.title,
      priority: workOrder.priority,
      equipment: { name: workOrder.equipment.name },
      reporter: workOrder.reporter ? { name: workOrder.reporter.name } : undefined,
    },
  });

  // ส่งแจ้งเตือนเข้ากลุ่ม Telegram - งานใหม่ยังไม่มอบหมาย
  await sendTelegramGroupNotification({
    type: 'WORK_ORDER_CREATED',
    workOrder: {
      id: workOrder.id,
      woNumber: workOrder.woNumber,
      title: workOrder.title,
      priority: workOrder.priority,
      equipment: { name: workOrder.equipment.name },
      reporter: workOrder.reporter ? { name: workOrder.reporter.name } : undefined,
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
            lineUserId: true,
            lineDisplayName: true,
            telegramUsername: true,
          },
        },
      },
    });

    // ส่งแจ้งเตือนเข้ากลุ่ม LINE พร้อม @mention ช่าง
    if (workOrder.assignee) {
      await sendGroupNotification({
        type: 'WORK_ORDER_ASSIGNED',
        workOrder: {
          id: workOrder.id,
          woNumber: workOrder.woNumber,
          title: workOrder.title,
          priority: workOrder.priority,
          equipment: { name: workOrder.equipment.name },
        },
        technician: {
          id: workOrder.assignee.id,
          name: workOrder.assignee.name,
          lineUserId: workOrder.assignee.lineUserId,
          lineDisplayName: workOrder.assignee.lineDisplayName,
        },
      });

      // ส่งแจ้งเตือนเข้ากลุ่ม Telegram
      await sendTelegramGroupNotification({
        type: 'WORK_ORDER_ASSIGNED',
        workOrder: {
          id: workOrder.id,
          woNumber: workOrder.woNumber,
          title: workOrder.title,
          priority: workOrder.priority,
          equipment: { name: workOrder.equipment.name },
        },
        technician: {
          id: workOrder.assignee.id,
          name: workOrder.assignee.name,
          telegramUsername: workOrder.assignee.telegramUsername,
        },
      });
    }

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
                maintenanceLogId: log.id, // ✅ Link to Maintenance Log
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

        // ✅ Create Expenses for Spare Parts
        // 1. Find or create Expense Type for Spare Parts
        let expenseType = await tx.expenseType.findFirst({
          where: {
            OR: [
              { name: { contains: "อะไหล่", mode: "insensitive" } },
              { name: { contains: "Spare", mode: "insensitive" } },
              { name: { contains: "Part", mode: "insensitive" } },
            ],
          },
        });

        // Fallback: Use the first available type or create if none (should be seeded though)
        if (!expenseType) {
          expenseType = await tx.expenseType.findFirst();
        }

        // 2. Fetch spare part details to get names
        const sparePartIds = data.spareParts.map((p) => p.sparePartId);
        const sparePartDetails = await tx.sparePart.findMany({
          where: { id: { in: sparePartIds } },
        });

        if (expenseType) {
          await Promise.all(
            data.spareParts.map((part) => {
              const partDetail = sparePartDetails.find(
                (p) => p.id === part.sparePartId
              );
              const partName = partDetail
                ? `${partDetail.name} (${partDetail.code})`
                : "อะไหล่";

              return tx.expense.create({
                data: {
                  workOrderId: data.workOrderId,
                  maintenanceLogId: log.id, // ✅ Link to Maintenance Log
                  expenseTypeId: expenseType!.id,
                  description: `${partName}`,
                  quantity: part.quantity,
                  unitPrice: part.unitPrice,
                  total: part.quantity * part.unitPrice,
                  date: new Date(),
                  notes: "สร้างอัตโนมัติจากบันทึกการซ่อม",
                },
              });
            })
          );
        }
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
 * แก้ไข Maintenance Log
 */
export async function updateMaintenanceLog(data: {
  id: string;
  description: string;
  rootCause?: string;
  solution?: string;
  workHours?: number;
  notes?: string;
  spareParts?: {
    sparePartId: string;
    quantity: number;
    unitPrice: number;
  }[];
  userId: string; // For permission check context if needed, though usually handled by caller
}) {
  try {
    const maintenanceLog = await prisma.$transaction(async (tx) => {
      // 1. Update basic info
      const log = await tx.maintenanceLog.update({
        where: { id: data.id },
        data: {
          description: data.description,
          rootCause: data.rootCause,
          solution: data.solution,
          workHours: data.workHours,
          notes: data.notes,
        },
        include: {
          parts: true,
          workOrder: true,
        },
      });

      // 2. Handle Spare Parts Reconciliation
      if (data.spareParts) {
        const oldParts = log.parts;
        const newParts = data.spareParts;

        // Map for easy lookup
        const oldPartMap = new Map(oldParts.map((p) => [p.sparePartId, p]));
        const newPartMap = new Map(newParts.map((p) => [p.sparePartId, p]));

        // Identify Added, Removed, Updated
        const added = newParts.filter((p) => !oldPartMap.has(p.sparePartId));
        const removed = oldParts.filter((p) => !newPartMap.has(p.sparePartId));
        const updated = newParts.filter((p) => oldPartMap.has(p.sparePartId));

        // Get Expense Type for Spare Parts
        let expenseType = await tx.expenseType.findFirst({
          where: {
            OR: [
              { name: { contains: "อะไหล่", mode: "insensitive" } },
              { name: { contains: "Spare", mode: "insensitive" } },
              { name: { contains: "Part", mode: "insensitive" } },
            ],
          },
        });
        if (!expenseType) {
          expenseType = await tx.expenseType.findFirst();
        }

        // --- Handle Removed ---
        for (const part of removed) {
          // 1. Restore Stock (+quantity)
          await tx.sparePart.update({
            where: { id: part.sparePartId },
            data: { stockQuantity: { increment: part.quantity } },
          });
          // 2. Delete WorkOrderPart
          await tx.workOrderPart.delete({ where: { id: part.id } });
          // 3. Delete Expense (Find by maintenanceLogId and description/partName approx or link?)
          // Since we linked maintenanceLogId, we can delete expenses linked to this log AND matching this part?
          // BEST: We should have linked Expense to WorkOrderPart if possible, but maintenanceLogId + sparePartId check is okay.
          // Problem: Expense doesn't have sparePartId. But we put part name in description.
          // Better approach: Find Expense linked to this maintenanceLogId that matches the part details roughly?
          // No, with maintenanceLogId, we check all expenses in this log.
          // WE NEED TO BE CAREFUL not to delete wrong expense if multiple same parts (unlikely).
          // Strategy: Find expense with maintenanceLogId AND description containing part name/code.
          const partDetail = await tx.sparePart.findUnique({ where: { id: part.sparePartId } });
          if (partDetail) {
            // Try to delete specific expense
            // Note: This is fuzzy if description changed. But typically generated description is consistent.
            await tx.expense.deleteMany({
              where: {
                maintenanceLogId: log.id,
                description: { contains: partDetail.code, mode: "insensitive" } // Assume code is unique enough in description
              }
            });
          }
        }

        // --- Handle Added ---
        for (const part of added) {
          // 1. Deduct Stock (-quantity)
          await tx.sparePart.update({
            where: { id: part.sparePartId },
            data: { stockQuantity: { decrement: part.quantity } },
          });

          // 2. Create WorkOrderPart
          await tx.workOrderPart.create({
            data: {
              workOrderId: log.workOrderId,
              maintenanceLogId: log.id,
              sparePartId: part.sparePartId,
              quantity: part.quantity,
              unitPrice: part.unitPrice,
              totalPrice: part.quantity * part.unitPrice,
            },
          });

          // 3. Create Expense
          const partDetail = await tx.sparePart.findUnique({ where: { id: part.sparePartId } });
          const partName = partDetail ? `${partDetail.name} (${partDetail.code})` : "อะไหล่";

          if (expenseType) {
            await tx.expense.create({
              data: {
                workOrderId: log.workOrderId,
                maintenanceLogId: log.id,
                expenseTypeId: expenseType.id,
                description: partName,
                quantity: part.quantity,
                unitPrice: part.unitPrice,
                total: part.quantity * part.unitPrice,
                date: new Date(),
                notes: "เพิ่มจากการแก้ไขบันทึกการซ่อม",
              },
            });
          }
        }

        // --- Handle Updated ---
        for (const part of updated) {
          const oldPart = oldPartMap.get(part.sparePartId)!;
          const qtyDiff = part.quantity - oldPart.quantity;
          // If Qty Changed
          if (qtyDiff !== 0) {
            // 1. Adjust Stock (inverse of diff: if diff is +1 (add 1), we decrement stock by 1)
            await tx.sparePart.update({
              where: { id: part.sparePartId },
              data: { stockQuantity: { decrement: qtyDiff } },
            });

            // 2. Update WorkOrderPart
            await tx.workOrderPart.update({
              where: { id: oldPart.id },
              data: {
                quantity: part.quantity,
                totalPrice: part.quantity * Number(part.unitPrice)
              }
            });

            // 3. Update Expense
            const partDetail = await tx.sparePart.findUnique({ where: { id: part.sparePartId } });
            if (partDetail) {
              // Update ALL expenses matching this criteria? (Should be 1)
              // Or delete and recreate? Updating is cleaner.
              await tx.expense.updateMany({
                where: {
                  maintenanceLogId: log.id,
                  description: { contains: partDetail.code, mode: "insensitive" }
                },
                data: {
                  quantity: part.quantity,
                  total: part.quantity * Number(part.unitPrice)
                }
              });
            }
          }
        }
      }

      return log;
    });

    return maintenanceLog;
  } catch (error) {
    console.error("Error updating maintenance log:", error);
    throw new Error("ไม่สามารถแก้ไขบันทึกการซ่อมได้");
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
import { deleteFile } from "@/lib/supabase/upload-file";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * ลบไฟล์แนบ
 * ⚠️ สำคัญ: ต้องลบไฟล์จาก Storage ก่อน แล้วค่อยลบ record ใน database
 */
export async function deleteAttachment(
  attachmentId: string,
  userId: string
): Promise<void> {
  try {
    // 1. ดึงข้อมูล attachment เพื่อเช็ค permission และดึง file path
    const attachment = await prisma.workOrderAttachment.findUnique({
      where: { id: attachmentId },
      select: {
        id: true,
        uploadedBy: true,
        fileUrl: true,
        fileName: true,
      },
    });

    if (!attachment) {
      throw new Error("ไม่พบไฟล์แนบ");
    }

    // 2. เช็ค permission - เฉพาะคนอัปโหลดหรือ Admin เท่านั้นที่ลบได้
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const canDelete =
      attachment.uploadedBy === userId || user?.role === "ADMIN";

    if (!canDelete) {
      throw new Error("คุณไม่มีสิทธิ์ลบไฟล์นี้");
    }

    // 3. ✅ ลบไฟล์จาก Supabase Storage ก่อน
    const filePath = extractFilePathFromUrl(attachment.fileUrl);

    if (filePath) {
      // ใช้ Admin Client เพื่อลบไฟล์ (Bypass RLS)
      const supabase = createAdminClient();
      const { error: deleteError } = await supabase.storage
        .from("attachments") // Hardcode bucket name to match upload-file.ts DEFAULT_BUCKET
        .remove([filePath]);

      if (deleteError) {
        console.warn(
          `⚠️ ไม่สามารถลบไฟล์ ${filePath} จาก Storage ได้: ${deleteError.message}`
        );
        // ⚠️ ไม่ throw error เพื่อให้ลบ record ได้ต่อ
      } else {
        console.log(`✅ ลบไฟล์ ${filePath} จาก Storage สำเร็จ`);
      }
    } else {
      console.warn(
        `⚠️ ไม่สามารถดึง file path จาก URL: ${attachment.fileUrl}`
      );
    }

    // 4. ลบ record จาก database
    await prisma.workOrderAttachment.delete({
      where: { id: attachmentId },
    });

    console.log(`✅ ลบ attachment record ${attachmentId} จาก database สำเร็จ`);
  } catch (error) {
    console.error("Delete attachment error:", error);
    throw error;
  }
}

/**
 * Helper function: ดึง file path จาก public URL
 * 
 * ตัวอย่าง URL:
 * https://abc.supabase.co/storage/v1/object/public/attachments/work-orders/12345-abc.jpg
 * 
 * จะได้ path:
 * work-orders/12345-abc.jpg
 */
function extractFilePathFromUrl(fileUrl: string): string | null {
  try {
    // Pattern 1: URL แบบ public
    // https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
    const publicPattern = /\/storage\/v1\/object\/public\/[^/]+\/(.+)$/;
    const publicMatch = fileUrl.match(publicPattern);

    if (publicMatch && publicMatch[1]) {
      return decodeURIComponent(publicMatch[1]);
    }

    // Pattern 2: URL แบบ authenticated
    // https://{project}.supabase.co/storage/v1/object/authenticated/{bucket}/{path}
    const authPattern = /\/storage\/v1\/object\/authenticated\/[^/]+\/(.+)$/;
    const authMatch = fileUrl.match(authPattern);

    if (authMatch && authMatch[1]) {
      return decodeURIComponent(authMatch[1]);
    }

    // Pattern 3: URL แบบ sign (มี token)
    // https://{project}.supabase.co/storage/v1/object/sign/{bucket}/{path}?token=...
    const signPattern = /\/storage\/v1\/object\/sign\/[^/]+\/([^?]+)/;
    const signMatch = fileUrl.match(signPattern);

    if (signMatch && signMatch[1]) {
      return decodeURIComponent(signMatch[1]);
    }

    console.error("ไม่สามารถ extract file path จาก URL:", fileUrl);
    return null;
  } catch (error) {
    console.error("Error extracting file path:", error);
    return null;
  }
}

/**
 * ลบหลายไฟล์พร้อมกัน
 */
export async function deleteMultipleAttachments(
  attachmentIds: string[],
  userId: string
): Promise<{ success: number; failed: number }> {
  let successCount = 0;
  let failedCount = 0;

  for (const attachmentId of attachmentIds) {
    try {
      await deleteAttachment(attachmentId, userId);
      successCount++;
    } catch (error) {
      console.error(`Failed to delete attachment ${attachmentId}:`, error);
      failedCount++;
    }
  }

  return { success: successCount, failed: failedCount };
}

// =============================================
// เพิ่มฟังก์ชันทำความสะอาดไฟล์ที่ไม่ได้ใช้
// =============================================

/**
 * ทำความสะอาดไฟล์ที่ไม่มี record ใน database
 * (ใช้ในกรณีที่มีไฟล์ตกค้างใน Storage)
 */
export async function cleanupOrphanedFiles(): Promise<{
  scanned: number;
  deleted: number;
  errors: number;
}> {
  try {
    // ⚠️ ฟังก์ชันนี้ควรรันโดย Admin เท่านั้น
    // และควรรันเป็นครั้งคราว ไม่ควรรันบ่อย

    console.log("🧹 เริ่มทำความสะอาดไฟล์ที่ไม่ได้ใช้...");

    // TODO: Implement cleanup logic
    // 1. List all files in Storage
    // 2. Check if each file has a record in database
    // 3. Delete files that don't have records

    console.log("⚠️ ฟังก์ชันนี้ยังไม่ได้ implement - ต้องทำด้วยตนเอง");

    return {
      scanned: 0,
      deleted: 0,
      errors: 0,
    };
  } catch (error) {
    console.error("Cleanup error:", error);
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
