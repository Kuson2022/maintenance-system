"use server";

/**
 * Notification Settings Server Actions
 * สำหรับจัดการการตั้งค่าแจ้งเตือน (ADMIN only)
 */

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface UpdateNotificationSettingsInput {
    pmNotificationEnabled: boolean;
    pmNotificationTime: string;
    pmDaysBefore: number;
    pmOverdueEnabled: boolean;
    pmOverdueDays: number;
}

/**
 * ดึงการตั้งค่าแจ้งเตือน
 */
export async function getNotificationSettingsAction() {
    try {
        // หา settings ที่มีอยู่ หรือสร้างใหม่ถ้าไม่มี
        let settings = await prisma.notificationSettings.findFirst();

        if (!settings) {
            settings = await prisma.notificationSettings.create({
                data: {},
            });
        }

        return { success: true, data: settings };
    } catch (error) {
        console.error("Error getting notification settings:", error);
        return { success: false, error: "ไม่สามารถดึงการตั้งค่าได้" };
    }
}

/**
 * อัพเดทการตั้งค่าแจ้งเตือน (ADMIN only)
 */
export async function updateNotificationSettingsAction(input: UpdateNotificationSettingsInput) {
    try {
        // ตรวจสอบสิทธิ์
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "กรุณาเข้าสู่ระบบ" };
        }

        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { role: true },
        });

        if (dbUser?.role !== "ADMIN") {
            return { success: false, error: "คุณไม่มีสิทธิ์ในการตั้งค่านี้" };
        }

        // Validate input
        if (input.pmDaysBefore < 1 || input.pmDaysBefore > 30) {
            return { success: false, error: "จำนวนวันก่อนแจ้งเตือนต้องอยู่ระหว่าง 1-30 วัน" };
        }

        if (input.pmOverdueDays < 1 || input.pmOverdueDays > 30) {
            return { success: false, error: "จำนวนวันเกินกำหนดต้องอยู่ระหว่าง 1-30 วัน" };
        }

        // Validate time format (HH:mm)
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(input.pmNotificationTime)) {
            return { success: false, error: "รูปแบบเวลาไม่ถูกต้อง (HH:mm)" };
        }

        // หา settings ที่มีอยู่หรือสร้างใหม่
        let settings = await prisma.notificationSettings.findFirst();

        if (settings) {
            settings = await prisma.notificationSettings.update({
                where: { id: settings.id },
                data: {
                    pmNotificationEnabled: input.pmNotificationEnabled,
                    pmNotificationTime: input.pmNotificationTime,
                    pmDaysBefore: input.pmDaysBefore,
                    pmOverdueEnabled: input.pmOverdueEnabled,
                    pmOverdueDays: input.pmOverdueDays,
                },
            });
        } else {
            settings = await prisma.notificationSettings.create({
                data: {
                    pmNotificationEnabled: input.pmNotificationEnabled,
                    pmNotificationTime: input.pmNotificationTime,
                    pmDaysBefore: input.pmDaysBefore,
                    pmOverdueEnabled: input.pmOverdueEnabled,
                    pmOverdueDays: input.pmOverdueDays,
                },
            });
        }

        revalidatePath("/dashboard/settings");

        return { success: true, data: settings };
    } catch (error) {
        console.error("Error updating notification settings:", error);
        return { success: false, error: "ไม่สามารถบันทึกการตั้งค่าได้" };
    }
}
