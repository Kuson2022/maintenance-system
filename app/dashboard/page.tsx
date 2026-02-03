import { Metadata } from "next";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { DashboardStats } from "@/app/actions/dashboard";

import {
  getDashboardStatsAction,
  getRecentWorkOrdersAction,
  getWorkOrderTrendAction,
  getExpenseTrendAction,
  getUpcomingPMSchedulesAction,
} from "@/app/actions/dashboard";

export const revalidate = 60; // Cache for 60 seconds

export const metadata: Metadata = {
  title: "Dashboard | ระบบซ่อมบำรุง",
  description: "ภาพรวมระบบบริหารงานซ่อมบำรุง",
};

export default async function DashboardPage() {
  // Fetch all dashboard data in parallel
  const [statsResult, recentWOResult, woTrendResult, expenseTrendResult, upcomingPMResult] = await Promise.all([
    getDashboardStatsAction(),
    getRecentWorkOrdersAction(5),
    getWorkOrderTrendAction(),
    getExpenseTrendAction(),
    getUpcomingPMSchedulesAction(7),
  ]);

  // Default values if fetch fails
  const defaultStats: DashboardStats = {
    workOrders: { total: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0 },
    equipment: { total: 0, active: 0, maintenance: 0, inactive: 0 },
    expenses: { thisMonth: 0, lastMonth: 0, trend: 0 },
    upcomingPM: 0,
    overduePM: 0,
  };

  const stats = statsResult.success && statsResult.data ? statsResult.data : defaultStats;
  const recentWorkOrders = recentWOResult.success && recentWOResult.data ? recentWOResult.data : [];
  const woTrendData = woTrendResult.success && woTrendResult.data ? woTrendResult.data : [];
  const expenseTrendData = expenseTrendResult.success && expenseTrendResult.data ? expenseTrendResult.data : [];
  const upcomingSchedules = upcomingPMResult.success && upcomingPMResult.data ? upcomingPMResult.data : [];

  return (
    <DashboardClient
      stats={stats}
      recentWorkOrders={recentWorkOrders}
      woTrendData={woTrendData}
      expenseTrendData={expenseTrendData}
      upcomingSchedules={upcomingSchedules}
    />
  );
}
