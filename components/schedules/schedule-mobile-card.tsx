"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Calendar,
    CheckCircle,
    Clock,
    Edit,
    Eye,
    MoreVertical,
    Pause,
    Play,
    Trash2,
    User,
    Wrench
} from "lucide-react";
import { format, isPast, differenceInDays } from "date-fns";
import { th } from "date-fns/locale";
import Link from "next/link";
import { SerializedMaintenanceScheduleWithRelations } from "@/lib/api/schedules/types";
import { SchedulePermissions } from "@/lib/api/schedules/permissions";
import { DeleteScheduleDialog } from "./delete-schedule-dialog";

interface ScheduleMobileCardProps {
    schedule: SerializedMaintenanceScheduleWithRelations;
    permissions: SchedulePermissions;
    onComplete?: (id: string) => void;
    onPause?: (id: string) => void;
    onResume?: (id: string) => void;
    onRefresh?: () => void;
}

export function ScheduleMobileCard({
    schedule,
    permissions,
    onComplete,
    onPause,
    onResume,
    onRefresh,
}: ScheduleMobileCardProps) {
    const nextDueDate = schedule.nextDueDate ? new Date(schedule.nextDueDate) : null;
    const isOverdue = nextDueDate && isPast(nextDueDate) && schedule.status === "ACTIVE";
    const daysUntilDue = nextDueDate ? differenceInDays(nextDueDate, new Date()) : null;

    const getStatusBadge = () => {
        if (schedule.status === "INACTIVE") {
            return <Badge variant="secondary">หยุดชั่วคราว</Badge>;
        }
        if (schedule.status === "COMPLETED") {
            return <Badge className="bg-green-100 text-green-800">เสร็จสิ้น</Badge>;
        }
        if (isOverdue) {
            return <Badge variant="destructive">เลยกำหนด</Badge>;
        }
        if (daysUntilDue !== null && daysUntilDue <= 7) {
            return <Badge className="bg-yellow-100 text-yellow-800">ใกล้ถึงกำหนด</Badge>;
        }
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    };

    const getTypeBadge = () => {
        const typeColors: Record<string, string> = {
            PREVENTIVE: "bg-blue-100 text-blue-800",
            PREDICTIVE: "bg-purple-100 text-purple-800",
            INSPECTION: "bg-cyan-100 text-cyan-800",
        };
        return (
            <Badge variant="outline" className={typeColors[schedule.type] || ""}>
                {schedule.type}
            </Badge>
        );
    };

    return (
        <Card className={`${isOverdue ? "border-red-300 bg-red-50/50" : ""}`}>
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <Link
                            href={`/dashboard/schedules/${schedule.id}`}
                            className="font-semibold text-base hover:text-primary hover:underline block truncate"
                        >
                            {schedule.activityName}
                        </Link>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <Wrench className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                            <span className="truncate">{schedule.equipment.name}</span>
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link href={`/dashboard/schedules/${schedule.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    ดูรายละเอียด
                                </Link>
                            </DropdownMenuItem>

                            {permissions.canEdit && (
                                <DropdownMenuItem asChild>
                                    <Link href={`/dashboard/schedules/${schedule.id}/edit`}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        แก้ไข
                                    </Link>
                                </DropdownMenuItem>
                            )}

                            {permissions.canComplete && schedule.status === "ACTIVE" && (
                                <DropdownMenuItem onClick={() => onComplete?.(schedule.id)}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    บันทึกผลการบำรุงรักษา
                                </DropdownMenuItem>
                            )}

                            {permissions.canEdit && schedule.status === "ACTIVE" && (
                                <DropdownMenuItem onClick={() => onPause?.(schedule.id)}>
                                    <Pause className="mr-2 h-4 w-4" />
                                    หยุดชั่วคราว
                                </DropdownMenuItem>
                            )}

                            {permissions.canEdit && schedule.status === "INACTIVE" && (
                                <DropdownMenuItem onClick={() => onResume?.(schedule.id)}>
                                    <Play className="mr-2 h-4 w-4" />
                                    เปิดใช้งาน
                                </DropdownMenuItem>
                            )}

                            {permissions.canDelete && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DeleteScheduleDialog
                                        scheduleId={schedule.id}
                                        scheduleName={schedule.activityName}
                                        onDeleted={onRefresh}
                                        trigger={
                                            <DropdownMenuItem
                                                className="text-red-600 focus:text-red-600"
                                                onSelect={(e) => e.preventDefault()}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                ลบ
                                            </DropdownMenuItem>
                                        }
                                    />
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>

            <CardContent className="pb-3">
                <div className="flex flex-wrap gap-2 mb-3">
                    {getStatusBadge()}
                    {getTypeBadge()}
                    <Badge variant="outline">{schedule.frequency}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2 shrink-0" />
                        <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                            {nextDueDate
                                ? format(nextDueDate, "d MMM yyyy", { locale: th })
                                : "ไม่ระบุ"
                            }
                        </span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                        <User className="h-4 w-4 mr-2 shrink-0" />
                        <span className="truncate">
                            {schedule.assignee?.name || "ไม่ได้มอบหมาย"}
                        </span>
                    </div>
                </div>

                {isOverdue && (
                    <div className="mt-3 p-2 bg-red-100 rounded-md text-sm text-red-700">
                        เลยกำหนด {Math.abs(daysUntilDue!)} วัน
                    </div>
                )}
            </CardContent>

            <CardFooter className="pt-0 pb-3">
                <div className="flex gap-2 w-full">
                    {permissions.canComplete && schedule.status === "ACTIVE" && (
                        <Button
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => onComplete?.(schedule.id)}
                        >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Complete
                        </Button>
                    )}
                    <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        asChild
                    >
                        <Link href={`/dashboard/schedules/${schedule.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            ดูรายละเอียด
                        </Link>
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}
