import prisma from "@/lib/prisma";
import { CreateExpenseInput, UpdateExpenseInput } from "./validation";
import { Prisma } from "@prisma/client";

export async function createExpense(data: CreateExpenseInput) {
    // Calculate total if not provided
    const total = data.total ?? (data.quantity * data.unitPrice);

    return prisma.expense.create({
        data: {
            description: data.description,
            quantity: data.quantity,
            unitPrice: data.unitPrice,
            total: total as any, // Decimal handling
            date: data.date,
            receiptUrl: data.receiptUrl,
            notes: data.notes,
            expenseTypeId: data.expenseTypeId,
            workOrderId: data.workOrderId || null,
            equipmentId: data.equipmentId || null,
        },
        include: {
            expenseType: true,
            equipment: true,
            workOrder: true,
        }
    });
}

export async function updateExpense(data: UpdateExpenseInput) {
    const { id, ...updateData } = data;

    // Recalculate total if needed
    let total = updateData.total;
    if (updateData.quantity !== undefined && updateData.unitPrice !== undefined) {
        total = updateData.quantity * updateData.unitPrice;
    } else if (updateData.quantity !== undefined || updateData.unitPrice !== undefined) {
        // Fetch current values to recalculate
        const current = await prisma.expense.findUnique({ where: { id } });
        if (current) {
            const qty = updateData.quantity ?? current.quantity;
            const price = updateData.unitPrice ?? Number(current.unitPrice);
            total = qty * price;
        }
    }

    return prisma.expense.update({
        where: { id },
        data: {
            ...updateData,
            total: total as any,
        },
    });
}

export async function deleteExpense(id: string) {
    return prisma.expense.delete({
        where: { id },
    });
}
