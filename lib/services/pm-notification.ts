/**
 * PM Notification Service
 * ส่งแจ้งเตือน PM (Preventive Maintenance) ก่อนถึงวันกำหนด
 */

import { prisma } from "@/lib/prisma";
import { sendGroupNotification } from "./line-notification";
import { sendTelegramGroupNotification } from "./telegram-notification";

export interface PMScheduleForNotification {
    id: string;
    activityName: string;
    nextDueDate: Date;
    equipment: {
        name: string;
        code: string;
        location?: string | null;
    };
    assignee?: {
        id: string;
        name: string;
        lineUserId?: string | null;
        lineDisplayName?: string | null;
        telegramUsername?: string | null;
    } | null;
}

/**
 * ดึง PM Schedules ที่ต้องแจ้งเตือน (ก่อน due date)
 */
export async function getPMSchedulesDue(daysBefore: number = 1): Promise<PMScheduleForNotification[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // คำนวณวันที่ต้องการแจ้งเตือน (วันนี้ + daysBefore)
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + daysBefore);

    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const schedules = await prisma.maintenanceSchedule.findMany({
        where: {
            status: "ACTIVE",
            nextDueDate: {
                gte: targetDate,
                lt: nextDay,
            },
        },
        include: {
            equipment: {
                select: {
                    name: true,
                    code: true,
                    location: true,
                },
            },
            assignee: {
                select: {
                    id: true,
                    name: true,
                    lineUserId: true,
                    lineDisplayName: true,
                    telegramUsername: true,
                },
            },
        },
    });

    return schedules.map((s) => ({
        id: s.id,
        activityName: s.activityName,
        nextDueDate: s.nextDueDate!,
        equipment: s.equipment,
        assignee: s.assignee,
    }));
}

/**
 * ดึง PM Schedules ที่เกินกำหนด (overdue)
 */
export async function getPMSchedulesOverdue(overdueDays: number = 3): Promise<PMScheduleForNotification[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // คำนวณวันที่เกินกำหนด (overdueDays วันก่อน)
    const overdueDate = new Date(today);
    overdueDate.setDate(overdueDate.getDate() - overdueDays);

    const schedules = await prisma.maintenanceSchedule.findMany({
        where: {
            status: "ACTIVE",
            nextDueDate: {
                lt: today, // เกินกำหนดแล้ว
                gte: overdueDate, // แต่ไม่เกิน X วัน (เพื่อไม่ให้แจ้งซ้ำทุกวัน)
            },
        },
        include: {
            equipment: {
                select: {
                    name: true,
                    code: true,
                    location: true,
                },
            },
            assignee: {
                select: {
                    id: true,
                    name: true,
                    lineUserId: true,
                    lineDisplayName: true,
                    telegramUsername: true,
                },
            },
        },
    });

    return schedules.map((s) => ({
        id: s.id,
        activityName: s.activityName,
        nextDueDate: s.nextDueDate!,
        equipment: s.equipment,
        assignee: s.assignee,
    }));
}

/**
 * ส่งแจ้งเตือน PM Due (ก่อนถึงกำหนด)
 */
export async function sendPMDueNotifications(schedules: PMScheduleForNotification[]): Promise<void> {
    for (const schedule of schedules) {
        // ส่ง LINE
        await sendGroupNotification({
            type: "PM_DUE",
            pmSchedule: {
                id: schedule.id,
                activityName: schedule.activityName,
                nextDueDate: schedule.nextDueDate,
                equipment: schedule.equipment,
            },
            technician: schedule.assignee ? {
                id: schedule.assignee.id,
                name: schedule.assignee.name,
                lineUserId: schedule.assignee.lineUserId,
                lineDisplayName: schedule.assignee.lineDisplayName,
            } : undefined,
        });

        // ส่ง Telegram
        await sendTelegramGroupNotification({
            type: "PM_DUE",
            pmSchedule: {
                id: schedule.id,
                activityName: schedule.activityName,
                nextDueDate: schedule.nextDueDate,
                equipment: schedule.equipment,
            },
            technician: schedule.assignee ? {
                id: schedule.assignee.id,
                name: schedule.assignee.name,
                telegramUsername: schedule.assignee.telegramUsername,
            } : undefined,
        });
    }
}

/**
 * ส่งแจ้งเตื่น PM Overdue (เกินกำหนด)
 */
export async function sendPMOverdueNotifications(schedules: PMScheduleForNotification[]): Promise<void> {
    for (const schedule of schedules) {
        const daysOverdue = Math.floor(
            (new Date().getTime() - schedule.nextDueDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // ส่ง LINE
        await sendGroupNotification({
            type: "PM_OVERDUE",
            pmSchedule: {
                id: schedule.id,
                activityName: schedule.activityName,
                nextDueDate: schedule.nextDueDate,
                equipment: schedule.equipment,
                daysOverdue,
            },
            technician: schedule.assignee ? {
                id: schedule.assignee.id,
                name: schedule.assignee.name,
                lineUserId: schedule.assignee.lineUserId,
                lineDisplayName: schedule.assignee.lineDisplayName,
            } : undefined,
        });

        // ส่ง Telegram
        await sendTelegramGroupNotification({
            type: "PM_OVERDUE",
            pmSchedule: {
                id: schedule.id,
                activityName: schedule.activityName,
                nextDueDate: schedule.nextDueDate,
                equipment: schedule.equipment,
                daysOverdue,
            },
            technician: schedule.assignee ? {
                id: schedule.assignee.id,
                name: schedule.assignee.name,
                telegramUsername: schedule.assignee.telegramUsername,
            } : undefined,
        });
    }
}

/**
 * ดึงการตั้งค่าแจ้งเตือน
 */
export async function getNotificationSettings() {
    // หา settings ที่มีอยู่ หรือสร้างใหม่ถ้าไม่มี
    let settings = await prisma.notificationSettings.findFirst();

    if (!settings) {
        settings = await prisma.notificationSettings.create({
            data: {},
        });
    }

    return settings;
}
