/**
 * Reports Queries
 * Database queries สำหรับดึงข้อมูลรายงาน
 */

import { prisma } from "@/lib/prisma";
import {
    WorkOrderReportData,
    ExpenseReportData,
    EquipmentReportData,
    TechnicianReportData,
    DateRangeFilter,
} from "./types";
import {
    startOfMonth,
    endOfMonth,
    subMonths,
    format,
    differenceInHours,
    startOfYear,
    subYears,
} from "date-fns";
import { th } from "date-fns/locale";

// ====================================
// WORK ORDER REPORT
// ====================================

export async function getWorkOrderReportData(
    dateRange?: DateRangeFilter
): Promise<WorkOrderReportData> {
    const now = new Date();
    const startDate = dateRange?.startDate || subMonths(now, 11);
    const endDate = dateRange?.endDate || now;

    // Get all work orders in date range
    const workOrders = await prisma.workOrder.findMany({
        where: {
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
        },
        include: {
            equipment: true,
        },
    });

    // Calculate summary
    const total = workOrders.length;
    const pending = workOrders.filter((wo) => wo.status === "PENDING").length;
    const inProgress = workOrders.filter(
        (wo) => wo.status === "IN_PROGRESS" || wo.status === "ASSIGNED"
    ).length;
    const completed = workOrders.filter((wo) => wo.status === "COMPLETED").length;
    const cancelled = workOrders.filter((wo) => wo.status === "CANCELLED").length;
    const overdue = workOrders.filter(
        (wo) =>
            wo.dueDate &&
            new Date(wo.dueDate) < now &&
            wo.status !== "COMPLETED" &&
            wo.status !== "CANCELLED"
    ).length;

    // Calculate average resolution time
    const completedOrders = workOrders.filter(
        (wo) => wo.status === "COMPLETED" && wo.completedAt && wo.reportedAt
    );
    const avgResolutionTime =
        completedOrders.length > 0
            ? completedOrders.reduce((sum, wo) => {
                return (
                    sum +
                    differenceInHours(new Date(wo.completedAt!), new Date(wo.reportedAt))
                );
            }, 0) / completedOrders.length
            : 0;

    // By Status
    const byStatus = [
        { label: "รอดำเนินการ", value: pending, color: "#fbbf24" },
        { label: "กำลังดำเนินการ", value: inProgress, color: "#3b82f6" },
        { label: "เสร็จสิ้น", value: completed, color: "#22c55e" },
        { label: "ยกเลิก", value: cancelled, color: "#ef4444" },
    ];

    // By Priority
    const priorityCounts = {
        LOW: workOrders.filter((wo) => wo.priority === "LOW").length,
        MEDIUM: workOrders.filter((wo) => wo.priority === "MEDIUM").length,
        HIGH: workOrders.filter((wo) => wo.priority === "HIGH").length,
        CRITICAL: workOrders.filter((wo) => wo.priority === "CRITICAL").length,
    };

    const byPriority = [
        { label: "ต่ำ", value: priorityCounts.LOW, color: "#94a3b8" },
        { label: "ปานกลาง", value: priorityCounts.MEDIUM, color: "#fbbf24" },
        { label: "สูง", value: priorityCounts.HIGH, color: "#f97316" },
        { label: "วิกฤต", value: priorityCounts.CRITICAL, color: "#ef4444" },
    ];

    // Monthly Trend
    const monthlyMap = new Map<string, number>();
    for (let i = 11; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const key = format(monthDate, "MMM yy", { locale: th });
        monthlyMap.set(key, 0);
    }

    workOrders.forEach((wo) => {
        const key = format(new Date(wo.createdAt), "MMM yy", { locale: th });
        if (monthlyMap.has(key)) {
            monthlyMap.set(key, (monthlyMap.get(key) || 0) + 1);
        }
    });

    const monthlyTrend = Array.from(monthlyMap.entries()).map(([month, value]) => ({
        month,
        value,
    }));

    // Top Equipment with most work orders
    const equipmentCounts = new Map<string, { name: string; code: string; count: number }>();
    workOrders.forEach((wo) => {
        const key = wo.equipmentId;
        const current = equipmentCounts.get(key) || {
            name: wo.equipment.name,
            code: wo.equipment.code,
            count: 0,
        };
        equipmentCounts.set(key, { ...current, count: current.count + 1 });
    });

    const topEquipment = Array.from(equipmentCounts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map((eq) => ({
            equipmentName: eq.name,
            equipmentCode: eq.code,
            count: eq.count,
        }));

    return {
        summary: {
            total,
            pending,
            inProgress,
            completed,
            cancelled,
            overdue,
            avgResolutionTime: Math.round(avgResolutionTime),
        },
        byStatus,
        byPriority,
        monthlyTrend,
        topEquipment,
    };
}

// ====================================
// EXPENSE REPORT
// ====================================

export async function getExpenseReportData(
    dateRange?: DateRangeFilter
): Promise<ExpenseReportData> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const previousYear = currentYear - 1;

    // Get all expenses for current and previous year
    const expenses = await prisma.expense.findMany({
        where: {
            date: {
                gte: startOfYear(subYears(now, 1)),
            },
        },
        include: {
            expenseType: true,
            equipment: true,
        },
    });

    // Current year expenses
    const currentYearExpenses = expenses.filter(
        (ex) => new Date(ex.date).getFullYear() === currentYear
    );
    const previousYearExpenses = expenses.filter(
        (ex) => new Date(ex.date).getFullYear() === previousYear
    );

    // Summary calculations
    const totalAmount = currentYearExpenses.reduce(
        (sum, ex) => sum + Number(ex.total),
        0
    );
    const totalCount = currentYearExpenses.length;
    const yearToDate = totalAmount;

    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const previousMonthStart = startOfMonth(subMonths(now, 1));
    const previousMonthEnd = endOfMonth(subMonths(now, 1));

    const currentMonthExpenses = currentYearExpenses.filter((ex) => {
        const date = new Date(ex.date);
        return date >= currentMonthStart && date <= currentMonthEnd;
    });
    const previousMonthExpenses = currentYearExpenses.filter((ex) => {
        const date = new Date(ex.date);
        return date >= previousMonthStart && date <= previousMonthEnd;
    });

    const currentMonth = currentMonthExpenses.reduce(
        (sum, ex) => sum + Number(ex.total),
        0
    );
    const previousMonth = previousMonthExpenses.reduce(
        (sum, ex) => sum + Number(ex.total),
        0
    );
    const avgPerMonth = totalCount > 0 ? totalAmount / 12 : 0;
    const changePercent =
        previousMonth > 0
            ? ((currentMonth - previousMonth) / previousMonth) * 100
            : 0;

    // By Type
    const typeMap = new Map<string, { amount: number; count: number }>();
    currentYearExpenses.forEach((ex) => {
        const typeName = ex.expenseType.name;
        const current = typeMap.get(typeName) || { amount: 0, count: 0 };
        typeMap.set(typeName, {
            amount: current.amount + Number(ex.total),
            count: current.count + 1,
        });
    });

    const byType = Array.from(typeMap.entries())
        .map(([typeName, stats]) => ({
            typeName,
            amount: stats.amount,
            count: stats.count,
            percentage: totalAmount > 0 ? (stats.amount / totalAmount) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

    // Monthly Comparison (Current vs Previous Year)
    const monthlyComparison: Array<{
        month: string;
        currentYear: number;
        previousYear: number;
    }> = [];

    for (let i = 0; i < 12; i++) {
        const monthNum = i + 1;
        const monthLabel = format(new Date(currentYear, i, 1), "MMM", { locale: th });

        const currYearMonthExpenses = currentYearExpenses.filter(
            (ex) => new Date(ex.date).getMonth() === i
        );
        const prevYearMonthExpenses = previousYearExpenses.filter(
            (ex) => new Date(ex.date).getMonth() === i
        );

        monthlyComparison.push({
            month: monthLabel,
            currentYear: currYearMonthExpenses.reduce(
                (sum, ex) => sum + Number(ex.total),
                0
            ),
            previousYear: prevYearMonthExpenses.reduce(
                (sum, ex) => sum + Number(ex.total),
                0
            ),
        });
    }

    // Top Equipment by expense
    const equipmentExpenseMap = new Map<
        string,
        { name: string; code: string; amount: number }
    >();
    currentYearExpenses
        .filter((ex) => ex.equipment)
        .forEach((ex) => {
            const key = ex.equipmentId!;
            const current = equipmentExpenseMap.get(key) || {
                name: ex.equipment!.name,
                code: ex.equipment!.code,
                amount: 0,
            };
            equipmentExpenseMap.set(key, {
                ...current,
                amount: current.amount + Number(ex.total),
            });
        });

    const topEquipment = Array.from(equipmentExpenseMap.values())
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)
        .map((eq) => ({
            equipmentName: eq.name,
            equipmentCode: eq.code,
            totalAmount: eq.amount,
        }));

    return {
        summary: {
            totalAmount,
            totalCount,
            avgPerMonth: Math.round(avgPerMonth),
            currentMonth,
            previousMonth,
            yearToDate,
            changePercent: Math.round(changePercent * 10) / 10,
        },
        byType,
        monthlyComparison,
        topEquipment,
    };
}

// ====================================
// EQUIPMENT REPORT
// ====================================

export async function getEquipmentReportData(): Promise<EquipmentReportData> {
    const equipment = await prisma.equipment.findMany({
        include: {
            category: true,
            workOrders: {
                where: {
                    status: "COMPLETED",
                },
                include: {
                    maintenanceLogs: true,
                },
            },
            expenses: true,
        },
    });

    // Summary by status
    const total = equipment.length;
    const active = equipment.filter((eq) => eq.status === "ACTIVE").length;
    const maintenance = equipment.filter((eq) => eq.status === "MAINTENANCE").length;
    const inactive = equipment.filter((eq) => eq.status === "INACTIVE").length;
    const retired = equipment.filter((eq) => eq.status === "RETIRED").length;

    const byStatus = [
        { label: "ใช้งาน", value: active, color: "#22c55e" },
        { label: "ซ่อมบำรุง", value: maintenance, color: "#f97316" },
        { label: "ไม่ใช้งาน", value: inactive, color: "#94a3b8" },
        { label: "ปลดระวาง", value: retired, color: "#ef4444" },
    ];

    // By Category
    const categoryMap = new Map<string, number>();
    equipment.forEach((eq) => {
        const catName = eq.category.name;
        categoryMap.set(catName, (categoryMap.get(catName) || 0) + 1);
    });

    const categoryColors = [
        "#3b82f6",
        "#22c55e",
        "#f97316",
        "#8b5cf6",
        "#ec4899",
        "#14b8a6",
    ];
    const byCategory = Array.from(categoryMap.entries()).map(([label, value], idx) => ({
        label,
        value,
        color: categoryColors[idx % categoryColors.length],
    }));

    // Calculate MTBF and MTTR
    let totalBreakdowns = 0;
    let totalRepairTime = 0;
    let totalUptime = 0;

    equipment.forEach((eq) => {
        const completedWorkOrders = eq.workOrders;
        totalBreakdowns += completedWorkOrders.length;

        completedWorkOrders.forEach((wo) => {
            if (wo.completedAt && wo.reportedAt) {
                totalRepairTime += differenceInHours(
                    new Date(wo.completedAt),
                    new Date(wo.reportedAt)
                );
            }
        });
    });

    // MTBF = Total Operating Time / Number of Failures (simplified - assume 8760 hours/year per equipment)
    const mtbf =
        totalBreakdowns > 0
            ? (equipment.length * 8760 - totalRepairTime) / totalBreakdowns
            : 8760;

    // MTTR = Total Repair Time / Number of Repairs
    const mttr = totalBreakdowns > 0 ? totalRepairTime / totalBreakdowns : 0;

    // Availability = MTBF / (MTBF + MTTR) * 100
    const availability = mtbf > 0 ? (mtbf / (mtbf + mttr)) * 100 : 100;

    // Top equipment with most breakdowns
    const topBreakdowns = equipment
        .map((eq) => ({
            equipmentName: eq.name,
            equipmentCode: eq.code,
            breakdownCount: eq.workOrders.length,
            totalDowntime: eq.workOrders.reduce((sum, wo) => {
                if (wo.completedAt && wo.reportedAt) {
                    return (
                        sum +
                        differenceInHours(new Date(wo.completedAt), new Date(wo.reportedAt))
                    );
                }
                return sum;
            }, 0),
        }))
        .sort((a, b) => b.breakdownCount - a.breakdownCount)
        .slice(0, 5);

    // Maintenance cost per equipment
    const maintenanceCost = equipment
        .map((eq) => ({
            equipmentName: eq.name,
            equipmentCode: eq.code,
            totalCost: eq.expenses.reduce((sum, ex) => sum + Number(ex.total), 0),
        }))
        .sort((a, b) => b.totalCost - a.totalCost)
        .slice(0, 5);

    return {
        summary: { total, active, maintenance, inactive, retired },
        byStatus,
        byCategory,
        reliability: {
            mtbf: Math.round(mtbf),
            mttr: Math.round(mttr * 10) / 10,
            availability: Math.round(availability * 10) / 10,
        },
        topBreakdowns,
        maintenanceCost,
    };
}

// ====================================
// TECHNICIAN REPORT
// ====================================

export async function getTechnicianReportData(): Promise<TechnicianReportData> {
    const technicians = await prisma.user.findMany({
        where: {
            role: { in: ["TECHNICIAN", "ADMIN"] },
            status: "ACTIVE",
        },
        include: {
            assignedWorkOrders: {
                include: {
                    maintenanceLogs: true,
                },
            },
            maintenanceLogs: true,
        },
    });

    const totalTechnicians = technicians.length;
    let totalWorkOrders = 0;
    let totalResolutionTime = 0;
    let completedCount = 0;

    const technicianStats = technicians.map((tech) => {
        const assigned = tech.assignedWorkOrders.length;
        const completed = tech.assignedWorkOrders.filter(
            (wo) => wo.status === "COMPLETED"
        ).length;
        const inProgress = tech.assignedWorkOrders.filter(
            (wo) => wo.status === "IN_PROGRESS" || wo.status === "ASSIGNED"
        ).length;

        // Calculate avg resolution time for this technician
        let techResolutionTime = 0;
        let techCompletedCount = 0;

        tech.assignedWorkOrders
            .filter((wo) => wo.status === "COMPLETED" && wo.completedAt && wo.reportedAt)
            .forEach((wo) => {
                techResolutionTime += differenceInHours(
                    new Date(wo.completedAt!),
                    new Date(wo.reportedAt)
                );
                techCompletedCount++;
            });

        const avgResolutionTime =
            techCompletedCount > 0 ? techResolutionTime / techCompletedCount : 0;

        // Total work hours from maintenance logs
        const totalWorkHours = tech.maintenanceLogs.reduce(
            (sum, log) => sum + (Number(log.workHours) || 0),
            0
        );

        totalWorkOrders += assigned;
        totalResolutionTime += techResolutionTime;
        completedCount += techCompletedCount;

        return {
            id: tech.id,
            name: tech.name,
            email: tech.email,
            avatarUrl: tech.avatarUrl,
            stats: {
                assigned,
                completed,
                inProgress,
                completionRate: assigned > 0 ? (completed / assigned) * 100 : 0,
                avgResolutionTime: Math.round(avgResolutionTime),
                totalWorkHours: Math.round(totalWorkHours * 10) / 10,
            },
        };
    });

    // Sort by completed work orders
    technicianStats.sort((a, b) => b.stats.completed - a.stats.completed);

    // Workload Distribution
    const workloadDistribution = technicianStats.slice(0, 10).map((tech) => ({
        label: tech.name,
        value: tech.stats.assigned,
        color: "#3b82f6",
    }));

    return {
        summary: {
            totalTechnicians,
            totalWorkOrders,
            avgWorkOrdersPerTech:
                totalTechnicians > 0
                    ? Math.round((totalWorkOrders / totalTechnicians) * 10) / 10
                    : 0,
            avgResolutionTime:
                completedCount > 0
                    ? Math.round(totalResolutionTime / completedCount)
                    : 0,
        },
        technicians: technicianStats,
        workloadDistribution,
    };
}
