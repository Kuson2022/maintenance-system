"use client";

/**
 * Expense Chart Component
 * แสดงแผนภูมิค่าใช้จ่ายรายเดือน
 */

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

interface MonthData {
    month: string;
    amount: number;
}

interface ExpenseChartProps {
    data: MonthData[];
    title?: string;
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const value = payload[0].value;
        return (
            <div className="bg-popover border rounded-lg shadow-lg p-3">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-lg font-bold text-primary">
                    {new Intl.NumberFormat("th-TH", {
                        style: "currency",
                        currency: "THB",
                        minimumFractionDigits: 0,
                    }).format(value)}
                </p>
            </div>
        );
    }
    return null;
};

// สี gradient สำหรับ bars
const COLORS = [
    "#3b82f6", // blue
    "#4f8ff7",
    "#639cf8",
    "#77a9f9",
    "#8bb6fa",
    "#9fc3fb",
    "#8bb6fa",
    "#77a9f9",
    "#639cf8",
    "#4f8ff7",
    "#3b82f6",
    "#2563eb", // darker blue for current month
];

export function ExpenseChart({ data, title = "ค่าใช้จ่ายรายเดือน" }: ExpenseChartProps) {
    // Format Y axis
    const formatYAxis = (value: number) => {
        if (value >= 1000000) {
            return `${(value / 1000000).toFixed(1)}M`;
        }
        if (value >= 1000) {
            return `${(value / 1000).toFixed(0)}K`;
        }
        return value.toString();
    };

    // หาค่าสูงสุดสำหรับ highlight
    const maxAmount = Math.max(...data.map((d) => d.amount));

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <div>
                        <CardTitle className="text-lg">{title}</CardTitle>
                        <CardDescription>แสดงค่าใช้จ่าย 12 เดือนล่าสุด</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {data.length > 0 ? (
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={data}
                                margin={{
                                    top: 10,
                                    right: 10,
                                    left: 10,
                                    bottom: 20,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis
                                    dataKey="month"
                                    tick={{ fontSize: 11 }}
                                    tickLine={false}
                                    axisLine={false}
                                    angle={-45}
                                    textAnchor="end"
                                    height={60}
                                />
                                <YAxis
                                    tickFormatter={formatYAxis}
                                    tick={{ fontSize: 11 }}
                                    tickLine={false}
                                    axisLine={false}
                                    width={50}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar
                                    dataKey="amount"
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={60}
                                >
                                    {data.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.amount === maxAmount ? "#2563eb" : COLORS[index % COLORS.length]}
                                            className="hover:opacity-80 transition-opacity cursor-pointer"
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                            <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-20" />
                            <p>ไม่มีข้อมูลค่าใช้จ่าย</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
