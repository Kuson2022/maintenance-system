"use server";

/**
 * Schedule Server Actions
 * Server actions for Maintenance Schedule CRUD operations
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import {
    createSchedule,
    updateSchedule,
    deleteSchedule,
    completeSchedule,
} from "@/lib/api/schedules/mutations";
import {
    getSchedules,
    getScheduleById,
    getUpcomingSchedules,
    getOverdueSchedules,
} from "@/lib/api/schedules/queries";
import {
    createScheduleSchema,
    updateScheduleSchema,
} from "@/lib/api/schedules/validation";
import { checkSchedulePermissions, SchedulePermissions } from "@/lib/api/schedules/permissions";

// ========================================
// TYPES
// ========================================

interface ActionResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

// ========================================
// AUTH HELPERS
// ========================================

async function checkAuth() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error("กรุณาเข้าสู่ระบบ");
    return user;
}

function serialize<T>(data: T): T {
    return JSON.parse(JSON.stringify(data, (key, value) => {
        if (value && typeof value === 'object' && value.constructor?.name === 'Decimal') {
            return Number(value);
        }
        if (value instanceof Date) {
            return value.toISOString();
        }
        return value;
    }));
}

// ========================================
// PERMISSION ACTIONS
// ========================================

/**
 * ตรวจสอบสิทธิ์การเข้าถึง Schedule (สำหรับ UI)
 */
export async function checkSchedulePermissionsAction(
    scheduleId?: string
): Promise<ActionResponse<SchedulePermissions>> {
    try {
        const user = await checkAuth();
        const permissions = await checkSchedulePermissions(user.id, scheduleId);
        return { success: true, data: permissions };
    } catch (error: any) {
        console.error("checkSchedulePermissionsAction error:", error);
        return { success: false, error: error.message || "เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์" };
    }
}

// ========================================
// READ ACTIONS
// ========================================

/**
 * ดึงรายการ Schedule ทั้งหมด
 */
