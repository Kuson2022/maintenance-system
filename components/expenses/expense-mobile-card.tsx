"use client";

/**
 * Expense Mobile Card Component
 * แสดงรายการค่าใช้จ่ายแบบ Card สำหรับมือถือ
 */

import { useState } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    MoreVertical,
    Pencil,
    Trash2,
    Calendar,
    DollarSign,
    Tag,
    Wrench,
    Package,
} from "lucide-react";
import { Expense } from "@/lib/api/expenses/types";
import { ExpensePermissions } from "@/lib/api/expenses/permissions";
import { EditExpenseDialog } from "./edit-expense-dialog";
import { DeleteExpenseDialog } from "./delete-expense-dialog";

interface ExpenseMobileCardProps {
    expense: Expense;
    permissions: ExpensePermissions;
    onRefresh?: () => void;
}

export function ExpenseMobileCard({
    expense,
    permissions,
    onRefresh,
}: ExpenseMobileCardProps) {
    const [editExpense, setEditExpense] = useState<Expense | null>(null);
    const [deleteExpense, setDeleteExpense] = useState<Expense | null>(null);

    const formatCurrency = (amount: any) => {
        return new Intl.NumberFormat("th-TH", {
            style: "currency",
            currency: "THB",
        }).format(Number(amount));
    };

    const hasActions = permissions.canEdit || permissions.canDelete;

    return (
        <>
            <Card className="transition-all hover:shadow-md">
                <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-2">
                            {/* Description & Amount */}
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-base truncate">
                                        {expense.description}
                                    </p>
                                    {expense.notes && (
                                        <p className="text-sm text-muted-foreground truncate">
                                            {expense.notes}
                                        </p>
                                    )}
                                </div>
                                <p className="text-lg font-bold text-primary whitespace-nowrap">
                                    {formatCurrency(expense.total)}
                                </p>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                {/* Date */}
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>{format(new Date(expense.date), "d MMM yyyy", { locale: th })}</span>
                                </div>

                                {/* Type */}
                                <div className="flex items-center gap-1.5">
                                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                                    <Badge variant="outline" className="text-xs">
                                        {expense.expenseType.name}
                                    </Badge>
                                </div>

                                {/* Equipment */}
                                {expense.equipment && (
                                    <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                                        <Package className="h-3.5 w-3.5" />
                                        <span className="truncate">
                                            {expense.equipment.name} ({expense.equipment.code})
                                        </span>
                                    </div>
                                )}

                                {/* Work Order */}
                                {expense.workOrder && (
                                    <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                                        <Wrench className="h-3.5 w-3.5" />
                                        <span>WO: {expense.workOrder.woNumber}</span>
                                    </div>
                                )}

                                {/* Quantity x Unit Price */}
                                <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                                    <DollarSign className="h-3.5 w-3.5" />
                                    <span>
                                        {expense.quantity} x {formatCurrency(expense.unitPrice)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions Menu */}
                        {hasActions && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreVertical className="h-4 w-4" />
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
                        )}
                    </div>
                </CardContent>
            </Card>

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

interface ExpenseMobileListProps {
    expenses: Expense[];
    permissions: ExpensePermissions;
    onRefresh?: () => void;
}

export function ExpenseMobileList({
    expenses,
    permissions,
    onRefresh,
}: ExpenseMobileListProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("th-TH", {
            style: "currency",
            currency: "THB",
        }).format(amount);
    };

    const totalAmount = expenses.reduce((sum, expense) => sum + Number(expense.total), 0);

    if (expenses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <DollarSign className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">ไม่พบค่าใช้จ่าย</p>
                <p className="text-sm text-muted-foreground mt-1">
                    ลองเปลี่ยน filter หรือเพิ่มค่าใช้จ่ายใหม่
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {expenses.map((expense) => (
                <ExpenseMobileCard
                    key={expense.id}
                    expense={expense}
                    permissions={permissions}
                    onRefresh={onRefresh}
                />
            ))}

            {/* Total Summary Card */}
            <Card className="bg-primary/10 border-primary/20">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <span className="font-medium">รวมทั้งหมด ({expenses.length} รายการ)</span>
                        <span className="text-xl font-bold text-primary">
                            {formatCurrency(totalAmount)}
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
