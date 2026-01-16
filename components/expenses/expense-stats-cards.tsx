"use client";

/**
 * Expense Stats Cards Component
 * แสดงสถิติสรุปค่าใช้จ่าย
 */

import { DollarSign, TrendingUp, Receipt, PieChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseStats } from "@/lib/api/expenses/types";

interface ExpenseStatsCardsProps {
    stats: ExpenseStats;
}

export function ExpenseStatsCards({ stats }: ExpenseStatsCardsProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("th-TH", {
            style: "currency",
            currency: "THB",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // หา top expense type
    const topType = stats.byType.length > 0
        ? stats.byType.reduce((prev, current) =>
            prev.amount > current.amount ? prev : current
        )
        : null;

    // คำนวณค่าเฉลี่ยต่อเดือน
    const monthsWithData = stats.byMonth.filter((m) => m.amount > 0).length || 1;
    const avgPerMonth = stats.totalAmount / monthsWithData;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Expenses */}
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        ค่าใช้จ่ายทั้งหมด
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(stats.totalAmount)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        12 เดือนล่าสุด
                    </p>
                </CardContent>
            </Card>

            {/* Total Count */}
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        จำนวนรายการ
                    </CardTitle>
                    <Receipt className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                        {stats.totalCount.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        รายการค่าใช้จ่าย
                    </p>
                </CardContent>
            </Card>

            {/* Average Per Month */}
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        เฉลี่ยต่อเดือน
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                        {formatCurrency(avgPerMonth)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        จาก {monthsWithData} เดือนที่มีข้อมูล
                    </p>
                </CardContent>
            </Card>

            {/* Top Expense Type */}
            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        ประเภทที่มากที่สุด
                    </CardTitle>
                    <PieChart className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                    {topType ? (
                        <>
                            <div className="text-xl font-bold text-orange-600 truncate">
                                {topType.type}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {formatCurrency(topType.amount)} ({topType.count} รายการ)
                            </p>
                        </>
                    ) : (
                        <div className="text-muted-foreground">ไม่มีข้อมูล</div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
