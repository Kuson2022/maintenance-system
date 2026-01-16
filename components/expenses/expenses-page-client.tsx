"use client";

/**
 * Expenses Page Client Component
 * จัดการ state และ interaction สำหรับหน้า Expenses
 * รวม pagination, mobile view, และ export
 */

import { useState, useEffect, useCallback } from "react";
import { ExpenseFilters, FilterValues } from "./expense-filters";
import { ExpenseChart } from "./expense-chart";
import { ExpenseStatsCards } from "./expense-stats-cards";
import { ExpensesTable } from "./expenses-table";
import { ExpenseMobileList } from "./expense-mobile-card";
import { getExpensesAction, getExpenseStatsAction, checkExpensePermissionsAction } from "@/app/actions/expenses";
import { ExpenseStats, Expense } from "@/lib/api/expenses/types";
import { ExpensePermissions } from "@/lib/api/expenses/permissions";
import { exportDataToCSV } from "@/components/reports/export-buttons";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
    Loader2,
    LayoutGrid,
    Table2,
    Download,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ExpensesPageClientProps {
    initialExpenses: Expense[];
    initialStats: ExpenseStats;
    initialTotal?: number;
}

const defaultPermissions: ExpensePermissions = {
    canView: false,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canManageTypes: false,
};

const PAGE_SIZE = 20;

