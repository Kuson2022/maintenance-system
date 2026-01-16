/**
 * Users Mutations
 * CRUD operations สำหรับจัดการผู้ใช้
 */

"use server";

import { prisma } from "@/lib/prisma";
import { UserRole, UserStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { checkUserPermissions } from "./permissions";

// Default password for new users
const DEFAULT_PASSWORD = "password123";

// Helper to generate random password
function generateTempPassword(length: number = 10): string {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Helper to get current authenticated user
async function getCurrentUserId(): Promise<string | null> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        return user?.id || null;
    } catch {
        return null;
    }
}

// Types
export interface CreateUserInput {
    name: string;
    email: string;
    phone?: string;
    position?: string;
    department?: string;
    role?: UserRole;
}

export interface UpdateUserInput {
    name?: string;
    email?: string;
    phone?: string;
    position?: string;
    department?: string;
    avatarUrl?: string;
}

// ========================================
// CREATE USER
// ========================================

export async function createUser(input: CreateUserInput) {
    try {
        // Permission check - only ADMIN can create users
        const currentUserId = await getCurrentUserId();
        if (!currentUserId) {
            return { success: false, error: "กรุณาเข้าสู่ระบบ" };
        }
        const permissions = await checkUserPermissions(currentUserId);
        if (!permissions.canCreate) {
            return { success: false, error: "คุณไม่มีสิทธิ์สร้างผู้ใช้ใหม่" };
        }

        // Check if email already exists in database
        const existingUser = await prisma.user.findUnique({
            where: { email: input.email },
        });

        if (existingUser) {
            return {
                success: false,
                error: "อีเมลนี้มีผู้ใช้งานแล้ว",
            };
        }

        // Create user in Supabase Auth with default password
        const supabaseAdmin = createAdminClient();
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: input.email,
            password: DEFAULT_PASSWORD,
            email_confirm: true, // Auto confirm email
            user_metadata: {
                name: input.name,
            },
        });

        if (authError) {
            console.error("Failed to create Supabase auth user:", authError);
            return {
                success: false,
                error: `ไม่สามารถสร้างผู้ใช้ใน Auth: ${authError.message}`,
            };
        }

        // Create user in database with Supabase user ID
        const user = await prisma.user.create({
            data: {
                id: authData.user.id, // Use Supabase user ID
                name: input.name,
                email: input.email,
                phone: input.phone,
                position: input.position,
                department: input.department,
                role: input.role || "USER",
                status: "ACTIVE",
            },
        });

        revalidatePath("/dashboard/users");

        return {
            success: true,
            data: user,
            message: `สร้างผู้ใช้สำเร็จ รหัสผ่านเริ่มต้น: ${DEFAULT_PASSWORD}`,
        };
    } catch (error) {
        console.error("Failed to create user:", error);
        return {
            success: false,
            error: "ไม่สามารถสร้างผู้ใช้ได้",
        };
    }
}

// ========================================
// BULK CREATE USERS (Import from Excel)
// ========================================

export interface BulkCreateUserInput {
    name: string;
    email: string;
    phone?: string;
    position?: string;
    department?: string;
    role?: string; // "USER" | "TECHNICIAN" | "ADMIN"
}

export interface BulkCreateResult {
    success: boolean;
    data?: {
        created: number;
        errors: Array<{ row: number; email: string; error: string }>;
    };
    error?: string;
}

