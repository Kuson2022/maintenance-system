"use client";

/**
 * User Import Excel Dialog Component
 * Dialog สำหรับ import ผู้ใช้จากไฟล์ Excel
 */

import { useState, useCallback } from "react";
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
    Upload,
    FileSpreadsheet,
    Download,
    Loader2,
    AlertCircle,
    CheckCircle,
    X,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { bulkCreateUsers } from "@/lib/api/users/mutations";

interface ImportRow {
    name: string;
    email: string;
    phone?: string;
    position?: string;
    department?: string;
    role?: string;
    error?: string;
    valid: boolean;
}

interface UserImportExcelDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

const REQUIRED_COLUMNS = ["ชื่อ", "อีเมล"];
const OPTIONAL_COLUMNS = ["เบอร์โทร", "ตำแหน่ง", "แผนก", "สิทธิ์"];

export function UserImportExcelDialog({
    open,
    onOpenChange,
    onSuccess,
}: UserImportExcelDialogProps) {
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [previewData, setPreviewData] = useState<ImportRow[]>([]);
    const [step, setStep] = useState<"upload" | "preview" | "result">("upload");
    const [result, setResult] = useState<{ success: number; failed: number; errors: Array<{ row: number; email: string; error: string }> }>({
        success: 0,
        failed: 0,
        errors: [],
    });

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleFileUpload = useCallback(
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (!file) return;

            setLoading(true);
            try {
                const data = await file.arrayBuffer();
                const workbook = XLSX.read(data);
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

                if (jsonData.length === 0) {
                    toast.error("ไฟล์ไม่มีข้อมูล");
                    return;
                }

                // Validate and transform data
                const rows: ImportRow[] = jsonData.map((row) => {
                    const name = String(row["ชื่อ"] || "").trim();
                    const email = String(row["อีเมล"] || "").trim().toLowerCase();
                    const phone = row["เบอร์โทร"]?.toString() || undefined;
                    const position = row["ตำแหน่ง"]?.toString() || undefined;
                    const department = row["แผนก"]?.toString() || undefined;
                    const role = row["สิทธิ์"]?.toString().toUpperCase() || "USER";

                    const errors: string[] = [];
                    if (!name) errors.push("ไม่มีชื่อ");
                    if (!email) errors.push("ไม่มีอีเมล");
                    if (email && !validateEmail(email)) errors.push("อีเมลไม่ถูกต้อง");
                    if (role && !["USER", "TECHNICIAN", "ADMIN"].includes(role)) {
                        errors.push(`สิทธิ์ไม่ถูกต้อง: ${role}`);
                    }

                    return {
                        name,
                        email,
                        phone,
                        position,
                        department,
                        role,
                        error: errors.length > 0 ? errors.join(", ") : undefined,
                        valid: errors.length === 0,
                    };
                });

                // Check for duplicate emails in imported data
                const emailCounts = new Map<string, number>();
                rows.forEach((row) => {
                    if (row.email) {
                        emailCounts.set(row.email, (emailCounts.get(row.email) || 0) + 1);
                    }
                });

                rows.forEach((row) => {
                    if (row.email && (emailCounts.get(row.email) || 0) > 1) {
                        if (row.valid) {
                            row.valid = false;
                            row.error = row.error ? `${row.error}, อีเมลซ้ำในไฟล์` : "อีเมลซ้ำในไฟล์";
                        }
                    }
                });

                setPreviewData(rows);
                setStep("preview");
            } catch (error: unknown) {
                console.error("Error reading file:", error);
                const errorMessage = error instanceof Error ? error.message : "ข้อผิดพลาด";
                toast.error("ไม่สามารถอ่านไฟล์ได้: " + errorMessage);
            } finally {
                setLoading(false);
                // Reset file input
                event.target.value = "";
            }
        },
        []
    );

    const handleImport = async () => {
        const validRows = previewData.filter((row) => row.valid);
        if (validRows.length === 0) {
            toast.error("ไม่มีข้อมูลที่ถูกต้องสำหรับ import");
            return;
        }

        setImporting(true);
        setProgress(0);

        try {
            const userData = validRows.map((row) => ({
                name: row.name,
                email: row.email,
                phone: row.phone,
                position: row.position,
                department: row.department,
                role: row.role,
            }));

            const res = await bulkCreateUsers(userData);

            if (res.success && res.data) {
                setResult({
                    success: res.data.created,
                    failed: res.data.errors.length,
                    errors: res.data.errors,
                });
                setStep("result");
            } else {
                toast.error(res.error || "เกิดข้อผิดพลาดในการ import");
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "ข้อผิดพลาด";
            toast.error("เกิดข้อผิดพลาด: " + errorMessage);
        } finally {
            setImporting(false);
            setProgress(100);
        }
    };

    const handleDownloadTemplate = () => {
        const headers = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS];
        const exampleRows = [
            {
                "ชื่อ": "สมชาย ใจดี",
                "อีเมล": "somchai@example.com",
                "เบอร์โทร": "0812345678",
                "ตำแหน่ง": "วิศวกรซ่อมบำรุง",
                "แผนก": "ฝ่ายซ่อมบำรุง",
                "สิทธิ์": "USER",
            },
            {
                "ชื่อ": "สมหญิง รักงาน",
                "อีเมล": "somying@example.com",
                "เบอร์โทร": "0898765432",
                "ตำแหน่ง": "ช่างเทคนิค",
                "แผนก": "ฝ่ายซ่อมบำรุง",
                "สิทธิ์": "TECHNICIAN",
            },
        ];

        const ws = XLSX.utils.json_to_sheet(exampleRows, { header: headers });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Users");

        // Auto-width columns
        const colWidths = headers.map((h) => ({ wch: Math.max(h.length + 5, 20) }));
        ws["!cols"] = colWidths;

        XLSX.writeFile(wb, "users_import_template.xlsx");
        toast.success("ดาวน์โหลด template สำเร็จ");
    };

    const handleClose = () => {
        if (step === "result" && result.success > 0) {
            onSuccess();
        }
        setPreviewData([]);
        setStep("upload");
        setResult({ success: 0, failed: 0, errors: [] });
        setProgress(0);
        onOpenChange(false);
    };

    const validCount = previewData.filter((r) => r.valid).length;
    const invalidCount = previewData.filter((r) => !r.valid).length;

    const roleLabels: Record<string, string> = {
        USER: "ผู้ใช้ทั่วไป",
        TECHNICIAN: "ช่างเทคนิค",
        ADMIN: "ผู้ดูแลระบบ",
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5" />
                        นำเข้าผู้ใช้จาก Excel
                    </DialogTitle>
                    <DialogDescription>
                        อัปโหลดไฟล์ Excel (.xlsx) เพื่อสร้างผู้ใช้หลายคนพร้อมกัน (รหัสผ่านเริ่มต้น: password123)
                    </DialogDescription>
                </DialogHeader>

                {step === "upload" && (
                    <div className="space-y-4 py-4">
                        <div className="border-2 border-dashed rounded-lg p-8 text-center">
                            <input
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="userFileInput"
                                disabled={loading}
                            />
                            <label
                                htmlFor="userFileInput"
                                className="cursor-pointer flex flex-col items-center gap-2"
                            >
                                {loading ? (
                                    <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
                                ) : (
                                    <Upload className="h-12 w-12 text-muted-foreground" />
                                )}
                                <span className="text-lg font-medium">
                                    {loading ? "กำลังอ่านไฟล์..." : "คลิกเพื่อเลือกไฟล์ Excel"}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    รองรับไฟล์ .xlsx และ .xls
                                </span>
                            </label>
                        </div>

                        <Separator />

                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                                ยังไม่มี template?
                            </span>
                            <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                                <Download className="h-4 w-4 mr-2" />
                                ดาวน์โหลด Template
                            </Button>
                        </div>

                        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                            <p className="font-medium mb-1">คอลัมน์ที่ต้องมี:</p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li><strong>ชื่อ</strong> - ชื่อ-นามสกุล</li>
                                <li><strong>อีเมล</strong> - Email ที่ไม่ซ้ำกัน</li>
                            </ul>
                            <p className="font-medium mt-2 mb-1">คอลัมน์เพิ่มเติม (ไม่บังคับ):</p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li><strong>เบอร์โทร</strong> - หมายเลขโทรศัพท์</li>
                                <li><strong>ตำแหน่ง</strong> - ตำแหน่งงาน</li>
                                <li><strong>แผนก</strong> - แผนกหรือหน่วยงาน</li>
                                <li><strong>สิทธิ์</strong> - USER / TECHNICIAN / ADMIN</li>
                            </ul>
                        </div>
                    </div>
                )}

                {step === "preview" && (
                    <div className="space-y-4 overflow-hidden flex-1 flex flex-col">
                        <div className="flex gap-4">
                            <Badge variant="default" className="py-1">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                ถูกต้อง: {validCount}
                            </Badge>
                            {invalidCount > 0 && (
                                <Badge variant="destructive" className="py-1">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    มีข้อผิดพลาด: {invalidCount}
                                </Badge>
                            )}
                        </div>

                        <div className="border rounded-lg overflow-auto flex-1">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-8">#</TableHead>
                                        <TableHead>ชื่อ</TableHead>
                                        <TableHead>อีเมล</TableHead>
                                        <TableHead>เบอร์โทร</TableHead>
                                        <TableHead>สิทธิ์</TableHead>
                                        <TableHead>สถานะ</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {previewData.slice(0, 50).map((row, index) => (
                                        <TableRow
                                            key={index}
                                            className={!row.valid ? "bg-red-50 dark:bg-red-950/30" : ""}
                                        >
                                            <TableCell className="font-mono text-xs">
                                                {index + 1}
                                            </TableCell>
                                            <TableCell>{row.name}</TableCell>
                                            <TableCell className="font-mono text-sm">{row.email}</TableCell>
                                            <TableCell>{row.phone || "-"}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {roleLabels[row.role || "USER"] || row.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {row.valid ? (
                                                    <Badge variant="outline" className="text-green-600">
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        พร้อม
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="destructive">
                                                        <X className="h-3 w-3 mr-1" />
                                                        {row.error}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {previewData.length > 50 && (
                            <p className="text-sm text-muted-foreground text-center">
                                แสดง 50 จาก {previewData.length} รายการ
                            </p>
                        )}

                        {importing && (
                            <div className="space-y-2">
                                <Progress value={progress} />
                                <p className="text-sm text-center text-muted-foreground">
                                    กำลังนำเข้า... {Math.round(progress)}%
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {step === "result" && (
                    <div className="py-8 text-center space-y-4">
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                        <h3 className="text-xl font-bold">นำเข้าเสร็จสิ้น</h3>
                        <div className="flex justify-center gap-4">
                            <Badge variant="default" className="text-lg py-2 px-4">
                                สำเร็จ: {result.success} คน
                            </Badge>
                            {result.failed > 0 && (
                                <Badge variant="destructive" className="text-lg py-2 px-4">
                                    ล้มเหลว: {result.failed} คน
                                </Badge>
                            )}
                        </div>
                        {result.success > 0 && (
                            <p className="text-sm text-muted-foreground">
                                รหัสผ่านเริ่มต้น: <code className="bg-muted px-2 py-1 rounded">password123</code>
                            </p>
                        )}
                        {result.errors.length > 0 && (
                            <div className="mt-4 text-left max-h-40 overflow-auto border rounded-md p-3">
                                <p className="font-medium text-sm mb-2 text-red-600">รายการที่ไม่สำเร็จ:</p>
                                {result.errors.map((err, i) => (
                                    <p key={i} className="text-sm text-muted-foreground">
                                        แถว {err.row}: {err.email} - {err.error}
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={importing}>
                        {step === "result" ? "ปิด" : "ยกเลิก"}
                    </Button>
                    {step === "preview" && (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setStep("upload");
                                    setPreviewData([]);
                                }}
                                disabled={importing}
                            >
                                เลือกไฟล์ใหม่
                            </Button>
                            <Button
                                onClick={handleImport}
                                disabled={importing || validCount === 0}
                            >
                                {importing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        กำลังนำเข้า...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="mr-2 h-4 w-4" />
                                        นำเข้า {validCount} คน
                                    </>
                                )}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
