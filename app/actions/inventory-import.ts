"use server";

import { prisma } from "@/lib/prisma";
import { checkInventoryPermissions } from "@/app/actions/inventory";
import { revalidatePath } from "next/cache";

export interface BulkCreateSparePartInput {
    code: string;
    name: string;
    category?: string;
    locationName?: string;
    unitPrice: number;
    initialStock: number;
    unit: string;
    minStockLevel: number;
    reorderPoint?: number;
    maxStockLevel?: number;
    supplier?: string;
    description?: string;
}

export interface BulkCreateResult {
    success: boolean;
    data?: {
        created: number;
        errors: Array<{ row: number; code: string; error: string }>;
    };
    error?: string;
}

export async function bulkCreateSpareParts(parts: BulkCreateSparePartInput[]): Promise<BulkCreateResult> {
    try {
        const { user, permissions } = await checkInventoryPermissions();

        // Strict: only ADMIN can import? The prompt says "with excel template for Role ADMIN".
        // But technicians might need to add parts? The user explicitly said "for Role ADMIN".
        // I will check user role directly or add a specific check.
        // checkInventoryPermissions returns canCreate for Techs too.
        // But prompt implies maybe only Admin gets this feature.
        // "พร้อม excel template สำหรับ Role ADMIN" -> implies functionality is for Admin.
        // I'll check user.role === 'ADMIN'.

        // However, reuse permissions object if possible.
        // If I want to restrict to Admin, I should check that.

        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { role: true }
        });

        if (dbUser?.role !== "ADMIN") {
            return { success: false, error: "Only ADMIN can import data." };
        }

        const errors: Array<{ row: number; code: string; error: string }> = [];
        let created = 0;

        // Cache locations to avoid repeated DB lookups
        const locations = await (prisma as any).location.findMany();
        const locationMap = new Map((locations as any[]).map(l => [l.name.toLowerCase(), l.id]));

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const rowNum = i + 1; // Assuming data rows start at 1 logically (adjusted for header elsewhere)

            try {
                // 1. Check duplicate code
                const existing = await prisma.sparePart.findUnique({
                    where: { code: part.code },
                });

                if (existing) {
                    errors.push({ row: rowNum, code: part.code, error: "รหัสอะไหล่ซ้ำในระบบ" });
                    continue;
                }

                // 2. Resolve Location
                let locationId = undefined;
                if (part.locationName) {
                    const normalizedLocName = part.locationName.trim().toLowerCase();
                    if (locationMap.has(normalizedLocName)) {
                        locationId = locationMap.get(normalizedLocName);
                    } else {
                        // Option: Create location? Or just ignore? 
                        // For safety, let's just ignore or maybe create if simple?
                        // "Locations are hierarchical", creating them flat might be messy.
                        // I'll skip location assignment if not found but log a warning? 
                        // Or just standard behavior: leave blank.
                        // Ideally: Create it if it doesn't exist? 
                        // Let's create it if missing, as "Other" type or just basic.
                        const newLoc = await (prisma as any).location.create({
                            data: { name: part.locationName.trim() }
                        });
                        locationId = newLoc.id;
                        locationMap.set(normalizedLocName, newLoc.id);
                    }
                }

                // 3. Create Part
                const newPart = await (prisma as any).sparePart.create({
                    data: {
                        code: part.code,
                        name: part.name,
                        category: part.category || "Uncategorized",
                        unit: part.unit,
                        unitPrice: part.unitPrice,
                        stockQuantity: part.initialStock,
                        minStockLevel: part.minStockLevel,
                        reorderPoint: part.reorderPoint ?? part.minStockLevel,
                        maxStockLevel: part.maxStockLevel,
                        supplier: part.supplier,
                        description: part.description,
                        locationId: locationId,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    }
                });

                // 4. Create Initial Transaction if stock > 0
                if (part.initialStock > 0) {
                    await (prisma as any).inventoryTransaction.create({
                        data: {
                            sparePartId: newPart.id,
                            type: "IN",
                            quantity: part.initialStock,
                            balanceAfter: part.initialStock,
                            unitPrice: part.unitPrice,
                            notes: "Initial Import",
                            createdById: user.id,
                            referenceType: "IMPORT_EXCEL",
                        }
                    });
                }

                created++;

            } catch (err: any) {
                errors.push({ row: rowNum, code: part.code, error: err.message || "Unknown error" });
            }
        }

        revalidatePath("/dashboard/inventory");

        return {
            success: true,
            data: { created, errors }
        };

    } catch (error: any) {
        console.error("Bulk Create Error:", error);
        return { success: false, error: "Import failed" };
    }
}
