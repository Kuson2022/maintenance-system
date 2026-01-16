"use client";

/**
 * Work Orders Report Client Component
 * Client wrapper with DateRangePicker for filtering report data
 */

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { StatsGrid } from "@/components/reports/stats-grid";
import { ExportButtons } from "@/components/reports/export-buttons";
import {
    ReportBarChart,
    ReportLineChart,
    ReportPieChart,
} from "@/components/reports/report-chart";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Wrench, Loader2 } from "lucide-react";
import { DateRangePicker, DateRange } from "@/components/reports/date-range-picker";
import { getWorkOrderReportAction } from "@/lib/api/reports/actions";
import { WorkOrderReportData } from "@/lib/api/reports/types";
import { subDays } from "date-fns";

interface WorkOrdersReportClientProps {
    initialData: WorkOrderReportData;
}

export function WorkOrdersReportClient({ initialData }: WorkOrdersReportClientProps) {
    const [data, setData] = useState<WorkOrderReportData>(initialData);
    const [isPending, startTransition] = useTransition();

    // Default to last 30 days
    const [dateRange, setDateRange] = useState<DateRange>({
        from: subDays(new Date(), 30),
        to: new Date(),
    });

    const handleDateRangeChange = (range: DateRange) => {
        setDateRange(range);

        if (range.from && range.to) {
            startTransition(async () => {
                const result = await getWorkOrderReportAction(
                    range.from?.toISOString(),
                    range.to?.toISOString()
                );
                if (result) {
                    setData(result);
                }
            });
        }
    };

    // Stats for StatsGrid
    const stats = [
        {
            label: "ใบแจ้งซ่อมทั้งหมด",
            value: data.summary.total.toLocaleString(),
            iconName: "Wrench" as const,
            color: "text-blue-600",
            bgColor: "bg-blue-100",
        },
        {
            label: "รอดำเนินการ",
            value: data.summary.pending.toLocaleString(),
            iconName: "Clock" as const,
            color: "text-yellow-600",
            bgColor: "bg-yellow-100",
        },
        {
            label: "เสร็จสิ้น",
            value: data.summary.completed.toLocaleString(),
            iconName: "CheckCircle" as const,
            color: "text-green-600",
            bgColor: "bg-green-100",
        },
        {
            label: "เกินกำหนด",
            value: data.summary.overdue.toLocaleString(),
            iconName: "AlertTriangle" as const,
            color: "text-red-600",
            bgColor: "bg-red-100",
        },
        {
            label: "เวลาซ่อมเฉลี่ย",
            value: `${data.summary.avgResolutionTime} ชม.`,
            iconName: "TrendingUp" as const,
            color: "text-purple-600",
            bgColor: "bg-purple-100",
        },
    ];

    // Monthly trend data for line chart
    const trendData = data.monthlyTrend.map((item) => ({
        month: item.month,
        value: item.value,
    }));

    // CSV data for export
    const csvData = [
        { สถานะ: "รอดำเนินการ", จำนวน: data.summary.pending },
        { สถานะ: "กำลังดำเนินการ", จำนวน: data.summary.inProgress },
        { สถานะ: "เสร็จสิ้น", จำนวน: data.summary.completed },
        { สถานะ: "ยกเลิก", จำนวน: data.summary.cancelled },
        { สถานะ: "เกินกำหนด", จำนวน: data.summary.overdue },
    ];

    return (
        <div className="space-y-6 print:space-y-4">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/reports">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">รายงานใบแจ้งซ่อม</h1>
                        <p className="text-muted-foreground">
                            สรุปสถานะและแนวโน้มใบแจ้งซ่อม
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <DateRangePicker
                        value={dateRange}
                        onChange={handleDateRangeChange}
                    />
                    {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    <ExportButtons data={csvData} filename="work-orders-report" />
                </div>
            </div>

            {/* Print Header */}
            <div className="hidden print:block">
                <h1 className="text-2xl font-bold text-center">รายงานใบแจ้งซ่อม</h1>
                <p className="text-center text-sm text-muted-foreground">
                    วันที่พิมพ์: {new Date().toLocaleDateString("th-TH")}
                </p>
            </div>

            {/* Stats Grid */}
            <StatsGrid stats={stats} columns={5} />

            {/* Charts Row 1 */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Status Distribution */}
                <ReportPieChart
                    data={data.byStatus}
                    title="สัดส่วนตามสถานะ"
                    description="การกระจายของใบแจ้งซ่อมตามสถานะ"
                    donut
                />

                {/* Priority Distribution */}
                <ReportBarChart
                    data={data.byPriority}
                    title="จำนวนตามระดับความสำคัญ"
                    description="การกระจายตามความเร่งด่วน"
                />
            </div>

            {/* Monthly Trend */}
            <ReportLineChart
                data={trendData}
                title="แนวโน้มใบแจ้งซ่อมรายเดือน"
                description="จำนวนใบแจ้งซ่อม 12 เดือนล่าสุด"
                height={350}
            />

            {/* Top Equipment */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Wrench className="h-5 w-5" />
                        เครื่องจักรที่แจ้งซ่อมบ่อยที่สุด
                    </CardTitle>
                    <CardDescription>Top 5 เครื่องจักรที่มีใบแจ้งซ่อมมากที่สุด</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Mobile-responsive table wrapper */}
                    <div className="overflow-x-auto -mx-6 px-6">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="whitespace-nowrap">อันดับ</TableHead>
                                    <TableHead className="whitespace-nowrap">รหัสเครื่อง</TableHead>
                                    <TableHead className="whitespace-nowrap">ชื่อเครื่องจักร</TableHead>
                                    <TableHead className="text-right whitespace-nowrap">จำนวนใบแจ้งซ่อม</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.topEquipment.length > 0 ? (
                                    data.topEquipment.map((eq, idx) => (
                                        <TableRow key={eq.equipmentCode}>
                                            <TableCell className="font-medium">{idx + 1}</TableCell>
                                            <TableCell>
                                                <code className="text-xs bg-muted px-2 py-1 rounded whitespace-nowrap">
                                                    {eq.equipmentCode}
                                                </code>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">{eq.equipmentName}</TableCell>
                                            <TableCell className="text-right font-bold">
                                                {eq.count}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                                            ไม่มีข้อมูล
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
