/**
 * Expense Permissions
 * Role-based permission checks for Expense module
 */

import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export interface ExpensePermissions {
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canManageTypes: boolean; // Expense Types CRUD
}

/**
 * ตรวจสอบสิทธิ์การเข้าถึง Expense module
 * @param userId - User ID ที่ต้องการตรวจสอบ
 * @returns ExpensePermissions object
 */
export async function checkExpensePermissions(
    userId: string
): Promise<ExpensePermissions> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });

        if (!user) {
            return {
                canView: false,
                canCreate: false,
                canEdit: false,
                canDelete: false,
                canManageTypes: false,
            };
        }

        const isAdmin = user.role === UserRole.ADMIN;
        const isTechnician = user.role === UserRole.TECHNICIAN;

        return {
            // ทุก role ดูได้
            canView: true,
            // ADMIN และ TECHNICIAN สร้างได้
            canCreate: isAdmin || isTechnician,
            // ADMIN แก้ไขได้ทุกรายการ, TECHNICIAN แก้ไขได้
            canEdit: isAdmin || isTechnician,
            // ADMIN เท่านั้นที่ลบได้
            canDelete: isAdmin,
            // ADMIN เท่านั้นที่จัดการ Expense Types ได้
            canManageTypes: isAdmin,
        };
    } catch (error) {
        console.error("Error checking expense permissions:", error);
        return {
            canView: false,
            canCreate: false,
            canEdit: false,
            canDelete: false,
            canManageTypes: false,
        };
    }
}
