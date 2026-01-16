import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ReportCard } from "@/components/reports/report-card";
import { StatsGrid } from "@/components/reports/stats-grid";
import {
  FileText,
  TrendingUp,
} from "lucide-react";
import {
  getWorkOrderReportData,
  getExpenseReportData,
  getEquipmentReportData,
  getTechnicianReportData,
} from "@/lib/api/reports/queries";
import { createClient } from "@/lib/supabase/server";
import { checkReportPermissions } from "@/lib/api/reports/permissions";

async function checkAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const permissions = await checkReportPermissions(user.id);
  if (!permissions.canView) {
    redirect("/dashboard");
  }
}

async function ReportsContent() {
  // Check permission - redirect non-admin users
  await checkAccess();

  // Fetch summary data for all reports
  const [workOrderData, expenseData, equipmentData, technicianData] =
    await Promise.all([
      getWorkOrderReportData(),
      getExpenseReportData(),
      getEquipmentReportData(),
      getTechnicianReportData(),
    ]);

  // Quick overview stats
  const overviewStats = [
    {
      label: "ใบแจ้งซ่อมทั้งหมด",
      value: workOrderData.summary.total.toLocaleString(),
      iconName: "Wrench" as const,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      label: "เสร็จสิ้น",
      value: workOrderData.summary.completed.toLocaleString(),
      iconName: "CheckCircle" as const,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      label: "ค่าใช้จ่ายปีนี้",
      value: `฿${(expenseData.summary.yearToDate / 1000).toFixed(0)}K`,
      iconName: "DollarSign" as const,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      label: "เวลาซ่อมเฉลี่ย",
      value: `${workOrderData.summary.avgResolutionTime}ชม.`,
      iconName: "Clock" as const,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  // Report categories
  const reportCategories = [
    {
      title: "รายงานใบแจ้งซ่อม",
      description: "สรุปสถานะและแนวโน้มใบแจ้งซ่อม",
      iconName: "Wrench" as const,
      href: "/dashboard/reports/work-orders",
      stats: [
        { label: "รอดำเนินการ", value: workOrderData.summary.pending },
        { label: "กำลังดำเนินการ", value: workOrderData.summary.inProgress },
        { label: "เสร็จสิ้น", value: workOrderData.summary.completed },
        { label: "เกินกำหนด", value: workOrderData.summary.overdue },
      ],
    },
    {
      title: "รายงานค่าใช้จ่าย",
      description: "วิเคราะห์ค่าใช้จ่ายรายเดือน/รายปี",
      iconName: "DollarSign" as const,
      href: "/dashboard/reports/expenses",
      stats: [
        { label: "เดือนนี้", value: `฿${(expenseData.summary.currentMonth / 1000).toFixed(0)}K` },
        { label: "เดือนก่อน", value: `฿${(expenseData.summary.previousMonth / 1000).toFixed(0)}K` },
        { label: "เปลี่ยนแปลง", value: `${expenseData.summary.changePercent > 0 ? "+" : ""}${expenseData.summary.changePercent}%` },
        { label: "ปีนี้", value: `฿${(expenseData.summary.yearToDate / 1000).toFixed(0)}K` },
      ],
    },
    {
      title: "รายงานเครื่องจักร",
      description: "สถานะและประสิทธิภาพเครื่องจักร",
      iconName: "Package" as const,
      href: "/dashboard/reports/equipment",
      stats: [
        { label: "ใช้งาน", value: equipmentData.summary.active },
        { label: "ซ่อมบำรุง", value: equipmentData.summary.maintenance },
        { label: "MTBF", value: `${equipmentData.reliability.mtbf}ชม.` },
        { label: "MTTR", value: `${equipmentData.reliability.mttr}ชม.` },
      ],
    },
    {
      title: "รายงานผลงานช่าง",
      description: "ประสิทธิภาพการทำงานของช่าง",
      iconName: "Users" as const,
      href: "/dashboard/reports/technicians",
      stats: [
        { label: "จำนวนช่าง", value: technicianData.summary.totalTechnicians },
        { label: "งานทั้งหมด", value: technicianData.summary.totalWorkOrders },
        { label: "งาน/คน", value: technicianData.summary.avgWorkOrdersPerTech },
        { label: "เวลาเฉลี่ย", value: `${technicianData.summary.avgResolutionTime}ชม.` },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">รายงาน</h1>
        <p className="text-muted-foreground">
          สรุปข้อมูลและวิเคราะห์ระบบซ่อมบำรุง
        </p>
      </div>

      {/* Quick Overview Stats */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          ภาพรวม
        </h2>
        <StatsGrid stats={overviewStats} columns={4} />
      </div>

      {/* Report Categories */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          เลือกประเภทรายงาน
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {reportCategories.map((category) => (
            <ReportCard
              key={category.href}
              title={category.title}
              description={category.description}
              iconName={category.iconName}
              href={category.href}
              stats={category.stats}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      }
    >
      <ReportsContent />
    </Suspense>
  );
}