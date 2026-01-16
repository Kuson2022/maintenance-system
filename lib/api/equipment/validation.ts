/**
 * Equipment Validation Schemas
 * Zod schemas for input validation
 */

import { z } from "zod";

// =====================================
// EQUIPMENT SCHEMAS
// =====================================

export const equipmentStatusSchema = z.enum([
    "ACTIVE",
    "INACTIVE",
    "MAINTENANCE",
    "RETIRED",
]);

export const createEquipmentSchema = z.object({
    code: z
        .string()
        .min(1, "รหัสเครื่องจักรต้องมีอย่างน้อย 1 ตัวอักษร")
        .max(50, "รหัสเครื่องจักรต้องไม่เกิน 50 ตัวอักษร")
        .regex(/^[A-Za-z0-9-_]+$/, "รหัสเครื่องจักรต้องประกอบด้วย A-Z, 0-9, - หรือ _ เท่านั้น"),
    name: z
        .string()
        .min(2, "ชื่อเครื่องจักรต้องมีอย่างน้อย 2 ตัวอักษร")
        .max(200, "ชื่อเครื่องจักรต้องไม่เกิน 200 ตัวอักษร"),
    categoryId: z.string().uuid("กรุณาเลือกหมวดหมู่"),
    type: z.string().max(100).optional().nullable(),
    manufacturer: z.string().max(200).optional().nullable(),
    model: z.string().max(200).optional().nullable(),
    serialNumber: z.string().max(100).optional().nullable(),
    location: z.string().max(200).optional().nullable(),
    installationDate: z.coerce.date().optional().nullable(),
    warrantyExpiry: z.coerce.date().optional().nullable(),
    image: z.string().url("URL รูปภาพไม่ถูกต้อง").optional().nullable().or(z.literal("")),
    cost: z.coerce.number().min(0, "ราคาต้องมากกว่า 0").optional().nullable(),
    status: equipmentStatusSchema.default("ACTIVE"),
    description: z.string().max(2000).optional().nullable(),
    manualUrl: z.string().optional().nullable().or(z.literal("")), // Validates as string, URL validation optional as it might be a relative path
    specifications: z.array(z.object({
        key: z.string(),
        value: z.string()
    })).optional().nullable(), // Changed to array of objects for easier UI handling
    responsiblePersonId: z.string().uuid().optional().nullable(),
    supplierContact: z.string().max(500).optional().nullable(),
    parentId: z.string().uuid().optional().nullable(),
    locationId: z.string().uuid().optional().nullable(),
    floor: z.string().max(50).optional().nullable(),
});

export const updateEquipmentSchema = z.object({
    id: z.string().uuid("ID ไม่ถูกต้อง"),
    code: z
        .string()
        .min(1)
        .max(50)
        .regex(/^[A-Za-z0-9-_]+$/)
        .optional(),
    name: z.string().min(2).max(200).optional(),
    categoryId: z.string().uuid().optional(),
    type: z.string().max(100).optional().nullable(),
    manufacturer: z.string().max(200).optional().nullable(),
    model: z.string().max(200).optional().nullable(),
    serialNumber: z.string().max(100).optional().nullable(),
    location: z.string().max(200).optional().nullable(),
    installationDate: z.coerce.date().optional().nullable(),
    warrantyExpiry: z.coerce.date().optional().nullable(),
    image: z.string().url().optional().nullable().or(z.literal("")),
    cost: z.coerce.number().min(0).optional().nullable(),
    status: equipmentStatusSchema.optional(),
    description: z.string().max(2000).optional().nullable(),
    manualUrl: z.string().optional().nullable().or(z.literal("")),
    specifications: z.array(z.object({
        key: z.string(),
        value: z.string()
    })).optional().nullable(),
    responsiblePersonId: z.string().uuid().optional().nullable(),
    supplierContact: z.string().max(500).optional().nullable(),
    parentId: z.string().uuid().optional().nullable(),
    locationId: z.string().uuid().optional().nullable(),
    floor: z.string().max(50).optional().nullable(),
});

export const equipmentFiltersSchema = z.object({
    search: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    status: equipmentStatusSchema.optional(),
    location: z.string().optional(),
    responsiblePersonId: z.string().uuid().optional(),
    warrantyExpired: z.boolean().optional(),
    hasActiveWorkOrders: z.boolean().optional(),
    floor: z.string().optional(),
});

export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(10000).default(10),
    sortBy: z.string().default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// =====================================
// CATEGORY SCHEMAS
// =====================================

export const createCategorySchema = z.object({
    name: z
        .string()
        .min(2, "ชื่อหมวดหมู่ต้องมีอย่างน้อย 2 ตัวอักษร")
        .max(100, "ชื่อหมวดหมู่ต้องไม่เกิน 100 ตัวอักษร"),
    description: z.string().max(500).optional().nullable(),
    icon: z.string().max(50).optional().nullable(),
});

export const updateCategorySchema = z.object({
    id: z.string().uuid("ID ไม่ถูกต้อง"),
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional().nullable(),
    icon: z.string().max(50).optional().nullable(),
});

// =====================================
// TYPE EXPORTS
// =====================================

export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;
export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>;
export type EquipmentFilters = z.infer<typeof equipmentFiltersSchema>;
export type PaginationParams = z.infer<typeof paginationSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
