"use client";

/**
 * Dashboard Stats Component
 * Stats cards for dashboard
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, Package, DollarSign, Calendar, Clock, AlertTriangle } from "lucide-react";
import { DashboardStats } from "@/app/actions/dashboard";

interface DashboardStatsProps {
    stats: DashboardStats;
}

export function DashboardStatsCards({ stats }: DashboardStatsProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const statCards = [
        {
            title: "ใบแจ้งซ่อมรอดำเนินการ",
            value: stats.workOrders.pending.toString(),
            description: `จากทั้งหมด ${stats.workOrders.total} รายการ`,
            icon: Clock,
            color: "text-yellow-600",
            bgColor: "bg-yellow-50 dark:bg-yellow-950",
        },
        {
            title: "กำลังดำเนินการ",
            value: stats.workOrders.inProgress.toString(),
            description: `เสร็จแล้ว ${stats.workOrders.completed} รายการ`,
            icon: Wrench,
            color: "text-orange-600",
            bgColor: "bg-orange-50 dark:bg-orange-950",
        },
        {
            title: "เครื่องจักรทั้งหมด",
            value: stats.equipment.total.toString(),
            description: `ใช้งาน ${stats.equipment.active} | ซ่อม ${stats.equipment.maintenance}`,
            icon: Package,
            color: "text-blue-600",
            bgColor: "bg-blue-50 dark:bg-blue-950",
        },
        {
            title: "ค่าใช้จ่ายเดือนนี้",
            value: formatCurrency(stats.expenses.thisMonth),
            description: "",
            icon: DollarSign,
            color: "text-green-600",
            bgColor: "bg-green-50 dark:bg-green-950",
        },
        {
            title: "PM ใกล้กำหนด",
            value: stats.upcomingPM.toString(),
            description: "ภายใน 7 วัน",
            icon: Calendar,
            color: "text-purple-600",
            bgColor: "bg-purple-50 dark:bg-purple-950",
        },
        {
            title: "งานเกินกำหนด",
            value: (stats.workOrders.overdue + stats.overduePM).toString(),
            description: `WO: ${stats.workOrders.overdue} | PM: ${stats.overduePM}`,
            icon: AlertTriangle,
            color: "text-red-600",
            bgColor: "bg-red-50 dark:bg-red-950",
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {statCards.map((stat) => {
                const Icon = stat.icon;
                return (
                    <Card key={stat.title} className="relative overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {stat.title}
                            </CardTitle>
                            <div className={`rounded-full p-2 ${stat.bgColor}`}>
                                <Icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            {stat.description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    {stat.description}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
