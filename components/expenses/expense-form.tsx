"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createExpenseSchema, CreateExpenseInput } from "@/lib/api/expenses/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { EquipmentSelector } from "@/components/forms/equipment-selector";
import { getExpenseTypesAction, createExpenseAction } from "@/app/actions/expenses";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function ExpenseForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [expenseTypes, setExpenseTypes] = useState<any[]>([]);

    const form = useForm<CreateExpenseInput>({
        resolver: zodResolver(createExpenseSchema),
        defaultValues: {
            date: new Date(),
            quantity: 1,
            unitPrice: 0,
            description: "",
        },
    });

    useEffect(() => {
        async function fetchTypes() {
            const res = await getExpenseTypesAction();
            if (res.success && res.data) {
                setExpenseTypes(res.data);
            }
        }
        fetchTypes();
    }, []);

    async function onSubmit(data: CreateExpenseInput) {
        setLoading(true);
        try {
            const res = await createExpenseAction(data);
            if (res.success) {
                toast.success("บันทึกค่าใช้จ่ายสำเร็จ");
                router.push("/dashboard/expenses");
            } else {
                toast.error(res.error || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาด");
        } finally {
            setLoading(false);
        }
    }

    const watchEquipment = form.watch("equipmentId");

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            <FormItem>
                                <FormLabel>วันที่</FormLabel>
                                <FormControl>
                                    <Input
                                        type="date"
                                        value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                                        onChange={(e) => field.onChange(new Date(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Equipment Selector */}
                    <div className="md:col-span-2">
                        <EquipmentSelector
                            value={watchEquipment}
                            onChange={(val) => form.setValue("equipmentId", val)}
                            error={form.formState.errors.equipmentId?.message as string}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            * เลือกเครื่องจักรที่เกี่ยวข้องกับค่าใช้จ่ายนี้ (ถ้ามี)
                        </p>
                    </div>


                    {/* Description */}
                    <div className="md:col-span-2">
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>รายการ / รายละเอียด</FormLabel>
                                    <FormControl>
                                        <Input placeholder="เช่น ค่าซ่อมบำรุง, ซื้ออะไหล่..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Quantity */}
                    <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>จำนวน</FormLabel>
                                <FormControl>
                                    <Input type="number" min="1" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Unit Price */}
                    <FormField
                        control={form.control}
                        name="unitPrice"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>ราคาต่อหน่วย</FormLabel>
                                <FormControl>
                                    <Input type="number" min="0" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Notes */}
                    <div className="md:col-span-2">
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>หมายเหตุ (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={() => router.back()}>
                        ยกเลิก
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        บันทึกข้อมูล
                    </Button>
                </div>
            </form>
        </Form>
    );
}
