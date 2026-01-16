"use server";

/**
 * Report Actions
 * Server actions for Report module permissions and data fetching
 */

import { createClient } from "@/lib/supabase/server";
import { checkReportPermissions, ReportPermissions } from "./permissions";
import {
    getWorkOrderReportData,
    getExpenseReportData,
    getEquipmentReportData,
    getTechnicianReportData,
} from "./queries";
import {
    WorkOrderReportData,
    ExpenseReportData,
    EquipmentReportData,
    TechnicianReportData,
    DateRangeFilter,
} from "./types";
import { subDays } from "date-fns";

// Default date range: last 30 days
function getDefaultDateRange(): DateRangeFilter {
    const now = new Date();
    return {
        startDate: subDays(now, 30),
        endDate: now,
    };
}

/**
 * Server action to check report permissions
 * For use in client components
 */
export async function checkReportPermissionsAction(): Promise<ReportPermissions> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return {
                canView: false,
                canExport: false,
            };
        }

        return await checkReportPermissions(user.id);
    } catch (error) {
        console.error("Error in checkReportPermissionsAction:", error);
        return {
            canView: false,
            canExport: false,
        };
    }
}

/**
 * Server action to fetch work order report data
 */
export async function getWorkOrderReportAction(
    startDate?: string,
    endDate?: string
): Promise<WorkOrderReportData | null> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return null;

        const permissions = await checkReportPermissions(user.id);
        if (!permissions.canView) return null;

        const dateRange: DateRangeFilter = {
            startDate: startDate ? new Date(startDate) : getDefaultDateRange().startDate,
            endDate: endDate ? new Date(endDate) : getDefaultDateRange().endDate,
        };

        return await getWorkOrderReportData(dateRange);
    } catch (error) {
        console.error("Error in getWorkOrderReportAction:", error);
        return null;
    }
}

/**
 * Server action to fetch expense report data
 */
export async function getExpenseReportAction(
    startDate?: string,
    endDate?: string
): Promise<ExpenseReportData | null> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return null;

        const permissions = await checkReportPermissions(user.id);
        if (!permissions.canView) return null;

        const dateRange: DateRangeFilter = {
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        };

        return await getExpenseReportData(dateRange);
    } catch (error) {
        console.error("Error in getExpenseReportAction:", error);
        return null;
    }
}

/**
 * Server action to fetch equipment report data
 */
export async function getEquipmentReportAction(): Promise<EquipmentReportData | null> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return null;

        const permissions = await checkReportPermissions(user.id);
        if (!permissions.canView) return null;

        return await getEquipmentReportData();
    } catch (error) {
        console.error("Error in getEquipmentReportAction:", error);
        return null;
    }
}

/**
 * Server action to fetch technician report data
 */
export async function getTechnicianReportAction(): Promise<TechnicianReportData | null> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return null;

        const permissions = await checkReportPermissions(user.id);
        if (!permissions.canView) return null;

        return await getTechnicianReportData();
    } catch (error) {
        console.error("Error in getTechnicianReportAction:", error);
        return null;
    }
}
