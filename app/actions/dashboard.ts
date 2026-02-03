"use server";

/**
 * Dashboard Server Actions
 * Actions for fetching all dashboard data
 */

import { createClient } from "@/lib/supabase/server";
import { getWorkOrderStats } from "@/lib/api/work-orders/queries";
import { getEquipmentStats } from "@/lib/api/equipment/queries";
import { getExpenseStats } from "@/lib/api/expenses/queries";
import { getUpcomingSchedules, getOverdueSchedules } from "@/lib/api/schedules/queries";
import prisma from "@/lib/prisma";

// Auth helper
async function checkAuth() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error("Unauthorized");
    return user;
}

function serialize<T>(data: T): T {
    return JSON.parse(JSON.stringify(data, (key, value) => {
        if (value && typeof value === 'object' && value.constructor?.name === 'Decimal') {
            return Number(value);
        }
        if (value instanceof Date) {
            return value.toISOString();
        }
        return value;
    }));
}

// ========================================
// DASHBOARD STATS
// ========================================

export interface DashboardStats {
    workOrders: {
        total: number;
        pending: number;
        inProgress: number;
        completed: number;
        overdue: number;
    };
    equipment: {
        total: number;
        active: number;
        maintenance: number;
        inactive: number;
    };
    expenses: {
        thisMonth: number;
        lastMonth: number;
        trend: number; // percentage change
    };
    upcomingPM: number;
    overduePM: number;
}

export async function getDashboardStatsAction() {
    try {
        await checkAuth();

        const [workOrderStats, equipmentStats, expenseStats, upcomingSchedules, overdueSchedules] = await Promise.all([
            getWorkOrderStats(),
            getEquipmentStats(),
            getExpenseStats("month"),
            getUpcomingSchedules(7),
            getOverdueSchedules(),
        ]);

        // Calculate this month's expense
        const thisMonthExpense = expenseStats.totalAmount;

        const stats: DashboardStats = {
            workOrders: {
                total: workOrderStats.total,
                pending: workOrderStats.pending,
                inProgress: workOrderStats.inProgress,
                completed: workOrderStats.completed,
                overdue: workOrderStats.overdue,
            },
            equipment: {
                total: equipmentStats.total,
                active: equipmentStats.byStatus.active,
                maintenance: equipmentStats.byStatus.maintenance,
                inactive: equipmentStats.byStatus.inactive,
            },
            expenses: {
                thisMonth: thisMonthExpense,
                lastMonth: 0, // Will calculate if needed
                trend: 0,
            },
            upcomingPM: upcomingSchedules.length,
            overduePM: overdueSchedules.length,
        };

        return { success: true, data: serialize(stats) };
    } catch (error: any) {
        console.error("getDashboardStatsAction error:", error);
        return { success: false, error: error.message };
    }
}

// ========================================
// RECENT WORK ORDERS
// ========================================

export async function getRecentWorkOrdersAction(limit: number = 5) {
    try {
        await checkAuth();

        const workOrders = await prisma.workOrder.findMany({
            select: {
                id: true,
                woNumber: true,
                title: true,
                status: true,
                priority: true,
                reportedAt: true,
                equipment: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
            },
            orderBy: { reportedAt: "desc" },
            take: limit,
        });

        return { success: true, data: serialize(workOrders) };
    } catch (error: any) {
        console.error("getRecentWorkOrdersAction error:", error);
        return { success: false, error: error.message };
    }
}

// ========================================
// IN PROGRESS WORK ORDERS
// ========================================

export async function getInProgressWorkOrdersAction(limit: number = 5) {
    try {
        await checkAuth();

        const workOrders = await prisma.workOrder.findMany({
            where: {
                status: "IN_PROGRESS",
            },
            select: {
                id: true,
                woNumber: true,
                title: true,
                status: true,
                priority: true,
                startedAt: true,
                equipment: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
                assignee: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { startedAt: "desc" },
            take: limit,
        });

        return { success: true, data: serialize(workOrders) };
    } catch (error: any) {
        console.error("getInProgressWorkOrdersAction error:", error);
        return { success: false, error: error.message };
    }
}

// ========================================
// UPCOMING PM SCHEDULES
// ========================================

export async function getUpcomingPMSchedulesAction(days: number = 7) {
    try {
        await checkAuth();

        const schedules = await getUpcomingSchedules(days);

        return { success: true, data: serialize(schedules) };
    } catch (error: any) {
        console.error("getUpcomingPMSchedulesAction error:", error);
        return { success: false, error: error.message };
    }
}

// ========================================
// WORK ORDER TREND (Last 6 months)
// ========================================

export async function getWorkOrderTrendAction() {
    try {
        await checkAuth();

        const months = 6;
        const now = new Date();

        // สร้าง date ranges ก่อน
        const dateRanges = Array.from({ length: months }, (_, i) => {
            const monthIndex = months - 1 - i;
            const startDate = new Date(now.getFullYear(), now.getMonth() - monthIndex, 1);
            const endDate = new Date(now.getFullYear(), now.getMonth() - monthIndex + 1, 0, 23, 59, 59);
            return { startDate, endDate, monthLabel: startDate.toLocaleDateString('th-TH', { month: 'short' }) };
        });

        // รัน queries ทั้งหมดพร้อมกัน (parallel)
        const allQueries = dateRanges.flatMap(({ startDate, endDate }) => [
            prisma.workOrder.count({
                where: { reportedAt: { gte: startDate, lte: endDate } },
            }),
            prisma.workOrder.count({
                where: { completedAt: { gte: startDate, lte: endDate } },
            }),
        ]);

        const results = await Promise.all(allQueries);

        // Map results กลับเป็น data array
        const data = dateRanges.map((range, index) => ({
            month: range.monthLabel,
            created: results[index * 2],
            completed: results[index * 2 + 1],
        }));

        return { success: true, data };
    } catch (error: any) {
        console.error("getWorkOrderTrendAction error:", error);
        return { success: false, error: error.message };
    }
}

// ========================================
// EXPENSE TREND (Last 6 months)
// ========================================

export async function getExpenseTrendAction() {
    try {
        await checkAuth();

        const months = 6;
        const now = new Date();

        // สร้าง date ranges ก่อน
        const dateRanges = Array.from({ length: months }, (_, i) => {
            const monthIndex = months - 1 - i;
            const startDate = new Date(now.getFullYear(), now.getMonth() - monthIndex, 1);
            const endDate = new Date(now.getFullYear(), now.getMonth() - monthIndex + 1, 0, 23, 59, 59);
            return { startDate, endDate, monthLabel: startDate.toLocaleDateString('th-TH', { month: 'short' }) };
        });

        // รัน queries ทั้งหมดพร้อมกัน (parallel)
        const allQueries = dateRanges.map(({ startDate, endDate }) =>
            prisma.expense.aggregate({
                where: { date: { gte: startDate, lte: endDate } },
                _sum: { total: true },
            })
        );

        const results = await Promise.all(allQueries);

        // Map results กลับเป็น data array
        const data = dateRanges.map((range, index) => ({
            month: range.monthLabel,
            amount: Number(results[index]._sum.total || 0),
        }));

        return { success: true, data };
    } catch (error: any) {
        console.error("getExpenseTrendAction error:", error);
        return { success: false, error: error.message };
    }
}
