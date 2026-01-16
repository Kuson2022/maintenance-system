"use client";

/**
 * Equipment Work Orders Component
 * แสดงรายการใบแจ้งซ่อมของเครื่องจักร
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Wrench, ChevronRight, Clock } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { getWorkOrdersAction } from "@/app/actions/work-orders";

interface WorkOrder {
    id: string;
    woNumber: string;
    title: string;
    status: string;
    priority: string;
    reportedAt: string;
    assignee?: { name: string } | null;
}

// Status badge styles
const statusStyles: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    PENDING: { label: "รอดำเนินการ", variant: "secondary" },
    ASSIGNED: { label: "มอบหมายแล้ว", variant: "outline" },
    IN_PROGRESS: { label: "กำลังดำเนินการ", variant: "default" },
    ON_HOLD: { label: "รอชิ้นส่วน", variant: "outline" },
    COMPLETED: { label: "เสร็จสิ้น", variant: "default" },
    CANCELLED: { label: "ยกเลิก", variant: "destructive" },
};

const priorityStyles: Record<string, string> = {
    LOW: "bg-gray-100 text-gray-800",
    MEDIUM: "bg-blue-100 text-blue-800",
    HIGH: "bg-orange-100 text-orange-800",
    CRITICAL: "bg-red-100 text-red-800",
};

interface Props {
    equipmentId: string;
}

export function EquipmentWorkOrders({ equipmentId }: Props) {
    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        async function fetchWorkOrders() {
            try {
                const result = await getWorkOrdersAction({
                    filters: { equipmentId },
                    pagination: { pageSize: 5 },
                });

                if (result.success && result.data) {
                    setWorkOrders(result.data.data as unknown as WorkOrder[]);
                    setTotal((result.data as any).count ?? 0);
                }
            } catch (error) {
                console.error("Error fetching work orders:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchWorkOrders();
    }, [equipmentId]);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>ใบแจ้งซ่อม</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    ใบแจ้งซ่อม ({total})
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/work-orders?equipmentId=${equipmentId}`}>
                        ดูทั้งหมด
                        <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                {workOrders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Wrench className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>ยังไม่มีใบแจ้งซ่อม</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {workOrders.map((wo) => (
                            <Link
                                key={wo.id}
                                href={`/dashboard/work-orders/${wo.id}`}
                                className="block p-3 border rounded-lg hover:bg-accent transition-colors"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{wo.woNumber}</span>
                                            <Badge variant={statusStyles[wo.status]?.variant || "outline"}>
                                                {statusStyles[wo.status]?.label || wo.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate mt-1">
                                            {wo.title}
                                        </p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {format(new Date(wo.reportedAt), "d MMM yyyy", { locale: th })}
                                            </span>
                                            {wo.assignee && (
                                                <span>ช่าง: {wo.assignee.name}</span>
                                            )}
                                        </div>
                                    </div>
                                    <span
                                        className={`text-xs px-2 py-1 rounded ${priorityStyles[wo.priority] || ""}`}
                                    >
                                        {wo.priority}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
