/**
 * Work Order Queries
 * Database queries สำหรับ CRUD operations
 */

import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import {
  WorkOrderFilters,
  PaginationParams,
  PaginatedResponse,
  WorkOrderWithRelations,
  WorkOrderStats,
} from "./types";
import { Prisma } from "@prisma/client";

// =====================================
// READ OPERATIONS
// =====================================

/**
 * ดึง Work Orders แบบมี pagination และ filters
 */
export async function getWorkOrders(
  filters: WorkOrderFilters = {},
  pagination: PaginationParams = {}
): Promise<PaginatedResponse<WorkOrderWithRelations>> {
  const {
    status,
    priority,
    equipmentId,
    reportedBy,
    assignedTo,
    dateFrom,
    dateTo,
    search,
    location,
  } = filters;

  const { page = 1, limit = 20, sortBy = "reportedAt", sortOrder = "desc" } = pagination;

  // Build WHERE clause
  const where: Prisma.WorkOrderWhereInput = {};

  if (status) {
    where.status = Array.isArray(status) ? { in: status } : status;
  }

  if (priority) {
    where.priority = Array.isArray(priority) ? { in: priority } : priority;
  }

  if (equipmentId) {
    where.equipmentId = equipmentId;
  }

  if (reportedBy) {
    where.reportedBy = reportedBy;
  }

  if (assignedTo) {
    where.assignedTo = assignedTo;
  }

  // Filter by equipment location
  if (location) {
    where.equipment = {
      location: { contains: location, mode: "insensitive" },
    };
  }

  if (dateFrom || dateTo) {
    where.reportedAt = {};
    if (dateFrom) {
      where.reportedAt.gte = dateFrom;
    }
    if (dateTo) {
      where.reportedAt.lte = dateTo;
    }
  }

  // Search in woNumber, title, description, equipment name/code/location
  if (search) {
    where.OR = [
      { woNumber: { contains: search, mode: "insensitive" } },
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { equipment: { name: { contains: search, mode: "insensitive" } } },
      { equipment: { code: { contains: search, mode: "insensitive" } } },
      { equipment: { location: { contains: search, mode: "insensitive" } } },
    ];
  }

  // Execute query with pagination
  const [data, total] = await Promise.all([
    prisma.workOrder.findMany({
      where,
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
        _count: {
          select: {
            comments: true,
            attachments: true,
            maintenanceLogs: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.workOrder.count({ where }),
  ]);

  return {
    data: data as WorkOrderWithRelations[],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * ดึง Work Order เดี่ยวตาม ID พร้อม relations ทั้งหมด
 */
export async function getWorkOrderById(
  id: string
): Promise<WorkOrderWithRelations | null> {
  const workOrder = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      equipment: {
        include: {
          category: true, // ✅ เปลี่ยนจาก select เป็น include category เต็มๆ
        },
      },
      reporter: {
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
        },
      },
      assignee: {
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
        },
      },
      maintenanceLogs: {
        include: {
          technician: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          parts: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      comments: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      attachments: {
        include: {
          uploader: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      expenses: {
        include: {
          expenseType: true,
        },
      },
      _count: {
        select: {
          comments: true,
          attachments: true,
          maintenanceLogs: true,
        },
      },
    },
  });

  return workOrder as WorkOrderWithRelations | null;
}

/**
 * ดึง Work Order ตาม WO Number
 */
export async function getWorkOrderByNumber(
  woNumber: string
): Promise<WorkOrderWithRelations | null> {
  const workOrder = await prisma.workOrder.findUnique({
    where: { woNumber },
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

  return workOrder as WorkOrderWithRelations | null;
}

/**
 * ดึงสถิติ Work Orders สำหรับ Dashboard
 */
export async function getWorkOrderStats(
  filters: Partial<WorkOrderFilters> = {}
): Promise<WorkOrderStats> {
  const where: Prisma.WorkOrderWhereInput = {};

  // Apply filters if provided
  if (filters.equipmentId) {
    where.equipmentId = filters.equipmentId;
  }
  if (filters.assignedTo) {
    where.assignedTo = filters.assignedTo;
  }
  if (filters.reportedBy) {
    where.reportedBy = filters.reportedBy;
  }

  const [
    total,
    byStatus,
    byPriority,
    avgResolutionTimeResult,
  ] = await Promise.all([
    // Total count
    prisma.workOrder.count({ where }),

    // Count by status
    prisma.workOrder.groupBy({
      by: ["status"],
      where,
      _count: true,
    }),

    // Count by priority
    prisma.workOrder.groupBy({
      by: ["priority"],
      where,
      _count: true,
    }),

    // Average resolution time (in hours)
    prisma.workOrder.aggregate({
      where: {
        ...where,
        status: "COMPLETED",
        resolutionTimeHours: { not: null },
      },
      _avg: {
        resolutionTimeHours: true,
      },
    }),
  ]);

  // Count overdue work orders
  const overdue = await prisma.workOrder.count({
    where: {
      ...where,
      status: {
        notIn: ["COMPLETED", "CANCELLED"],
      },
      dueDate: {
        lt: new Date(),
      },
    },
  });

  // Transform results
  const byStatusMap = byStatus.reduce((acc, item) => {
    acc[item.status] = item._count;
    return acc;
  }, {} as Record<string, number>);

  const byPriorityMap = byPriority.reduce((acc, item) => {
    acc[item.priority] = item._count;
    return acc;
  }, {} as Record<string, number>);

  return {
    total,
    pending: byStatusMap.PENDING || 0,
    inProgress: byStatusMap.IN_PROGRESS || 0,
    completed: byStatusMap.COMPLETED || 0,
    overdue,
    byPriority: byPriorityMap as any,
    byStatus: byStatusMap as any,
    avgResolutionTime: avgResolutionTimeResult._avg.resolutionTimeHours ? Number(avgResolutionTimeResult._avg.resolutionTimeHours) : null,
  };
}

/**
 * ดึง Work Orders ที่ overdue
 */
export async function getOverdueWorkOrders() {
  return prisma.workOrder.findMany({
    where: {
      status: {
        notIn: ["COMPLETED", "CANCELLED"],
      },
      dueDate: {
        lt: new Date(),
      },
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
    orderBy: {
      dueDate: "asc",
    },
  });
}

/**
 * ดึง Work Orders ของ User คนหนึ่ง (ที่เป็นผู้แจ้งหรือผู้รับผิดชอบ)
 */
export async function getUserWorkOrders(userId: string) {
  return prisma.workOrder.findMany({
    where: {
      OR: [
        { reportedBy: userId },
        { assignedTo: userId },
      ],
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
    orderBy: {
      reportedAt: "desc",
    },
    take: 50,
  });
}

// เพิ่มใน lib/api/work-orders/queries.ts (ต่อจากโค้ดเดิม)

// =====================================
// EXTENDED QUERIES FOR DETAIL PAGE
// =====================================

/**
 * ดึง Timeline/Activity Log ของ Work Order
 */
export async function getWorkOrderTimeline(
  workOrderId: string
): Promise<any[]> {
  try {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        attachments: {
          include: {
            uploader: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        maintenanceLogs: {
          include: {
            technician: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        expenses: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!workOrder) return [];

    const events: any[] = [];

    // Created event
    events.push({
      id: `created-${workOrder.id}`,
      type: "CREATED",
      timestamp: workOrder.createdAt,
      user: workOrder.reporter,
      title: "สร้างใบแจ้งซ่อม",
      description: `สร้างโดย ${workOrder.reporter.name}`,
    });

    // Assigned event
    if (workOrder.assignee && workOrder.status !== "PENDING") {
      events.push({
        id: `assigned-${workOrder.id}`,
        type: "ASSIGNED",
        timestamp: workOrder.updatedAt,
        user: workOrder.assignee,
        title: "มอบหมายช่าง",
        description: `มอบหมายให้ ${workOrder.assignee.name}`,
        metadata: {
          technicianName: workOrder.assignee.name,
        },
      });
    }

    // Started event
    if (workOrder.startedAt) {
      events.push({
        id: `started-${workOrder.id}`,
        type: "STATUS_CHANGED",
        timestamp: workOrder.startedAt,
        user: workOrder.assignee,
        title: "เริ่มดำเนินการ",
        description: "เปลี่ยนสถานะเป็น กำลังดำเนินการ",
        metadata: {
          oldValue: "ASSIGNED",
          newValue: "IN_PROGRESS",
        },
      });
    }

    // Comments
    workOrder.comments.forEach((comment) => {
      events.push({
        id: `comment-${comment.id}`,
        type: "COMMENT_ADDED",
        timestamp: comment.createdAt,
        user: comment.user,
        title: "เพิ่มความคิดเห็น",
        description:
          comment.comment.substring(0, 100) +
          (comment.comment.length > 100 ? "..." : ""),
      });
    });

    // Attachments
    workOrder.attachments.forEach((attachment) => {
      events.push({
        id: `attachment-${attachment.id}`,
        type: "ATTACHMENT_UPLOADED",
        timestamp: attachment.createdAt,
        user: attachment.uploader,
        title: "อัพโหลดไฟล์",
        description: attachment.fileName,
        metadata: {
          fileUrl: attachment.fileUrl,
          fileType: attachment.fileType,
        },
      });
    });

    // Maintenance logs
    workOrder.maintenanceLogs.forEach((log) => {
      events.push({
        id: `maintenance-${log.id}`,
        type: "MAINTENANCE_LOG_ADDED",
        timestamp: log.createdAt,
        user: log.technician,
        title: "บันทึกการซ่อม",
        description:
          log.description.substring(0, 100) +
          (log.description.length > 100 ? "..." : ""),
      });
    });

    // Expenses
    workOrder.expenses.forEach((expense) => {
      events.push({
        id: `expense-${expense.id}`,
        type: "EXPENSE_ADDED",
        timestamp: expense.createdAt,
        user: null,
        title: "เพิ่มค่าใช้จ่าย",
        description: `${expense.description} - ฿${expense.total.toLocaleString()}`,
      });
    });

    // Completed event
    if (workOrder.completedAt) {
      events.push({
        id: `completed-${workOrder.id}`,
        type: "COMPLETED",
        timestamp: workOrder.completedAt,
        user: workOrder.assignee,
        title: "เสร็จสิ้น",
        description: `แก้ไขเสร็จใน ${workOrder.resolutionTimeHours?.toFixed(1) || 0
          } ชั่วโมง`,
      });
    }

    // Sort by timestamp
    return events.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
  } catch (error) {
    console.error("Error fetching timeline:", error);
    throw new Error("ไม่สามารถดึงข้อมูล Timeline ได้");
  }
}

/**
 * ดึงสถิติของ Work Order
 */
export async function getWorkOrderDetailStats(workOrderId: string) {
  try {
    const [expenses, maintenanceLogs, comments, attachments] =
      await Promise.all([
        prisma.expense.aggregate({
          where: { workOrderId },
          _sum: { total: true },
        }),
        prisma.maintenanceLog.aggregate({
          where: { workOrderId },
          _sum: { workHours: true },
          _count: true,
        }),
        prisma.workOrderComment.count({
          where: { workOrderId },
        }),
        prisma.workOrderAttachment.count({
          where: { workOrderId },
        }),
      ]);

    return {
      totalExpenses: expenses._sum.total?.toNumber() || 0,
      totalWorkHours: maintenanceLogs._sum.workHours?.toNumber() || 0,
      commentsCount: comments,
      attachmentsCount: attachments,
      maintenanceLogsCount: maintenanceLogs._count,
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    throw new Error("ไม่สามารถดึงข้อมูลสถิติได้");
  }
}

/**
 * ตรวจสอบสิทธิ์การเข้าถึง Work Order
 */
export async function checkWorkOrderPermissions(
  workOrderId: string,
  userId: string
) {
  try {
    const [workOrder, user] = await Promise.all([
      prisma.workOrder.findUnique({
        where: { id: workOrderId },
        select: {
          reportedBy: true,
          assignedTo: true,
          status: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      }),
    ]);

    if (!workOrder || !user) {
      return {
        canView: false,
        canEdit: false,
        canDelete: false,
        canChangeStatus: false,
        canAssign: false,
        canAddExpense: false,
        canAddMaintenanceLog: false,
        canComment: false,
        canUploadAttachment: false,
      };
    }

    const isAdmin = user.role === UserRole.ADMIN;
    const isTechnician = user.role === UserRole.TECHNICIAN || isAdmin;
    const isReporter = workOrder.reportedBy === userId;
    const isAssignee = workOrder.assignedTo === userId;
    const isPending = workOrder.status === "PENDING";

    return {
      canView: isAdmin || isTechnician || isReporter || isAssignee,
      canEdit: isAdmin || (isReporter && isPending) || isAssignee,
      canDelete: isAdmin,
      canChangeStatus: isAdmin || (isTechnician && isAssignee),
      canAssign: isAdmin,
      canAddExpense: isAdmin,
      canAddMaintenanceLog: isAdmin || (isTechnician && isAssignee),
      canComment: true, // Anyone who can view
      canUploadAttachment: isAdmin || isTechnician || (isReporter && isPending),
      canAccept: isTechnician && !workOrder.assignedTo,
    };
  } catch (error) {
    console.error("Error checking permissions:", error);
    return {
      canView: false,
      canEdit: false,
      canDelete: false,
      canChangeStatus: false,
      canAssign: false,
      canAddExpense: false,
      canAddMaintenanceLog: false,
      canComment: false,
      canUploadAttachment: false,
    };
  }
}

/**
 * ดึงรายชื่อช่างที่พร้อมรับงาน
 */
export async function getAvailableTechnicians() {
  try {
    const technicians = await prisma.user.findMany({
      where: {
        role: {
          in: [UserRole.TECHNICIAN, UserRole.ADMIN],
        },
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        _count: {
          select: {
            assignedWorkOrders: {
              where: {
                status: {
                  in: ["ASSIGNED", "IN_PROGRESS"],
                },
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return technicians.map((tech) => ({
      id: tech.id,
      name: tech.name,
      email: tech.email,
      avatarUrl: tech.avatarUrl,
      activeWorkOrders: tech._count.assignedWorkOrders,
    }));
  } catch (error) {
    console.error("Error fetching technicians:", error);
    throw new Error("ไม่สามารถดึงข้อมูลช่างได้");
  }
}

/**
 * ดึงรายการ Expense Types
 */
export async function getExpenseTypes() {
  try {
    return await prisma.expenseType.findMany({
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Error fetching expense types:", error);
    throw new Error("ไม่สามารถดึงข้อมูลประเภทค่าใช้จ่ายได้");
  }
}

/**
 * ดึงรายการ Spare Parts
 */
export async function getSpareParts(search?: string) {
  try {
    const where = search
      ? {
        OR: [
          { code: { contains: search, mode: "insensitive" as const } },
          { name: { contains: search, mode: "insensitive" as const } },
        ],
      }
      : {};

    return await prisma.sparePart.findMany({
      where,
      orderBy: { name: "asc" },
      take: 50,
    });
  } catch (error) {
    console.error("Error fetching spare parts:", error);
    throw new Error("ไม่สามารถดึงข้อมูลอะไหล่ได้");
  }
}

/**
 * ดึงความคิดเห็นของ Work Order
 */
export async function getWorkOrderComments(workOrderId: string) {
  try {
    return await prisma.workOrderComment.findMany({
      where: { workOrderId },
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
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    throw new Error("ไม่สามารถดึงข้อมูลความคิดเห็นได้");
  }
}

/**
 * ดึงไฟล์แนบของ Work Order
 */
export async function getWorkOrderAttachments(workOrderId: string) {
  try {
    return await prisma.workOrderAttachment.findMany({
      where: { workOrderId },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching attachments:", error);
    throw new Error("ไม่สามารถดึงข้อมูลไฟล์แนบได้");
  }
}