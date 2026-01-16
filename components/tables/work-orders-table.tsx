"use client";

/**
 * Work Orders Table Component
 * ตารางแสดงรายการ Work Orders พร้อมฟีเจอร์ครบ
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { StatusBadge, PriorityBadge } from "@/components/shared/status-badge";
import { WorkOrderWithRelations, STATUS_CONFIG, WorkOrderStatus } from "@/lib/api/work-orders/types";
import { deleteWorkOrderAction, bulkAssignAction, bulkUpdateStatusAction, getAvailableTechniciansAction } from "@/app/actions/work-orders";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  ArrowUpDown,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface WorkOrdersTableProps {
  data: WorkOrderWithRelations[];
  onSort?: (column: string) => void;
  currentSort?: { column: string; order: "asc" | "desc" };
  onRefresh?: () => void;
  isAdmin?: boolean;
}

export function WorkOrdersTable({
  data,
  onSort,
  currentSort,
  onRefresh,
  isAdmin = false,
}: WorkOrdersTableProps) {
  const router = useRouter();
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [deleteWorkOrderId, setDeleteWorkOrderId] = useState<string | null>(null);
  const [deleteWorkOrderNumber, setDeleteWorkOrderNumber] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk action state
  const [showBulkAssignDialog, setShowBulkAssignDialog] = useState(false);
  const [showBulkStatusDialog, setShowBulkStatusDialog] = useState(false);
  const [technicians, setTechnicians] = useState<{ id: string; name: string }[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);

  const handleDelete = async () => {
    if (!deleteWorkOrderId) return;

    setIsDeleting(true);
    try {
      const result = await deleteWorkOrderAction(deleteWorkOrderId);
      if (result.success) {
        toast.success("ลบใบแจ้งซ่อมเรียบร้อยแล้ว");
        // Call onRefresh callback if provided, otherwise fallback to router.refresh
        if (onRefresh) {
          onRefresh();
        } else {
          router.refresh();
        }
      } else {
        throw new Error(result.error || "ไม่สามารถลบได้");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ไม่สามารถลบได้");
    } finally {
      setIsDeleting(false);
      setDeleteWorkOrderId(null);
      setDeleteWorkOrderNumber("");
    }
  };

  const handleSort = (column: string) => {
    if (onSort) {
      onSort(column);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return format(new Date(date), "dd MMM yyyy", { locale: th });
  };

  const formatDateTime = (date: Date | null) => {
    if (!date) return "-";
    return format(new Date(date), "dd MMM yyyy HH:mm", { locale: th });
  };

  // Check if work order is overdue
  const isOverdue = (workOrder: WorkOrderWithRelations) => {
    if (!workOrder.dueDate) return false;
    if (workOrder.status === "COMPLETED" || workOrder.status === "CANCELLED") return false;
    return new Date(workOrder.dueDate) < new Date();
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(data.map((wo) => wo.id)));
    }
  };

  // Load technicians when bulk assign dialog opens
  const openBulkAssignDialog = async () => {
    setShowBulkAssignDialog(true);
    setLoadingTechnicians(true);
    try {
      const result = await getAvailableTechniciansAction();
      if (result.success && result.data) {
        setTechnicians(result.data);
      }
    } catch (error) {
      console.error("Error loading technicians:", error);
    } finally {
      setLoadingTechnicians(false);
    }
  };

  // Handle bulk assign
  const handleBulkAssign = async () => {
    if (!selectedTechnician) return;
    setIsBulkLoading(true);
    try {
      const result = await bulkAssignAction(Array.from(selectedRows), selectedTechnician);
      if (result.success) {
        toast.success(`มอบหมาย ${result.data.count} รายการเรียบร้อยแล้ว`);
        setSelectedRows(new Set());
        setShowBulkAssignDialog(false);
        setSelectedTechnician("");
        if (onRefresh) onRefresh();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการมอบหมายงาน");
    } finally {
      setIsBulkLoading(false);
    }
  };

  // Handle bulk status change
  const handleBulkStatusChange = async () => {
    if (!selectedStatus) return;
    setIsBulkLoading(true);
    try {
      const result = await bulkUpdateStatusAction(Array.from(selectedRows), selectedStatus);
      if (result.success) {
        toast.success(`เปลี่ยนสถานะ ${result.data.count} รายการเรียบร้อยแล้ว`);
        setSelectedRows(new Set());
        setShowBulkStatusDialog(false);
        setSelectedStatus("");
        if (onRefresh) onRefresh();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
    } finally {
      setIsBulkLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* Bulk Actions */}
        {selectedRows.size > 0 && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 flex-wrap">
            <span className="text-sm font-medium text-blue-900">
              เลือก {selectedRows.size} รายการ
            </span>
            {isAdmin && (
              <>
                <Button size="sm" variant="outline" onClick={openBulkAssignDialog}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  มอบหมายงาน
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowBulkStatusDialog(true)}>
                  เปลี่ยนสถานะ
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedRows(new Set())}
            >
              ยกเลิก
            </Button>
          </div>
        )}

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              ไม่พบข้อมูลใบแจ้งซ่อม
            </div>
          ) : (
            data.map((workOrder) => (
              <div
                key={workOrder.id}
                className="bg-white rounded-lg border p-4 space-y-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(workOrder.id)}
                      onChange={() => handleSelectRow(workOrder.id)}
                      className="rounded border-gray-300"
                    />
                    <Link
                      href={`/dashboard/work-orders/${workOrder.id}`}
                      className="font-semibold text-blue-600 hover:underline"
                    >
                      {workOrder.woNumber}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={workOrder.status} />
                    {isOverdue(workOrder) && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertTriangle className="h-3 w-3" />
                        เกินกำหนด
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900">{workOrder.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {workOrder.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="px-2 py-1 bg-gray-100 rounded">
                    🔧 {workOrder.equipment.name}
                  </span>
                  <PriorityBadge priority={workOrder.priority} />
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-3">
                  <div>
                    <span>ผู้แจ้ง: </span>
                    <span className="font-medium text-gray-700">{workOrder.reporter.name}</span>
                  </div>
                  <div>
                    {workOrder.assignee ? (
                      <span className="font-medium text-gray-700">
                        👤 {workOrder.assignee.name}
                      </span>
                    ) : (
                      <span className="text-orange-600">ยังไม่มอบหมาย</span>
                    )}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  แจ้งเมื่อ: {formatDateTime(workOrder.reportedAt)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === data.length && data.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort("woNumber")}
                >
                  <div className="flex items-center gap-2">
                    <span>WO Number</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>หัวเรื่อง</TableHead>
                <TableHead>เครื่องจักร</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center gap-2">
                    <span>สถานะ</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort("priority")}
                >
                  <div className="flex items-center gap-2">
                    <span>ความเร่งด่วน</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>ผู้แจ้ง</TableHead>
                <TableHead>ผู้รับผิดชอบ</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort("reportedAt")}
                >
                  <div className="flex items-center gap-2">
                    <span>วันที่แจ้ง</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="text-right">การดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    ไม่พบข้อมูลใบแจ้งซ่อม
                  </TableCell>
                </TableRow>
              ) : (
                data.map((workOrder) => (
                  <TableRow key={workOrder.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedRows.has(workOrder.id)}
                        onChange={() => handleSelectRow(workOrder.id)}
                        className="rounded border-gray-300"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/work-orders/${workOrder.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {workOrder.woNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px]">
                        <p className="font-medium truncate">{workOrder.title}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {workOrder.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{workOrder.equipment.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {workOrder.equipment.code}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={workOrder.status} />
                        {isOverdue(workOrder) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                            <AlertTriangle className="h-3 w-3" />
                            เกินกำหนด
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={workOrder.priority} />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">
                          {workOrder.reporter.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {workOrder.reporter.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {workOrder.assignee ? (
                        <div>
                          <p className="text-sm font-medium">
                            {workOrder.assignee.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {workOrder.assignee.email}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          ยังไม่มอบหมาย
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatDateTime(workOrder.reportedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>การดำเนินการ</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/work-orders/${workOrder.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              ดูรายละเอียด
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/work-orders/${workOrder.id}/edit`}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              แก้ไข
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <UserPlus className="h-4 w-4 mr-2" />
                            มอบหมายงาน
                          </DropdownMenuItem>
                          {isAdmin && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  setDeleteWorkOrderId(workOrder.id);
                                  setDeleteWorkOrderNumber(workOrder.woNumber);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                ลบ
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteWorkOrderId !== null}
        onOpenChange={(open) => !open && setDeleteWorkOrderId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ที่จะลบใบแจ้งซ่อม {deleteWorkOrderNumber}?
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
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังลบ...
                </>
              ) : (
                "ลบ"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Assign Dialog */}
      <Dialog open={showBulkAssignDialog} onOpenChange={setShowBulkAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>มอบหมายงาน {selectedRows.size} รายการ</DialogTitle>
            <DialogDescription>
              เลือกช่างเทคนิคที่จะรับผิดชอบใบแจ้งซ่อมที่เลือก
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="technician">ช่างเทคนิค</Label>
            <Select
              value={selectedTechnician}
              onValueChange={setSelectedTechnician}
              disabled={loadingTechnicians}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder={loadingTechnicians ? "กำลังโหลด..." : "เลือกช่าง"} />
              </SelectTrigger>
              <SelectContent>
                {technicians.map((tech) => (
                  <SelectItem key={tech.id} value={tech.id}>
                    {tech.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkAssignDialog(false)} disabled={isBulkLoading}>
              ยกเลิก
            </Button>
            <Button onClick={handleBulkAssign} disabled={!selectedTechnician || isBulkLoading}>
              {isBulkLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังมอบหมาย...
                </>
              ) : (
                "มอบหมายงาน"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Status Change Dialog */}
      <Dialog open={showBulkStatusDialog} onOpenChange={setShowBulkStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เปลี่ยนสถานะ {selectedRows.size} รายการ</DialogTitle>
            <DialogDescription>
              เลือกสถานะใหม่สำหรับใบแจ้งซ่อมที่เลือก
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="status">สถานะ</Label>
            <Select
              value={selectedStatus}
              onValueChange={setSelectedStatus}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="เลือกสถานะ" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                  <SelectItem key={status} value={status}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkStatusDialog(false)} disabled={isBulkLoading}>
              ยกเลิก
            </Button>
            <Button onClick={handleBulkStatusChange} disabled={!selectedStatus || isBulkLoading}>
              {isBulkLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังเปลี่ยนสถานะ...
                </>
              ) : (
                "เปลี่ยนสถานะ"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}