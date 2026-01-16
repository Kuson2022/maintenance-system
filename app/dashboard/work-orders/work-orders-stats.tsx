/**
 * Work Orders Stats Component (Server Component)
 * แสดง KPI Cards สำหรับ Work Orders
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getWorkOrderStats } from "@/lib/api/work-orders";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Wrench,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

export async function WorkOrdersStats() {
  const stats = await getWorkOrderStats();

  const statCards = [
    {
      title: "รอดำเนินการ",
      value: stats.pending,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      description: "ใบแจ้งซ่อมที่ยังไม่ได้ดำเนินการ",
    },
    {
      title: "กำลังดำเนินการ",
      value: stats.inProgress,
      icon: Wrench,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      description: "ใบแจ้งซ่อมที่กำลังทำอยู่",
    },
    {
      title: "เสร็จสิ้นแล้ว",
      value: stats.completed,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-50",
      description: "ใบแจ้งซ่อมที่เสร็จแล้ว",
    },
    {
      title: "เกินกำหนด",
      value: stats.overdue,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      description: "ใบแจ้งซ่อมที่เลยกำหนดเวลา",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Main Stats */}
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
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              ภาพรวม
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  ใบแจ้งซ่อมทั้งหมด
                </span>
                <span className="font-semibold">{stats.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  เวลาเฉลี่ยในการแก้ไข
                </span>
                <span className="font-semibold">
                  {stats.avgResolutionTime
                    ? `${stats.avgResolutionTime.toFixed(1)} ชม.`
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  อัตราความสำเร็จ
                </span>
                <span className="font-semibold">
                  {stats.total > 0
                    ? `${((stats.completed / stats.total) * 100).toFixed(1)}%`
                    : "0%"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-purple-600" />
              ตามระดับความเร่งด่วน
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🔴</span>
                  <span className="text-sm text-muted-foreground">
                    ฉุกเฉิน
                  </span>
                </div>
                <span className="font-semibold">
                  {stats.byPriority?.CRITICAL || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🟠</span>
                  <span className="text-sm text-muted-foreground">สูง</span>
                </div>
                <span className="font-semibold">
                  {stats.byPriority?.HIGH || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🟡</span>
                  <span className="text-sm text-muted-foreground">
                    ปานกลาง
                  </span>
                </div>
                <span className="font-semibold">
                  {stats.byPriority?.MEDIUM || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🟢</span>
                  <span className="text-sm text-muted-foreground">ต่ำ</span>
                </div>
                <span className="font-semibold">
                  {stats.byPriority?.LOW || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}