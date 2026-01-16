// app/(dashboard)/work-orders/[id]/components/work-order-header.tsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Printer,
  UserPlus,
  MoreVertical,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { WorkOrderDetail } from "@/lib/api/work-orders/types";
import {
  PRIORITY_CONFIG,
  STATUS_CONFIG,
} from "@/lib/api/work-orders/types";
import {
  deleteWorkOrderAction,
  checkWorkOrderPermissionsAction,
  assignWorkOrderAction,
} from "@/app/actions/work-orders";
import { StatusChangeDialog } from "./status-change-dialog";
import { AssignTechnicianDialog } from "./assign-technician-dialog";

interface WorkOrderHeaderProps {
  workOrder: WorkOrderDetail;
  currentUserId: string;
}

export function WorkOrderHeader({
  workOrder,
  currentUserId,
}: WorkOrderHeaderProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [permissions, setPermissions] = useState({
    canEdit: false,
    canDelete: false,
    canChangeStatus: false,
    canAssign: false,
    canAccept: false,
  });

  // ✅ Load permissions on mount - ใช้ useEffect แทน
  useEffect(() => {
    async function loadPermissions() {
      const result = await checkWorkOrderPermissionsAction(workOrder.id);
      if (result.success && result.data) {
        setPermissions(result.data);
      }
    }
    loadPermissions();
  }, [workOrder.id]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteWorkOrderAction(workOrder.id);

      if (result.success) {
        toast({
          title: "ลบสำเร็จ",
          description: "ลบใบแจ้งซ่อมเรียบร้อยแล้ว",
        });
        router.push("/dashboard/work-orders");
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error instanceof Error ? error.message : "ไม่สามารถลบได้",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const result = await assignWorkOrderAction(workOrder.id, currentUserId);

      if (result.success) {
        toast({
          title: "รับงานสำเร็จ",
          description: "มอบหมายงานให้คุณเรียบร้อยแล้ว",
        });
        window.location.reload(); // Reload to refresh permissions and UI
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error instanceof Error ? error.message : "ไม่สามารถรับงานได้",
        variant: "destructive",
      });
    } finally {
      setIsAccepting(false);
    }
  };

  const handlePrint = () => {
    // Open print page in new window - Standalone Route
    window.open(`/print/work-orders/${workOrder.id}`, '_blank');
  };

  const priorityConfig = PRIORITY_CONFIG[workOrder.priority];
  const statusConfig = STATUS_CONFIG[workOrder.status];

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="shrink-0"
          >
            <Link href="/dashboard/work-orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">
                {workOrder.woNumber}
              </h1>
              <Badge className={statusConfig.color}>
                {statusConfig.label}
              </Badge>
              <Badge className={priorityConfig.color}>
                {priorityConfig.icon} {priorityConfig.label}
              </Badge>
            </div>
            <p className="text-lg text-muted-foreground">
              {workOrder.title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Change Status Button */}
          {permissions.canChangeStatus && (
            <Button
              onClick={() => setShowStatusDialog(true)}
              variant="outline"
            >
              เปลี่ยนสถานะ
            </Button>
          )}

          {/* Accept Work Order Button - For Technician */}
          {permissions.canAccept && !workOrder.assignedTo && (
            <Button
              onClick={handleAccept}
              disabled={isAccepting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              {isAccepting ? "กำลังรับงาน..." : "รับงาน"}
            </Button>
          )}

          {/* Assign Technician Button - For Admin */}
          {permissions.canAssign && !workOrder.assignedTo && (
            <Button
              onClick={() => setShowAssignDialog(true)}
              variant="outline"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              มอบหมายช่าง
            </Button>
          )}

          {/* Edit Button */}
          {permissions.canEdit && (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/work-orders/${workOrder.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                แก้ไข
              </Link>
            </Button>
          )}

          {/* More Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                พิมพ์
              </DropdownMenuItem>

              {permissions.canAssign && workOrder.assignedTo && (
                <DropdownMenuItem onClick={() => setShowAssignDialog(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  เปลี่ยนช่าง
                </DropdownMenuItem>
              )}

              {permissions.canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    ลบ
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Status Change Dialog */}
      <StatusChangeDialog
        open={showStatusDialog}
        onOpenChange={setShowStatusDialog}
        workOrder={workOrder}
      />

      {/* Assign Technician Dialog */}
      <AssignTechnicianDialog
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        workOrder={workOrder}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ที่จะลบใบแจ้งซ่อม {workOrder.woNumber}?
              การกระทำนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "กำลังลบ..." : "ลบ"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}