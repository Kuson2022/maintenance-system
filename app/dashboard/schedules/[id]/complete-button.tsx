"use client";

import { Button } from "@/components/ui/button";
import { completeScheduleAction } from "@/app/actions/schedules";
import { CheckCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ChecklistItem } from "@/lib/api/schedules/types";

interface CompleteScheduleButtonProps {
    scheduleId: string;
    checklist?: ChecklistItem[];
}

export function CompleteScheduleButton({ scheduleId, checklist = [] }: CompleteScheduleButtonProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [results, setResults] = useState<Record<string, any>>({});
    const [notes, setNotes] = useState("");

    const handleResultChange = (id: string, value: any) => {
        setResults((prev) => ({ ...prev, [id]: value }));
    };

    const handleComplete = async () => {
        // Validate required fields
        const missingRequired = checklist.filter(
            (item) => item.required && !results[item.id] && results[item.id] !== false
        );

        if (missingRequired.length > 0) {
            toast.error(`กรุณากรอกข้อมูลที่จำเป็น: ${missingRequired.map((i) => i.task).join(", ")}`);
            return;
        }

        setLoading(true);
        try {
            // Include notes in results
            const finalResults = { ...results, notes };

            const result = await completeScheduleAction(scheduleId, finalResults);

            if (result.success) {
                toast.success("บันทึกผลการบำรุงรักษาสำเร็จ!");
                setOpen(false);
                router.refresh();
            } else {
                toast.error(result.error || "ไม่สามารถบันทึกผลได้");
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการบันทึก");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                    <CheckCheck className="mr-2 h-4 w-4" />
                    Complete Maintenance
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>บันทึกผลการบำรุงรักษา</DialogTitle>
                    <DialogDescription>
                        กรอกข้อมูลการตรวจสอบด้านล่างเพื่อบันทึกผลการบำรุงรักษา
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                    {checklist.length === 0 && (
                        <p className="text-sm text-muted-foreground italic">
                            ไม่มีรายการตรวจสอบที่กำหนดไว้
                        </p>
                    )}

                    {checklist.map((item) => (
                        <div key={item.id} className="space-y-2 border-b pb-3 last:border-0">
                            <Label htmlFor={item.id} className="text-base font-medium flex items-center gap-2">
                                {item.task}
                                {item.required && <span className="text-red-500">*</span>}
                            </Label>

                            {item.inputType === "BOOLEAN" && (
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id={item.id}
                                        checked={results[item.id] || false}
                                        onCheckedChange={(checked) => handleResultChange(item.id, checked)}
                                    />
                                    <Label htmlFor={item.id} className="font-normal text-muted-foreground">
                                        ผ่าน / ตรวจสอบแล้ว
                                    </Label>
                                </div>
                            )}

                            {item.inputType === "TEXT" && (
                                <Input
                                    id={item.id}
                                    placeholder="กรอกข้อมูล..."
                                    value={results[item.id] || ""}
                                    onChange={(e) => handleResultChange(item.id, e.target.value)}
                                />
                            )}

                            {item.inputType === "NUMBER" && (
                                <div className="flex items-center gap-2">
                                    <Input
                                        id={item.id}
                                        type="number"
                                        placeholder="0.00"
                                        className="w-full"
                                        value={results[item.id] || ""}
                                        onChange={(e) => handleResultChange(item.id, e.target.value)}
                                    />
                                    {item.unit && <span className="text-sm font-medium">{item.unit}</span>}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Notes section */}
                    <div className="space-y-2 pt-2 border-t">
                        <Label htmlFor="notes" className="text-base font-medium">
                            หมายเหตุ (ไม่บังคับ)
                        </Label>
                        <Textarea
                            id="notes"
                            placeholder="บันทึกข้อสังเกตหรือหมายเหตุเพิ่มเติม..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        ยกเลิก
                    </Button>
                    <Button onClick={handleComplete} disabled={loading} className="bg-green-600 hover:bg-green-700">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        บันทึกผล
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
