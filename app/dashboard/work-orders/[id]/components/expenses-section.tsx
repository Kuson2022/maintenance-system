"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { DollarSign, Plus, Trash2, FileText, ExternalLink } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { WorkOrderDetail } from "@/lib/api/work-orders/types";
import {
  deleteExpenseAction,
  checkWorkOrderPermissionsAction,
} from "@/app/actions/work-orders";
import { ExpenseDialog } from "./expense-dialog";

interface ExpensesSectionProps {
  workOrder: WorkOrderDetail;
  currentUserId: string;
}

export function ExpensesSection({
  workOrder,
  currentUserId,
}: ExpensesSectionProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [canManageExpenses, setCanManageExpenses] = useState(false);

  // Load permissions on mount
  useEffect(() => {
    async function loadPermissions() {
      const result = await checkWorkOrderPermissionsAction(workOrder.id);
      if (result.success && result.data) {
        setCanManageExpenses(result.data.canAddExpense);
      }
    }
    loadPermissions();
  }, [workOrder.id]);

  const handleDelete = async () => {
    if (!deleteExpenseId) return;

    setIsDeleting(true);
    try {
      const result = await deleteExpenseAction(deleteExpenseId);

      if (result.success) {
        toast({
          title: "ลบสำเร็จ",
          description: "ลบค่าใช้จ่ายเรียบร้อยแล้ว",
        });
        router.refresh();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description:
          error instanceof Error ? error.message : "ไม่สามารถลบได้",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteExpenseId(null);
    }
  };

  const formatDate = (date: Date | string) => {
    return format(new Date(date), "d MMM yyyy", { locale: th });
  };

  const expenses = workOrder.expenses || [];
  const totalExpenses = expenses.reduce(
    (sum, exp) => sum + Number(exp.total),
    0
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                ค่าใช้จ่าย
                <Badge variant="secondary">{expenses.length}</Badge>
              </CardTitle>
              <CardDescription>
                รายการค่าใช้จ่ายในการซ่อม
              </CardDescription>
            </div>
            {canManageExpenses && (
              <Button onClick={() => setShowDialog(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มค่าใช้จ่าย
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {expenses.length > 0 ? (
            <div className="space-y-4">
              {/* Expenses Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>วันที่</TableHead>
                      <TableHead>ประเภท</TableHead>
                      <TableHead>รายการ</TableHead>
                      <TableHead className="text-right">จำนวน</TableHead>
                      <TableHead className="text-right">ราคา/หน่วย</TableHead>
                      <TableHead className="text-right">รวม</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="text-sm">
                          {formatDate(expense.date)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {expense.expenseType.name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{expense.description}</p>
                            {expense.notes && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {expense.notes}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {expense.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          ฿{expense.unitPrice.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ฿{expense.total.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            {expense.receiptUrl && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                asChild
                              >
                                <a
                                  href={expense.receiptUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="ดูใบเสร็จ"
                                >
                                  <FileText className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            {canManageExpenses && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => setDeleteExpenseId(expense.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <span className="text-lg font-semibold">รวมค่าใช้จ่ายทั้งหมด</span>
                <span className="text-2xl font-bold text-primary">
                  ฿{totalExpenses.toLocaleString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">ยังไม่มีค่าใช้จ่าย</p>
              {canManageExpenses && (
                <p className="text-xs">
                  คลิกปุ่ม "เพิ่มค่าใช้จ่าย" เพื่อบันทึกรายการ
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Expense Dialog */}
      <ExpenseDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        workOrder={workOrder}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteExpenseId !== null}
        onOpenChange={(open) => !open && setDeleteExpenseId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ที่จะลบค่าใช้จ่ายนี้?
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