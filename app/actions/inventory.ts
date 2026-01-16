"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type InventoryTransactionType = "IN" | "OUT" | "ADJUST";

export type InventoryResult = {
    success: boolean;
    message?: string;
    data?: any;
    error?: string;
};

// Export this for Server Components
export async function checkInventoryPermissions() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true, status: true }
    });

    if (!dbUser || dbUser.status !== "ACTIVE") throw new Error("Unauthorized");

    const isAdmin = dbUser.role === "ADMIN";
    const isTechnician = dbUser.role === "TECHNICIAN";

    // Define permissions
    // ADMIN: All
    // TECHNICIAN: All except DELETE
    // USER: None (or Read Only if we weren't blocking menu? Request says USER doesn't see menu. I'll block writes for USER).

    // Strict Mode: Only ADMIN and TECHNICIAN can access these actions.
    if (!isAdmin && !isTechnician) {
        throw new Error("Forbidden: Insufficient permissions");
    }

    return {
        user,
        role: dbUser.role,
        permissions: {
            canCreate: isAdmin || isTechnician,
            canEdit: isAdmin || isTechnician,
            canDelete: isAdmin,
            canAdjust: isAdmin || isTechnician,
        }
    };
}

export async function checkInventoryPermissionsAction() {
    try {
        const { permissions } = await checkInventoryPermissions();
        return { success: true, permissions };
    } catch {
        return {
            success: false,
            permissions: {
                canCreate: false,
                canEdit: false,
                canDelete: false,
                canAdjust: false
            }
        };
    }
}

export async function adjustStock(data: {
    sparePartId: string;
    type: InventoryTransactionType;
    quantity: number;
    unitPrice?: number;
    notes?: string;
    referenceId?: string;
    referenceType?: string;
}): Promise<InventoryResult> {
    try {
        const { user } = await checkInventoryPermissions();

        // 1. Get current part
        const part = await prisma.sparePart.findUnique({
            where: { id: data.sparePartId },
        });

        if (!part) return { success: false, error: "Spare part not found" };

        // 2. Calculate new balance
        let qtyChange = 0;
        let newBalance = part.stockQuantity;

        if (data.type === "IN") {
            qtyChange = data.quantity;
            newBalance += qtyChange;
        } else if (data.type === "OUT") {
            qtyChange = -data.quantity;
            newBalance -= data.quantity;
        } else if (data.type === "ADJUST") {
            qtyChange = data.quantity;
            newBalance += qtyChange;
        }

        if (newBalance < 0) {
            return { success: false, error: "Insufficient stock" };
        }

        // 3. Create Transaction
        const transaction = await prisma.inventoryTransaction.create({
            data: {
                sparePartId: data.sparePartId,
                type: data.type,
                quantity: data.quantity,
                balanceAfter: newBalance,
                unitPrice: data.unitPrice,
                totalCost: data.unitPrice ? data.unitPrice * Math.abs(data.quantity) : undefined,
                notes: data.notes,
                createdById: user.id,
                referenceId: data.referenceId,
                referenceType: data.referenceType || "MANUAL_ADJUST",
            } as any,
        });

        // 4. Update Part Stock
        await prisma.sparePart.update({
            where: { id: data.sparePartId },
            data: {
                stockQuantity: newBalance,
            },
        });

        revalidatePath(`/dashboard/inventory/${data.sparePartId}`);
        revalidatePath("/dashboard/inventory");
        return { success: true, data: transaction };

    } catch (error: any) {
        console.error(error);
        return { success: false, error: error.message || "Failed to adjust stock" };
    }
}

