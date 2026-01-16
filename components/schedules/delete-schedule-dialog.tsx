"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { deleteScheduleAction } from "@/app/actions/schedules";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface DeleteScheduleDialogProps {
    scheduleId: string;
    scheduleName: string;
    onDeleted?: () => void;
    trigger?: React.ReactNode;
}

export function DeleteScheduleDialog({
    scheduleId,
    scheduleName,
    onDeleted,
    trigger,
}: DeleteScheduleDialogProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        try {
            const result = await deleteScheduleAction(scheduleId);

            if (result.success) {
                toast.success("ลบตารางบำรุงรักษาสำเร็จ");
                setOpen(false);
                if (onDeleted) {
                    onDeleted();
                } else {
                    router.push("/dashboard/schedules");
                    router.refresh();
                }
            } else {
                toast.error(result.error || "ไม่สามารถลบตารางบำรุงรักษาได้");
            }
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("เกิดข้อผิดพลาดในการลบ");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                {trigger || (
                    <Button variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" />
                        ลบ
                    </Button>
                )}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>ยืนยันการลบตารางบำรุงรักษา</AlertDialogTitle>
                    <AlertDialogDescription>
                        คุณต้องการลบ <strong>{scheduleName}</strong> หรือไม่?
                        <br />
                        <br />
                        การดำเนินการนี้ไม่สามารถยกเลิกได้ ข้อมูลตารางบำรุงรักษานี้จะถูกลบถาวร
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>
                        ยกเลิก
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleDelete();
                        }}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        ลบตารางบำรุงรักษา
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
