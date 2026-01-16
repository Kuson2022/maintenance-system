"use client";

/**
 * Work Order Trend Chart Component
 * Bar chart showing work order trend
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

interface WorkOrderTrendProps {
    data: {
        month: string;
        created: number;
        completed: number;
    }[];
}

export function WorkOrderTrendChart({ data }: WorkOrderTrendProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>แนวโน้มใบแจ้งซ่อม</CardTitle>
                <CardDescription>เปรียบเทียบจำนวนใบแจ้งซ่อมที่เปิด/ปิดในแต่ละเดือน</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                            dataKey="month"
                            className="text-xs"
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis
                            className="text-xs"
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                            }}
                            labelStyle={{ color: 'hsl(var(--foreground))' }}
                        />
                        <Legend />
                        <Bar
                            dataKey="created"
                            name="เปิดใหม่"
                            fill="hsl(var(--chart-1))"
                            radius={[4, 4, 0, 0]}
                        />
                        <Bar
                            dataKey="completed"
                            name="เสร็จสิ้น"
                            fill="hsl(var(--chart-2))"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
