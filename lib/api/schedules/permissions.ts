/**
 * Schedule Permissions
 * Role-based permission checks for Maintenance Schedule module
 */

import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export interface SchedulePermissions {
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canComplete: boolean;
    canAssign: boolean;
}

/**
 * ตรวจสอบสิทธิ์การเข้าถึง Maintenance Schedule module
 * @param userId - User ID ที่ต้องการตรวจสอบ
 * @param scheduleId - Schedule ID (optional) สำหรับตรวจสอบ assignee
 * @returns SchedulePermissions object
 */
export async function checkSchedulePermissions(
    userId: string,
    scheduleId?: string
): Promise<SchedulePermissions> {
    try {
        // Get user with role
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                role: true,
                status: true
            },
        });

        if (!user || user.status !== "ACTIVE") {
            return {
                canView: false,
                canCreate: false,
                canEdit: false,
                canDelete: false,
                canComplete: false,
                canAssign: false,
            };
        }

        const isAdmin = user.role === UserRole.ADMIN;
        const isTechnician = user.role === UserRole.TECHNICIAN;

        // Check if user is assigned to this schedule (if scheduleId provided)
        let isAssignee = false;
        if (scheduleId && (isTechnician || isAdmin)) {
            const schedule = await prisma.maintenanceSchedule.findUnique({
                where: { id: scheduleId },
                select: { assignedTo: true },
            });
            isAssignee = schedule?.assignedTo === userId;
        }

        return {
            // ทุก role ที่ login ได้ ดูได้ (ADMIN, TECHNICIAN)
            // USER ทั่วไปไม่ควรเห็น Schedule
            canView: isAdmin || isTechnician,

            // ADMIN เท่านั้นที่สร้าง Schedule ได้
            canCreate: isAdmin,

            // ADMIN แก้ไขได้ทุก schedule
            canEdit: isAdmin,

            // ADMIN เท่านั้นที่ลบได้
            canDelete: isAdmin,

            // ADMIN complete ได้ทุก schedule
            // TECHNICIAN complete ได้เฉพาะ schedule ที่ถูก assign
            canComplete: isAdmin || (isTechnician && isAssignee),

            // ADMIN เท่านั้นที่ assign technician ได้
            canAssign: isAdmin,
        };
    } catch (error) {
        console.error("Error checking schedule permissions:", error);
        return {
            canView: false,
            canCreate: false,
            canEdit: false,
            canDelete: false,
            canComplete: false,
            canAssign: false,
        };
    }
}

/**
 * ตรวจสอบสิทธิ์แบบทั่วไป (ไม่ต้องระบุ scheduleId)
 * ใช้สำหรับหน้า list และการสร้าง schedule ใหม่
 */
export async function checkSchedulePermissionsGeneral(
    userId: string
): Promise<SchedulePermissions> {
    return checkSchedulePermissions(userId);
}
