"use client";

/**
 * Bulk Status Dialog Component
 * Dialog สำหรับเปลี่ยนสถานะหลายเครื่องจักรพร้อมกัน
 */

import { useState } from "react";
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
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { bulkUpdateStatusAction } from "@/app/actions/equipment";
import { EquipmentStatus } from "@prisma/client";

interface BulkStatusDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedIds: string[];
    onSuccess: () => void;
}

const statusOptions = [
    { value: "ACTIVE", label: "พร้อมใช้งาน" },
    { value: "INACTIVE", label: "ไม่พร้อมใช้งาน" },
    { value: "MAINTENANCE", label: "กำลังซ่อมบำรุง" },
    { value: "RETIRED", label: "ปลดระวาง" },
];

export function BulkStatusDialog({
    open,
    onOpenChange,
    selectedIds,
    onSuccess,
}: BulkStatusDialogProps) {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string>("");

    const handleSubmit = async () => {
        if (!status) {
            toast.error("กรุณาเลือกสถานะ");
            return;
        }

        setLoading(true);
        try {
            const result = await bulkUpdateStatusAction(
                selectedIds,
                status as EquipmentStatus
            );

            if (result.success) {
                toast.success(`เปลี่ยนสถานะ ${selectedIds.length} รายการเรียบร้อยแล้ว`);
                onSuccess();
                onOpenChange(false);
                setStatus("");
            } else {
                toast.error(result.error || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <RefreshCw className="h-5 w-5" />
                        เปลี่ยนสถานะหลายรายการ
                    </DialogTitle>
                    <DialogDescription>
                        เปลี่ยนสถานะเครื่องจักรที่เลือก {selectedIds.length} รายการ
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <label className="text-sm font-medium mb-2 block">
                        เลือกสถานะใหม่
                    </label>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger>
                            <SelectValue placeholder="เลือกสถานะ" />
                        </SelectTrigger>
                        <SelectContent>
                            {statusOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
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
                    <Button onClick={handleSubmit} disabled={loading || !status}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                กำลังดำเนินการ...
                            </>
                        ) : (
                            "เปลี่ยนสถานะ"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
