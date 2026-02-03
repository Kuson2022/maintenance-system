/**
 * PM Notifications Cron Job
 * ทำงานทุกวันตามเวลาที่กำหนดเพื่อส่งแจ้งเตือน PM
 * 
 * Vercel Cron: จะถูกเรียกอัตโนมัติตาม schedule ใน vercel.json
 */

import { NextRequest, NextResponse } from "next/server";
import {
    getNotificationSettings,
    getPMSchedulesDue,
    getPMSchedulesOverdue,
    sendPMDueNotifications,
    sendPMOverdueNotifications
} from "@/lib/services/pm-notification";

// Cron secret สำหรับป้องกันการเรียกจากภายนอก
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
    try {
        // ตรวจสอบ Authorization header (Vercel Cron จะส่ง Bearer token มา)
        const authHeader = request.headers.get("authorization");

        // ถ้ามี CRON_SECRET ให้ตรวจสอบ
        if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
            console.warn("Unauthorized cron request");
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        console.log("Running PM notifications cron job...");

        // ดึงการตั้งค่า
        const settings = await getNotificationSettings();

        if (!settings.pmNotificationEnabled) {
            console.log("PM notifications are disabled");
            return NextResponse.json({
                success: true,
                message: "PM notifications are disabled",
                sent: { due: 0, overdue: 0 },
            });
        }

        let dueSent = 0;
        let overdueSent = 0;

        // 1. ส่งแจ้งเตือน PM Due (ก่อนถึงกำหนด)
        const dueSchedules = await getPMSchedulesDue(settings.pmDaysBefore);
        if (dueSchedules.length > 0) {
            await sendPMDueNotifications(dueSchedules);
            dueSent = dueSchedules.length;
            console.log(`Sent ${dueSent} PM due notifications`);
        }

        // 2. ส่งแจ้งเตือน PM Overdue (เกินกำหนด)
        if (settings.pmOverdueEnabled) {
            const overdueSchedules = await getPMSchedulesOverdue(settings.pmOverdueDays);
            if (overdueSchedules.length > 0) {
                await sendPMOverdueNotifications(overdueSchedules);
                overdueSent = overdueSchedules.length;
                console.log(`Sent ${overdueSent} PM overdue notifications`);
            }
        }

        console.log(`PM notifications cron completed. Due: ${dueSent}, Overdue: ${overdueSent}`);

        return NextResponse.json({
            success: true,
            message: "PM notifications sent successfully",
            sent: { due: dueSent, overdue: overdueSent },
        });
    } catch (error) {
        console.error("PM notifications cron error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
