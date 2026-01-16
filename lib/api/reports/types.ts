/**
 * Reports Types
 * TypeScript interfaces สำหรับข้อมูลรายงาน
 */

// ====================================
// COMMON TYPES
// ====================================

export interface DateRangeFilter {
    startDate?: Date;
    endDate?: Date;
}

export interface ChartDataPoint {
    label: string;
    value: number;
    color?: string;
}

export interface MonthlyData {
    month: string;
    value: number;
}

// ====================================
// WORK ORDER REPORT TYPES
// ====================================

export interface WorkOrderReportData {
    summary: {
        total: number;
        pending: number;
        inProgress: number;
        completed: number;
        cancelled: number;
        overdue: number;
        avgResolutionTime: number; // in hours
    };
    byStatus: ChartDataPoint[];
    byPriority: ChartDataPoint[];
    monthlyTrend: MonthlyData[];
    topEquipment: Array<{
        equipmentName: string;
        equipmentCode: string;
        count: number;
    }>;
}

// ====================================
// EXPENSE REPORT TYPES
// ====================================

export interface ExpenseReportData {
    summary: {
        totalAmount: number;
        totalCount: number;
        avgPerMonth: number;
        currentMonth: number;
        previousMonth: number;
        yearToDate: number;
        changePercent: number;
    };
    byType: Array<{
        typeName: string;
        amount: number;
        count: number;
        percentage: number;
    }>;
    monthlyComparison: Array<{
        month: string;
        currentYear: number;
        previousYear: number;
    }>;
    topEquipment: Array<{
        equipmentName: string;
        equipmentCode: string;
        totalAmount: number;
    }>;
}

// ====================================
// EQUIPMENT REPORT TYPES
// ====================================

export interface EquipmentReportData {
    summary: {
        total: number;
        active: number;
        maintenance: number;
        inactive: number;
        retired: number;
    };
    byStatus: ChartDataPoint[];
    byCategory: ChartDataPoint[];
    reliability: {
        mtbf: number; // Mean Time Between Failures (hours)
        mttr: number; // Mean Time To Repair (hours)
        availability: number; // Percentage
    };
    topBreakdowns: Array<{
        equipmentName: string;
        equipmentCode: string;
        breakdownCount: number;
        totalDowntime: number;
    }>;
    maintenanceCost: Array<{
        equipmentName: string;
        equipmentCode: string;
        totalCost: number;
    }>;
}

// ====================================
// TECHNICIAN REPORT TYPES
// ====================================

export interface TechnicianReportData {
    summary: {
        totalTechnicians: number;
        totalWorkOrders: number;
        avgWorkOrdersPerTech: number;
        avgResolutionTime: number;
    };
    technicians: Array<{
        id: string;
        name: string;
        email: string;
        avatarUrl: string | null;
        stats: {
            assigned: number;
            completed: number;
            inProgress: number;
            completionRate: number;
            avgResolutionTime: number;
            totalWorkHours: number;
        };
    }>;
    workloadDistribution: ChartDataPoint[];
}

// ====================================
// EXPORT TYPES
// ====================================

export type ReportType = "work-orders" | "expenses" | "equipment" | "technicians";

export interface ExportOptions {
    format: "pdf" | "excel" | "csv";
    reportType: ReportType;
    dateRange?: DateRangeFilter;
}
