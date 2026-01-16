import { getScheduleById } from "@/lib/api/schedules/queries";
import { ScheduleForm } from "@/components/schedules/schedule-form";
import { notFound } from "next/navigation";
import { getAvailableTechnicians } from "@/lib/api/work-orders/queries";
import { createClient } from "@/lib/supabase/server";
import { checkSchedulePermissions } from "@/lib/api/schedules/permissions";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function EditSchedulePage({ params }: { params: { id: string } }) {
    const { id } = await params;

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

    const [schedule, permissions] = await Promise.all([
        getScheduleById(id),
        checkSchedulePermissions(user.id, id),
    ]);

    if (!schedule) {
        notFound();
    }

    if (!permissions.canEdit) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground">ไม่มีสิทธิ์แก้ไขตารางบำรุงรักษานี้</p>
            </div>
        );
    }

    const technicianList = await getAvailableTechnicians();

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            {/* Back Button */}
            <Link href={`/dashboard/schedules/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                กลับไปรายละเอียด
            </Link>

            <div className="flex items-center justify-between">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                    แก้ไขตารางบำรุงรักษา
                </h2>
            </div>

            <div className="mx-auto max-w-2xl">
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <ScheduleForm
                        initialData={schedule}
                        technicianList={technicianList}
                    />
                </div>
            </div>
        </div>
    );
}

