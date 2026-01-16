import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StatsGrid } from "@/components/reports/stats-grid";
import { ExportButtons } from "@/components/reports/export-buttons";
import { ReportBarChart } from "@/components/reports/report-chart";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
    Users,
    Wrench,
    BarChart3,
    Trophy,
    Medal,
    Award,
} from "lucide-react";
import { getTechnicianReportData } from "@/lib/api/reports/queries";
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

async function TechniciansReportContent() {
    await checkAccess();
    const data = await getTechnicianReportData();

    // Stats for StatsGrid
    const stats = [
        {
            label: "จำนวนช่าง",
            value: data.summary.totalTechnicians.toLocaleString(),
            iconName: "Users" as const,
            color: "text-blue-600",
            bgColor: "bg-blue-100",
        },
        {
            label: "งานทั้งหมด",
            value: data.summary.totalWorkOrders.toLocaleString(),
            iconName: "Wrench" as const,
            color: "text-purple-600",
            bgColor: "bg-purple-100",
        },
        {
            label: "งานเฉลี่ย/คน",
            value: data.summary.avgWorkOrdersPerTech.toString(),
            iconName: "BarChart3" as const,
            color: "text-green-600",
            bgColor: "bg-green-100",
        },
        {
            label: "เวลาซ่อมเฉลี่ย",
            value: `${data.summary.avgResolutionTime} ชม.`,
            iconName: "Clock" as const,
            color: "text-orange-600",
            bgColor: "bg-orange-100",
        },
    ];

    // Get top 3 for medals
    const getMedalIcon = (idx: number) => {
        if (idx === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
        if (idx === 1) return <Medal className="h-5 w-5 text-gray-400" />;
        if (idx === 2) return <Award className="h-5 w-5 text-amber-700" />;
        return null;
    };

    // CSV data for export
    const csvData = data.technicians.map((tech) => ({
        ชื่อ: tech.name,
        อีเมล: tech.email,
        งานที่รับ: tech.stats.assigned,
        เสร็จสิ้น: tech.stats.completed,
        กำลังดำเนินการ: tech.stats.inProgress,
        อัตราเสร็จสิ้น: `${tech.stats.completionRate.toFixed(1)}%`,
        เวลาเฉลี่ย: `${tech.stats.avgResolutionTime} ชม.`,
        ชั่วโมงทำงาน: tech.stats.totalWorkHours,
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
                        <h1 className="text-3xl font-bold">รายงานผลงานช่าง</h1>
                        <p className="text-muted-foreground">
                            ประสิทธิภาพการทำงานของช่างเทคนิค
                        </p>
                    </div>
                </div>
                <ExportButtons data={csvData} filename="technicians-report" />
            </div>

            {/* Print Header */}
            <div className="hidden print:block">
                <h1 className="text-2xl font-bold text-center">รายงานผลงานช่าง</h1>
                <p className="text-center text-sm text-muted-foreground">
                    วันที่พิมพ์: {new Date().toLocaleDateString("th-TH")}
                </p>
            </div>

            {/* Stats Grid */}
            <StatsGrid stats={stats} columns={4} />

            {/* Workload Distribution Chart */}
            <ReportBarChart
                data={data.workloadDistribution}
                title="การกระจายภาระงาน"
                description="จำนวนงานที่รับผิดชอบของแต่ละช่าง"
                horizontal
                height={Math.max(200, data.workloadDistribution.length * 40)}
            />

            {/* Technician Performance Cards */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        อันดับผลงานช่าง
                    </CardTitle>
                    <CardDescription>เรียงตามจำนวนงานที่เสร็จสิ้น</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {data.technicians.slice(0, 6).map((tech, idx) => (
                            <Card key={tech.id} className="relative">
                                {idx < 3 && (
                                    <div className="absolute top-3 right-3">
                                        {getMedalIcon(idx)}
                                    </div>
                                )}
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={tech.avatarUrl || undefined} alt={tech.name} />
                                            <AvatarFallback>
                                                {tech.name
                                                    .split(" ")
                                                    .map((n) => n[0])
                                                    .join("")
                                                    .toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold truncate">{tech.name}</p>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {tech.email}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-3">
                                        {/* Completion Rate */}
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-muted-foreground">อัตราเสร็จสิ้น</span>
                                                <span className="font-medium">
                                                    {tech.stats.completionRate.toFixed(0)}%
                                                </span>
                                            </div>
                                            <Progress
                                                value={tech.stats.completionRate}
                                                className="h-2"
                                            />
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            <div className="p-2 rounded bg-muted/50">
                                                <p className="text-lg font-bold">{tech.stats.completed}</p>
                                                <p className="text-xs text-muted-foreground">เสร็จ</p>
                                            </div>
                                            <div className="p-2 rounded bg-muted/50">
                                                <p className="text-lg font-bold">{tech.stats.inProgress}</p>
                                                <p className="text-xs text-muted-foreground">กำลังทำ</p>
                                            </div>
                                            <div className="p-2 rounded bg-muted/50">
                                                <p className="text-lg font-bold">
                                                    {tech.stats.avgResolutionTime}
                                                </p>
                                                <p className="text-xs text-muted-foreground">ชม./งาน</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Full Technician Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        ตารางสรุปผลงานช่างทั้งหมด
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Mobile-responsive table wrapper */}
                    <div className="overflow-x-auto -mx-6 px-6">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>อันดับ</TableHead>
                                    <TableHead>ชื่อ</TableHead>
                                    <TableHead className="text-right">งานที่รับ</TableHead>
                                    <TableHead className="text-right">เสร็จสิ้น</TableHead>
                                    <TableHead className="text-right">กำลังทำ</TableHead>
                                    <TableHead className="text-right">อัตราเสร็จ</TableHead>
                                    <TableHead className="text-right">เวลาเฉลี่ย</TableHead>
                                    <TableHead className="text-right">ชม.ทำงาน</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.technicians.length > 0 ? (
                                    data.technicians.map((tech, idx) => (
                                        <TableRow key={tech.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    {idx + 1}
                                                    {getMedalIcon(idx)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage
                                                            src={tech.avatarUrl || undefined}
                                                            alt={tech.name}
                                                        />
                                                        <AvatarFallback className="text-xs">
                                                            {tech.name
                                                                .split(" ")
                                                                .map((n) => n[0])
                                                                .join("")
                                                                .toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span>{tech.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">{tech.stats.assigned}</TableCell>
                                            <TableCell className="text-right font-bold text-green-600">
                                                {tech.stats.completed}
                                            </TableCell>
                                            <TableCell className="text-right">{tech.stats.inProgress}</TableCell>
                                            <TableCell className="text-right">
                                                <Badge
                                                    variant={
                                                        tech.stats.completionRate >= 80
                                                            ? "default"
                                                            : tech.stats.completionRate >= 50
                                                                ? "secondary"
                                                                : "destructive"
                                                    }
                                                >
                                                    {tech.stats.completionRate.toFixed(0)}%
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {tech.stats.avgResolutionTime} ชม.
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {tech.stats.totalWorkHours} ชม.
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center text-muted-foreground">
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

export default function TechniciansReportPage() {
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
                    <div className="h-64 bg-muted animate-pulse rounded-lg" />
                    <div className="grid gap-4 md:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
                        ))}
                    </div>
                </div>
            }
        >
            <TechniciansReportContent />
        </Suspense>
    );
}
