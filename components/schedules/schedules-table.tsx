"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    Edit,
    Eye,
    MoreHorizontal,
    Pause,
    Play,
    Trash2
} from "lucide-react";
import { format, isPast, differenceInDays } from "date-fns";
import { th } from "date-fns/locale";
import Link from "next/link";
import { SerializedMaintenanceScheduleWithRelations } from "@/lib/api/schedules/types";
import { SchedulePermissions } from "@/lib/api/schedules/permissions";
import { DeleteScheduleDialog } from "./delete-schedule-dialog";
import { ScheduleMobileCard } from "./schedule-mobile-card";

interface SchedulesTableProps {
    data: SerializedMaintenanceScheduleWithRelations[];
    permissions: SchedulePermissions;
    onComplete?: (id: string) => void;
    onPause?: (id: string) => void;
    onResume?: (id: string) => void;
    onRefresh?: () => void;
}

export function SchedulesTable({
    data,
    permissions,
    onComplete,
    onPause,
    onResume,
    onRefresh,
}: SchedulesTableProps) {
    const getStatusBadge = (schedule: SerializedMaintenanceScheduleWithRelations) => {
        const nextDueDate = schedule.nextDueDate ? new Date(schedule.nextDueDate) : null;
        const isOverdue = nextDueDate && isPast(nextDueDate) && schedule.status === "ACTIVE";
        const daysUntilDue = nextDueDate ? differenceInDays(nextDueDate, new Date()) : null;

        if (schedule.status === "INACTIVE") {
            return <Badge variant="secondary">Paused</Badge>;
        }
        if (schedule.status === "COMPLETED") {
            return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
        }
        if (isOverdue) {
            return <Badge variant="destructive">Overdue</Badge>;
        }
        if (daysUntilDue !== null && daysUntilDue <= 7) {
            return <Badge className="bg-yellow-100 text-yellow-800">Due Soon</Badge>;
        }
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    };

    const getTypeBadge = (type: string) => {
        const typeColors: Record<string, string> = {
            PREVENTIVE: "bg-blue-100 text-blue-800 border-blue-200",
            PREDICTIVE: "bg-purple-100 text-purple-800 border-purple-200",
            INSPECTION: "bg-cyan-100 text-cyan-800 border-cyan-200",
        };
        return (
            <Badge variant="outline" className={typeColors[type] || ""}>
                {type}
            </Badge>
        );
    };

    const formatDueDate = (schedule: SerializedMaintenanceScheduleWithRelations) => {
        if (!schedule.nextDueDate) return "-";
        const date = new Date(schedule.nextDueDate);
        const isOverdue = isPast(date) && schedule.status === "ACTIVE";
        const daysUntilDue = differenceInDays(date, new Date());

        return (
            <div className={isOverdue ? "text-red-600 font-medium" : ""}>
                {format(date, "d MMM yyyy", { locale: th })}
                {isOverdue && (
                    <div className="text-xs">
                        (เลยกำหนด {Math.abs(daysUntilDue)} วัน)
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            {/* Desktop Table - Hidden on mobile */}
            <div className="hidden md:block rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>กิจกรรม</TableHead>
                            <TableHead>อุปกรณ์</TableHead>
                            <TableHead>ประเภท</TableHead>
                            <TableHead>ความถี่</TableHead>
                            <TableHead>ครบกำหนด</TableHead>
                            <TableHead>ผู้รับผิดชอบ</TableHead>
                            <TableHead>สถานะ</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                    ไม่พบข้อมูลตารางบำรุงรักษา
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((schedule) => (
                                <TableRow key={schedule.id} className="hover:bg-slate-50">
                                    <TableCell className="font-medium">
                                        <Link
                                            href={`/dashboard/schedules/${schedule.id}`}
                                            className="hover:text-primary hover:underline"
                                        >
                                            {schedule.activityName}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            {schedule.equipment.name}
                                            <div className="text-xs text-muted-foreground">
                                                {schedule.equipment.code}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getTypeBadge(schedule.type)}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{schedule.frequency}</Badge>
                                    </TableCell>
                                    <TableCell>{formatDueDate(schedule)}</TableCell>
                                    <TableCell>{schedule.assignee?.name || "-"}</TableCell>
                                    <TableCell>{getStatusBadge(schedule)}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
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
                                                        บันทึกผล
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
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Card View - Shown on mobile only */}
            <div className="md:hidden space-y-3">
                {data.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        ไม่พบข้อมูลตารางบำรุงรักษา
                    </div>
                ) : (
                    data.map((schedule) => (
                        <ScheduleMobileCard
                            key={schedule.id}
                            schedule={schedule}
                            permissions={permissions}
                            onComplete={onComplete}
                            onPause={onPause}
                            onResume={onResume}
                            onRefresh={onRefresh}
                        />
                    ))
                )}
            </div>
        </>
    );
}