export async function getSchedulesAction(filters?: {
    equipmentId?: string;
    assignedTo?: string;
    status?: string;
    type?: string;
}): Promise<ActionResponse> {
    try {
        const user = await checkAuth();
        const permissions = await checkSchedulePermissions(user.id);

        if (!permissions.canView) {
            return { success: false, error: "ไม่มีสิทธิ์ดูข้อมูลตารางบำรุงรักษา" };
        }

        const schedules = await getSchedules(filters as any);
        return { success: true, data: serialize(schedules) };
    } catch (error: any) {
        console.error("getSchedulesAction error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * ดึง Schedule เฉพาะ
 */
export async function getScheduleByIdAction(id: string): Promise<ActionResponse> {
    try {
        const user = await checkAuth();
        const permissions = await checkSchedulePermissions(user.id, id);

        if (!permissions.canView) {
            return { success: false, error: "ไม่มีสิทธิ์ดูข้อมูลตารางบำรุงรักษานี้" };
        }

        const schedule = await getScheduleById(id);
        if (!schedule) {
            return { success: false, error: "ไม่พบข้อมูลตารางบำรุงรักษา" };
        }

        return { success: true, data: serialize(schedule) };
    } catch (error: any) {
        console.error("getScheduleByIdAction error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * ดึง Upcoming Schedules
 */
export async function getUpcomingSchedulesAction(days: number = 7): Promise<ActionResponse> {
    try {
        const user = await checkAuth();
        const permissions = await checkSchedulePermissions(user.id);

        if (!permissions.canView) {
            return { success: false, error: "ไม่มีสิทธิ์ดูข้อมูลตารางบำรุงรักษา" };
        }

        const schedules = await getUpcomingSchedules(days);
        return { success: true, data: serialize(schedules) };
    } catch (error: any) {
        console.error("getUpcomingSchedulesAction error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * ดึง Overdue Schedules
 */
export async function getOverdueSchedulesAction(): Promise<ActionResponse> {
    try {
        const user = await checkAuth();
        const permissions = await checkSchedulePermissions(user.id);

        if (!permissions.canView) {
            return { success: false, error: "ไม่มีสิทธิ์ดูข้อมูลตารางบำรุงรักษา" };
        }

        const schedules = await getOverdueSchedules();
        return { success: true, data: serialize(schedules) };
    } catch (error: any) {
        console.error("getOverdueSchedulesAction error:", error);
        return { success: false, error: error.message };
    }
}

// ========================================
// CREATE ACTION
// ========================================

/**
 * สร้าง Schedule ใหม่
 */
export async function createScheduleAction(data: any): Promise<ActionResponse> {
    try {
        const user = await checkAuth();
        const permissions = await checkSchedulePermissions(user.id);

        if (!permissions.canCreate) {
            return { success: false, error: "ไม่มีสิทธิ์สร้างตารางบำรุงรักษา" };
        }

        // Validate and transform data
        const validData = createScheduleSchema.parse({
            ...data,
            startDate: new Date(data.startDate),
            endDate: data.endDate ? new Date(data.endDate) : undefined,
        });

        const schedule = await createSchedule(validData);

        revalidatePath("/dashboard/schedules");
        revalidatePath("/dashboard");

        return { success: true, data: serialize(schedule) };
    } catch (error: any) {
        console.error("createScheduleAction error:", error);
        return { success: false, error: error.message || "ไม่สามารถสร้างตารางบำรุงรักษาได้" };
    }
}

// ========================================
// UPDATE ACTION
// ========================================

/**
 * แก้ไข Schedule
 */
export async function updateScheduleAction(data: any): Promise<ActionResponse> {
    try {
        const user = await checkAuth();
        const permissions = await checkSchedulePermissions(user.id, data.id);

        if (!permissions.canEdit) {
            return { success: false, error: "ไม่มีสิทธิ์แก้ไขตารางบำรุงรักษา" };
        }

        // Validate and transform data
        const validData = updateScheduleSchema.parse({
            ...data,
            startDate: data.startDate ? new Date(data.startDate) : undefined,
            endDate: data.endDate ? new Date(data.endDate) : undefined,
        });

        const schedule = await updateSchedule(validData);

        revalidatePath("/dashboard/schedules");
        revalidatePath(`/dashboard/schedules/${data.id}`);

        return { success: true, data: serialize(schedule) };
    } catch (error: any) {
        console.error("updateScheduleAction error:", error);
        return { success: false, error: error.message || "ไม่สามารถแก้ไขตารางบำรุงรักษาได้" };
    }
}

// ========================================
// DELETE ACTION
// ========================================

/**
 * ลบ Schedule
 */
export async function deleteScheduleAction(id: string): Promise<ActionResponse> {
    try {
        const user = await checkAuth();
        const permissions = await checkSchedulePermissions(user.id, id);

        if (!permissions.canDelete) {
            return { success: false, error: "ไม่มีสิทธิ์ลบตารางบำรุงรักษา" };
        }

        // Check if schedule has maintenance history
        const historyCount = await prisma.maintenanceHistory.count({
            where: { scheduleId: id },
        });

        if (historyCount > 0) {
            return {
                success: false,
                error: `ไม่สามารถลบได้ มีประวัติการบำรุงรักษา ${historyCount} รายการ`
            };
        }

        await deleteSchedule(id);

        revalidatePath("/dashboard/schedules");
        revalidatePath("/dashboard");

        return { success: true };
    } catch (error: any) {
        console.error("deleteScheduleAction error:", error);
        return { success: false, error: error.message || "ไม่สามารถลบตารางบำรุงรักษาได้" };
    }
}

// ========================================
// COMPLETE ACTION
// ========================================

/**
 * Complete Schedule (บันทึกผลการบำรุงรักษา)
 */
export async function completeScheduleAction(
    scheduleId: string,
    results?: Record<string, any>
): Promise<ActionResponse> {
    try {
        const user = await checkAuth();
        const permissions = await checkSchedulePermissions(user.id, scheduleId);

        if (!permissions.canComplete) {
            return { success: false, error: "ไม่มีสิทธิ์บันทึกผลการบำรุงรักษา" };
        }

        await completeSchedule(scheduleId, results, user.id);

        revalidatePath("/dashboard/schedules");
        revalidatePath(`/dashboard/schedules/${scheduleId}`);
        revalidatePath("/dashboard");

        return { success: true };
    } catch (error: any) {
        console.error("completeScheduleAction error:", error);
        return { success: false, error: error.message || "ไม่สามารถบันทึกผลการบำรุงรักษาได้" };
    }
}

// ========================================
// ASSIGN ACTION
// ========================================

/**
 * Assign Technician to Schedule
 */
export async function assignScheduleAction(
    scheduleId: string,
    technicianId: string
): Promise<ActionResponse> {
    try {
        const user = await checkAuth();
        const permissions = await checkSchedulePermissions(user.id, scheduleId);

        if (!permissions.canAssign) {
            return { success: false, error: "ไม่มีสิทธิ์มอบหมายช่างเทคนิค" };
        }

        const schedule = await prisma.maintenanceSchedule.update({
            where: { id: scheduleId },
            data: { assignedTo: technicianId },
            include: {
                equipment: true,
                assignee: true,
            },
        });

        revalidatePath("/dashboard/schedules");
        revalidatePath(`/dashboard/schedules/${scheduleId}`);

        return { success: true, data: serialize(schedule) };
    } catch (error: any) {
        console.error("assignScheduleAction error:", error);
        return { success: false, error: error.message || "ไม่สามารถมอบหมายช่างเทคนิคได้" };
    }
}

// ========================================
// PAUSE/RESUME ACTIONS
// ========================================

/**
 * Pause Schedule
 */
export async function pauseScheduleAction(scheduleId: string): Promise<ActionResponse> {
    try {
        const user = await checkAuth();
        const permissions = await checkSchedulePermissions(user.id, scheduleId);

        if (!permissions.canEdit) {
            return { success: false, error: "ไม่มีสิทธิ์หยุดตารางบำรุงรักษาชั่วคราว" };
        }

        const schedule = await prisma.maintenanceSchedule.update({
            where: { id: scheduleId },
            data: { status: "INACTIVE" },
        });

        revalidatePath("/dashboard/schedules");
        revalidatePath(`/dashboard/schedules/${scheduleId}`);

        return { success: true, data: serialize(schedule) };
    } catch (error: any) {
        console.error("pauseScheduleAction error:", error);
        return { success: false, error: error.message || "ไม่สามารถหยุดตารางบำรุงรักษาได้" };
    }
}

/**
 * Resume Schedule
 */
export async function resumeScheduleAction(scheduleId: string): Promise<ActionResponse> {
    try {
        const user = await checkAuth();
        const permissions = await checkSchedulePermissions(user.id, scheduleId);

        if (!permissions.canEdit) {
            return { success: false, error: "ไม่มีสิทธิ์เปิดใช้งานตารางบำรุงรักษา" };
        }

        const schedule = await prisma.maintenanceSchedule.update({
            where: { id: scheduleId },
            data: { status: "ACTIVE" },
        });

        revalidatePath("/dashboard/schedules");
        revalidatePath(`/dashboard/schedules/${scheduleId}`);

        return { success: true, data: serialize(schedule) };
    } catch (error: any) {
        console.error("resumeScheduleAction error:", error);
        return { success: false, error: error.message || "ไม่สามารถเปิดใช้งานตารางบำรุงรักษาได้" };
    }
}

// ========================================
// HELPER ACTIONS
// ========================================

/**
 * Get available technicians for assignment
 */
export async function getAvailableTechniciansAction(): Promise<ActionResponse> {
    try {
        await checkAuth();

        const technicians = await prisma.user.findMany({
            where: {
                role: { in: ["TECHNICIAN", "ADMIN"] },
                status: "ACTIVE",
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
            orderBy: { name: "asc" },
        });

        return { success: true, data: serialize(technicians) };
    } catch (error: any) {
        console.error("getAvailableTechniciansAction error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Get equipment list for schedule creation
 */
export async function getEquipmentListAction(): Promise<ActionResponse> {
    try {
        await checkAuth();

        const equipment = await prisma.equipment.findMany({
            where: {
                status: { in: ["ACTIVE", "MAINTENANCE"] },
            },
            select: {
                id: true,
                name: true,
                code: true,
                location: true,
            },
            orderBy: { name: "asc" },
        });

        return { success: true, data: serialize(equipment) };
    } catch (error: any) {
        console.error("getEquipmentListAction error:", error);
        return { success: false, error: error.message };
    }
}