export async function getInventoryTransactions(sparePartId: string) {
    try {
        await checkInventoryPermissions();
        const transactions = await (prisma as any).inventoryTransaction.findMany({
            where: { sparePartId },
            include: {
                createdBy: {
                    select: { name: true, email: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        return { success: true, data: transactions };
    } catch (error) {
        console.error(error);
        return { success: false, error: "Failed to fetch transactions" };
    }
}

// CRUD Operations for Spare Parts

export async function createSparePart(data: {
    name: string;
    code: string;
    description?: string;
    category?: string;
    unit: string;
    locationId?: string;
    minStockLevel: number; // reorder point often same or similar
    maxStockLevel?: number;
    reorderPoint?: number;
    unitPrice: number;
    initialStock?: number;
    supplier?: string;
}): Promise<InventoryResult> {
    try {
        const { user } = await checkInventoryPermissions();


        // Check duplicate code
        const existing = await prisma.sparePart.findUnique({
            where: { code: data.code },
        });
        if (existing) return { success: false, error: "Part code already exists" };

        const part = await prisma.sparePart.create({
            data: {
                name: data.name,
                code: data.code,
                description: data.description,
                category: data.category || "Uncategorized",
                unit: data.unit,
                unitPrice: data.unitPrice,
                locationId: data.locationId ?? null,
                minStockLevel: data.minStockLevel,
                reorderPoint: data.reorderPoint ?? data.minStockLevel,
                maxStockLevel: data.maxStockLevel,
                stockQuantity: data.initialStock || 0,
                supplier: data.supplier,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any,
        });

        if (data.initialStock && data.initialStock > 0) {
            await (prisma as any).inventoryTransaction.create({
                data: {
                    sparePartId: part.id,
                    type: "IN",
                    quantity: data.initialStock,
                    balanceAfter: data.initialStock,
                    unitPrice: data.unitPrice,
                    notes: "Initial Stock",
                    createdById: user.id,
                    referenceType: "INITIAL_SETUP",
                }
            });
        }

        revalidatePath("/dashboard/inventory");
        return { success: true, data: part };
    } catch (error) {
        console.error("Create Part Error:", error);
        return { success: false, error: "Failed to create spare part" };
    }
}

export async function updateSparePart(id: string, data: {
    name?: string;
    description?: string;
    category?: string;
    unit?: string;
    unitPrice?: number;
    locationId?: string | null;
    minStockLevel?: number;
    maxStockLevel?: number;
    reorderPoint?: number;
    supplier?: string;
}): Promise<InventoryResult> {
    try {
        await checkInventoryPermissions();
        const part = await prisma.sparePart.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description,
                category: data.category,
                unit: data.unit,
                unitPrice: data.unitPrice,
                locationId: data.locationId ?? undefined,
                minStockLevel: data.minStockLevel,
                reorderPoint: data.reorderPoint ?? data.minStockLevel,
                maxStockLevel: data.maxStockLevel,
                supplier: data.supplier,
                updatedAt: new Date(),
            } as any
        });
        revalidatePath("/dashboard/inventory");
        return { success: true, data: part };
    } catch (error) {
        console.error("Update Part Error:", error);
        return { success: false, error: "Failed to update spare part" };
    }
}

export async function deleteSparePart(id: string): Promise<InventoryResult> {
    try {
        const { permissions } = await checkInventoryPermissions();
        if (!permissions.canDelete) {
            throw new Error("Forbidden: You cannot delete items");
        }
        await prisma.sparePart.delete({ where: { id } });
        revalidatePath("/dashboard/inventory");
        return { success: true, message: "Deleted successfully" };
    } catch (error) {
        console.error("Delete Part Error:", error);
        return { success: false, error: "Failed to delete part" };
    }
}

export async function getSpareParts(params?: {
    search?: string;
    category?: string;
    lowStock?: boolean;
    page?: number;
    pageSize?: number;
}) {
    try {
        await checkInventoryPermissions();
        const { page = 1, pageSize = 10 } = params || {};
        const where: any = {};

        if (params?.search) {
            where.OR = [
                { name: { contains: params.search, mode: "insensitive" } },
                { code: { contains: params.search, mode: "insensitive" } },
            ];
        }

        if (params?.category && params.category !== "all") {
            where.category = params.category;
        }

        // Handle lowStock:
        // Since Prisma doesn't support comparing two columns in 'where' easily without raw query,
        // and we need pagination, we have two options:
        // 1. Raw Query.
        // 2. In-memory filter if lowStock is checked (likely smaller result set).
        // Let's use in-memory filter for lowStock for now, assuming the dataset isn't massive yet.
        // But for normal view (no lowStock), we MUST use DB pagination.

        if (params?.lowStock) {
            // Fetch ALL matching criteria then filter lowStock then paginate
            // This is acceptable because 'low stock' items are usually few.
            const allParts = await prisma.sparePart.findMany({
                where,
                include: { location: true } as any,
                orderBy: { name: "asc" },
            });

            const lowStockParts = allParts.filter((p: any) =>
                p.stockQuantity <= (p.reorderPoint ?? p.minStockLevel ?? 0)
            );

            const total = lowStockParts.length;
            const totalPages = Math.ceil(total / pageSize);
            const start = (page - 1) * pageSize;
            const paginatedParts = lowStockParts.slice(start, start + pageSize);

            const serializedParts = paginatedParts.map((part: any) => ({
                ...part,
                unitPrice: part.unitPrice.toNumber(),
            }));

            return {
                success: true,
                data: serializedParts,
                meta: {
                    total,
                    page,
                    pageSize,
                    totalPages
                }
            };
        } else {
            // Normal DB Pagination
            const total = await prisma.sparePart.count({ where });
            const totalPages = Math.ceil(total / pageSize);

            const parts = await prisma.sparePart.findMany({
                where,
                include: { location: true } as any,
                orderBy: { name: "asc" },
                skip: (page - 1) * pageSize,
                take: pageSize,
            });

            const serializedParts = parts.map((part: any) => ({
                ...part,
                unitPrice: part.unitPrice.toNumber(),
            }));

            return {
                success: true,
                data: serializedParts,
                meta: {
                    total,
                    page,
                    pageSize,
                    totalPages
                }
            };
        }

    } catch (error) {
        console.error(error);
        return { success: false, error: "Failed to fetch parts" };
    }
}

export async function getSparePartById(id: string) {
    try {
        await checkInventoryPermissions();
        const part = await prisma.sparePart.findUnique({
            where: { id },
            include: {
                location: true,
                transactions: {
                    take: 10,
                    orderBy: { createdAt: "desc" },
                    include: { createdBy: true }
                }
            } as any
        });

        if (!part) return { success: false, error: "Part not found" };

        const serializedPart = {
            ...part,
            unitPrice: (part as any).unitPrice.toNumber(),
            transactions: (part as any).transactions.map((tx: any) => ({
                ...tx,
                unitPrice: tx.unitPrice?.toNumber() ?? null,
                totalCost: tx.totalCost?.toNumber() ?? null,
            }))
        };

        return { success: true, data: serializedPart };

    } catch (error) {
        return { success: false, error: "Part not found" };
    }
}
