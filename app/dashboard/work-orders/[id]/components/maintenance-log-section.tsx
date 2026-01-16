// app/(dashboard)/work-orders/[id]/components/maintenance-log-section.tsx

"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Wrench, Plus, Clock, Package, Pencil } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WorkOrderDetail } from "@/lib/api/work-orders/types";
import { MaintenanceLogDialog } from "./maintenance-log-dialog";
import { checkWorkOrderPermissionsAction } from "@/app/actions/work-orders";

interface MaintenanceLogSectionProps {
  workOrder: WorkOrderDetail;
  currentUserId: string;
  isAdmin?: boolean;
}

export function MaintenanceLogSection({
  workOrder,
  currentUserId,
  isAdmin,
}: MaintenanceLogSectionProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [canAddLog, setCanAddLog] = useState(false);
  const [editingLog, setEditingLog] = useState<any | null>(null);

  const handleEdit = (log: any) => {
    setEditingLog(log);
    setShowDialog(true);
  };

  const handleClose = (open: boolean) => {
    setShowDialog(open);
    if (!open) setEditingLog(null);
  };

  // Load permissions on mount
  useEffect(() => {
    async function loadPermissions() {
      const result = await checkWorkOrderPermissionsAction(workOrder.id);
      if (result.success && result.data) {
        // Admin or assigned technician can add log, but only when status allows it
        const statusAllowsLog = workOrder.status === "IN_PROGRESS" || workOrder.status === "COMPLETED";
        setCanAddLog(result.data.canAddMaintenanceLog && statusAllowsLog);
      }
    }
    loadPermissions();
  }, [workOrder.id, workOrder.status]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: Date | string) => {
    return format(new Date(date), "d MMM yyyy, HH:mm น.", { locale: th });
  };

  const maintenanceLogs = workOrder.maintenanceLogs || [];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                บันทึกการซ่อม
                <Badge variant="secondary">{maintenanceLogs.length}</Badge>
              </CardTitle>
              <CardDescription>
                รายละเอียดการซ่อมและอะไหล่ที่ใช้
              </CardDescription>
            </div>
            {canAddLog && (
              <Button onClick={() => setShowDialog(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                บันทึกการซ่อม
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {maintenanceLogs.length > 0 ? (
            <div className="space-y-6">
              {maintenanceLogs.map((log, index) => (
                <div key={log.id}>
                  {index > 0 && <Separator className="my-6" />}

                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={log.technician.avatarUrl || undefined}
                          />
                          <AvatarFallback>
                            {getInitials(log.technician.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{log.technician.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(log.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {log.workHours && (
                          <Badge variant="outline" className="gap-1">
                            <Clock className="h-3 w-3" />
                            {log.workHours} ชั่วโมง
                          </Badge>
                        )}
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(log)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-semibold mb-1">
                          รายละเอียดการซ่อม
                        </h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {log.description}
                        </p>
                      </div>

                      {log.rootCause && (
                        <div>
                          <h4 className="text-sm font-semibold mb-1">
                            สาเหตุของปัญหา
                          </h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {log.rootCause}
                          </p>
                        </div>
                      )}

                      {/* Solution display removed */}

                    </div>

                    {/* Time Info removed */}

                    {/* Spare Parts display removed as it is not supported in the current schema relation */}

                    {/* Notes */}
                    {log.notes && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-900">{log.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Wrench className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">ยังไม่มีบันทึกการซ่อม</p>
              {canAddLog && (
                <p className="text-xs">
                  คลิกปุ่ม "บันทึกการซ่อม" เพื่อเพิ่มรายละเอียด
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <MaintenanceLogDialog
        open={showDialog}
        onOpenChange={handleClose}
        workOrder={workOrder}
        mode={editingLog ? "edit" : "create"}
        initialData={editingLog}
      />
    </>
  );
}