export async function bulkCreateUsers(users: BulkCreateUserInput[]): Promise<BulkCreateResult> {
    try {
        // Permission check - only ADMIN can import users
        const currentUserId = await getCurrentUserId();
        if (!currentUserId) {
            return { success: false, error: "กรุณาเข้าสู่ระบบ" };
        }
        const permissions = await checkUserPermissions(currentUserId);
        if (!permissions.canImport) {
            return { success: false, error: "คุณไม่มีสิทธิ์ import ผู้ใช้" };
        }

        const supabaseAdmin = createAdminClient();
        const errors: Array<{ row: number; email: string; error: string }> = [];
        let created = 0;

        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const rowNum = i + 1;

            try {
                // Check if email exists
                const existingUser = await prisma.user.findUnique({
                    where: { email: user.email },
                });

                if (existingUser) {
                    errors.push({ row: rowNum, email: user.email, error: "อีเมลนี้มีผู้ใช้งานแล้ว" });
                    continue;
                }

                // Validate role
                const role = (user.role?.toUpperCase() || "USER") as UserRole;
                if (!["USER", "TECHNICIAN", "ADMIN"].includes(role)) {
                    errors.push({ row: rowNum, email: user.email, error: `สิทธิ์ไม่ถูกต้อง: ${user.role}` });
                    continue;
                }

                // Create Supabase Auth user
                const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                    email: user.email,
                    password: DEFAULT_PASSWORD,
                    email_confirm: true,
                    user_metadata: { name: user.name },
                });

                if (authError) {
                    errors.push({ row: rowNum, email: user.email, error: authError.message });
                    continue;
                }

                // Create database user
                await prisma.user.create({
                    data: {
                        id: authData.user.id,
                        name: user.name,
                        email: user.email,
                        phone: user.phone || null,
                        position: user.position || null,
                        department: user.department || null,
                        role: role,
                        status: "ACTIVE",
                    },
                });

                created++;
            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
                errors.push({ row: rowNum, email: user.email, error: errorMessage });
            }
        }

        revalidatePath("/dashboard/users");

        return {
            success: true,
            data: { created, errors },
        };
    } catch (error) {
        console.error("Failed to bulk create users:", error);
        return {
            success: false,
            error: "ไม่สามารถ import ผู้ใช้ได้",
        };
    }
}

// ========================================
// UPDATE USER
// ========================================

export async function updateUser(id: string, input: UpdateUserInput) {
    try {
        // Permission check - ADMIN can edit anyone, others only themselves
        const currentUserId = await getCurrentUserId();
        if (!currentUserId) {
            return { success: false, error: "กรุณาเข้าสู่ระบบ" };
        }
        const permissions = await checkUserPermissions(currentUserId, id);
        const isEditingOwnProfile = currentUserId === id;
        // Require canEdit for anyone, or canEditOwn + editing own profile
        if (!permissions.canEdit && !(permissions.canEditOwn && isEditingOwnProfile)) {
            return { success: false, error: "คุณไม่มีสิทธิ์แก้ไขข้อมูลผู้ใช้นี้" };
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id },
        });

        if (!existingUser) {
            return {
                success: false,
                error: "ไม่พบผู้ใช้",
            };
        }

        // Check if email is being changed and if it's already used
        if (input.email && input.email !== existingUser.email) {
            const emailInUse = await prisma.user.findUnique({
                where: { email: input.email },
            });

            if (emailInUse) {
                return {
                    success: false,
                    error: "อีเมลนี้มีผู้ใช้งานแล้ว",
                };
            }
        }

        const user = await prisma.user.update({
            where: { id },
            data: {
                name: input.name,
                email: input.email,
                phone: input.phone,
                position: input.position,
                department: input.department,
                avatarUrl: input.avatarUrl,
            },
        });

        revalidatePath("/dashboard/users");
        revalidatePath(`/dashboard/users/${id}`);

        return {
            success: true,
            data: user,
        };
    } catch (error) {
        console.error("Failed to update user:", error);
        return {
            success: false,
            error: "ไม่สามารถอัปเดตผู้ใช้ได้",
        };
    }
}

// ========================================
// UPDATE USER ROLE
// ========================================

export async function updateUserRole(id: string, role: UserRole) {
    try {
        // Permission check - only ADMIN can change roles
        const currentUserId = await getCurrentUserId();
        if (!currentUserId) {
            return { success: false, error: "กรุณาเข้าสู่ระบบ" };
        }
        const permissions = await checkUserPermissions(currentUserId);
        if (!permissions.canChangeRole) {
            return { success: false, error: "คุณไม่มีสิทธิ์เปลี่ยน Role ผู้ใช้" };
        }

        const user = await prisma.user.update({
            where: { id },
            data: { role },
        });

        revalidatePath("/dashboard/users");
        revalidatePath(`/dashboard/users/${id}`);

        return {
            success: true,
            data: user,
        };
    } catch (error) {
        console.error("Failed to update user role:", error);
        return {
            success: false,
            error: "ไม่สามารถเปลี่ยน Role ได้",
        };
    }
}

// ========================================
// UPDATE USER STATUS
// ========================================

