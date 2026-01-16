import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { ExpenseFilters, ExpenseStats } from "./types";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { th } from "date-fns/locale";

export async function getExpenses(filters: ExpenseFilters, pagination: { page: number; pageSize: number }) {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ExpenseWhereInput = {};

    if (filters.startDate) {
        where.date = { gte: filters.startDate };
    }
    if (filters.endDate) {
        where.date = { ...where.date, lte: filters.endDate } as any;
    }
    if (filters.equipmentId) {
        where.equipmentId = filters.equipmentId;
    }
    if (filters.workOrderId) {
        where.workOrderId = filters.workOrderId;
    }
    if (filters.expenseTypeId) {
        where.expenseTypeId = filters.expenseTypeId;
    }

    const [expenses, total] = await Promise.all([
        prisma.expense.findMany({
            where,
            include: {
                workOrder: true,
                equipment: true,
                expenseType: true,
            },
            orderBy: { date: "desc" },
            skip,
            take: pageSize,
        }),
        prisma.expense.count({ where }),
    ]);

    return {
        data: expenses,
        meta: {
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        },
    };
}

export async function getExpenseStats(period: "month" | "year" = "year"): Promise<ExpenseStats> {
    const now = new Date();
    const startDate = period === "month" ? startOfMonth(now) : subMonths(now, 11); // Last 12 months

    const where: Prisma.ExpenseWhereInput = {
        date: { gte: startDate },
    };

    const expenses = await prisma.expense.findMany({
        where,
        include: {
            expenseType: true,
        },
        orderBy: { date: "asc" },
    });

    const totalAmount = expenses.reduce((sum, ex) => sum + Number(ex.total), 0);

    // Group by Type
    const byTypeMap = new Map<string, { amount: number; count: number }>();
    expenses.forEach((ex) => {
        const typeName = ex.expenseType.name;
        const current = byTypeMap.get(typeName) || { amount: 0, count: 0 };
        byTypeMap.set(typeName, {
            amount: current.amount + Number(ex.total),
            count: current.count + 1,
        });
    });

    const byType = Array.from(byTypeMap.entries()).map(([type, stats]) => ({
        type,
        amount: stats.amount,
        count: stats.count,
    }));

    // Group by Month (for chart)
    const byMonthMap = new Map<string, number>();

    // Initialize last 12 months with 0 if year view
    if (period === "year") {
        let current = subMonths(now, 11);
        while (current <= now) {
            const key = format(current, "MMM yyyy", { locale: th });
            byMonthMap.set(key, 0);
            current = new Date(current.setMonth(current.getMonth() + 1));
        }
    }

    expenses.forEach((ex) => {
        const key = format(ex.date, "MMM yyyy", { locale: th });
        const current = byMonthMap.get(key) || 0;
        byMonthMap.set(key, current + Number(ex.total));
    });

    const byMonth = Array.from(byMonthMap.entries()).map(([month, amount]) => ({
        month,
        amount,
    }));

    return {
        totalAmount,
        totalCount: expenses.length,
        byType,
        byMonth,
    };
}

export async function getExpenseTypes() {
    return prisma.expenseType.findMany({
        orderBy: { name: 'asc' }
    });
}
