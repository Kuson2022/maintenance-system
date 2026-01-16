"use client";

/**
 * Recent Work Orders Component
 * Shows recent work orders list
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Wrench } from "lucide-react";
import Link from "next/link";

interface WorkOrder {
    id: string;
    woNumber: string;
    title: string;
    status: string;
    priority: string;
    reportedAt: string | Date;
    equipment: {
        id: string;
        name: string;
        code: string;
    };
}

interface RecentWorkOrdersProps {
    workOrders: WorkOrder[];
}

const statusConfig: Record<string, { label: string; className: string }> = {
    PENDING: {
        label: "รอดำเนินการ",
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200 border-yellow-200"
    },
    ASSIGNED: {
        label: "มอบหมายแล้ว",
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border-blue-200"
    },
    IN_PROGRESS: {
        label: "กำลังดำเนินการ",
        className: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200 border-orange-200"
    },
    ON_HOLD: {
        label: "รออะไหล่/หยุดพัก",
        className: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200 border-indigo-200"
    },
    COMPLETED: {
        label: "เสร็จสิ้น",
        className: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 border-green-200"
    },
    CANCELLED: {
        label: "ยกเลิก",
        className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200"
    },
};

const priorityConfig: Record<string, string> = {
    LOW: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
    MEDIUM: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
    HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100",
    CRITICAL: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100",
};

export function RecentWorkOrders({ workOrders }: RecentWorkOrdersProps) {
    const formatDate = (dateValue: string | Date) => {
        const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
        return date.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    ใบแจ้งซ่อมล่าสุด
                </CardTitle>
                <Link href="/dashboard/work-orders">
                    <Button variant="ghost" size="sm">
                        ดูทั้งหมด
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
            </CardHeader>
            <CardContent>
                {workOrders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Wrench className="mx-auto h-8 w-8 mb-2 opacity-50" />
                        <p>ไม่มีใบแจ้งซ่อม</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {workOrders.map((wo) => {
                            const status = statusConfig[wo.status] || { label: wo.status, className: "bg-gray-100" };
                            return (
                                <Link
                                    key={wo.id}
                                    href={`/dashboard/work-orders/${wo.id}`}
                                    className="flex items-center justify-between border-b pb-3 last:border-0 hover:bg-muted/50 -mx-2 px-2 py-1 rounded-lg transition-colors"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{wo.woNumber}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${priorityConfig[wo.priority]}`}>
                                                {wo.priority}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-1">
                                            {wo.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {wo.equipment.name} • {formatDate(wo.reportedAt)}
                                        </p>
                                    </div>
                                    <Badge variant="outline" className={`border ${status.className}`}>
                                        {status.label}
                                    </Badge>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
