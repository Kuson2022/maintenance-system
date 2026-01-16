import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StatsGrid } from "@/components/reports/stats-grid";
import { ExportButtons } from "@/components/reports/export-buttons";
import {
    ReportBarChart,
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
import { Progress } from "@/components/ui/progress";
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
    Package,
    Wrench,
    Activity,
    Clock,
    Gauge,
    DollarSign,
} from "lucide-react";
import { getEquipmentReportData } from "@/lib/api/reports/queries";
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

async function EquipmentReportContent() {
    await checkAccess();
    const data = await getEquipmentReportData();

    // Stats for StatsGrid
    const stats = [
        {
            label: "เครื่องจักรทั้งหมด",
            value: data.summary.total.toLocaleString(),
            iconName: "Package" as const,
            color: "text-blue-600",
            bgColor: "bg-blue-100",
        },
        {
            label: "ใช้งานอยู่",
            value: data.summary.active.toLocaleString(),
            iconName: "CheckCircle" as const,
            color: "text-green-600",
            bgColor: "bg-green-100",
        },
        {
            label: "กำลังซ่อมบำรุง",
            value: data.summary.maintenance.toLocaleString(),
            iconName: "Wrench" as const,
            color: "text-orange-600",
            bgColor: "bg-orange-100",
        },
        {
            label: "ไม่ใช้งาน/ปลดระวาง",
            value: (data.summary.inactive + data.summary.retired).toLocaleString(),
            iconName: "XCircle" as const,
            color: "text-gray-600",
            bgColor: "bg-gray-100",
        },
    ];

    // CSV data for export
    const csvData = data.byStatus.map((item) => ({
        สถานะ: item.label,
        จำนวน: item.value,
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
                        <h1 className="text-3xl font-bold">รายงานเครื่องจักร</h1>
                        <p className="text-muted-foreground">
                            สถานะและประสิทธิภาพเครื่องจักร
                        </p>
                    </div>
                </div>
                <ExportButtons data={csvData} filename="equipment-report" />
            </div>

            {/* Print Header */}
            <div className="hidden print:block">
                <h1 className="text-2xl font-bold text-center">รายงานเครื่องจักร</h1>
                <p className="text-center text-sm text-muted-foreground">
                    วันที่พิมพ์: {new Date().toLocaleDateString("th-TH")}
                </p>
            </div>

            {/* Stats Grid */}
            <StatsGrid stats={stats} columns={4} />

            {/* Reliability Metrics */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        ตัวชี้วัดความน่าเชื่อถือ (Reliability Metrics)
                    </CardTitle>
                    <CardDescription>
                        MTBF, MTTR และ Availability ของเครื่องจักรทั้งหมด
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6 md:grid-cols-3">
                        {/* MTBF */}
                        <div className="space-y-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                            <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-blue-600" />
                                <span className="font-medium">MTBF</span>
                            </div>
                            <p className="text-3xl font-bold text-blue-600">
                                {data.reliability.mtbf.toLocaleString()} ชม.
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Mean Time Between Failures
                                <br />
                                เวลาเฉลี่ยระหว่างความเสียหาย
                            </p>
                        </div>

                        {/* MTTR */}
                        <div className="space-y-3 p-4 rounded-lg bg-orange-50 dark:bg-orange-950/30">
                            <div className="flex items-center gap-2">
                                <Wrench className="h-5 w-5 text-orange-600" />
                                <span className="font-medium">MTTR</span>
                            </div>
                            <p className="text-3xl font-bold text-orange-600">
                                {data.reliability.mttr} ชม.
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Mean Time To Repair
                                <br />
                                เวลาเฉลี่ยในการซ่อม
                            </p>
                        </div>

                        {/* Availability */}
                        <div className="space-y-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/30">
                            <div className="flex items-center gap-2">
                                <Gauge className="h-5 w-5 text-green-600" />
                                <span className="font-medium">Availability</span>
                            </div>
                            <p className="text-3xl font-bold text-green-600">
                                {data.reliability.availability}%
                            </p>
                            <Progress value={data.reliability.availability} className="h-2" />
                            <p className="text-sm text-muted-foreground">
                                ความพร้อมใช้งานของเครื่องจักร
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Charts Row */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Status Distribution */}
                <ReportPieChart
                    data={data.byStatus}
                    title="สัดส่วนตามสถานะเครื่องจักร"
                    description="การกระจายของสถานะเครื่องจักร"
                    donut
                />

                {/* Category Distribution */}
                <ReportBarChart
                    data={data.byCategory}
                    title="จำนวนตามหมวดหมู่"
                    description="การกระจายเครื่องจักรตามประเภท"
                />
            </div>

            {/* Top Breakdowns */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Wrench className="h-5 w-5 text-red-500" />
                        เครื่องจักรที่เสียบ่อยที่สุด
                    </CardTitle>
                    <CardDescription>Top 5 เครื่องจักรที่มีการแจ้งซ่อมมากที่สุด</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Mobile-responsive table wrapper */}
                    <div className="overflow-x-auto -mx-6 px-6">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>อันดับ</TableHead>
                                    <TableHead>รหัสเครื่อง</TableHead>
                                    <TableHead>ชื่อเครื่องจักร</TableHead>
                                    <TableHead className="text-right">จำนวนครั้ง</TableHead>
                                    <TableHead className="text-right">Downtime (ชม.)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.topBreakdowns.length > 0 ? (
                                    data.topBreakdowns.map((eq, idx) => (
                                        <TableRow key={eq.equipmentCode}>
                                            <TableCell className="font-medium">{idx + 1}</TableCell>
                                            <TableCell>
                                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                                    {eq.equipmentCode}
                                                </code>
                                            </TableCell>
                                            <TableCell>{eq.equipmentName}</TableCell>
                                            <TableCell className="text-right font-bold text-red-600">
                                                {eq.breakdownCount}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {eq.totalDowntime}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                                            ไม่มีข้อมูล
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Maintenance Cost */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        ค่าใช้จ่ายซ่อมบำรุงสูงสุด
                    </CardTitle>
                    <CardDescription>Top 5 เครื่องจักรที่มีค่าใช้จ่ายซ่อมบำรุงมากที่สุด</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Mobile-responsive table wrapper */}
                    <div className="overflow-x-auto -mx-6 px-6">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>อันดับ</TableHead>
                                    <TableHead>รหัสเครื่อง</TableHead>
                                    <TableHead>ชื่อเครื่องจักร</TableHead>
                                    <TableHead className="text-right">ค่าใช้จ่ายรวม</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.maintenanceCost.length > 0 ? (
                                    data.maintenanceCost.map((eq, idx) => (
                                        <TableRow key={eq.equipmentCode}>
                                            <TableCell className="font-medium">{idx + 1}</TableCell>
                                            <TableCell>
                                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                                    {eq.equipmentCode}
                                                </code>
                                            </TableCell>
                                            <TableCell>{eq.equipmentName}</TableCell>
                                            <TableCell className="text-right font-bold text-green-600">
                                                {formatCurrency(eq.totalCost)}
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

export default function EquipmentReportPage() {
    return (
        <Suspense
            fallback={
                <div className="space-y-6">
                    <div className="h-8 w-64 bg-muted animate-pulse rounded" />
                    <div className="grid gap-4 md:grid-cols-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-28 bg-muted animate-pulse rounded-lg" />
                        ))}
                    </div>
                    <div className="h-48 bg-muted animate-pulse rounded-lg" />
                    <div className="grid gap-6 md:grid-cols-2">
                        {[1, 2].map((i) => (
                            <div key={i} className="h-80 bg-muted animate-pulse rounded-lg" />
                        ))}
                    </div>
                </div>
            }
        >
            <EquipmentReportContent />
        </Suspense>
    );
}
