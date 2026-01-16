"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useMemo } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Expense } from "@/lib/api/expenses/types";
import { ExpensePermissions } from "@/lib/api/expenses/permissions";
import { EditExpenseDialog } from "./edit-expense-dialog";
import { DeleteExpenseDialog } from "./delete-expense-dialog";

interface ExpensesTableProps {
    data: Expense[];
    permissions: ExpensePermissions;
    onRefresh?: () => void;
}

export function ExpensesTable({ data, permissions, onRefresh }: ExpensesTableProps) {
    const [editExpense, setEditExpense] = useState<Expense | null>(null);
    const [deleteExpense, setDeleteExpense] = useState<Expense | null>(null);

    const formatCurrency = (amount: any) => {
        return new Intl.NumberFormat("th-TH", {
            style: "currency",
            currency: "THB",
        }).format(Number(amount));
    };

    // คำนวณผลรวมค่าใช้จ่ายทั้งหมด
    const totalAmount = useMemo(() => {
        return data.reduce((sum, expense) => sum + Number(expense.total), 0);
    }, [data]);

    const hasActions = permissions.canEdit || permissions.canDelete;

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>วันที่</TableHead>
                            <TableHead>รายการ</TableHead>
                            <TableHead>ประเภท</TableHead>
                            <TableHead>เครื่องจักร / ใบงาน</TableHead>
                            <TableHead className="text-right">จำนวนเงิน</TableHead>
                            {hasActions && <TableHead className="w-[60px]"></TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={hasActions ? 6 : 5} className="h-24 text-center">
                                    ไม่พบข้อมูลค่าใช้จ่าย
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((expense) => (
                                <TableRow key={expense.id}>
                                    <TableCell>
                                        {format(new Date(expense.date), "d MMM yyyy", { locale: th })}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <div>{expense.description}</div>
                                        {expense.notes && <div className="text-xs text-muted-foreground">{expense.notes}</div>}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{expense.expenseType.name}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {expense.equipment && (
                                            <div className="text-sm">
                                                <span className="font-medium">{expense.equipment.name}</span>
                                                <span className="text-xs text-muted-foreground block">{expense.equipment.code}</span>
                                            </div>
                                        )}
                                        {expense.workOrder && (
                                            <div className="text-sm mt-1">
                                                <span className="text-xs bg-muted px-1 rounded">WO: {expense.workOrder.woNumber}</span>
                                            </div>
                                        )}
                                        {!expense.equipment && !expense.workOrder && (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right font-bold">
                                        {formatCurrency(expense.total)}
                                    </TableCell>
                                    {hasActions && (
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">เปิดเมนู</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {permissions.canEdit && (
                                                        <DropdownMenuItem onClick={() => setEditExpense(expense)}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            แก้ไข
                                                        </DropdownMenuItem>
                                                    )}
                                                    {permissions.canDelete && (
                                                        <DropdownMenuItem
                                                            onClick={() => setDeleteExpense(expense)}
                                                            className="text-destructive focus:text-destructive"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            ลบ
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                    {/* แถวผลรวมค่าใช้จ่าย */}
                    {data.length > 0 && (
                        <TableFooter>
                            <TableRow className="bg-muted/50 font-bold">
                                <TableCell colSpan={hasActions ? 5 : 4} className="text-right">
                                    รวมทั้งหมด ({data.length} รายการ)
                                </TableCell>
                                <TableCell className={`text-right text-lg text-primary ${hasActions ? "" : ""}`}>
                                    {formatCurrency(totalAmount)}
                                </TableCell>
                                {hasActions && <TableCell></TableCell>}
                            </TableRow>
                        </TableFooter>
                    )}
                </Table>
            </div>

            {/* Edit Dialog */}
            <EditExpenseDialog
                expense={editExpense}
                open={!!editExpense}
                onOpenChange={(open) => !open && setEditExpense(null)}
                onSuccess={() => {
                    setEditExpense(null);
                    onRefresh?.();
                }}
            />

            {/* Delete Dialog */}
            <DeleteExpenseDialog
                expense={deleteExpense}
                open={!!deleteExpense}
                onOpenChange={(open) => !open && setDeleteExpense(null)}
                onSuccess={() => {
                    setDeleteExpense(null);
                    onRefresh?.();
                }}
            />
        </>
    );
}