export async function updateUserStatus(id: string, status: UserStatus) {
    try {
        // Permission check - only ADMIN can change status
        const currentUserId = await getCurrentUserId();
        if (!currentUserId) {
            return { success: false, error: "กรุณาเข้าสู่ระบบ" };
        }
        const permissions = await checkUserPermissions(currentUserId);
        if (!permissions.canEdit) {
            return { success: false, error: "คุณไม่มีสิทธิ์เปลี่ยนสถานะผู้ใช้" };
        }

        const user = await prisma.user.update({
            where: { id },
            data: { status },
        });

        revalidatePath("/dashboard/users");
        revalidatePath(`/dashboard/users/${id}`);

        return {
            success: true,
            data: user,
        };
    } catch (error) {
        console.error("Failed to update user status:", error);
        return {
            success: false,
            error: "ไม่สามารถเปลี่ยนสถานะได้",
        };
    }
}

// ========================================
// DEACTIVATE USER
// ========================================

export async function deactivateUser(id: string) {
    try {
        // Permission check - only ADMIN can deactivate users
        const currentUserId = await getCurrentUserId();
        if (!currentUserId) {
            return { success: false, error: "กรุณาเข้าสู่ระบบ" };
        }
        const permissions = await checkUserPermissions(currentUserId);
        if (!permissions.canDelete) {
            return { success: false, error: "คุณไม่มีสิทธิ์ปิดการใช้งานผู้ใช้" };
        }

        const user = await prisma.user.update({
            where: { id },
            data: { status: "INACTIVE" },
        });

        revalidatePath("/dashboard/users");

        return {
            success: true,
            data: user,
        };
    } catch (error) {
        console.error("Failed to deactivate user:", error);
        return {
            success: false,
            error: "ไม่สามารถปิดการใช้งานผู้ใช้ได้",
        };
    }
}

// ========================================
// ACTIVATE USER
// ========================================

export async function activateUser(id: string) {
    try {
        // Permission check - only ADMIN can activate users
        const currentUserId = await getCurrentUserId();
        if (!currentUserId) {
            return { success: false, error: "กรุณาเข้าสู่ระบบ" };
        }
        const permissions = await checkUserPermissions(currentUserId);
        if (!permissions.canEdit) {
            return { success: false, error: "คุณไม่มีสิทธิ์เปิดการใช้งานผู้ใช้" };
        }

        const user = await prisma.user.update({
            where: { id },
            data: { status: "ACTIVE" },
        });

        revalidatePath("/dashboard/users");

        return {
            success: true,
            data: user,
        };
    } catch (error) {
        console.error("Failed to activate user:", error);
        return {
            success: false,
            error: "ไม่สามารถเปิดการใช้งานผู้ใช้ได้",
        };
    }
}

// ========================================
// DELETE USER (Soft delete - set status to SUSPENDED)
// ========================================

export async function deleteUser(id: string) {
    try {
        // Permission check - only ADMIN can delete users
        const currentUserId = await getCurrentUserId();
        if (!currentUserId) {
            return { success: false, error: "กรุณาเข้าสู่ระบบ" };
        }
        const permissions = await checkUserPermissions(currentUserId);
        if (!permissions.canDelete) {
            return { success: false, error: "คุณไม่มีสิทธิ์ลบผู้ใช้" };
        }

        const user = await prisma.user.update({
            where: { id },
            data: { status: "SUSPENDED" },
        });

        revalidatePath("/dashboard/users");

        return {
            success: true,
            data: user,
        };
    } catch (error) {
        console.error("Failed to delete user:", error);
        return {
            success: false,
            error: "ไม่สามารถลบผู้ใช้ได้",
        };
    }
}

// ========================================
// HARD DELETE USER (Permanently remove from database)
// ========================================

