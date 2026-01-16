import { getScheduleById } from "@/lib/api/schedules/queries";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, Clock, User, Wrench, ArrowLeft } from "lucide-react";
import { format, isPast, differenceInDays } from "date-fns";
import { th } from "date-fns/locale";
import { CompleteScheduleButton } from "./complete-button";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { checkSchedulePermissions } from "@/lib/api/schedules/permissions";
import { DeleteScheduleDialog } from "@/components/schedules/delete-schedule-dialog";

export default async function ScheduleDetailsPage({ params }: { params: { id: string } }) {
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

    if (!permissions.canView) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground">ไม่มีสิทธิ์เข้าถึงหน้านี้</p>
            </div>
        );
    }

    const checklist = (schedule.checklist as any[]) || [];
    const nextDueDate = schedule.nextDueDate ? new Date(schedule.nextDueDate) : null;
    const isOverdue = nextDueDate && isPast(nextDueDate) && schedule.status === "ACTIVE";
    const daysUntilDue = nextDueDate ? differenceInDays(nextDueDate, new Date()) : null;

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
            {/* Back Button */}
            <Link href="/dashboard/schedules" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                กลับไปรายการ
            </Link>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{schedule.activityName}</h2>
                    <p className="text-muted-foreground flex items-center mt-2">
                        <Wrench className="mr-2 h-4 w-4" />
                        {schedule.equipment.name} ({schedule.equipment.code})
                    </p>
                    {isOverdue && (
                        <div className="mt-2">
                            <Badge variant="destructive">
                                เลยกำหนด {Math.abs(daysUntilDue!)} วัน
                            </Badge>
                        </div>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {permissions.canEdit && (
                        <Link href={`/dashboard/schedules/${id}/edit`}>
                            <Button variant="outline">แก้ไข</Button>
                        </Link>
                    )}
                    {permissions.canDelete && (
                        <DeleteScheduleDialog
                            scheduleId={id}
                            scheduleName={schedule.activityName}
                        />
                    )}
                    {permissions.canComplete && schedule.status === "ACTIVE" && (
                        <CompleteScheduleButton scheduleId={id} checklist={checklist} />
                    )}
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <div className="flex flex-row items-center justify-between pb-2">
                        <h3 className="text-sm font-medium text-muted-foreground">สถานะ</h3>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">
                        <Badge
                            variant={schedule.status === "ACTIVE" ? "default" : "secondary"}
                            className={isOverdue ? "bg-red-100 text-red-800" : ""}
                        >
                            {schedule.status === "ACTIVE" && !isOverdue && "Active"}
                            {schedule.status === "ACTIVE" && isOverdue && "Overdue"}
                            {schedule.status === "INACTIVE" && "Inactive"}
                            {schedule.status === "COMPLETED" && "Completed"}
                        </Badge>
                    </div>
                </div>
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <div className="flex flex-row items-center justify-between pb-2">
                        <h3 className="text-sm font-medium text-muted-foreground">ครบกำหนด</h3>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className={`text-2xl font-bold ${isOverdue ? 'text-red-600' : ''}`}>
                        {nextDueDate ? format(nextDueDate, "d MMM yyyy", { locale: th }) : "N/A"}
                    </div>
                    {daysUntilDue !== null && !isOverdue && daysUntilDue >= 0 && (
                        <p className="text-sm text-muted-foreground">อีก {daysUntilDue} วัน</p>
                    )}
                </div>
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <div className="flex flex-row items-center justify-between pb-2">
                        <h3 className="text-sm font-medium text-muted-foreground">ความถี่</h3>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">{schedule.frequency}</div>
                </div>
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <div className="flex flex-row items-center justify-between pb-2">
                        <h3 className="text-sm font-medium text-muted-foreground">ผู้รับผิดชอบ</h3>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-lg font-bold truncate">
                        {schedule.assignee?.name || "ไม่ได้มอบหมาย"}
                    </div>
                </div>
            </div>

            {/* Additional Info */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border bg-card p-4 shadow-sm">
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">ประเภท</h4>
                    <Badge variant="outline">{schedule.type}</Badge>
                </div>
                <div className="rounded-xl border bg-card p-4 shadow-sm">
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">วันที่เริ่มต้น</h4>
                    <p className="font-medium">{format(new Date(schedule.startDate), "d MMM yyyy", { locale: th })}</p>
                </div>
                <div className="rounded-xl border bg-card p-4 shadow-sm">
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">ทำครั้งล่าสุด</h4>
                    <p className="font-medium">
                        {schedule.lastPerformedDate
                            ? format(new Date(schedule.lastPerformedDate), "d MMM yyyy", { locale: th })
                            : "ยังไม่เคยทำ"
                        }
                    </p>
                </div>
                <div className="rounded-xl border bg-card p-4 shadow-sm">
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">ระยะเวลาโดยประมาณ</h4>
                    <p className="font-medium">
                        {schedule.estimatedDuration ? `${schedule.estimatedDuration} นาที` : "ไม่ระบุ"}
                    </p>
                </div>
            </div>

            {/* Description & Checklist */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Description */}
                <div className="md:col-span-2 rounded-xl border bg-card p-6 shadow-sm">
                    <h3 className="font-semibold text-lg mb-4">รายละเอียด</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">
                        {schedule.description || "ไม่มีรายละเอียด"}
                    </p>
                </div>

                {/* Checklist View */}
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <h3 className="font-semibold text-lg mb-4">รายการตรวจสอบ</h3>
                    {checklist.length > 0 ? (
                        <div className="space-y-4">
                            {checklist.map((item, idx) => (
                                <div key={idx} className="flex flex-col gap-2 p-3 rounded bg-slate-50 border">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">{item.task}</span>
                                        {item.required && <Badge variant="outline" className="text-xs">Required</Badge>}
                                    </div>

                                    <div className="opacity-70 pointer-events-none">
                                        {(!item.inputType || item.inputType === "BOOLEAN") && (
                                            <div className="flex items-center gap-2">
                                                <div className="h-4 w-4 rounded border border-primary flex items-center justify-center" />
                                                <span className="text-xs text-muted-foreground">Pass / Fail</span>
                                            </div>
                                        )}

                                        {item.inputType === "TEXT" && (
                                            <div className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                                                <span className="text-muted-foreground italic">Text Input...</span>
                                            </div>
                                        )}

                                        {item.inputType === "NUMBER" && (
                                            <div className="flex items-center gap-2">
                                                <div className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm flex items-center">
                                                    <span className="text-muted-foreground italic">0.00</span>
                                                </div>
                                                {item.unit && <span className="text-sm font-medium">{item.unit}</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm">ไม่มีรายการตรวจสอบ</p>
                    )}
                </div>
            </div>
        </div>
    );
}
