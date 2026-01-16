import { ScheduleForm } from "@/components/schedules/schedule-form";
import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { checkSchedulePermissions } from "@/lib/api/schedules/permissions";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewSchedulePage() {
    // Get current user and permissions
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground">กรุณาเข้าสู่ระบบ</p>
            </div>
        );
    }

    const permissions = await checkSchedulePermissions(user.id);

    if (!permissions.canCreate) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground">ไม่มีสิทธิ์สร้างตารางบำรุงรักษา</p>
            </div>
        );
    }

    const technicians = await prisma.user.findMany({
        where: {
            role: { in: ["TECHNICIAN", "ADMIN"] },
            status: "ACTIVE"
        },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
    });

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            {/* Back Button */}
            <Link href="/dashboard/schedules" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                กลับไปรายการ
            </Link>

            <div className="flex items-center justify-between">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                    สร้างตารางบำรุงรักษา
                </h2>
            </div>

            <div className="mx-auto max-w-2xl">
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <ScheduleForm technicianList={technicians} />
                </div>
            </div>
        </div>
    );
}
