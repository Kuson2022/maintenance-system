"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormDescription,
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
import { toast } from "sonner";
import { adjustStock } from "@/app/actions/inventory";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
    type: z.enum(["IN", "OUT", "ADJUST"]),
    quantity: z.coerce.number().min(0.01, "จำนวนต้องมากกว่า 0"),
    unitPrice: z.coerce.number().optional(),
    notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AdjustStockDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    partId: string;
    partName: string;
    currentStock: number;
    onSuccess?: () => void;
}

export function AdjustStockDialog({
    open,
    onOpenChange,
    partId,
    partName,
    currentStock,
    onSuccess,
}: AdjustStockDialogProps) {
    const [loading, setLoading] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            type: "IN",
            quantity: 1,
            notes: "",
        },
    });

    const onSubmit = async (values: FormValues) => {
        setLoading(true);
        try {
            const result = await adjustStock({
                sparePartId: partId,
                type: values.type,
                quantity: values.quantity,
                unitPrice: values.unitPrice,
                notes: values.notes,
            });

            if (result.success) {
                toast.success("ปรับปรุงสต็อกเรียบร้อยแล้ว");
                onOpenChange(false);
                form.reset();
                if (onSuccess) onSuccess();
            } else {
                toast.error(result.error || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            console.error(error);
            toast.error("เกิดข้อผิดพลาด");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>ปรับปรุงสต็อก: {partName}</DialogTitle>
                    <DialogDescription>
                        สต็อกปัจจุบัน: {currentStock}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>ประเภทรายการ</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="IN">รับเข้า (IN)</SelectItem>
                                            <SelectItem value="OUT">เบิกออก (OUT)</SelectItem>
                                            <SelectItem value="ADJUST">ปรับยอด (ADJUST +/-)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>จำนวน</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="1" {...field} />
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
                                        <FormLabel>ต้นทุนต่อหน่วย (บาท)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" placeholder="เฉพาะรับเข้า" {...field} />
                                        </FormControl>
                                        <FormDescription className="text-xs">
                                            กรอกเมื่อมีการรับเข้าสินค้าใหม่
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>หมายเหตุ</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="เช่น เบิกไปใช้ซ่อมแอร์..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
