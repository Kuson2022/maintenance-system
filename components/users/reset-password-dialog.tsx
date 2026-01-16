"use client";

/**
 * Reset Password Dialog
 * Dialog สำหรับ Admin รีเซ็ตรหัสผ่านให้ผู้ใช้
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
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, KeyRound, Copy, Check, AlertTriangle } from "lucide-react";
import { resetUserPassword } from "@/lib/api/users/mutations";
import { toast } from "sonner";

interface ResetPasswordDialogProps {
    userId: string;
    userName: string;
}

export function ResetPasswordDialog({ userId, userName }: ResetPasswordDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [tempPassword, setTempPassword] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleReset = async () => {
        setIsLoading(true);
        try {
            const result = await resetUserPassword(userId);
            if (result.success && result.tempPassword) {
                setTempPassword(result.tempPassword);
                toast.success("รีเซ็ตรหัสผ่านสำเร็จ");
            } else {
                toast.error(result.error || "เกิดข้อผิดพลาด");
            }
        } catch {
            toast.error("เกิดข้อผิดพลาดที่ไม่คาดคิด");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = async () => {
        if (tempPassword) {
            await navigator.clipboard.writeText(tempPassword);
            setCopied(true);
            toast.success("คัดลอกรหัสผ่านแล้ว");
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleClose = () => {
        setOpen(false);
        // Reset state after dialog closes
        setTimeout(() => {
            setTempPassword(null);
            setCopied(false);
        }, 200);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <KeyRound className="mr-2 h-4 w-4" />
                    รีเซ็ตรหัสผ่าน
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <KeyRound className="h-5 w-5" />
                        รีเซ็ตรหัสผ่าน
                    </DialogTitle>
                    <DialogDescription>
                        {tempPassword
                            ? `รหัสผ่านใหม่สำหรับ ${userName}`
                            : `คุณต้องการรีเซ็ตรหัสผ่านสำหรับ "${userName}" หรือไม่?`}
                    </DialogDescription>
                </DialogHeader>

                {!tempPassword ? (
                    <>
                        <div className="flex items-center gap-2 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200">
                            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                            <p className="text-sm">
                                การดำเนินการนี้จะสร้างรหัสผ่านใหม่ รหัสผ่านเดิมจะใช้งานไม่ได้อีกต่อไป
                            </p>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                                ยกเลิก
                            </Button>
                            <Button
                                onClick={handleReset}
                                disabled={isLoading}
                                variant="destructive"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        กำลังรีเซ็ต...
                                    </>
                                ) : (
                                    <>
                                        <KeyRound className="mr-2 h-4 w-4" />
                                        รีเซ็ตรหัสผ่าน
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200">
                                <Check className="h-5 w-5 flex-shrink-0" />
                                <p className="text-sm">รีเซ็ตรหัสผ่านสำเร็จ!</p>
                            </div>
                            <div className="space-y-2">
                                <Label>รหัสผ่านชั่วคราว</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={tempPassword}
                                        readOnly
                                        className="font-mono text-lg"
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={handleCopy}
                                    >
                                        {copied ? (
                                            <Check className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    กรุณาคัดลอกและส่งให้ผู้ใช้ รหัสผ่านนี้จะแสดงเพียงครั้งเดียว
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleClose}>ปิด</Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