export function ExpensesPageClient({
    initialExpenses,
    initialStats,
    initialTotal = 0,
}: ExpensesPageClientProps) {
    const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
    const [stats, setStats] = useState<ExpenseStats>(initialStats);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState<FilterValues>({});
    const [permissions, setPermissions] = useState<ExpensePermissions>(defaultPermissions);
    const [permissionsLoaded, setPermissionsLoaded] = useState(false);

    // View mode and pagination
    const [viewMode, setViewMode] = useState<"table" | "cards">("table");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(initialTotal);
    const totalPages = Math.ceil(totalItems / PAGE_SIZE);

    // Detect mobile view
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setViewMode("cards");
            }
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Load permissions on mount
    useEffect(() => {
        async function loadPermissions() {
            const result = await checkExpensePermissionsAction();
            if (result.success && result.data) {
                setPermissions(result.data);
            }
            setPermissionsLoaded(true);
        }
        loadPermissions();
    }, []);

    // Fetch expenses with current filters and pagination
    const fetchExpenses = useCallback(async (
        filterValues: FilterValues = filters,
        page: number = currentPage
    ) => {
        setLoading(true);
        try {
            const result = await getExpensesAction(
                {
                    startDate: filterValues.startDate,
                    endDate: filterValues.endDate,
                    expenseTypeId: filterValues.expenseTypeId,
                    equipmentId: filterValues.equipmentId,
                },
                { page, pageSize: PAGE_SIZE }
            );

            if (result.success && result.data) {
                setExpenses(result.data);
                if (result.meta) {
                    setTotalItems(result.meta.total);
                }
            }
        } catch (error) {
            console.error("Failed to fetch expenses:", error);
        } finally {
            setLoading(false);
        }
    }, [filters, currentPage]);

    // Handle filter change
    const handleFilterChange = useCallback(async (newFilters: FilterValues) => {
        setFilters(newFilters);
        setCurrentPage(1);
        fetchExpenses(newFilters, 1);
    }, [fetchExpenses]);

    // Handle page change
    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
        fetchExpenses(filters, page);
    }, [fetchExpenses, filters]);

    // Handle refresh (after edit/delete) - also refresh stats
    const handleRefresh = useCallback(async () => {
        // Fetch both expenses and stats in parallel
        const [expensesResult, statsResult] = await Promise.all([
            getExpensesAction(
                {
                    startDate: filters.startDate,
                    endDate: filters.endDate,
                    expenseTypeId: filters.expenseTypeId,
                    equipmentId: filters.equipmentId,
                },
                { page: currentPage, pageSize: PAGE_SIZE }
            ),
            getExpenseStatsAction("year"),
        ]);

        if (expensesResult.success && expensesResult.data) {
            setExpenses(expensesResult.data);
            if (expensesResult.meta) {
                setTotalItems(expensesResult.meta.total);
            }
        }

        if (statsResult.success && statsResult.data) {
            setStats(statsResult.data);
        }
    }, [filters, currentPage]);

    // Handle export
    const handleExport = useCallback(() => {
        const exportData = expenses.map((expense) => ({
            "วันที่": format(new Date(expense.date), "d MMM yyyy", { locale: th }),
            "รายการ": expense.description,
            "ประเภท": expense.expenseType.name,
            "เครื่องจักร": expense.equipment?.name || "-",
            "ใบสั่งงาน": expense.workOrder?.woNumber || "-",
            "จำนวน": expense.quantity,
            "ราคา/หน่วย": Number(expense.unitPrice),
            "รวม": Number(expense.total),
            "หมายเหตุ": expense.notes || "",
        }));
        exportDataToCSV(exportData, `expenses_${format(new Date(), "yyyyMMdd")}`);
    }, [expenses]);

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <ExpenseStatsCards stats={stats} />

            {/* Chart */}
            <ExpenseChart data={stats.byMonth} />

            {/* Filters */}
            <ExpenseFilters onFilterChange={handleFilterChange} />

            {/* Toolbar: View Toggle & Export */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground hidden sm:inline">
                        แสดงผล:
                    </span>
                    <div className="flex items-center bg-muted rounded-lg p-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode("table")}
                            className={cn(
                                "px-3",
                                viewMode === "table" && "bg-background shadow-sm"
                            )}
                        >
                            <Table2 className="h-4 w-4" />
                            <span className="ml-2 hidden sm:inline">ตาราง</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode("cards")}
                            className={cn(
                                "px-3",
                                viewMode === "cards" && "bg-background shadow-sm"
                            )}
                        >
                            <LayoutGrid className="h-4 w-4" />
                            <span className="ml-2 hidden sm:inline">การ์ด</span>
                        </Button>
                    </div>
                </div>
                <Button
                    variant="outline"
                    onClick={handleExport}
                    disabled={expenses.length === 0}
                >
                    <Download className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">ส่งออก CSV</span>
                    <span className="sm:hidden">CSV</span>
                </Button>
            </div>

            {/* Data Table/Cards */}
            <div className="relative">
                {loading && (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-lg">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}

                {permissionsLoaded ? (
                    viewMode === "table" ? (
                        <ExpensesTable
                            data={expenses}
                            permissions={permissions}
                            onRefresh={handleRefresh}
                        />
                    ) : (
                        <ExpenseMobileList
                            expenses={expenses}
                            permissions={permissions}
                            onRefresh={handleRefresh}
                        />
                    )
                ) : (
                    <Skeleton className="h-[400px] rounded-xl" />
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        แสดง {((currentPage - 1) * PAGE_SIZE) + 1} - {Math.min(currentPage * PAGE_SIZE, totalItems)} จาก {totalItems} รายการ
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1 || loading}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            <span className="hidden sm:inline ml-1">ก่อนหน้า</span>
                        </Button>
                        <div className="flex items-center gap-1">
                            {/* Page numbers */}
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let page: number;
                                if (totalPages <= 5) {
                                    page = i + 1;
                                } else if (currentPage <= 3) {
                                    page = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    page = totalPages - 4 + i;
                                } else {
                                    page = currentPage - 2 + i;
                                }
                                return (
                                    <Button
                                        key={page}
                                        variant={currentPage === page ? "default" : "outline"}
                                        size="sm"
                                        className="w-8 h-8 p-0"
                                        onClick={() => handlePageChange(page)}
                                        disabled={loading}
                                    >
                                        {page}
                                    </Button>
                                );
                            })}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages || loading}
                        >
                            <span className="hidden sm:inline mr-1">ถัดไป</span>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Skeleton loader for initial load
export function ExpensesPageSkeleton() {
    return (
        <div className="space-y-6">
            {/* Stats Cards Skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-[120px] rounded-xl" />
                ))}
            </div>

            {/* Chart Skeleton */}
            <Skeleton className="h-[380px] rounded-xl" />

            {/* Filter Skeleton */}
            <Skeleton className="h-[100px] rounded-xl" />

            {/* Table Skeleton */}
            <Skeleton className="h-[400px] rounded-xl" />
        </div>
    );
}
