"use client";

/**
 * Expense Types Settings Component
 * CRUD management for expense types (Admin only)
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
import { Loader2, Plus, Pencil, Trash2, DollarSign } from "lucide-react";
import { toast } from "sonner";
import {
    getExpenseTypesWithCountAction,
    createExpenseTypeAction,
    updateExpenseTypeAction,
    deleteExpenseTypeAction,
} from "@/app/actions/expenses";

interface ExpenseType {
    id: string;
    name: string;
    description?: string | null;
    createdAt: string;
    _count?: {
        expenses: number;
    };
}

export function ExpenseTypesSettings() {
    const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingType, setEditingType] = useState<ExpenseType | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
    });

    useEffect(() => {
        fetchExpenseTypes();
    }, []);

    const fetchExpenseTypes = async () => {
        setIsLoading(true);
        try {
            const result = await getExpenseTypesWithCountAction();
            if (result.success && result.data) {
                setExpenseTypes(result.data);
            }
        } catch (error) {
            toast.error("ไม่สามารถโหลดข้อมูลได้");
        } finally {
            setIsLoading(false);
        }
    };

    const openCreateDialog = () => {
        setEditingType(null);
        setFormData({ name: "", description: "" });
        setIsDialogOpen(true);
    };

    const openEditDialog = (type: ExpenseType) => {
        setEditingType(type);
        setFormData({
            name: type.name,
            description: type.description || "",
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            let result;
            if (editingType) {
                result = await updateExpenseTypeAction(editingType.id, formData);
            } else {
                result = await createExpenseTypeAction(formData);
            }

            if (result.success) {
                toast.success(editingType ? "อัปเดตสำเร็จ" : "เพิ่มสำเร็จ");
                setIsDialogOpen(false);
                fetchExpenseTypes();
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
            const result = await deleteExpenseTypeAction(id);
            if (result.success) {
                toast.success("ลบสำเร็จ");
                fetchExpenseTypes();
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
                            <DollarSign className="h-5 w-5" />
                            ประเภทค่าใช้จ่าย
                        </CardTitle>
                        <CardDescription>
                            จัดการประเภทค่าใช้จ่ายในระบบ
                        </CardDescription>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={openCreateDialog}>
                                <Plus className="mr-2 h-4 w-4" />
                                เพิ่มประเภท
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {editingType ? "แก้ไขประเภทค่าใช้จ่าย" : "เพิ่มประเภทค่าใช้จ่าย"}
                                </DialogTitle>
                                <DialogDescription>
                                    กรอกข้อมูลประเภทค่าใช้จ่าย
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit}>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">ชื่อประเภท *</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) =>
                                                setFormData((prev) => ({ ...prev, name: e.target.value }))
                                            }
                                            placeholder="เช่น ค่าอะไหล่, ค่าแรง"
                                            required
                                        />
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
                                        {editingType ? "บันทึก" : "เพิ่ม"}
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
                ) : expenseTypes.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <DollarSign className="mx-auto h-12 w-12 mb-4 opacity-50" />
                        <p>ยังไม่มีประเภทค่าใช้จ่าย</p>
                        <p className="text-sm">คลิก "เพิ่มประเภท" เพื่อเริ่มต้น</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ชื่อประเภท</TableHead>
                                <TableHead>คำอธิบาย</TableHead>
                                <TableHead className="text-center">จำนวนรายการ</TableHead>
                                <TableHead className="text-right">การดำเนินการ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {expenseTypes.map((type) => (
                                <TableRow key={type.id}>
                                    <TableCell className="font-medium">{type.name}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {type.description || "-"}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {type._count?.expenses || 0}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openEditDialog(type)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            คุณต้องการลบประเภท "{type.name}" หรือไม่?
                                                            {(type._count?.expenses || 0) > 0 && (
                                                                <span className="block mt-2 text-destructive">
                                                                    ⚠️ ประเภทนี้มี {type._count?.expenses} รายการค่าใช้จ่ายอ้างอิงอยู่
                                                                </span>
                                                            )}
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDelete(type.id)}
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
