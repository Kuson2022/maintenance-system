"use client";

/**
 * Equipment Stats Component
 * แสดงสถิติเครื่องจักร
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Package,
    CheckCircle,
    AlertTriangle,
    Wrench,
    XCircle,
} from "lucide-react";
import { getEquipmentStatsAction } from "@/app/actions/equipment";

interface EquipmentStats {
    total: number;
    byStatus: {
        active: number;
        inactive: number;
        maintenance: number;
        retired: number;
    };
    warrantyExpiringSoon: number;
    recentlyAdded: number;
}

export function EquipmentStats() {
    const [stats, setStats] = useState<EquipmentStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const result = await getEquipmentStatsAction();
                if (result.success && result.data) {
                    setStats(result.data);
                }
            } catch (error) {
                console.error("Error fetching equipment stats:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-8 w-8 rounded-full" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-16" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (!stats) {
        return null;
    }

    const statCards = [
        {
            title: "เครื่องจักรทั้งหมด",
            value: stats.total.toString(),
            icon: Package,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
        },
        {
            title: "พร้อมใช้งาน",
            value: stats.byStatus.active.toString(),
            icon: CheckCircle,
            color: "text-green-600",
            bgColor: "bg-green-50",
        },
        {
            title: "กำลังซ่อมบำรุง",
            value: stats.byStatus.maintenance.toString(),
            icon: Wrench,
            color: "text-orange-600",
            bgColor: "bg-orange-50",
        },
        {
            title: "ประกันใกล้หมดอายุ",
            value: stats.warrantyExpiringSoon.toString(),
            icon: AlertTriangle,
            color: "text-yellow-600",
            bgColor: "bg-yellow-50",
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => {
                const Icon = stat.icon;
                return (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {stat.title}
                            </CardTitle>
                            <div className={`rounded-full p-2 ${stat.bgColor}`}>
                                <Icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
