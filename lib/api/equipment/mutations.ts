/**
 * Equipment Mutations
 * Create, Update, Delete operations for Equipment
 */

import { prisma } from "@/lib/prisma";
import { EquipmentStatus } from "@prisma/client";
import { EquipmentWithRelations } from "./types";
import QRCode from "qrcode";

// =====================================
// HELPER FUNCTIONS
// =====================================

/**
 * Generate unique QR Code URL for equipment
 * Format: {NEXT_PUBLIC_APP_URL}/dashboard/equipment/{equipmentId}
 */
function generateQrCodeUrl(equipmentId: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return `${baseUrl}/dashboard/equipment/${equipmentId}`;
}

/**
 * Generate QR Code image as data URL
 */
export async function generateQrCodeImage(qrCode: string): Promise<string> {
    try {
        const dataUrl = await QRCode.toDataURL(qrCode, {
            width: 256,
            margin: 2,
            color: {
                dark: "#000000",
                light: "#ffffff",
            },
        });
        return dataUrl;
    } catch (error) {
        console.error("Error generating QR code image:", error);
        throw new Error("ไม่สามารถสร้าง QR Code ได้");
    }
}

// =====================================
// CREATE OPERATIONS
// =====================================

interface CreateEquipmentData {
    code: string;
    name: string;
    categoryId: string;
    type?: string | null;
    manufacturer?: string | null;
    serialNumber?: string | null;
    model?: string | null;
    location?: string | null;
    installationDate?: Date | null;
    warrantyExpiry?: Date | null;
    cost?: number | null;
    status?: EquipmentStatus;
    description?: string | null;
    manualUrl?: string | null;
    specifications?: Record<string, any> | null;
    responsiblePersonId?: string | null;
    supplierContact?: string | null;
    image?: string | null;
    parentId?: string | null;

    locationId?: string | null;
    floor?: string | null;
}

/**
 * สร้างเครื่องจักรใหม่
 */
export async function createEquipment(
    data: CreateEquipmentData
): Promise<EquipmentWithRelations> {
    // Create equipment first with temporary QR code
    const tempQrCode = `TEMP-${data.code}-${Date.now()}`;

    const createdEquipment = await prisma.equipment.create({
        data: {
            code: data.code,
            name: data.name,
            categoryId: data.categoryId,
            type: data.type,
            manufacturer: data.manufacturer,
            serialNumber: data.serialNumber,
            model: data.model,
            location: data.location,
            installationDate: data.installationDate,
            warrantyExpiry: data.warrantyExpiry,
            cost: data.cost,
            status: data.status || "ACTIVE",
            qrCode: tempQrCode,
            description: data.description,
            manualUrl: data.manualUrl || null,
            specifications: data.specifications as any,
            responsiblePersonId: data.responsiblePersonId,
            supplierContact: data.supplierContact,
            image: data.image || null,
            parentId: data.parentId || null,
            locationId: data.locationId || null,
            floor: data.floor || null,
        },
    });

    // Now update with proper QR code URL using the generated ID
    const qrCodeUrl = generateQrCodeUrl(createdEquipment.id);

    const equipment = await prisma.equipment.update({
        where: { id: createdEquipment.id },
        data: { qrCode: qrCodeUrl },
        include: {
            category: true,
            responsiblePerson: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                },
            },
            parent: {
                select: {
                    id: true,
                    name: true,
                    code: true,
                }
            },
            locationRef: true,
        },
    });

    return equipment as EquipmentWithRelations;
}

// =====================================
// UPDATE OPERATIONS
// =====================================

interface UpdateEquipmentData {
    id: string;
    code?: string;
    name?: string;
    categoryId?: string;
    type?: string | null;
    manufacturer?: string | null;
    serialNumber?: string | null;
    model?: string | null;
    location?: string | null;
    installationDate?: Date | null;
    warrantyExpiry?: Date | null;
    cost?: number | null;
    status?: EquipmentStatus;
    description?: string | null;
    manualUrl?: string | null;
    specifications?: Record<string, any> | null;
    responsiblePersonId?: string | null;
    supplierContact?: string | null;
    image?: string | null;
    parentId?: string | null;

    locationId?: string | null;
    floor?: string | null;
}

/**
 * อัปเดตเครื่องจักร
 */
export async function updateEquipment(
    data: UpdateEquipmentData
): Promise<EquipmentWithRelations> {
    const { id, ...updateData } = data;

    // QR Code is now based on equipment ID (immutable), no need to regenerate on code change

    const equipment = await prisma.equipment.update({
        where: { id },
        data: {
            code: updateData.code,
            name: updateData.name,
            categoryId: updateData.categoryId,
            type: updateData.type,
            manufacturer: updateData.manufacturer,
            serialNumber: updateData.serialNumber,
            model: updateData.model,
            location: updateData.location,
            installationDate: updateData.installationDate,
            warrantyExpiry: updateData.warrantyExpiry,
            cost: updateData.cost,
            status: updateData.status,
            description: updateData.description,
            manualUrl: updateData.manualUrl || null,
            specifications: updateData.specifications as any,
            responsiblePersonId: updateData.responsiblePersonId,
            supplierContact: updateData.supplierContact,
            image: updateData.image || null,
            parentId: updateData.parentId,
            locationId: updateData.locationId,
            floor: updateData.floor,

        },
        include: {
            category: true,
            responsiblePerson: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                },
            },
            parent: {
                select: {
                    id: true,
                    name: true,
                    code: true
                }
            },
            locationRef: true,
        },
    });

    return equipment as EquipmentWithRelations;
}

