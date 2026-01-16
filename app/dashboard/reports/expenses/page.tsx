import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StatsGrid } from "@/components/reports/stats-grid";
import { ExportButtons } from "@/components/reports/export-buttons";
import {
    ReportBarChart,
    ReportPieChart,
    ReportComparisonChart,
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
import {
    ArrowLeft,
    DollarSign,
    Package,
} from "lucide-react";
import { getExpenseReportData } from "@/lib/api/reports/queries";
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

// Format Thai Baht
function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("th-TH", {
        style: "currency",
        currency: "THB",
        minimumFractionDigits: 0,
    }).format(amount);
}

async function ExpensesReportContent() {
    await checkAccess();
    const data = await getExpenseReportData();

    // Stats for StatsGrid
    const stats = [
        {
            label: "ค่าใช้จ่ายปีนี้",
            value: formatCurrency(data.summary.yearToDate),
            iconName: "DollarSign" as const,
            color: "text-green-600",
            bgColor: "bg-green-100",
        },
        {
            label: "เดือนนี้",
            value: formatCurrency(data.summary.currentMonth),
            iconName: "DollarSign" as const,
            color: "text-blue-600",
            bgColor: "bg-blue-100",
        },
        {
            label: "เดือนที่แล้ว",
            value: formatCurrency(data.summary.previousMonth),
            iconName: "DollarSign" as const,
            color: "text-gray-600",
            bgColor: "bg-gray-100",
        },
        {
            label: "เปลี่ยนแปลง",
            value: `${data.summary.changePercent > 0 ? "+" : ""}${data.summary.changePercent}%`,
            iconName: data.summary.changePercent >= 0 ? "TrendingUp" as const : "TrendingDown" as const,
            color: data.summary.changePercent >= 0 ? "text-red-600" : "text-green-600",
            bgColor: data.summary.changePercent >= 0 ? "bg-red-100" : "bg-green-100",
        },
        {
            label: "เฉลี่ยต่อเดือน",
            value: formatCurrency(data.summary.avgPerMonth),
            iconName: "BarChart3" as const,
            color: "text-purple-600",
            bgColor: "bg-purple-100",
        },
    ];

    // Expense by type for pie chart
    const byTypeData = data.byType.map((item) => ({
        label: item.typeName,
        value: item.amount,
    }));

    // CSV data for export
    const csvData = data.byType.map((item) => ({
        ประเภท: item.typeName,
        จำนวน: item.count,
        ยอดเงิน: item.amount,
        สัดส่วน: `${item.percentage.toFixed(1)}%`,
    }));

    return (
        <div className="space-y-6 print:space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between print:hidden">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/reports">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">รายงานค่าใช้จ่าย</h1>
                        <p className="text-muted-foreground">
                            วิเคราะห์ค่าใช้จ่ายรายเดือนและรายปี
                        </p>
                    </div>
                </div>
                <ExportButtons data={csvData} filename="expenses-report" />
            </div>

            {/* Print Header */}
            <div className="hidden print:block">
                <h1 className="text-2xl font-bold text-center">รายงานค่าใช้จ่าย</h1>
                <p className="text-center text-sm text-muted-foreground">
                    วันที่พิมพ์: {new Date().toLocaleDateString("th-TH")}
                </p>
            </div>

            {/* Stats Grid */}
            <StatsGrid stats={stats} columns={5} />

            {/* Charts Row 1 */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Expense by Type */}
                <ReportPieChart
                    data={byTypeData}
                    title="สัดส่วนตามประเภทค่าใช้จ่าย"
                    description="การกระจายค่าใช้จ่ายตามประเภท"
                    donut
                />

                {/* Type Breakdown Bar */}
                <ReportBarChart
                    data={byTypeData}
                    title="ค่าใช้จ่ายแยกตามประเภท"
                    description="ยอดค่าใช้จ่ายในแต่ละประเภท"
                    horizontal
                />
            </div>

            {/* Year-over-Year Comparison */}
            <ReportComparisonChart
                data={data.monthlyComparison}
                title="เปรียบเทียบค่าใช้จ่ายรายเดือน"
                description="เทียบปีนี้กับปีที่แล้ว"
                height={350}
                labels={{ current: `ปี ${new Date().getFullYear()}`, previous: `ปี ${new Date().getFullYear() - 1}` }}
            />

            {/* Type Details Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        รายละเอียดตามประเภทค่าใช้จ่าย
                    </CardTitle>
                    <CardDescription>สรุปค่าใช้จ่ายแยกตามประเภท</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Mobile-responsive table wrapper */}
                    <div className="overflow-x-auto -mx-6 px-6">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ประเภท</TableHead>
                                    <TableHead className="text-right">จำนวนรายการ</TableHead>
                                    <TableHead className="text-right">ยอดเงิน</TableHead>
                                    <TableHead className="text-right">สัดส่วน</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.byType.length > 0 ? (
                                    data.byType.map((item) => (
                                        <TableRow key={item.typeName}>
                                            <TableCell className="font-medium">{item.typeName}</TableCell>
                                            <TableCell className="text-right">{item.count}</TableCell>
                                            <TableCell className="text-right font-bold">
                                                {formatCurrency(item.amount)}
                                            </TableCell>
                                            <TableCell className="text-right">{item.percentage.toFixed(1)}%</TableCell>
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

            {/* Top Equipment by Expense */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        เครื่องจักรที่มีค่าใช้จ่ายสูงสุด
                    </CardTitle>
                    <CardDescription>Top 5 เครื่องจักรที่มีค่าใช้จ่ายมากที่สุด</CardDescription>
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
                                    <TableHead className="text-right whitespace-nowrap">ค่าใช้จ่ายรวม</TableHead>
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
                                            <TableCell className="text-right font-bold whitespace-nowrap">
                                                {formatCurrency(eq.totalAmount)}
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

export default function ExpensesReportPage() {
    return (
        <Suspense
            fallback={
                <div className="space-y-6">
                    <div className="h-8 w-64 bg-muted animate-pulse rounded" />
                    <div className="grid gap-4 md:grid-cols-5">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-28 bg-muted animate-pulse rounded-lg" />
                        ))}
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                        {[1, 2].map((i) => (
                            <div key={i} className="h-80 bg-muted animate-pulse rounded-lg" />
                        ))}
                    </div>
                </div>
            }
        >
            <ExpensesReportContent />
        </Suspense>
    );
}
