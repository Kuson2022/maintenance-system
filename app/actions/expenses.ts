"use server";

import { revalidatePath } from "next/cache";
import {
    createExpense,
    updateExpense,
    deleteExpense
} from "@/lib/api/expenses/mutations";
import {
    getExpenses,
    getExpenseStats,
    getExpenseTypes
} from "@/lib/api/expenses/queries";
import {
    createExpenseSchema,
    updateExpenseSchema,
    expenseFiltersSchema
} from "@/lib/api/expenses/validation";
import { createClient } from "@/lib/supabase/server";
import { checkExpensePermissions } from "@/lib/api/expenses/permissions";
import prisma from "@/lib/prisma";

// ========================================
// AUTH HELPERS
// ========================================

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
// PERMISSION ACTIONS
// ========================================

export async function checkExpensePermissionsAction() {
    try {
        const user = await checkAuth();
        const permissions = await checkExpensePermissions(user.id);
        return { success: true, data: permissions };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ========================================
// EXPENSE CRUD ACTIONS
// ========================================

export async function getExpensesAction(filters: any, pagination: any) {
    try {
        const user = await checkAuth();
        const permissions = await checkExpensePermissions(user.id);

        if (!permissions.canView) {
            return { success: false, error: "ไม่มีสิทธิ์ดูข้อมูลค่าใช้จ่าย" };
        }

        const validFilters = expenseFiltersSchema.parse(filters);
        const result = await getExpenses(validFilters, pagination);
        return { success: true, ...serialize(result) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getExpenseByIdAction(id: string) {
    try {
        const user = await checkAuth();
        const permissions = await checkExpensePermissions(user.id);

        if (!permissions.canView) {
            return { success: false, error: "ไม่มีสิทธิ์ดูข้อมูลค่าใช้จ่าย" };
        }

        const expense = await prisma.expense.findUnique({
            where: { id },
            include: {
                expenseType: true,
                equipment: true,
                workOrder: true,
            }
        });

        if (!expense) {
            return { success: false, error: "ไม่พบรายการค่าใช้จ่าย" };
        }

        return { success: true, data: serialize(expense) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getExpenseStatsAction(period: "month" | "year") {
    try {
        const user = await checkAuth();
        const permissions = await checkExpensePermissions(user.id);

        if (!permissions.canView) {
            return { success: false, error: "ไม่มีสิทธิ์ดูข้อมูลค่าใช้จ่าย" };
        }

        const result = await getExpenseStats(period);
        return { success: true, data: serialize(result) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getExpenseTypesAction() {
    try {
        await checkAuth();
        const result = await getExpenseTypes();
        return { success: true, data: serialize(result) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function createExpenseAction(data: any) {
    try {
        const user = await checkAuth();
        const permissions = await checkExpensePermissions(user.id);

        if (!permissions.canCreate) {
            return { success: false, error: "ไม่มีสิทธิ์สร้างรายการค่าใช้จ่าย" };
        }

        const validData = createExpenseSchema.parse(data);
        const result = await createExpense(validData);
        revalidatePath("/dashboard/expenses");
        return { success: true, data: serialize(result) };
    } catch (error: any) {
        console.error("createExpenseAction Error", error);
        return { success: false, error: error.message || "Failed to create expense" };
    }
}

export async function updateExpenseAction(data: any) {
    try {
        const user = await checkAuth();
        const permissions = await checkExpensePermissions(user.id);

        if (!permissions.canEdit) {
            return { success: false, error: "ไม่มีสิทธิ์แก้ไขรายการค่าใช้จ่าย" };
        }

        const validData = updateExpenseSchema.parse(data);
        const result = await updateExpense(validData);
        revalidatePath("/dashboard/expenses");
        return { success: true, data: serialize(result) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteExpenseAction(id: string) {
    try {
        const user = await checkAuth();
        const permissions = await checkExpensePermissions(user.id);

        if (!permissions.canDelete) {
            return { success: false, error: "ไม่มีสิทธิ์ลบรายการค่าใช้จ่าย" };
        }

        await deleteExpense(id);
        revalidatePath("/dashboard/expenses");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ========================================
// EXPENSE TYPE CRUD ACTIONS
// ========================================

export async function getExpenseTypesWithCountAction() {
    try {
        await checkAuth();
        const result = await prisma.expenseType.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { expenses: true }
                }
            }
        });
        return { success: true, data: serialize(result) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function createExpenseTypeAction(data: { name: string; description?: string }) {
    try {
        const user = await checkAuth();
        const permissions = await checkExpensePermissions(user.id);

        if (!permissions.canManageTypes) {
            return { success: false, error: "ไม่มีสิทธิ์สร้างประเภทค่าใช้จ่าย" };
        }

        // Check if name already exists
        const existing = await prisma.expenseType.findUnique({
            where: { name: data.name }
        });

        if (existing) {
            return { success: false, error: "ชื่อประเภทนี้มีอยู่แล้ว" };
        }

        const result = await prisma.expenseType.create({
            data: {
                name: data.name,
                description: data.description || null,
            }
        });

        revalidatePath("/dashboard/settings");
        return { success: true, data: serialize(result) };
    } catch (error: any) {
        console.error("createExpenseTypeAction Error", error);
        return { success: false, error: error.message || "Failed to create expense type" };
    }
}

export async function updateExpenseTypeAction(id: string, data: { name: string; description?: string }) {
    try {
        const user = await checkAuth();
        const permissions = await checkExpensePermissions(user.id);

        if (!permissions.canManageTypes) {
            return { success: false, error: "ไม่มีสิทธิ์แก้ไขประเภทค่าใช้จ่าย" };
        }

        // Check if new name conflicts with existing
        const existing = await prisma.expenseType.findFirst({
            where: {
                name: data.name,
                NOT: { id }
            }
        });

        if (existing) {
            return { success: false, error: "ชื่อประเภทนี้มีอยู่แล้ว" };
        }

        const result = await prisma.expenseType.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description || null,
            }
        });

        revalidatePath("/dashboard/settings");
        return { success: true, data: serialize(result) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteExpenseTypeAction(id: string) {
    try {
        const user = await checkAuth();
        const permissions = await checkExpensePermissions(user.id);

        if (!permissions.canManageTypes) {
            return { success: false, error: "ไม่มีสิทธิ์ลบประเภทค่าใช้จ่าย" };
        }

        // Check if type is being used
        const expenseCount = await prisma.expense.count({
            where: { expenseTypeId: id }
        });

        if (expenseCount > 0) {
            return { success: false, error: `ไม่สามารถลบได้ มีรายการค่าใช้จ่าย ${expenseCount} รายการอ้างอิงอยู่` };
        }

        await prisma.expenseType.delete({
            where: { id }
        });

        revalidatePath("/dashboard/settings");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
