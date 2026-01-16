/**
 * Report Permissions
 * Role-based permission checks for Report module
 * Only ADMIN can access reports
 */

import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export interface ReportPermissions {
    canView: boolean;
    canExport: boolean;
}

/**
 * ตรวจสอบสิทธิ์การเข้าถึง Report module
 * เฉพาะ ADMIN เท่านั้นที่เข้าถึงได้
 * @param userId - User ID ที่ต้องการตรวจสอบ
 * @returns ReportPermissions object
 */
export async function checkReportPermissions(
    userId: string
): Promise<ReportPermissions> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                role: true,
                status: true,
            },
        });

        if (!user || user.status !== "ACTIVE") {
            return {
                canView: false,
                canExport: false,
            };
        }

        const isAdmin = user.role === UserRole.ADMIN;

        return {
            // เฉพาะ ADMIN เท่านั้นที่ดูรายงานได้
            canView: isAdmin,
            // เฉพาะ ADMIN เท่านั้นที่ export ได้
            canExport: isAdmin,
        };
    } catch (error) {
        console.error("Error checking report permissions:", error);
        return {
            canView: false,
            canExport: false,
        };
    }
}

/**
 * ตรวจสอบว่า user เป็น Admin หรือไม่
 * @param userId - User ID
 * @returns boolean
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });
        return user?.role === UserRole.ADMIN;
    } catch (error) {
        console.error("Error checking if user is admin:", error);
        return false;
    }
}