export async function hardDeleteUser(id: string) {
    try {
        // Permission check - only ADMIN can delete users
        const currentUserId = await getCurrentUserId();
        if (!currentUserId) {
            return { success: false, error: "กรุณาเข้าสู่ระบบ" };
        }

        const permissions = await checkUserPermissions(currentUserId);
        if (!permissions.canDelete) {
            return { success: false, error: "คุณไม่มีสิทธิ์ลบผู้ใช้" };
        }

        // Prevent self-deletion
        if (currentUserId === id) {
            return { success: false, error: "ไม่สามารถลบบัญชีตัวเองได้" };
        }

        // Check if user exists
        const targetUser = await prisma.user.findUnique({
            where: { id },
            select: { id: true, name: true, email: true, role: true },
        });

        if (!targetUser) {
            return { success: false, error: "ไม่พบผู้ใช้" };
        }

        // Prevent deleting the last admin
        if (targetUser.role === "ADMIN") {
            const adminCount = await prisma.user.count({
                where: { role: "ADMIN", status: "ACTIVE" },
            });
            if (adminCount <= 1) {
                return { success: false, error: "ไม่สามารถลบผู้ดูแลระบบคนสุดท้ายได้" };
            }
        }

        // Check if user has reported work orders (reportedBy = Restrict)
        const reportedWorkOrders = await prisma.workOrder.count({
            where: { reportedBy: id },
        });

        if (reportedWorkOrders > 0) {
            return {
                success: false,
                error: `ผู้ใช้นี้มี Work Orders ที่เปิดไว้ ${reportedWorkOrders} รายการ กรุณาโอนให้ผู้ใช้อื่นก่อน`
            };
        }

        // Delete user from Supabase Auth first
        const supabaseAdmin = createAdminClient();
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

        // Only fail if there's an auth error AND it's not "user not found"
        // (user might exist in DB but not in Supabase Auth if created before auth integration)
        if (authError && authError.code !== 'user_not_found') {
            console.error("Failed to delete user from Supabase Auth:", authError);
            return {
                success: false,
                error: `ไม่สามารถลบผู้ใช้จาก Auth: ${authError.message}`,
            };
        }

        // Delete user from database (onDelete: SetNull will handle relations)
        await prisma.user.delete({
            where: { id },
        });

        revalidatePath("/dashboard/users");

        return {
            success: true,
            message: `ลบผู้ใช้ "${targetUser.name}" เรียบร้อยแล้ว`,
        };
    } catch (error) {
        console.error("Failed to hard delete user:", error);
        return {
            success: false,
            error: "ไม่สามารถลบผู้ใช้ได้",
        };
    }
}

// ========================================
// RESET USER PASSWORD
// ========================================

export async function resetUserPassword(userId: string): Promise<{
    success: boolean;
    tempPassword?: string;
    error?: string;
}> {
    try {
        // Permission check - only ADMIN can reset passwords
        const currentUserId = await getCurrentUserId();
        if (!currentUserId) {
            return { success: false, error: "กรุณาเข้าสู่ระบบ" };
        }
        const permissions = await checkUserPermissions(currentUserId);
        if (!permissions.canResetPassword) {
            return { success: false, error: "คุณไม่มีสิทธิ์รีเซ็ตรหัสผ่าน" };
        }

        // Check if target user exists
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, name: true },
        });

        if (!targetUser) {
            return { success: false, error: "ไม่พบผู้ใช้" };
        }

        // Generate temporary password
        const tempPassword = generateTempPassword(12);

        // Update password in Supabase Auth
        const supabaseAdmin = createAdminClient();
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { password: tempPassword }
        );

        if (authError) {
            console.error("Failed to reset password in Supabase:", authError);
            return {
                success: false,
                error: `ไม่สามารถรีเซ็ตรหัสผ่านได้: ${authError.message}`,
            };
        }

        revalidatePath("/dashboard/users");
        revalidatePath(`/dashboard/users/${userId}`);

        return {
            success: true,
            tempPassword,
        };
    } catch (error) {
        console.error("Failed to reset user password:", error);
        return {
            success: false,
            error: "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน",
        };
    }
}

// ========================================
// UPLOAD USER AVATAR
// ========================================

const AVATAR_MAX_SIZE = 2 * 1024 * 1024; // 2MB
const AVATAR_ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];

