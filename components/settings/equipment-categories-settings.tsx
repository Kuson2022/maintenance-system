"use client";

/**
 * Equipment Categories Settings Component
 * CRUD management for equipment categories (Admin only)
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, Pencil, Trash2, Layers } from "lucide-react";
import { toast } from "sonner";
import {
    getEquipmentCategoriesAction,
    createEquipmentCategoryAction,
    updateEquipmentCategoryAction,
    deleteEquipmentCategoryAction,
} from "@/app/actions/equipment-categories";

interface EquipmentCategory {
    id: string;
    name: string;
    description?: string | null;
    icon?: string | null;
    createdAt: string;
    _count?: {
        equipment: number;
    };
}

export function EquipmentCategoriesSettings() {
    const [categories, setCategories] = useState<EquipmentCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingCategory, setEditingCategory] = useState<EquipmentCategory | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        icon: "",
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const result = await getEquipmentCategoriesAction();
            if (result.success && result.data) {
                setCategories(result.data);
            }
        } catch (error) {
            toast.error("ไม่สามารถโหลดข้อมูลได้");
        } finally {
            setIsLoading(false);
        }
    };

    const openCreateDialog = () => {
        setEditingCategory(null);
        setFormData({ name: "", description: "", icon: "" });
        setIsDialogOpen(true);
    };

    const openEditDialog = (category: EquipmentCategory) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            description: category.description || "",
            icon: category.icon || "",
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            let result;
            if (editingCategory) {
                result = await updateEquipmentCategoryAction(editingCategory.id, formData);
            } else {
                result = await createEquipmentCategoryAction(formData);
            }

            if (result.success) {
                toast.success(editingCategory ? "อัปเดตสำเร็จ" : "เพิ่มสำเร็จ");
                setIsDialogOpen(false);
                fetchCategories();
            } else {
                toast.error(result.error || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาด");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const result = await deleteEquipmentCategoryAction(id);
            if (result.success) {
                toast.success("ลบสำเร็จ");
                fetchCategories();
            } else {
                toast.error(result.error || "ไม่สามารถลบได้");
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาด");
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Layers className="h-5 w-5" />
                            หมวดหมู่เครื่องจักร
                        </CardTitle>
                        <CardDescription>
                            จัดการหมวดหมู่เครื่องจักรในระบบ
                        </CardDescription>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={openCreateDialog}>
                                <Plus className="mr-2 h-4 w-4" />
                                เพิ่มหมวดหมู่
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {editingCategory ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่"}
                                </DialogTitle>
                                <DialogDescription>
                                    กรอกข้อมูลหมวดหมู่เครื่องจักร
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit}>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">ชื่อหมวดหมู่ *</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) =>
                                                setFormData((prev) => ({ ...prev, name: e.target.value }))
                                            }
                                            placeholder="เช่น เครื่องปรับอากาศ, ลิฟต์"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="icon">ไอคอน</Label>
                                        <Input
                                            id="icon"
                                            value={formData.icon}
                                            onChange={(e) =>
                                                setFormData((prev) => ({ ...prev, icon: e.target.value }))
                                            }
                                            placeholder="ชื่อไอคอน (เช่น air-vent, elevator)"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            ใช้ชื่อไอคอนจาก Lucide Icons
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description">คำอธิบาย</Label>
                                        <Textarea
                                            id="description"
                                            value={formData.description}
                                            onChange={(e) =>
                                                setFormData((prev) => ({ ...prev, description: e.target.value }))
                                            }
                                            placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
                                            rows={3}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsDialogOpen(false)}
                                    >
                                        ยกเลิก
                                    </Button>
                                    <Button type="submit" disabled={isSaving}>
                                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {editingCategory ? "บันทึก" : "เพิ่ม"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : categories.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Layers className="mx-auto h-12 w-12 mb-4 opacity-50" />
                        <p>ยังไม่มีหมวดหมู่</p>
                        <p className="text-sm">คลิก "เพิ่มหมวดหมู่" เพื่อเริ่มต้น</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ชื่อหมวดหมู่</TableHead>
                                <TableHead>คำอธิบาย</TableHead>
                                <TableHead className="text-center">จำนวนเครื่องจักร</TableHead>
                                <TableHead className="text-right">การดำเนินการ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categories.map((category) => (
                                <TableRow key={category.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Layers className="h-4 w-4 text-muted-foreground" />
                                            {category.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {category.description || "-"}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {category._count?.equipment || 0}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openEditDialog(category)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive hover:text-destructive"
                                                        disabled={(category._count?.equipment || 0) > 0}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            คุณต้องการลบหมวดหมู่ "{category.name}" หรือไม่?
                                                            การดำเนินการนี้ไม่สามารถย้อนกลับได้
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDelete(category.id)}
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                        >
                                                            ลบ
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
