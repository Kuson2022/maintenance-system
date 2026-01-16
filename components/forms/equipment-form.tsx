"use client";

/**
 * Equipment Form Component
 * ฟอร์มสำหรับเพิ่ม/แก้ไขเครื่องจักร
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler, useFieldArray } from "react-hook-form";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, CalendarIcon, Save, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    createEquipmentAction,
    updateEquipmentAction,
    getEquipmentCategoriesAction,
    getActiveEquipmentAction,
} from "@/app/actions/equipment";
import { getAllLocationsFlat } from "@/app/actions/locations";
import { getAvailableTechniciansAction } from "@/app/actions/work-orders";
import { SerializedEquipment } from "@/lib/api/equipment/types";
import { ImageUpload } from "@/components/forms/image-upload";
import { FileUpload } from "@/components/forms/file-upload";
import { uploadFile } from "@/lib/supabase/upload-file";

const formSchema = z.object({
    code: z
        .string()
        .min(1, "กรุณากรอกรหัสเครื่องจักร")
        .max(50)
        .regex(/^[A-Za-z0-9-_]+$/, "รหัสต้องเป็น A-Z, 0-9, - หรือ _ เท่านั้น"),
    name: z.string().min(2, "กรุณากรอกชื่อเครื่องจักร").max(200),
    categoryId: z.string().min(1, "กรุณาเลือกหมวดหมู่"),
    type: z.string().max(100).optional(),
    manufacturer: z.string().max(200).optional(),
    model: z.string().max(200).optional(),
    serialNumber: z.string().max(100).optional(),
    location: z.string().max(200).optional(),
    floor: z.string().max(50).optional(),
    installationDate: z.date().optional().nullable(),
    warrantyExpiry: z.date().optional().nullable(),
    cost: z.coerce.number().min(0).optional().nullable(),
    status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE", "RETIRED"]),
    description: z.string().max(2000).optional(),
    manualUrl: z.string().optional().or(z.literal("")),
    specifications: z.array(z.object({
        key: z.string(),
        value: z.string()
    })).optional().nullable(),
    responsiblePersonId: z.string().optional(),
    supplierContact: z.string().max(500).optional(),
    image: z.string().optional().nullable(),
    parentId: z.string().optional().nullable(),
    locationId: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface Category {
    id: string;
    name: string;
}

interface Technician {
    id: string;
    name: string;
}

interface EquipmentFormProps {
    equipment?: SerializedEquipment;
    mode: "create" | "edit";
}

export function EquipmentForm({ equipment, mode }: EquipmentFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [files, setFiles] = useState<File[]>([]);
    const [manualFiles, setManualFiles] = useState<File[]>([]);
    const [parents, setParents] = useState<{ id: string; name: string; code: string }[]>([]);
    const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            code: equipment?.code || "",
            name: equipment?.name || "",
            categoryId: equipment?.categoryId || "",
            type: equipment?.type || "",
            manufacturer: equipment?.manufacturer || "",
            model: equipment?.model || "",
            serialNumber: equipment?.serialNumber || "",
            location: equipment?.location || "", // Keep backward compatibility
            locationId: equipment?.locationId || undefined,
            parentId: equipment?.parentId || undefined,
            floor: equipment?.floor || "",
            installationDate: equipment?.installationDate
                ? new Date(equipment.installationDate)
                : null,
            warrantyExpiry: equipment?.warrantyExpiry
                ? new Date(equipment.warrantyExpiry)
                : null,
            cost: equipment?.cost || undefined,
            status: equipment?.status || "ACTIVE",
            description: equipment?.description || "",
            manualUrl: equipment?.manualUrl || "",
            responsiblePersonId: equipment?.responsiblePersonId || "unassigned",
            supplierContact: equipment?.supplierContact || "",
            image: equipment?.image || "",
            specifications: Array.isArray(equipment?.specifications)
                ? equipment.specifications
                : (equipment?.specifications && typeof equipment.specifications === 'object')
                    ? Object.entries(equipment.specifications).map(([key, value]) => ({ key, value: String(value) }))
                    : [],
        },
    });

    const { fields: specFields, append: appendSpec, remove: removeSpec } = useFieldArray({
        control: form.control,
        name: "specifications" as any, // dynamic field
    });

    // Fetch categories, technicians, parents, locations
    useEffect(() => {
        async function fetchData() {
            try {
                const [catResult, techResult, parentResult, locResult] = await Promise.all([
                    getEquipmentCategoriesAction(),
                    getAvailableTechniciansAction(),
                    getActiveEquipmentAction(),
                    getAllLocationsFlat(),
                ]);

                if (catResult.success && catResult.data) {
                    setCategories(catResult.data.map((c: any) => ({ id: c.id, name: c.name })));
                }

                if (techResult.success && techResult.data) {
                    setTechnicians(techResult.data.map((t: any) => ({ id: t.id, name: t.name })));
                }

                if (parentResult.success && parentResult.data) {
                    // Filter out self if editing
                    const filteredParents = equipment
                        ? parentResult.data.filter((p: any) => p.id !== equipment.id)
                        : parentResult.data;
                    setParents(filteredParents.map((p: any) => ({ id: p.id, name: p.name, code: p.code })));
                }

                if (locResult.success && locResult.data) {
                    setLocations(locResult.data.map((l: any) => ({ id: l.id, name: l.name })));
                }

            } catch (error) {
                console.error("Error fetching form data:", error);
            }
        }
        fetchData();
    }, [equipment]);

    const onSubmit: SubmitHandler<FormValues> = async (values) => {
        setLoading(true);
        try {
            let imageUrl = values.image;

            if (files.length > 0) {
                const result = await uploadFile(files[0], "equipment");
                if (result) {
                    imageUrl = result.url;
                }
            }

            let manualUrl = values.manualUrl;
            if (manualFiles.length > 0) {
                const result = await uploadFile(manualFiles[0], "manuals");
                if (result) {
                    manualUrl = result.url;
                }
            }

            const data = {
                ...values,
                image: imageUrl,
                manualUrl: manualUrl || null,
                responsiblePersonId: (values.responsiblePersonId && values.responsiblePersonId !== "unassigned") ? values.responsiblePersonId : null,
                parentId: (values.parentId && values.parentId !== "none") ? values.parentId : null,
                locationId: (values.locationId && values.locationId !== "none") ? values.locationId : null,
                serialNumber: values.serialNumber || null,
            };

            let result;
            if (mode === "create") {
                result = await createEquipmentAction(data);
            } else {
                result = await updateEquipmentAction({ id: equipment!.id, ...data });
            }

            if (result.success) {
                toast.success(
                    mode === "create"
                        ? "เพิ่มเครื่องจักรเรียบร้อยแล้ว"
                        : "อัปเดตเครื่องจักรเรียบร้อยแล้ว"
                );
                if (mode === "edit" && equipment) {
                    router.push(`/dashboard/equipment/${equipment.id}`);
                } else if (mode === "create" && result.data) {
                    // Redirect to the new equipment detail page
                    router.push(`/dashboard/equipment/${(result.data as any).id}`);
                } else {
                    router.push("/dashboard/equipment");
                }
                router.refresh();
            } else {
                toast.error(result.error || "เกิดข้อผิดพลาด");
            }
        } catch (error: any) {
            toast.error(error.message || "เกิดข้อผิดพลาด");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>ข้อมูลพื้นฐาน</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="image"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>รูปภาพเครื่องจักร</FormLabel>
                                    <FormControl>
                                        <ImageUpload
                                            value={files}
                                            onChange={(newFiles) => {
                                                setFiles(newFiles);
                                                // Clear string value if new file is selected, or keep it if not?
                                                // Actually ImageUpload handles display. 
                                                // If we have a file, that takes precedence for upload.
                                                // But if we remove file, we might want to keep the old text value? 
                                                // No, ImageUpload logic for "initialImage" handles display. 
                                                // Ideally if user clears image in ImageUpload, we should clear 'image' field too if it was prefilled.
                                                // But ImageUpload 'onChange' gives us Files[]. 
                                                // If File[] is empty, and we had an initialImage, did user want to delete it?
                                                // Current ImageUpload implementation:
                                                // If initialImage exists, previews has it.
                                                // If user clicks remove on initial image, previews becomes empty.
                                                // But 'value' (files) is also empty.
                                                // We need a way to know "user deleted the initial image".
                                                // For now, let's assume if files is empty, we don't change anything unless we handle deletion explicitly.
                                                // To keep it simple: We won't support DELETE existing image yet via this simple form unless we add that logic.
                                                // But we can support REPLACING.
                                                // If files.length > 0, we upload and replace.
                                            }}
                                            maxFiles={1}
                                            initialImage={field.value}
                                            onRemoveInitialImage={() => {
                                                form.setValue("image", null, {
                                                    shouldDirty: true,
                                                    shouldValidate: true
                                                });
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>รหัสเครื่องจักร *</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="เช่น AC-001"
                                                {...field}
                                                disabled={mode === "edit"}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            รหัสเฉพาะของเครื่องจักร (ไม่สามารถแก้ไขได้)
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ชื่อเครื่องจักร *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="เช่น แอร์ชั้น 3 ห้อง 301" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="categoryId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>หมวดหมู่ *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="เลือกหมวดหมู่" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {categories.map((cat) => (
                                                    <SelectItem key={cat.id} value={cat.id}>
                                                        {cat.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>สถานะ</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="ACTIVE">พร้อมใช้งาน</SelectItem>
                                                <SelectItem value="INACTIVE">ไม่พร้อมใช้งาน</SelectItem>
                                                <SelectItem value="MAINTENANCE">กำลังซ่อมบำรุง</SelectItem>
                                                <SelectItem value="RETIRED">ปลดระวาง</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>รายละเอียด</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="อธิบายรายละเอียดเครื่องจักร..."
                                            rows={3}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Technical Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>ข้อมูลทางเทคนิค</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ประเภท</FormLabel>
                                        <FormControl>
                                            <Input placeholder="เช่น Split Type" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="manufacturer"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ผู้ผลิต</FormLabel>
                                        <FormControl>
                                            <Input placeholder="เช่น Daikin" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="model"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>รุ่น / Model</FormLabel>
                                        <FormControl>
                                            <Input placeholder="เช่น FTKM12SV2S" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="serialNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Serial Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="หมายเลข Serial" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="location"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ตำแหน่งที่ติดตั้ง (ระบุเอง)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="เช่น อาคาร A ห้อง 301" {...field} />
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
                                        <FormLabel>สถานที่ (Location)</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || "none"}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="เลือกสถานที่" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="none">ไม่ระบุ</SelectItem>
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

                            <FormField
                                control={form.control}
                                name="parentId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>เครื่องจักรแม่ (Parent Equipment)</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || "none"}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="เลือกเครื่องจักรแม่" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="none">ไม่มี</SelectItem>
                                                {parents.map((p) => (
                                                    <SelectItem key={p.id} value={p.id}>
                                                        {p.code} - {p.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="floor"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ชั้น</FormLabel>
                                        <FormControl>
                                            <Input placeholder="เช่น 1, 2, 3 หรือ ชั้นใต้ดิน" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="responsiblePersonId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ผู้รับผิดชอบ</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || "unassigned"}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="เลือกผู้รับผิดชอบ" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="unassigned">ไม่ระบุ</SelectItem>
                                                {technicians.map((tech) => (
                                                    <SelectItem key={tech.id} value={tech.id}>
                                                        {tech.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Specifications */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>สเปคเครื่องจักร</CardTitle>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => appendSpec({ key: "", value: "" })}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            เพิ่มสเปค
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {specFields.map((field, index) => (
                            <div key={field.id} className="flex gap-2 items-start">
                                <FormField
                                    control={form.control}
                                    name={`specifications.${index}.key` as any}
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormControl>
                                                <Input placeholder="ชื่อค่า (เช่น สี, กำลังไฟ)" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`specifications.${index}.value` as any}
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormControl>
                                                <Input placeholder="ค่า (เช่น ขาว, 220V)" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeSpec(index)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        {specFields.length === 0 && (
                            <div className="text-center p-4 border border-dashed rounded-lg text-muted-foreground text-sm">
                                ยังไม่มีข้อมูลสเปค
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Purchase Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>ข้อมูลการจัดซื้อ</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-3">
                            <FormField
                                control={form.control}
                                name="cost"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ราคา (บาท)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="0.00"
                                                {...field}
                                                value={field.value ?? ""}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="installationDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>วันที่ติดตั้ง</FormLabel>
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
                                                            format(field.value, "d MMM yyyy", { locale: th })
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
                                                    selected={field.value || undefined}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date > new Date() || date < new Date("1900-01-01")
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="warrantyExpiry"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>วันหมดประกัน</FormLabel>
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
                                                            format(field.value, "d MMM yyyy", { locale: th })
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
                                                    selected={field.value || undefined}
                                                    onSelect={field.onChange}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="supplierContact"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ข้อมูลติดต่อผู้จำหน่าย</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="ชื่อบริษัท, เบอร์โทร, อีเมล..."
                                                rows={2}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="manualUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>คู่มือ (PDF หรือ รูปภาพ)</FormLabel>
                                        <FormControl>
                                            <FileUpload
                                                value={manualFiles}
                                                onChange={setManualFiles} // Just update files state
                                                maxFiles={1}
                                                accept=".pdf,image/*"
                                                initialFile={field.value}
                                                onRemoveInitialFile={() => form.setValue("manualUrl", "")}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            อัพโหลดไฟล์คู่มือ PDF หรือรูปภาพ
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={loading}
                    >
                        ยกเลิก
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                กำลังบันทึก...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                {mode === "create" ? "เพิ่มเครื่องจักร" : "บันทึกการแก้ไข"}
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
