// app/dashboard/work-orders/[id]/components/work-order-info.tsx

"use client";

import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  CalendarClock,
  MapPin,
  User,
  UserCog,
  Package,
  Clock,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { WorkOrderDetail } from "@/lib/api/work-orders/types";

interface WorkOrderInfoProps {
  workOrder: WorkOrderDetail;
}

export function WorkOrderInfo({ workOrder }: WorkOrderInfoProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return format(new Date(date), "d MMM yyyy, HH:mm น.", { locale: th });
  };

  const isOverdue =
    workOrder.dueDate &&
    new Date(workOrder.dueDate) < new Date() &&
    workOrder.status !== "COMPLETED" &&
    workOrder.status !== "CANCELLED";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          ข้อมูลใบแจ้งซ่อม
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Description */}
        <div>
          <h3 className="font-semibold mb-2">รายละเอียดปัญหา</h3>
          <p className="text-muted-foreground whitespace-pre-wrap">
            {workOrder.description}
          </p>
        </div>

        <Separator />

        {/* Equipment */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Package className="h-4 w-4" />
            เครื่องจักร/อุปกรณ์
          </h3>
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{workOrder.equipment.name}</p>
                <p className="text-sm text-muted-foreground">
                  {workOrder.equipment.code}
                </p>
              </div>
              <Badge variant="outline">
                {workOrder.equipment.category.name}
              </Badge>
            </div>
            {workOrder.equipment.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{workOrder.equipment.location}</span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* People */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Reporter */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              ผู้แจ้ง
            </h3>
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={workOrder.reporter.avatarUrl || undefined} />
                <AvatarFallback>
                  {getInitials(workOrder.reporter.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{workOrder.reporter.name}</p>
                <p className="text-sm text-muted-foreground">
                  {workOrder.reporter.email}
                </p>
              </div>
            </div>
          </div>

          {/* Assignee */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              ช่างผู้รับผิดชอบ
            </h3>
            {workOrder.assignee ? (
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={workOrder.assignee.avatarUrl || undefined} />
                  <AvatarFallback>
                    {getInitials(workOrder.assignee.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{workOrder.assignee.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {workOrder.assignee.email}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                ยังไม่ได้มอบหมาย
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* Timestamps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Reported At */}
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded-lg shrink-0">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium">วันที่แจ้ง</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(workOrder.reportedAt)}
              </p>
            </div>
          </div>

          {/* Due Date */}
          {workOrder.dueDate && (
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-lg shrink-0 ${isOverdue ? "bg-red-100" : "bg-orange-100"
                  }`}
              >
                <CalendarClock
                  className={`h-4 w-4 ${isOverdue ? "text-red-600" : "text-orange-600"
                    }`}
                />
              </div>
              <div>
                <div className="text-sm font-medium flex items-center gap-2">
                  <span>กำหนดเสร็จ</span>
                  {isOverdue && (
                    <Badge variant="destructive">
                      เกินกำหนด
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatDate(workOrder.dueDate)}
                </p>
              </div>
            </div>
          )}

          {/* Started At */}
          {workOrder.startedAt && (
            <div className="flex items-start gap-3">
              <div className="bg-purple-100 p-2 rounded-lg shrink-0">
                <Clock className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium">เริ่มดำเนินการ</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(workOrder.startedAt)}
                </p>
              </div>
            </div>
          )}

          {/* Completed At */}
          {workOrder.completedAt && (
            <div className="flex items-start gap-3">
              <div className="bg-green-100 p-2 rounded-lg shrink-0">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">เสร็จสิ้น</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(workOrder.completedAt)}
                </p>
                {workOrder.resolutionTimeHours && (
                  <p className="text-xs text-muted-foreground mt-1">
                    ใช้เวลา {workOrder.resolutionTimeHours.toFixed(1)} ชั่วโมง
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}