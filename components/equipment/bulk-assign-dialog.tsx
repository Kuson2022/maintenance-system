"use client";

/**
 * Bulk Assign Dialog Component
 * Dialog สำหรับมอบหมายผู้รับผิดชอบหลายเครื่องจักรพร้อมกัน
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { bulkAssignResponsibleAction } from "@/app/actions/equipment";
import { getAvailableTechniciansAction } from "@/app/actions/work-orders";

interface Technician {
    id: string;
    name: string;
}

interface BulkAssignDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedIds: string[];
    onSuccess: () => void;
}

export function BulkAssignDialog({
    open,
    onOpenChange,
    selectedIds,
    onSuccess,
}: BulkAssignDialogProps) {
    const [loading, setLoading] = useState(false);
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [selectedTechnician, setSelectedTechnician] = useState<string>("");

    useEffect(() => {
        if (open) {
            fetchTechnicians();
        }
    }, [open]);

    const fetchTechnicians = async () => {
        try {
            const result = await getAvailableTechniciansAction();
            if (result.success && result.data) {
                setTechnicians(result.data);
            }
        } catch (error) {
            console.error("Error fetching technicians:", error);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const userId = selectedTechnician === "unassigned" ? null : selectedTechnician;
            const result = await bulkAssignResponsibleAction(selectedIds, userId);

            if (result.success) {
                const message = userId
                    ? `มอบหมายผู้รับผิดชอบให้ ${selectedIds.length} รายการเรียบร้อยแล้ว`
                    : `ยกเลิกผู้รับผิดชอบ ${selectedIds.length} รายการเรียบร้อยแล้ว`;
                toast.success(message);
                onSuccess();
                onOpenChange(false);
                setSelectedTechnician("");
            } else {
                toast.error(result.error || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการมอบหมายผู้รับผิดชอบ");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        มอบหมายผู้รับผิดชอบ
                    </DialogTitle>
                    <DialogDescription>
                        มอบหมายผู้รับผิดชอบให้เครื่องจักรที่เลือก {selectedIds.length} รายการ
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <label className="text-sm font-medium mb-2 block">
                        เลือกผู้รับผิดชอบ
                    </label>
                    <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                        <SelectTrigger>
                            <SelectValue placeholder="เลือกผู้รับผิดชอบ" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="unassigned">ไม่ระบุ (ยกเลิกผู้รับผิดชอบ)</SelectItem>
                            {technicians.map((tech) => (
                                <SelectItem key={tech.id} value={tech.id}>
                                    {tech.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        ยกเลิก
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading || !selectedTechnician}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                กำลังดำเนินการ...
                            </>
                        ) : (
                            "บันทึก"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
