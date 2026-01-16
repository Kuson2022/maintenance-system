"use client";

/**
 * Report Card Component
 * การ์ดสำหรับแสดงประเภทรายงาน
 */

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Wrench,
    DollarSign,
    Package,
    Users,
    FileText,
    BarChart3,
    TrendingUp,
} from "lucide-react";

// Icon mapping for serialization from Server Components
const iconMap = {
    Wrench,
    DollarSign,
    Package,
    Users,
    FileText,
    BarChart3,
    TrendingUp,
} as const;

export type ReportIconName = keyof typeof iconMap;

interface ReportCardProps {
    title: string;
    description: string;
    iconName: ReportIconName;
    href: string;
    stats?: {
        label: string;
        value: string | number;
    }[];
    color?: string;
}

export function ReportCard({
    title,
    description,
    iconName,
    href,
    stats,
    color = "text-primary",
}: ReportCardProps) {
    const Icon = iconMap[iconName];

    return (
        <Link href={href}>
            <Card className="h-full transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer group">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl bg-primary/10 ${color} group-hover:scale-110 transition-transform`}>
                            <Icon className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle className="text-lg group-hover:text-primary transition-colors">
                                {title}
                            </CardTitle>
                            <CardDescription className="text-sm">
                                {description}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                {stats && stats.length > 0 && (
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            {stats.map((stat, idx) => (
                                <div key={idx} className="text-center p-2 rounded-lg bg-muted/50">
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                )}
            </Card>
        </Link>
    );
}
