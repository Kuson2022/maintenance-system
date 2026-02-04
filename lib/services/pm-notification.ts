/**
 * PM Notification Service
 * ส่งแจ้งเตือน PM (Preventive Maintenance) ในวันที่ถึงกำหนด และเมื่อเกินกำหนด
 * ใช้ timezone ประเทศไทย (UTC+7) ในการคำนวณวันที่
 * 
 * หมายเหตุ: วันที่ใน database ถูกเก็บเป็น noon UTC (12:00:00Z) เพื่อป้องกัน timezone shift
 */

import { prisma } from "@/lib/prisma";
import { sendGroupNotification } from "./line-notification";
import { sendTelegramGroupNotification } from "./telegram-notification";

// Thailand timezone offset (UTC+7)
const THAILAND_TIMEZONE = "Asia/Bangkok";

/**
 * คำนวณวันที่ปัจจุบันตาม timezone ไทย และคืนค่าเป็น noon UTC
 * เพื่อให้ตรงกับวิธีที่เก็บ nextDueDate ใน database
 * @returns วันที่ 12:00:00 UTC ของวันนี้ตามเวลาไทย
 */
function getTodayInThailand(): Date {
    // สร้าง date string ในรูปแบบ YYYY-MM-DD ตามเวลาไทย
    const now = new Date();
    const thaiDateStr = now.toLocaleDateString("en-CA", {
        timeZone: THAILAND_TIMEZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });

    // แปลงกลับเป็น Date object ที่ 12:00:00 UTC (noon)
    // เพื่อให้ตรงกับวิธีที่เก็บ nextDueDate ใน database
    return new Date(thaiDateStr + "T12:00:00.000Z");
}

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
 * ดึง PM Schedules ที่ต้องแจ้งเตือน (วันที่ถึงกำหนด PM วันนี้ตามเวลาไทย)
 */
export async function getPMSchedulesDue(): Promise<PMScheduleForNotification[]> {
    const today = getTodayInThailand();

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const schedules = await prisma.maintenanceSchedule.findMany({
        where: {
            status: "ACTIVE",
            nextDueDate: {
                gte: today,
                lt: tomorrow,
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
 * ดึง PM Schedules ที่เกินกำหนดพอดี X วัน (แจ้งเตือนเฉพาะวันที่ครบกำหนด overdue)
 * เช่น overdueDays = 3 จะแจ้งเตือน PM ที่เกินกำหนดครบ 3 วันพอดีเท่านั้น
 * ใช้เวลาไทยในการคำนวณ
 */
export async function getPMSchedulesOverdue(overdueDays: number = 3): Promise<PMScheduleForNotification[]> {
    const today = getTodayInThailand();

    // คำนวณวันที่เกินกำหนดพอดี X วัน
    const exactOverdueDate = new Date(today);
    exactOverdueDate.setDate(exactOverdueDate.getDate() - overdueDays);

    const nextDay = new Date(exactOverdueDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const schedules = await prisma.maintenanceSchedule.findMany({
        where: {
            status: "ACTIVE",
            nextDueDate: {
                gte: exactOverdueDate, // เกินกำหนดพอดี X วัน
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
