"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { createSparePart, updateSparePart } from "@/app/actions/inventory";
import { getAllLocationsFlat } from "@/app/actions/locations";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
    name: z.string().min(1, "กรุณากรอกชื่ออะไหล่"),
    code: z.string().min(1, "กรุณากรอกรหัสอะไหล่"),
    category: z.string().optional(),
    unit: z.string().min(1, "กรุณาระบุหน่วยนับ"),
    unitPrice: z.coerce.number().min(0),
    description: z.string().optional(),
    locationId: z.string().optional().nullable(),
    minStockLevel: z.coerce.number().min(0),
    maxStockLevel: z.coerce.number().min(0).optional(),
    reorderPoint: z.coerce.number().min(0).optional(),
    supplier: z.string().optional(),
    initialStock: z.coerce.number().min(0).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SparePartFormProps {
    part?: any; // SparePart type
    onSuccess?: () => void;
    mode?: "create" | "edit";
}

export function SparePartForm({ part, onSuccess, mode = "create" }: SparePartFormProps) {
    const [loading, setLoading] = useState(false);
    const [locations, setLocations] = useState<any[]>([]);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name: part?.name || "",
            code: part?.code || "",
            category: part?.category || "",
            unit: part?.unit || "ชิ้น",
            unitPrice: part?.unitPrice ? Number(part.unitPrice) : 0,
            description: part?.description || "",
            locationId: part?.locationId || "unassigned",
            minStockLevel: part?.minStockLevel || 0,
            maxStockLevel: part?.maxStockLevel || 0,
            reorderPoint: part?.reorderPoint || 0,
            supplier: part?.supplier || "",
            initialStock: 0, // Only for create
        },
    });

    useEffect(() => {
        async function loadLocations() {
            const result = await getAllLocationsFlat();
            if (result.success && result.data) {
                setLocations(result.data);
            }
        }
        loadLocations();
    }, []);

    const onSubmit = async (values: FormValues) => {
        setLoading(true);
        try {
            const payload = {
                ...values,
                locationId: (values.locationId && values.locationId !== "unassigned") ? values.locationId : undefined,
            };

            let result;
            if (mode === "edit" && part) {
                result = await updateSparePart(part.id, payload);
            } else {
                result = await createSparePart(payload);
            }

            if (result.success) {
                toast.success(mode === "create" ? "เพิ่มอะไหล่เรียบร้อย" : "แก้ไขอะไหล่เรียบร้อย");
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
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>รหัสอะไหล่ *</FormLabel>
                                <FormControl>
                                    <Input placeholder="เช่น SP-001" {...field} disabled={mode === "edit"} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>ชื่ออะไหล่ *</FormLabel>
                                <FormControl>
                                    <Input placeholder="เช่น ไส้กรอง A" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>หมวดหมู่</FormLabel>
                                <FormControl>
                                    <Input placeholder="เช่น ไฟฟ้า, ประปา" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="unit"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>หน่วยนับ *</FormLabel>
                                <FormControl>
                                    <Input placeholder="เช่น ชิ้น, กล่อง, เมตร" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="unitPrice"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>ราคาต่อหน่วย (บาท)</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="locationId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>สถานที่จัดเก็บ</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || "unassigned"}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="เลือกสถานที่" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="unassigned">ไม่ระบุ</SelectItem>
                                        {locations.map((loc) => (
                                            <SelectItem key={loc.id} value={loc.id}>
                                                {loc.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="minStockLevel"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>ขั้นต่ำ (Min)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="reorderPoint"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>จุดสั่งซื้อ (Reorder)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="maxStockLevel"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>สูงสุด (Max)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {mode === "create" && (
                    <FormField
                        control={form.control}
                        name="initialStock"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>จำนวนเริ่มต้น (Stock)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormDescription>จำนวนสินค้าที่มีอยู่จริงในปัจจุบัน</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <FormField
                    control={form.control}
                    name="supplier"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>ผู้จำหน่าย (Supplier)</FormLabel>
                            <FormControl>
                                <Input placeholder="ชื่อร้านค้า หรือ บริษัทคู่ค้า" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>รายละเอียดเพิ่มเติม</FormLabel>
                            <FormControl>
                                <Textarea placeholder="..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-2 pt-2">
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {mode === "create" ? "เพิ่มอะไหล่" : "บันทึกแก้ไข"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
