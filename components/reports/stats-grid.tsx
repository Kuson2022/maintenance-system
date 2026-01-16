"use client";

/**
 * Stats Grid Component
 * แสดง Statistics แบบ Grid
 */

import { Card, CardContent } from "@/components/ui/card";
import {
    Wrench,
    Package,
    DollarSign,
    Calendar,
    Clock,
    CheckCircle,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Users,
    BarChart3,
    Activity,
    Gauge,
    XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Icon mapping for serialization from Server Components
const iconMap = {
    Wrench,
    Package,
    DollarSign,
    Calendar,
    Clock,
    CheckCircle,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Users,
    BarChart3,
    Activity,
    Gauge,
    XCircle,
} as const;

export type IconName = keyof typeof iconMap;

export interface StatItem {
    label: string;
    value: string | number;
    iconName?: IconName;
    color?: string;
    bgColor?: string;
    change?: number;
    changeLabel?: string;
}

interface StatsGridProps {
    stats: StatItem[];
    columns?: 2 | 3 | 4 | 5;
    className?: string;
}

export function StatsGrid({ stats, columns = 4, className }: StatsGridProps) {
    const gridCols = {
        2: "md:grid-cols-2",
        3: "md:grid-cols-3",
        4: "md:grid-cols-2 lg:grid-cols-4",
        5: "md:grid-cols-3 lg:grid-cols-5",
    };

    return (
        <div className={cn(`grid gap-4 ${gridCols[columns]}`, className)}>
            {stats.map((stat, idx) => {
                const Icon = stat.iconName ? iconMap[stat.iconName] : null;
                return (
                    <Card key={idx} className="overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {stat.label}
                                    </p>
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                    {stat.change !== undefined && (
                                        <p
                                            className={cn(
                                                "text-xs flex items-center gap-1",
                                                stat.change >= 0 ? "text-green-600" : "text-red-600"
                                            )}
                                        >
                                            {stat.change >= 0 ? "↑" : "↓"}
                                            {Math.abs(stat.change)}%
                                            {stat.changeLabel && (
                                                <span className="text-muted-foreground">
                                                    {stat.changeLabel}
                                                </span>
                                            )}
                                        </p>
                                    )}
                                </div>
                                {Icon && (
                                    <div
                                        className={cn(
                                            "p-3 rounded-full",
                                            stat.bgColor || "bg-primary/10"
                                        )}
                                    >
                                        <Icon className={cn("h-5 w-5", stat.color || "text-primary")} />
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
