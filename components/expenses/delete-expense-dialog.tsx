"use client";

/**
 * Delete Expense Dialog
 * Dialog ยืนยันการลบรายการค่าใช้จ่าย
 */

import { useState } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Loader2, AlertTriangle } from "lucide-react";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Expense } from "@/lib/api/expenses/types";
import { deleteExpenseAction } from "@/app/actions/expenses";

interface DeleteExpenseDialogProps {
    expense: Expense | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function DeleteExpenseDialog({
    expense,
    open,
    onOpenChange,
    onSuccess,
}: DeleteExpenseDialogProps) {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!expense) return;

        setLoading(true);
        try {
            const res = await deleteExpenseAction(expense.id);
            if (res.success) {
                toast.success("ลบค่าใช้จ่ายสำเร็จ");
                onSuccess?.();
            } else {
                toast.error(res.error || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาด");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: any) => {
        return new Intl.NumberFormat("th-TH", {
            style: "currency",
            currency: "THB",
        }).format(Number(amount));
    };

    if (!expense) return null;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        ยืนยันการลบค่าใช้จ่าย
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-3">
                            <p>
                                คุณแน่ใจหรือไม่ที่จะลบค่าใช้จ่ายนี้? การกระทำนี้ไม่สามารถย้อนกลับได้
                            </p>
                            <div className="bg-muted rounded-lg p-3 space-y-1">
                                <p className="font-medium">{expense.description}</p>
                                <p className="text-sm">
                                    วันที่: {format(new Date(expense.date), "d MMMM yyyy", { locale: th })}
                                </p>
                                <p className="text-sm">
                                    ประเภท: {expense.expenseType.name}
                                </p>
                                <p className="text-lg font-bold text-primary">
                                    {formatCurrency(expense.total)}
                                </p>
                            </div>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        ยกเลิก
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={loading}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        ลบ
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
