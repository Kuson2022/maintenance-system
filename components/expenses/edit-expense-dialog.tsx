"use client";

/**
 * Edit Expense Dialog
 * Dialog สำหรับแก้ไขรายการค่าใช้จ่าย
 */

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Expense } from "@/lib/api/expenses/types";
import { updateExpenseSchema, UpdateExpenseInput } from "@/lib/api/expenses/validation";
import { getExpenseTypesAction, updateExpenseAction } from "@/app/actions/expenses";

interface EditExpenseDialogProps {
    expense: Expense | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

interface ExpenseType {
    id: string;
    name: string;
}

export function EditExpenseDialog({
    expense,
    open,
    onOpenChange,
    onSuccess,
}: EditExpenseDialogProps) {
    const [loading, setLoading] = useState(false);
    const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);

    const form = useForm<UpdateExpenseInput>({
        resolver: zodResolver(updateExpenseSchema),
    });

    // Load expense types
    useEffect(() => {
        async function fetchTypes() {
            const res = await getExpenseTypesAction();
            if (res.success && res.data) {
                setExpenseTypes(res.data);
            }
        }
        if (open) {
            fetchTypes();
        }
    }, [open]);

    // Reset form when expense changes
    useEffect(() => {
        if (expense && open) {
            form.reset({
                id: expense.id,
                expenseTypeId: expense.expenseTypeId,
                description: expense.description,
                quantity: expense.quantity,
                unitPrice: Number(expense.unitPrice),
                date: new Date(expense.date),
                receiptUrl: expense.receiptUrl || undefined,
                notes: expense.notes || undefined,
                equipmentId: expense.equipmentId || undefined,
                workOrderId: expense.workOrderId || undefined,
            });
        }
    }, [expense, open, form]);

    const onSubmit = async (data: UpdateExpenseInput) => {
        setLoading(true);
        try {
            const res = await updateExpenseAction(data);
            if (res.success) {
                toast.success("แก้ไขค่าใช้จ่ายสำเร็จ");
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

    const watchQuantity = form.watch("quantity") || 0;
    const watchUnitPrice = form.watch("unitPrice") || 0;
    const calculatedTotal = watchQuantity * watchUnitPrice;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("th-TH", {
            style: "currency",
            currency: "THB",
        }).format(amount);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>แก้ไขค่าใช้จ่าย</DialogTitle>
                    <DialogDescription>
                        แก้ไขรายละเอียดค่าใช้จ่าย
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Expense Type */}
                        <FormField
                            control={form.control}
                            name="expenseTypeId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>ประเภทค่าใช้จ่าย</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="เลือกประเภท..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {expenseTypes.map((type) => (
                                                <SelectItem key={type.id} value={type.id}>
                                                    {type.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Date */}
                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>วันที่</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "d MMMM yyyy", { locale: th })
                                                    ) : (
                                                        <span>เลือกวันที่</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Description */}
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>รายละเอียด</FormLabel>
                                    <FormControl>
                                        <Input placeholder="รายละเอียดค่าใช้จ่าย..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Quantity and Unit Price */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>จำนวน</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={field.value || ""}
                                                onChange={(e) => {
                                                    const parsed = parseInt(e.target.value);
                                                    field.onChange(isNaN(parsed) ? 1 : parsed);
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="unitPrice"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ราคาต่อหน่วย (฿)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={field.value || ""}
                                                onChange={(e) => {
                                                    const parsed = parseFloat(e.target.value);
                                                    field.onChange(isNaN(parsed) ? 0 : parsed);
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Total Display */}
                        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">ราคารวม</span>
                                <span className="text-xl font-bold text-primary">
                                    {formatCurrency(calculatedTotal)}
                                </span>
                            </div>
                        </div>

                        {/* Notes */}
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>หมายเหตุ (ถ้ามี)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="หมายเหตุเพิ่มเติม..." rows={2} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={loading}
                            >
                                ยกเลิก
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                บันทึก
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
