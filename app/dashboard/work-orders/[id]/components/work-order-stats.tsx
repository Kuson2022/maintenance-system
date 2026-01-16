// app/dashboard/work-orders/[id]/components/work-order-stats.tsx

"use client";

import { DollarSign, Clock, MessageCircle, Paperclip } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface WorkOrderStatsProps {
  stats: {
    totalExpenses: number;
    totalWorkHours: number;
    commentsCount: number;
    attachmentsCount: number;
  };
}

export function WorkOrderStats({ stats }: WorkOrderStatsProps) {
  const statCards = [
    {
      title: "ค่าใช้จ่ายรวม",
      value: `฿${stats.totalExpenses.toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "ชั่วโมงการทำงาน",
      value: `${stats.totalWorkHours.toFixed(1)} ชม.`,
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "ความคิดเห็น",
      value: stats.commentsCount.toString(),
      icon: MessageCircle,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "ไฟล์แนบ",
      value: stats.attachmentsCount.toString(),
      icon: Paperclip,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-full`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}