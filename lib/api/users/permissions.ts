/**
 * User Permissions
 * Role-based permission checks for Users module
 */

"use server";

import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";

export interface UserPermissions {
    canView: boolean;          // ดูรายการผู้ใช้ทั้งหมด
    canViewOwn: boolean;       // ดูข้อมูลตัวเอง
    canCreate: boolean;        // สร้างผู้ใช้ใหม่
    canEdit: boolean;          // แก้ไขผู้ใช้ทุกคน
    canEditOwn: boolean;       // แก้ไขตัวเอง
    canDelete: boolean;        // ลบ/ระงับผู้ใช้
    canChangeRole: boolean;    // เปลี่ยน Role
    canResetPassword: boolean; // รีเซ็ตรหัสผ่าน
    canImport: boolean;        // Import ผู้ใช้จาก Excel
}

/**
 * ตรวจสอบสิทธิ์การเข้าถึง Users module
 * @param userId - User ID ที่ต้องการตรวจสอบ
 * @param targetUserId - User ID ที่กำลังดำเนินการด้วย (optional)
 * @returns UserPermissions object
 * 
 * Permission Matrix:
 * | Permission       | ADMIN | TECHNICIAN | USER |
 * |------------------|-------|------------|------|
 * | canView          | ✅    | ❌         | ❌   |
 * | canViewOwn       | ✅    | ✅         | ✅   |
 * | canCreate        | ✅    | ❌         | ❌   |
 * | canEdit          | ✅    | ❌         | ❌   |
 * | canEditOwn       | ✅    | ✅         | ✅   |
 * | canDelete        | ✅    | ❌         | ❌   |
 * | canChangeRole    | ✅    | ❌         | ❌   |
 * | canResetPassword | ✅    | ❌         | ❌   |
 */
export async function checkUserPermissions(
    userId: string,
    targetUserId?: string
): Promise<UserPermissions> {
    try {
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
                canViewOwn: false,
                canCreate: false,
                canEdit: false,
                canEditOwn: false,
                canDelete: false,
                canChangeRole: false,
                canResetPassword: false,
                canImport: false,
            };
        }

        const isAdmin = user.role === UserRole.ADMIN;
        const isTechnician = user.role === UserRole.TECHNICIAN;
        const isTargetSelf = targetUserId ? userId === targetUserId : false;

        return {
            // เฉพาะ ADMIN ดูรายการผู้ใช้ทั้งหมดได้
            canView: isAdmin,

            // ทุก role ดูข้อมูลตัวเองได้
            canViewOwn: true,

            // เฉพาะ ADMIN สร้างผู้ใช้ใหม่ได้
            canCreate: isAdmin,

            // เฉพาะ ADMIN แก้ไขผู้ใช้คนอื่นได้
            canEdit: isAdmin,

            // ทุก role แก้ไขข้อมูลตัวเองได้
            canEditOwn: isTargetSelf || isAdmin,

            // เฉพาะ ADMIN ลบ/ระงับผู้ใช้ได้
            canDelete: isAdmin,

            // เฉพาะ ADMIN เปลี่ยน Role ได้
            canChangeRole: isAdmin,

            // เฉพาะ ADMIN รีเซ็ตรหัสผ่านได้
            canResetPassword: isAdmin,

            // เฉพาะ ADMIN import ผู้ใช้จาก Excel ได้
            canImport: isAdmin,
        };
    } catch (error) {
        console.error("Error checking user permissions:", error);
        return {
            canView: false,
            canViewOwn: false,
            canCreate: false,
            canEdit: false,
            canEditOwn: false,
            canDelete: false,
            canChangeRole: false,
            canResetPassword: false,
            canImport: false,
        };
    }
}

/**
 * Server action to check user permissions
 * ใช้สำหรับ UI components ที่ต้องการตรวจสอบสิทธิ์
 */
export async function checkUserPermissionsAction(
    targetUserId?: string
): Promise<UserPermissions | null> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return null;
        }

        return await checkUserPermissions(user.id, targetUserId);
    } catch (error) {
        console.error("Error in checkUserPermissionsAction:", error);
        return null;
    }
}

/**
 * ตรวจสอบว่า user ปัจจุบันเป็น Admin หรือไม่
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return false;
        }

        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { role: true },
        });

        return dbUser?.role === UserRole.ADMIN;
    } catch (error) {
        console.error("Error checking admin status:", error);
        return false;
    }
}
