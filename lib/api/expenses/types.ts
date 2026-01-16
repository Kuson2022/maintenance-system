import { Prisma } from "@prisma/client";

export type Expense = Prisma.ExpenseGetPayload<{
    include: {
        workOrder: true;
        equipment: true;
        expenseType: true;
    };
}>;

export interface ExpenseFilters {
    startDate?: Date;
    endDate?: Date;
    minAmount?: number;
    maxAmount?: number;
    equipmentId?: string;
    expenseTypeId?: string;
    workOrderId?: string;
}

export interface ExpenseStats {
    totalAmount: number;
    totalCount: number;
    byType: {
        type: string;
        amount: number;
        count: number;
    }[];
    byMonth: {
        month: string;
        amount: number;
    }[];
}
