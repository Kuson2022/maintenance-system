"use client";

/**
 * Report Chart Component
 * แสดงกราฟต่างๆ สำหรับรายงาน
 */

import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Default colors
const COLORS = [
    "#3b82f6", // blue
    "#22c55e", // green
    "#f97316", // orange
    "#ef4444", // red
    "#8b5cf6", // purple
    "#14b8a6", // teal
    "#f59e0b", // amber
    "#ec4899", // pink
];

// ====================================
// BAR CHART
// ====================================

interface BarChartData {
    label: string;
    value: number;
    color?: string;
}

interface ReportBarChartProps {
    data: BarChartData[];
    title: string;
    description?: string;
    height?: number;
    showGrid?: boolean;
    horizontal?: boolean;
}

export function ReportBarChart({
    data,
    title,
    description,
    height = 300,
    showGrid = true,
    horizontal = false,
}: ReportBarChartProps) {
    const formatValue = (value: number) => {
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
        return value.toString();
    };

    const chartData = data.map((item) => ({
        name: item.label,
        value: item.value,
        fill: item.color || COLORS[0],
    }));

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg">{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
                <div style={{ height }}>
                    <ResponsiveContainer width="100%" height="100%">
                        {horizontal ? (
                            <BarChart data={chartData} layout="vertical" margin={{ left: 60 }}>
                                {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
                                <XAxis type="number" tickFormatter={formatValue} />
                                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                                <Tooltip
                                    formatter={(value: number) => formatValue(value)}
                                    contentStyle={{ borderRadius: "8px" }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        ) : (
                            <BarChart data={chartData}>
                                {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis tickFormatter={formatValue} tick={{ fontSize: 11 }} />
                                <Tooltip
                                    formatter={(value: number) => formatValue(value)}
                                    contentStyle={{ borderRadius: "8px" }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

// ====================================
// LINE CHART
// ====================================

interface LineChartData {
    month: string;
    value: number;
    [key: string]: string | number;
}

interface ReportLineChartProps {
    data: LineChartData[];
    title: string;
    description?: string;
    height?: number;
    dataKeys?: { key: string; color: string; name: string }[];
}

export function ReportLineChart({
    data,
    title,
    description,
    height = 300,
    dataKeys = [{ key: "value", color: "#3b82f6", name: "ค่า" }],
}: ReportLineChartProps) {
    const formatValue = (value: number) => {
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
        return value.toString();
    };

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg">{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
                <div style={{ height }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                            <YAxis tickFormatter={formatValue} tick={{ fontSize: 11 }} />
                            <Tooltip
                                formatter={(value: number) => formatValue(value)}
                                contentStyle={{ borderRadius: "8px" }}
                            />
                            <Legend />
                            {dataKeys.map((dk) => (
                                <Line
                                    key={dk.key}
                                    type="monotone"
                                    dataKey={dk.key}
                                    stroke={dk.color}
                                    name={dk.name}
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

// ====================================
// PIE CHART
// ====================================

interface PieChartData {
    label: string;
    value: number;
    color?: string;
}

interface ReportPieChartProps {
    data: PieChartData[];
    title: string;
    description?: string;
    height?: number;
    showLegend?: boolean;
    donut?: boolean;
}

export function ReportPieChart({
    data,
    title,
    description,
    height = 300,
    showLegend = true,
    donut = false,
}: ReportPieChartProps) {
    const chartData = data.map((item, index) => ({
        name: item.label,
        value: item.value,
        fill: item.color || COLORS[index % COLORS.length],
    }));

    const total = data.reduce((sum, item) => sum + item.value, 0);

    const renderCustomLabel = ({
        cx,
        cy,
        midAngle,
        innerRadius,
        outerRadius,
        percent,
    }: any) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        if (percent < 0.05) return null;

        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={12}
                fontWeight="bold"
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg">{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
                <div style={{ height }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={renderCustomLabel}
                                innerRadius={donut ? 60 : 0}
                                outerRadius={80}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: number, name: string) => [
                                    `${value} (${((value / total) * 100).toFixed(1)}%)`,
                                    name,
                                ]}
                                contentStyle={{ borderRadius: "8px" }}
                            />
                            {showLegend && <Legend />}
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

// ====================================
// COMPARISON BAR CHART
// ====================================

interface ComparisonData {
    month: string;
    currentYear: number;
    previousYear: number;
}

interface ReportComparisonChartProps {
    data: ComparisonData[];
    title: string;
    description?: string;
    height?: number;
    labels?: { current: string; previous: string };
}

export function ReportComparisonChart({
    data,
    title,
    description,
    height = 300,
    labels = { current: "ปีนี้", previous: "ปีที่แล้ว" },
}: ReportComparisonChartProps) {
    const formatValue = (value: number) => {
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
        return value.toString();
    };

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg">{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
                <div style={{ height }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                            <YAxis tickFormatter={formatValue} tick={{ fontSize: 11 }} />
                            <Tooltip
                                formatter={(value: number) => formatValue(value)}
                                contentStyle={{ borderRadius: "8px" }}
                            />
                            <Legend />
                            <Bar
                                dataKey="previousYear"
                                name={labels.previous}
                                fill="#94a3b8"
                                radius={[4, 4, 0, 0]}
                            />
                            <Bar
                                dataKey="currentYear"
                                name={labels.current}
                                fill="#3b82f6"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