export async function uploadUserAvatarAction(formData: FormData): Promise<{
    success: boolean;
    avatarUrl?: string;
    error?: string;
}> {
    try {
        const userId = formData.get("userId") as string;
        const file = formData.get("file") as File;

        if (!userId || !file) {
            return { success: false, error: "ข้อมูลไม่ครบถ้วน" };
        }

        // Permission check - user can only upload their own avatar, ADMIN can upload for anyone
        const currentUserId = await getCurrentUserId();
        if (!currentUserId) {
            return { success: false, error: "กรุณาเข้าสู่ระบบ" };
        }

        const permissions = await checkUserPermissions(currentUserId, userId);
        const isEditingOwnProfile = currentUserId === userId;

        if (!permissions.canEdit && !(permissions.canEditOwn && isEditingOwnProfile)) {
            return { success: false, error: "คุณไม่มีสิทธิ์อัปโหลดรูปภาพ" };
        }

        // Validate file size
        if (file.size > AVATAR_MAX_SIZE) {
            return { success: false, error: "ไฟล์มีขนาดใหญ่เกิน 2MB" };
        }

        // Validate file type
        if (!AVATAR_ALLOWED_TYPES.includes(file.type)) {
            return { success: false, error: "รองรับเฉพาะรูปภาพ JPG, PNG, GIF, WebP" };
        }

        // Get current user to check for old avatar
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { avatarUrl: true },
        });

        if (!existingUser) {
            return { success: false, error: "ไม่พบผู้ใช้" };
        }

        // Upload new avatar to Supabase Storage
        const supabase = await createClient();

        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        const fileExt = file.name.split(".").pop();
        const fileName = `${userId}-${timestamp}-${randomString}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        // Convert File to ArrayBuffer for upload
        const arrayBuffer = await file.arrayBuffer();
        const fileBuffer = new Uint8Array(arrayBuffer);

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from("attachments")
            .upload(filePath, fileBuffer, {
                contentType: file.type,
                cacheControl: "3600",
                upsert: false,
            });

        if (uploadError) {
            console.error("Failed to upload avatar:", uploadError);
            return { success: false, error: `อัปโหลดไม่สำเร็จ: ${uploadError.message}` };
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from("attachments")
            .getPublicUrl(filePath);

        // Delete old avatar if exists
        if (existingUser.avatarUrl) {
            try {
                // Extract path from URL
                const oldUrl = new URL(existingUser.avatarUrl);
                const pathMatch = oldUrl.pathname.match(/\/attachments\/(.+)/);
                if (pathMatch && pathMatch[1]) {
                    await supabase.storage.from("attachments").remove([pathMatch[1]]);
                }
            } catch (err) {
                console.warn("Failed to delete old avatar:", err);
                // Continue even if deletion fails
            }
        }

        // Update user's avatarUrl in database
        await prisma.user.update({
            where: { id: userId },
            data: { avatarUrl: publicUrl },
        });

        revalidatePath("/dashboard/settings");
        revalidatePath(`/dashboard/users/${userId}`);
        revalidatePath("/dashboard/users");

        return {
            success: true,
            avatarUrl: publicUrl,
        };
    } catch (error) {
        console.error("Failed to upload avatar:", error);
        return {
            success: false,
            error: "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ",
        };
    }
}

// ========================================
// DELETE USER AVATAR
// ========================================

export async function deleteUserAvatarAction(userId: string): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        if (!userId) {
            return { success: false, error: "ข้อมูลไม่ครบถ้วน" };
        }

        // Permission check
        const currentUserId = await getCurrentUserId();
        if (!currentUserId) {
            return { success: false, error: "กรุณาเข้าสู่ระบบ" };
        }

        const permissions = await checkUserPermissions(currentUserId, userId);
        const isEditingOwnProfile = currentUserId === userId;

        if (!permissions.canEdit && !(permissions.canEditOwn && isEditingOwnProfile)) {
            return { success: false, error: "คุณไม่มีสิทธิ์ลบรูปภาพ" };
        }

        // Get current user avatar
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { avatarUrl: true },
        });

        if (!existingUser) {
            return { success: false, error: "ไม่พบผู้ใช้" };
        }

        if (!existingUser.avatarUrl) {
            return { success: false, error: "ไม่มีรูปโปรไฟล์ที่จะลบ" };
        }

        // Delete from Supabase Storage
        const supabase = await createClient();

        try {
            const oldUrl = new URL(existingUser.avatarUrl);
            const pathMatch = oldUrl.pathname.match(/\/attachments\/(.+)/);
            if (pathMatch && pathMatch[1]) {
                await supabase.storage.from("attachments").remove([pathMatch[1]]);
            }
        } catch (err) {
            console.warn("Failed to delete avatar from storage:", err);
            // Continue even if storage deletion fails
        }

        // Update user's avatarUrl to null in database
        await prisma.user.update({
            where: { id: userId },
            data: { avatarUrl: null },
        });

        revalidatePath("/dashboard/settings");
        revalidatePath(`/dashboard/users/${userId}`);
        revalidatePath("/dashboard/users");

        return { success: true };
    } catch (error) {
        console.error("Failed to delete avatar:", error);
        return {
            success: false,
            error: "เกิดข้อผิดพลาดในการลบรูปภาพ",
        };
    }
}