/**
 * อัปเดตสถานะเครื่องจักร
 */
export async function updateEquipmentStatus(
    id: string,
    status: EquipmentStatus
): Promise<EquipmentWithRelations> {
    const equipment = await prisma.equipment.update({
        where: { id },
        data: { status },
        include: {
            category: true,
            responsiblePerson: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                },
            },
        },
    });

    return equipment as EquipmentWithRelations;
}

/**
 * มอบหมายผู้รับผิดชอบเครื่องจักร
 */
export async function assignResponsiblePerson(
    equipmentId: string,
    userId: string | null
): Promise<EquipmentWithRelations> {
    const equipment = await prisma.equipment.update({
        where: { id: equipmentId },
        data: { responsiblePersonId: userId },
        include: {
            category: true,
            responsiblePerson: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                },
            },
        },
    });

    return equipment as EquipmentWithRelations;
}

// =====================================
// DELETE OPERATIONS
// =====================================

/**
 * ลบเครื่องจักร (Soft delete โดยเปลี่ยนสถานะเป็น RETIRED)
 */
export async function retireEquipment(id: string): Promise<void> {
    await prisma.equipment.update({
        where: { id },
        data: { status: "RETIRED" },
    });
}

/**
 * ลบเครื่องจักรถาวร (Hard delete)
 * ⚠️ ใช้ระวัง! จะลบข้อมูลทั้งหมดที่เกี่ยวข้อง
 */
export async function deleteEquipment(id: string): Promise<void> {
    // Check if there are related work orders
    const workOrderCount = await prisma.workOrder.count({
        where: { equipmentId: id },
    });

    if (workOrderCount > 0) {
        throw new Error(
            `ไม่สามารถลบเครื่องจักรได้เนื่องจากมีใบแจ้งซ่อม ${workOrderCount} รายการที่เกี่ยวข้อง`
        );
    }

    // Delete related maintenance schedules first
    await prisma.maintenanceSchedule.deleteMany({
        where: { equipmentId: id },
    });

    // Then delete equipment
    await prisma.equipment.delete({
        where: { id },
    });
}

// =====================================
// CATEGORY OPERATIONS
// =====================================

interface CreateCategoryData {
    name: string;
    description?: string | null;
    icon?: string | null;
}

/**
 * สร้างหมวดหมู่เครื่องจักรใหม่
 */
export async function createCategory(data: CreateCategoryData) {
    return prisma.equipmentCategory.create({
        data: {
            name: data.name,
            description: data.description,
            icon: data.icon,
        },
    });
}

interface UpdateCategoryData {
    id: string;
    name?: string;
    description?: string | null;
    icon?: string | null;
}

/**
 * อัปเดตหมวดหมู่
 */
export async function updateCategory(data: UpdateCategoryData) {
    const { id, ...updateData } = data;
    return prisma.equipmentCategory.update({
        where: { id },
        data: updateData,
    });
}

/**
 * ลบหมวดหมู่
 * ⚠️ ต้องไม่มีเครื่องจักรในหมวดหมู่นี้
 */
export async function deleteCategory(id: string): Promise<void> {
    const equipmentCount = await prisma.equipment.count({
        where: { categoryId: id },
    });

    if (equipmentCount > 0) {
        throw new Error(
            `ไม่สามารถลบหมวดหมู่ได้เนื่องจากมีเครื่องจักร ${equipmentCount} รายการในหมวดหมู่นี้`
        );
    }

    await prisma.equipmentCategory.delete({
        where: { id },
    });
}

// =====================================
// BATCH OPERATIONS
// =====================================

/**
 * อัปเดตสถานะหลายเครื่องพร้อมกัน
 */
export async function bulkUpdateStatus(
    ids: string[],
    status: EquipmentStatus
): Promise<{ count: number }> {
    const result = await prisma.equipment.updateMany({
        where: { id: { in: ids } },
        data: { status },
    });

    return { count: result.count };
}

/**
 * มอบหมายผู้รับผิดชอบหลายเครื่องพร้อมกัน
 */
export async function bulkAssignResponsible(
    ids: string[],
    userId: string | null
): Promise<{ count: number }> {
    const result = await prisma.equipment.updateMany({
        where: { id: { in: ids } },
        data: { responsiblePersonId: userId },
    });

    return { count: result.count };
}
