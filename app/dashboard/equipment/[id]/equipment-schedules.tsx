import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronRight, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { MaintenanceScheduleStatus } from "@prisma/client";

interface Schedule {
    id: string;
    activityName: string;
    status: MaintenanceScheduleStatus;
    frequency: string;
    nextDueDate: Date | null;
    lastPerformedDate: Date | null;
    assignee?: { name: string } | null;
}

interface Props {
    schedules: Schedule[];
    equipmentId: string;
    totalCount?: number;
}

const statusStyles: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    ACTIVE: { label: "เปิดใช้งาน", variant: "default" },
    INACTIVE: { label: "ปิดใช้งาน", variant: "secondary" },
    COMPLETED: { label: "เสร็จสิ้น", variant: "outline" }, // Though schedules usually stay Active
};

export function EquipmentSchedules({ schedules, equipmentId, totalCount }: Props) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    แผนซ่อมบำรุง ({totalCount ?? schedules.length})
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/schedules?equipmentId=${equipmentId}`}>
                        ดูทั้งหมด
                        <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                {schedules.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>ยังไม่มีแผนบำรุงรักษา</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {schedules.map((schedule) => (
                            <Link
                                key={schedule.id}
                                href={`/dashboard/schedules/${schedule.id}`}
                                className="block p-3 border rounded-lg hover:bg-accent transition-colors"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium truncate">{schedule.activityName}</span>
                                            <Badge variant={statusStyles[schedule.status]?.variant || "outline"}>
                                                {statusStyles[schedule.status]?.label || schedule.status}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {schedule.frequency}
                                            </span>
                                            {schedule.assignee && (
                                                <span>ผู้รับผิดชอบ: {schedule.assignee.name}</span>
                                            )}
                                        </div>

                                        <div className="mt-2 flex items-center gap-3 text-xs">
                                            {schedule.nextDueDate && (
                                                <div className={`flex items-center gap-1 ${new Date(schedule.nextDueDate) < new Date() ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                                                    <Calendar className="h-3 w-3" />
                                                    <span>ครบกำหนด: {format(new Date(schedule.nextDueDate), "d MMM yyyy", { locale: th })}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
