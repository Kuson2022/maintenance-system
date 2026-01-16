import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { getUserById } from "@/lib/api/users/queries";
import { checkUserPermissions } from "@/lib/api/users/permissions";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ResetPasswordDialog } from "@/components/users/reset-password-dialog";
import {
    ArrowLeft,
    Pencil,
    Mail,
    Phone,
    Calendar,
    Clock,
    Shield,
    Activity,
} from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { UserRole, UserStatus } from "@prisma/client";

interface PageProps {
    params: Promise<{ id: string }>;
}

const roleLabels: Record<UserRole, string> = {
    USER: "ผู้ใช้ทั่วไป",
    TECHNICIAN: "ช่างเทคนิค",
    ADMIN: "ผู้ดูแลระบบ",
};

const roleColors: Record<UserRole, string> = {
    USER: "bg-gray-100 text-gray-800",
    TECHNICIAN: "bg-blue-100 text-blue-800",
    ADMIN: "bg-purple-100 text-purple-800",
};

const statusLabels: Record<UserStatus, string> = {
    ACTIVE: "ใช้งาน",
    INACTIVE: "ไม่ใช้งาน",
    SUSPENDED: "ระงับการใช้งาน",
};

const statusColors: Record<UserStatus, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    INACTIVE: "bg-gray-100 text-gray-800",
    SUSPENDED: "bg-red-100 text-red-800",
};

async function UserDetailContent({ params }: PageProps) {
    const { id } = await params;

    // Check authentication
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
        redirect("/login");
    }

    // Get permissions
    const permissions = await checkUserPermissions(authUser.id, id);

    // Check if can view this user
    const canViewUser = permissions.canView || (permissions.canViewOwn && authUser.id === id);
    if (!canViewUser) {
        redirect("/dashboard");
    }

    const user = await getUserById(id);

    if (!user) {
        notFound();
    }

    // Get activity logs for this user
    const activityLogs = await prisma.activityLog.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 10,
    });

    // Get work orders stats
    const workOrderStats = await prisma.workOrder.groupBy({
        by: ["status"],
        where: { assignedTo: id },
        _count: true,
    });

    const totalAssigned = workOrderStats.reduce((sum, s) => sum + s._count, 0);
    const completed = workOrderStats.find((s) => s.status === "COMPLETED")?._count || 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/users">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">รายละเอียดผู้ใช้</h1>
                        <p className="text-muted-foreground">ดูและแก้ไขข้อมูลผู้ใช้</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {permissions.canResetPassword && (
                        <ResetPasswordDialog userId={id} userName={user.name} />
                    )}
                    {(permissions.canEdit || permissions.canEditOwn) && (
                        <Link href={`/dashboard/users/${id}/edit`}>
                            <Button>
                                <Pencil className="mr-2 h-4 w-4" />
                                แก้ไข
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Profile Card */}
                <Card className="md:col-span-1">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center">
                            <Avatar className="h-24 w-24 mb-4">
                                <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
                                <AvatarFallback className="text-2xl">
                                    {user.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <h2 className="text-xl font-bold">{user.name}</h2>
                            <div className="flex gap-2 mt-2">
                                <Badge variant="secondary" className={roleColors[user.role]}>
                                    {roleLabels[user.role]}
                                </Badge>
                                <Badge variant="secondary" className={statusColors[user.status]}>
                                    {statusLabels[user.status]}
                                </Badge>
                            </div>
                        </div>

                        <Separator className="my-6" />

                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{user.email}</span>
                            </div>
                            {user.phone && (
                                <div className="flex items-center gap-3">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{user.phone}</span>
                                </div>
                            )}
                            {user.position && (
                                <div className="flex items-center gap-3">
                                    <Shield className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">ตำแหน่ง: {user.position}</span>
                                </div>
                            )}
                            {user.department && (
                                <div className="flex items-center gap-3">
                                    <Activity className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">แผนก: {user.department}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                    สร้างเมื่อ {format(new Date(user.createdAt), "d MMM yyyy", { locale: th })}
                                </span>
                            </div>
                            {user.lastLoginAt && (
                                <div className="flex items-center gap-3">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">
                                        เข้าสู่ระบบล่าสุด{" "}
                                        {format(new Date(user.lastLoginAt), "d MMM yyyy HH:mm", { locale: th })}
                                    </span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Stats & Activity */}
                <div className="md:col-span-2 space-y-6">
                    {/* Work Stats (for technicians) */}
                    {(user.role === "TECHNICIAN" || user.role === "ADMIN") && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    สถิติการทำงาน
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 grid-cols-3">
                                    <div className="text-center p-4 rounded-lg bg-muted/50">
                                        <p className="text-2xl font-bold">{totalAssigned}</p>
                                        <p className="text-sm text-muted-foreground">งานที่รับ</p>
                                    </div>
                                    <div className="text-center p-4 rounded-lg bg-green-100 dark:bg-green-900/30">
                                        <p className="text-2xl font-bold text-green-600">{completed}</p>
                                        <p className="text-sm text-muted-foreground">เสร็จสิ้น</p>
                                    </div>
                                    <div className="text-center p-4 rounded-lg bg-muted/50">
                                        <p className="text-2xl font-bold">
                                            {totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0}%
                                        </p>
                                        <p className="text-sm text-muted-foreground">อัตราเสร็จ</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Activity Log */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Activity className="h-5 w-5" />
                                กิจกรรมล่าสุด
                            </CardTitle>
                            <CardDescription>ประวัติการใช้งานระบบ</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {activityLogs.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    ไม่มีกิจกรรม
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {activityLogs.map((log) => (
                                        <div
                                            key={log.id}
                                            className="flex items-start gap-3 pb-3 border-b last:border-0"
                                        >
                                            <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                                            <div className="flex-1">
                                                <p className="text-sm">
                                                    {log.action} - {log.entityType}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {format(new Date(log.createdAt), "d MMM yyyy HH:mm", {
                                                        locale: th,
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default function UserDetailPage({ params }: PageProps) {
    return (
        <Suspense
            fallback={
                <div className="space-y-6">
                    <div className="h-8 w-64 bg-muted animate-pulse rounded" />
                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="h-96 bg-muted animate-pulse rounded-lg" />
                        <div className="md:col-span-2 space-y-6">
                            <div className="h-40 bg-muted animate-pulse rounded-lg" />
                            <div className="h-64 bg-muted animate-pulse rounded-lg" />
                        </div>
                    </div>
                </div>
            }
        >
            <UserDetailContent params={params} />
        </Suspense>
    );
}
