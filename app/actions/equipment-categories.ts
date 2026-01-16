"use server";

/**
 * Equipment Categories Server Actions
 * CRUD operations for equipment categories
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

// Auth helper
async function checkAuth() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error("Unauthorized");
    return user;
}

function serialize(data: any) {
    return JSON.parse(JSON.stringify(data));
}

// ========================================
// GET ALL CATEGORIES
// ========================================

export async function getEquipmentCategoriesAction() {
    try {
        await checkAuth();
        const result = await prisma.equipmentCategory.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { equipment: true }
                }
            }
        });
        return { success: true, data: serialize(result) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ========================================
// CREATE CATEGORY
// ========================================

export async function createEquipmentCategoryAction(data: {
    name: string;
    description?: string;
    icon?: string;
}) {
    try {
        await checkAuth();

        // Check if name already exists
        const existing = await prisma.equipmentCategory.findUnique({
            where: { name: data.name }
        });

        if (existing) {
            return { success: false, error: "ชื่อหมวดหมู่นี้มีอยู่แล้ว" };
        }

        const result = await prisma.equipmentCategory.create({
            data: {
                name: data.name,
                description: data.description || null,
                icon: data.icon || null,
            }
        });

        revalidatePath("/dashboard/settings");
        revalidatePath("/dashboard/equipment");
        return { success: true, data: serialize(result) };
    } catch (error: any) {
        console.error("createEquipmentCategoryAction Error", error);
        return { success: false, error: error.message || "Failed to create category" };
    }
}

// ========================================
// UPDATE CATEGORY
// ========================================

export async function updateEquipmentCategoryAction(id: string, data: {
    name: string;
    description?: string;
    icon?: string;
}) {
    try {
        await checkAuth();

        // Check if new name conflicts with existing
        const existing = await prisma.equipmentCategory.findFirst({
            where: {
                name: data.name,
                NOT: { id }
            }
        });

        if (existing) {
            return { success: false, error: "ชื่อหมวดหมู่นี้มีอยู่แล้ว" };
        }

        const result = await prisma.equipmentCategory.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description || null,
                icon: data.icon || null,
            }
        });

        revalidatePath("/dashboard/settings");
        revalidatePath("/dashboard/equipment");
        return { success: true, data: serialize(result) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ========================================
// DELETE CATEGORY
// ========================================

export async function deleteEquipmentCategoryAction(id: string) {
    try {
        await checkAuth();

        // Check if category has equipment
        const equipmentCount = await prisma.equipment.count({
            where: { categoryId: id }
        });

        if (equipmentCount > 0) {
            return {
                success: false,
                error: `ไม่สามารถลบได้ มีเครื่องจักร ${equipmentCount} รายการในหมวดหมู่นี้`
            };
        }

        await prisma.equipmentCategory.delete({
            where: { id }
        });

        revalidatePath("/dashboard/settings");
        revalidatePath("/dashboard/equipment");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
