"use client";

/**
 * Dashboard Client Component
 * Handles mobile-responsive layout with collapsible sections
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Wrench,
    Package,
    Calendar,
    ChevronDown,
    ChevronUp,
    BarChart3,
    LayoutGrid
} from "lucide-react";
import Link from "next/link";

import { DashboardStatsCards } from "@/components/dashboard/dashboard-stats";
import { WorkOrderTrendChart } from "@/components/dashboard/work-order-chart";
import { ExpenseChart } from "@/components/dashboard/expense-chart";
import { RecentWorkOrders } from "@/components/dashboard/recent-work-orders";
import { UpcomingSchedules } from "@/components/dashboard/upcoming-schedules";
import { DashboardStats } from "@/app/actions/dashboard";
import { useAuth } from "@/lib/auth/auth-context";

interface WorkOrder {
    id: string;
    woNumber: string;
    title: string;
    status: string;
    priority: string;
    reportedAt: string | Date;
    equipment: {
        id: string;
        name: string;
        code: string;
    };
}

interface Schedule {
    id: string;
    activityName: string;
    nextDueDate: string | null;
    equipment: {
        id: string;
        name: string;
        code: string;
    };
    assignee: {
        id: string;
        name: string;
    } | null;
    type: string;
    frequency: string;
}

interface DashboardClientProps {
    stats: DashboardStats;
    recentWorkOrders: WorkOrder[];
    woTrendData: Array<{ month: string; created: number; completed: number }>;
    expenseTrendData: Array<{ month: string; amount: number }>; upcomingSchedules: Schedule[];
}

export function DashboardClient({
    stats,
    recentWorkOrders,
    woTrendData,
    expenseTrendData,
    upcomingSchedules,
}: DashboardClientProps) {
    const { userProfile } = useAuth();
    const [showStats, setShowStats] = useState(false);
    const [showCharts, setShowCharts] = useState(false);

    // Hide Quick Actions for USER role
    const showQuickActions = userProfile?.role !== "USER";

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground text-sm md:text-base">
                        ภาพรวมระบบบริหารงานซ่อมบำรุง
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/dashboard/work-orders/new">
                        <Button size="sm" className="md:hidden">
                            <Wrench className="h-4 w-4" />
                        </Button>
                        <Button className="hidden md:flex">
                            <Wrench className="mr-2 h-4 w-4" />
                            แจ้งซ่อม
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Mobile: Recent Work Orders First (Priority) */}
            <div className="lg:hidden">
                <RecentWorkOrders workOrders={recentWorkOrders} />
            </div>

            {/* Mobile Toggle: Stats Section */}
            <div className="lg:hidden">
                <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => setShowStats(!showStats)}
                >
                    <span className="flex items-center gap-2">
                        <LayoutGrid className="h-4 w-4" />
                        สถิติภาพรวม
                    </span>
                    {showStats ? (
                        <ChevronUp className="h-4 w-4" />
                    ) : (
                        <ChevronDown className="h-4 w-4" />
                    )}
                </Button>
                {showStats && (
                    <div className="mt-4 animate-in slide-in-from-top-2 duration-200">
                        <DashboardStatsCards stats={stats} />
                    </div>
                )}
            </div>

            {/* Desktop: Stats Grid (always visible) */}
            <div className="hidden lg:block">
                <DashboardStatsCards stats={stats} />
            </div>

            {/* Mobile Toggle: Charts Section */}
            <div className="lg:hidden">
                <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => setShowCharts(!showCharts)}
                >
                    <span className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        กราฟและแผนภูมิ
                    </span>
                    {showCharts ? (
                        <ChevronUp className="h-4 w-4" />
                    ) : (
                        <ChevronDown className="h-4 w-4" />
                    )}
                </Button>
                {showCharts && (
                    <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                        <WorkOrderTrendChart data={woTrendData} />
                        <ExpenseChart data={expenseTrendData} />
                    </div>
                )}
            </div>

            {/* Desktop: Charts Row (always visible) */}
            <div className="hidden lg:grid gap-6 lg:grid-cols-2">
                <WorkOrderTrendChart data={woTrendData} />
                <ExpenseChart data={expenseTrendData} />
            </div>

            {/* Desktop: Recent Activity Row */}
            <div className="hidden lg:grid gap-6 lg:grid-cols-2">
                <RecentWorkOrders workOrders={recentWorkOrders} />
                <UpcomingSchedules schedules={upcomingSchedules} userRole={userProfile?.role} />
            </div>

            {/* Mobile: Upcoming Schedules */}
            <div className="lg:hidden">
                <UpcomingSchedules schedules={upcomingSchedules} userRole={userProfile?.role} />
            </div>

            {/* Quick Actions - Hidden for USER role */}
            {showQuickActions && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base md:text-lg">การดำเนินการด่วน</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`grid gap-4 ${userProfile?.role === "ADMIN" ? "grid-cols-3" : "grid-cols-2"} md:grid-cols-3`}>
                            <Link href="/dashboard/work-orders/new">
                                <button className="w-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-3 md:p-6 text-center hover:border-primary hover:bg-accent transition-colors">
                                    <Wrench className="h-6 w-6 md:h-8 md:w-8 mb-1 md:mb-2 text-primary" />
                                    <span className="font-medium text-xs md:text-sm">แจ้งซ่อม</span>
                                </button>
                            </Link>
                            {/* เพิ่มเครื่องจักร - เฉพาะ ADMIN */}
                            {userProfile?.role === "ADMIN" && (
                                <Link href="/dashboard/equipment/new">
                                    <button className="w-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-3 md:p-6 text-center hover:border-primary hover:bg-accent transition-colors">
                                        <Package className="h-6 w-6 md:h-8 md:w-8 mb-1 md:mb-2 text-primary" />
                                        <span className="font-medium text-xs md:text-sm">เพิ่มเครื่องจักร</span>
                                    </button>
                                </Link>
                            )}
                            <Link href="/dashboard/schedules">
                                <button className="w-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-3 md:p-6 text-center hover:border-primary hover:bg-accent transition-colors">
                                    <Calendar className="h-6 w-6 md:h-8 md:w-8 mb-1 md:mb-2 text-primary" />
                                    <span className="font-medium text-xs md:text-sm">ตารางซ่อม</span>
                                </button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
