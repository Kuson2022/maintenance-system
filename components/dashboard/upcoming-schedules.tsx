"use client";

/**
 * Upcoming Schedules Component
 * Shows upcoming PM schedules
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import Link from "next/link";

interface Schedule {
    id: string;
    activityName: string;
    nextDueDate: string | null;
    frequency: string;
    equipment: {
        id: string;
        name: string;
        code: string;
    };
    assignee?: {
        id: string;
        name: string;
    } | null;
}

interface UpcomingSchedulesProps {
    schedules: Schedule[];
    userRole?: string;
}

const frequencyLabels: Record<string, string> = {
    DAILY: "รายวัน",
    WEEKLY: "รายสัปดาห์",
    BI_WEEKLY: "ทุก 2 สัปดาห์",
    MONTHLY: "รายเดือน",
    QUARTERLY: "รายไตรมาส",
    SEMI_ANNUALLY: "ทุก 6 เดือน",
    ANNUALLY: "รายปี",
    CUSTOM: "กำหนดเอง",
};

export function UpcomingSchedules({ schedules, userRole }: UpcomingSchedulesProps) {
    const formatDate = (dateString: string | null) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        const today = new Date();
        const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        const dateFormatted = date.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
        });

        if (diff === 0) return { text: "วันนี้", urgent: true, formatted: dateFormatted };
        if (diff === 1) return { text: "พรุ่งนี้", urgent: true, formatted: dateFormatted };
        if (diff < 0) return { text: `เกินกำหนด ${Math.abs(diff)} วัน`, urgent: true, formatted: dateFormatted };
        return { text: `อีก ${diff} วัน`, urgent: diff <= 3, formatted: dateFormatted };
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    งาน PM ที่จะถึงกำหนด
                </CardTitle>
                {userRole !== "USER" && (
                    <Link href="/dashboard/schedules">
                        <Button variant="ghost" size="sm">
                            ดูทั้งหมด
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                )}
            </CardHeader>
            <CardContent>
                {schedules.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Calendar className="mx-auto h-8 w-8 mb-2 opacity-50" />
                        <p>ไม่มีงาน PM ที่จะถึงกำหนด</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {schedules.slice(0, 5).map((schedule) => {
                            const dateInfo = formatDate(schedule.nextDueDate);
                            return (
                                <Link
                                    key={schedule.id}
                                    href={`/dashboard/schedules/${schedule.id}`}
                                    className="flex items-center justify-between border-b pb-3 last:border-0 hover:bg-muted/50 -mx-2 px-2 py-1 rounded-lg transition-colors"
                                >
                                    <div className="space-y-1">
                                        <p className="font-medium line-clamp-1">
                                            {schedule.activityName}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {schedule.equipment.name}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Badge variant="outline" className="text-xs">
                                                {frequencyLabels[schedule.frequency] || schedule.frequency}
                                            </Badge>
                                            {schedule.assignee && (
                                                <span>• {schedule.assignee.name}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`flex items-center gap-1 ${typeof dateInfo === 'object' && dateInfo.urgent ? 'text-orange-600' : 'text-muted-foreground'}`}>
                                            <Clock className="h-3 w-3" />
                                            <span className="text-sm font-medium">
                                                {typeof dateInfo === 'object' ? dateInfo.text : dateInfo}
                                            </span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {typeof dateInfo === 'object' ? dateInfo.formatted : ''}
                                        </span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
