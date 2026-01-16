"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
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
import { Plus, Pencil, Trash2, MapPin, ChevronRight, CornerDownRight } from "lucide-react";
import { toast } from "sonner";
import { createLocation, updateLocation, deleteLocation, getLocations } from "@/app/actions/locations";

const formSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "กรุณากรอกชื่อสถานที่"),
    description: z.string().optional(),
    type: z.enum(["SITE", "BUILDING", "FLOOR", "ROOM", "ZONE", "OTHER"]),
    parentId: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

export function LocationSettings() {
    const [locations, setLocations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
            type: "SITE",
            parentId: "none",
        },
    });

    const fetchLocations = async () => {
        setLoading(true);
        const result = await getLocations();
        if (result.success && result.data) {
            setLocations(result.data);
        } else {
            toast.error(result.error || "ไม่สามารถโหลดข้อมูลสถานที่ได้");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchLocations();
    }, []);

    const resetForm = () => {
        form.reset({
            name: "",
            description: "",
            type: "SITE",
            parentId: "none",
        });
        setEditingId(null);
    };

    const handleEdit = (location: any) => {
        setEditingId(location.id);
        form.reset({
            id: location.id,
            name: location.name,
            description: location.description || "",
            type: location.type,
            parentId: location.parentId || "none",
        });
        setDialogOpen(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`คุณต้องการลบสถานที่ "${name}" ใช่หรือไม่?`)) return;

        const result = await deleteLocation(id);
        if (result.success) {
            toast.success("ลบสถานที่เรียบร้อยแล้ว");
            fetchLocations();
        } else {
            toast.error(result.error || "เกิดข้อผิดพลาดในการลบ");
        }
    };

    const onSubmit = async (values: FormValues) => {
        setLoading(true);
        try {
            const data = {
                ...values,
                parentId: values.parentId === "none" ? undefined : values.parentId,
            };

            let result;
            if (editingId) {
                result = await updateLocation(editingId, data as any);
            } else {
                result = await createLocation({
                    ...data,
                    parentId: data.parentId ?? undefined,
                });
            }

            if (result.success) {
                toast.success(editingId ? "แก้ไขสถานที่เรียบร้อยแล้ว" : "เพิ่มสถานที่เรียบร้อยแล้ว");
                setDialogOpen(false);
                fetchLocations();
                resetForm();
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

    // Helper to render hierarchical rows
    const renderRows = (nodes: any[], level = 0): React.ReactNode[] => {
        return nodes.flatMap((node) => [
            <TableRow key={node.id}>
                <TableCell className="font-medium">
                    <div className="flex items-center" style={{ paddingLeft: `${level * 24}px` }}>
                        {level > 0 && <CornerDownRight className="h-4 w-4 mr-2 text-muted-foreground" />}
                        <MapPin className="h-4 w-4 mr-2 text-primary" />
                        {node.name}
                    </div>
                </TableCell>
                <TableCell>{node.type}</TableCell>
                <TableCell>{node.description}</TableCell>
                <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(node)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(node.id, node.name)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </TableCell>
            </TableRow>,
            ...(node.children ? renderRows(node.children, level + 1) : []),
        ]);
    };

    // Helper to get ALL possible parents (flattened list) for the select
    // Simple flatten
    const getFlattenedLocations = (nodes: any[]): any[] => {
        let flat: any[] = [];
        nodes.forEach((node) => {
            flat.push(node);
            if (node.children) {
                flat = flat.concat(getFlattenedLocations(node.children));
            }
        });
        return flat;
    };
    const allLocations = getFlattenedLocations(locations);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        จัดการสถานที่ (Locations)
                    </CardTitle>
                    <CardDescription>
                        จัดการโครงสร้างสถานที่ Site → Building → Floor → Room
                    </CardDescription>
                </div>
                <Dialog open={dialogOpen} onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            เพิ่มสถานที่
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingId ? "แก้ไขสถานที่" : "เพิ่มสถานที่ใหม่"}</DialogTitle>
                            <DialogDescription>
                                กรอกข้อมูลสถานที่เพื่อใช้ในการระบุตำแหน่งเครื่องจักร
                            </DialogDescription>
                        </DialogHeader>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>ชื่อสถานที่</FormLabel>
                                            <FormControl>
                                                <Input placeholder="เช่น โรงงาน 1, ชั้น 2, ห้องเก็บของ" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>ประเภท</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="SITE">Site (สถานที่ตั้งหลัก)</SelectItem>
                                                    <SelectItem value="BUILDING">Building (อาคาร)</SelectItem>
                                                    <SelectItem value="FLOOR">Floor (ชั้น)</SelectItem>
                                                    <SelectItem value="ROOM">Room (ห้อง)</SelectItem>
                                                    <SelectItem value="ZONE">Zone (โซน)</SelectItem>
                                                    <SelectItem value="OTHER">Other (อื่นๆ)</SelectItem>
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
                                            <FormLabel>อยู่ภายใต้ (Parent Location)</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || "none"}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="เลือกสถานที่หลัก (ถ้ามี)" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="none">-- ไม่มี (เป็น Root) --</SelectItem>
                                                    {allLocations.filter(L => L.id !== editingId).map((loc) => (
                                                        <SelectItem key={loc.id} value={loc.id}>
                                                            {loc.name} ({loc.type})
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
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>รายละเอียดเพิ่มเติม</FormLabel>
                                            <FormControl>
                                                <Input placeholder="..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                        ยกเลิก
                                    </Button>
                                    <Button type="submit" disabled={loading}>
                                        {loading ? "กำลังบันทึก..." : "บันทึก"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ชื่อสถานที่</TableHead>
                            <TableHead>ประเภท</TableHead>
                            <TableHead>รายละเอียด</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {locations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                    ยังไม่มีข้อมูลสถานที่
                                </TableCell>
                            </TableRow>
                        ) : (
                            renderRows(locations)
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
