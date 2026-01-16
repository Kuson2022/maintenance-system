"use client";

/**
 * Import Excel Dialog Component
 * Dialog สำหรับ import ข้อมูลเครื่องจักรจากไฟล์ Excel
 */

import { useState, useCallback, useEffect } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { bulkCreateEquipmentAction, getEquipmentCategoriesAction } from "@/app/actions/equipment";

interface Category {
    id: string;
    name: string;
}

interface ImportRow {
    code: string;
    name: string;
    categoryName: string;
    categoryId?: string;
    type?: string;
    manufacturer?: string;
    model?: string;
    serialNumber?: string;
    location?: string;
    floor?: string;
    installationDate?: string;
    warrantyExpiry?: string;
    cost?: number;
    description?: string;
    specifications?: Record<string, string>;
    status?: string;
    error?: string;
    valid: boolean;
}

interface ImportExcelDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

const REQUIRED_COLUMNS = ["รหัส", "ชื่อ", "หมวดหมู่"];
const OPTIONAL_COLUMNS = [
    "ประเภท",
    "ผู้ผลิต",
    "รุ่น",
    "Serial Number",
    "สถานที่",
    "ชั้น",
    "วันติดตั้ง",
    "วันหมดประกัน",
    "ราคา",
    "รายละเอียด",
    "ข้อมูลจำเพาะ",
];

export function ImportExcelDialog({
    open,
    onOpenChange,
    onSuccess,
}: ImportExcelDialogProps) {
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [categories, setCategories] = useState<Category[]>([]);
    const [previewData, setPreviewData] = useState<ImportRow[]>([]);
    const [step, setStep] = useState<"upload" | "preview" | "result">("upload");
    const [result, setResult] = useState<{ success: number; failed: number }>({
        success: 0,
        failed: 0,
    });

    useEffect(() => {
        if (open) {
            fetchCategories();
        }
    }, [open]);

    const fetchCategories = async () => {
        try {
            const res = await getEquipmentCategoriesAction();
            if (res.success && res.data) {
                setCategories(res.data);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
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
                const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

                if (jsonData.length === 0) {
                    toast.error("ไฟล์ไม่มีข้อมูล");
                    return;
                }

                // Validate and transform data
                const rows: ImportRow[] = jsonData.map((row) => {
                    const code = String(row["รหัส"] || "").trim();
                    const name = String(row["ชื่อ"] || "").trim();
                    const categoryName = String(row["หมวดหมู่"] || "").trim();

                    // Find category ID
                    const category = categories.find(
                        (c) => c.name.toLowerCase() === categoryName.toLowerCase()
                    );

                    const errors: string[] = [];
                    if (!code) errors.push("ไม่มีรหัส");
                    if (!name) errors.push("ไม่มีชื่อ");
                    if (!categoryName) errors.push("ไม่มีหมวดหมู่");
                    if (categoryName && !category) errors.push(`ไม่พบหมวดหมู่ "${categoryName}"`);

                    // Parse dates
                    const parseDate = (value: any): string | undefined => {
                        if (!value) return undefined;
                        if (typeof value === "number") {
                            // Excel date serial number
                            const date = new Date((value - 25569) * 86400 * 1000);
                            return date.toISOString().split("T")[0];
                        }
                        return String(value);
                    };

                    // Parse specifications from key:value|key:value format
                    const parseSpecifications = (value: any): Record<string, string> | undefined => {
                        if (!value) return undefined;
                        const specString = String(value).trim();
                        if (!specString) return undefined;

                        const result: Record<string, string> = {};
                        const pairs = specString.split("|");
                        for (const pair of pairs) {
                            const [key, val] = pair.split(":").map(s => s.trim());
                            if (key && val) {
                                result[key] = val;
                            }
                        }
                        return Object.keys(result).length > 0 ? result : undefined;
                    };

                    return {
                        code,
                        name,
                        categoryName,
                        categoryId: category?.id,
                        type: row["ประเภท"]?.toString() || undefined,
                        manufacturer: row["ผู้ผลิต"]?.toString() || undefined,
                        model: row["รุ่น"]?.toString() || undefined,
                        serialNumber: row["Serial Number"]?.toString() || undefined,
                        location: row["สถานที่"]?.toString() || undefined,
                        floor: row["ชั้น"]?.toString() || undefined,
                        installationDate: parseDate(row["วันติดตั้ง"]),
                        warrantyExpiry: parseDate(row["วันหมดประกัน"]),
                        cost: row["ราคา"] ? Number(row["ราคา"]) : undefined,
                        description: row["รายละเอียด"]?.toString() || undefined,
                        specifications: parseSpecifications(row["ข้อมูลจำเพาะ"]),
                        error: errors.length > 0 ? errors.join(", ") : undefined,
                        valid: errors.length === 0,
                    };
                });

                setPreviewData(rows);
                setStep("preview");
            } catch (error: any) {
                console.error("Error reading file:", error);
                toast.error("ไม่สามารถอ่านไฟล์ได้: " + error.message);
            } finally {
                setLoading(false);
            }
        },
        [categories]
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
            // Transform data for bulk create
            const equipmentData = validRows.map((row) => ({
                code: row.code,
                name: row.name,
                categoryId: row.categoryId!,
                type: row.type,
                manufacturer: row.manufacturer,
                model: row.model,
                serialNumber: row.serialNumber,
                location: row.location,
                floor: row.floor,
                installationDate: row.installationDate,
                warrantyExpiry: row.warrantyExpiry,
                cost: row.cost,
                description: row.description,
                specifications: row.specifications,
            }));

            const res = await bulkCreateEquipmentAction(equipmentData);

            if (res.success) {
                setResult({
                    success: res.data?.created || validRows.length,
                    failed: (res.data?.errors?.length) || 0,
                });
                setStep("result");

                // Trigger immediate list refresh
                window.dispatchEvent(new CustomEvent("equipmentListRefresh"));
            } else {
                toast.error(res.error || "เกิดข้อผิดพลาดในการ import");
            }
        } catch (error: any) {
            toast.error("เกิดข้อผิดพลาด: " + error.message);
        } finally {
            setImporting(false);
            setProgress(100);
        }
    };

    const handleDownloadTemplate = () => {
        const headers = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS];
        const exampleRow = {
            รหัส: "EQ-001",
            ชื่อ: "เครื่องปรับอากาศ",
            หมวดหมู่: "ระบบปรับอากาศ",
            ประเภท: "Wall Type",
            ผู้ผลิต: "Daikin",
            รุ่น: "FTKQ35TV2S",
            "Serial Number": "SN123456",
            สถานที่: "อาคาร A",
            ชั้น: "2",
            วันติดตั้ง: "2024-01-15",
            วันหมดประกัน: "2027-01-15",
            ราคา: 45000,
            รายละเอียด: "แอร์ขนาด 12000 BTU",
            ข้อมูลจำเพาะ: "กำลังไฟ:220V|ขนาด:12000 BTU|น้ำหนัก:35 kg",
        };

        const ws = XLSX.utils.json_to_sheet([exampleRow], { header: headers });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Equipment");

        // Auto-width columns
        const colWidths = headers.map((h) => ({ wch: Math.max(h.length + 2, 15) }));
        ws["!cols"] = colWidths;

        XLSX.writeFile(wb, "equipment_import_template.xlsx");
        toast.success("ดาวน์โหลด template สำเร็จ");
    };

    const handleClose = () => {
        if (step === "result" && result.success > 0) {
            onSuccess();
        }
        setPreviewData([]);
        setStep("upload");
        setResult({ success: 0, failed: 0 });
        setProgress(0);
        onOpenChange(false);
    };

    const validCount = previewData.filter((r) => r.valid).length;
    const invalidCount = previewData.filter((r) => !r.valid).length;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5" />
                        นำเข้าข้อมูลจาก Excel
                    </DialogTitle>
                    <DialogDescription>
                        อัปโหลดไฟล์ Excel (.xlsx) เพื่อนำเข้าข้อมูลเครื่องจักรหลายรายการพร้อมกัน
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
                                id="fileInput"
                                disabled={loading}
                            />
                            <label
                                htmlFor="fileInput"
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
                                        <TableHead>รหัส</TableHead>
                                        <TableHead>ชื่อ</TableHead>
                                        <TableHead>หมวดหมู่</TableHead>
                                        <TableHead>สถานะ</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {previewData.slice(0, 50).map((row, index) => (
                                        <TableRow
                                            key={index}
                                            className={!row.valid ? "bg-red-50" : ""}
                                        >
                                            <TableCell className="font-mono text-xs">
                                                {index + 1}
                                            </TableCell>
                                            <TableCell className="font-mono">{row.code}</TableCell>
                                            <TableCell>{row.name}</TableCell>
                                            <TableCell>{row.categoryName}</TableCell>
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
                                สำเร็จ: {result.success} รายการ
                            </Badge>
                            {result.failed > 0 && (
                                <Badge variant="destructive" className="text-lg py-2 px-4">
                                    ล้มเหลว: {result.failed} รายการ
                                </Badge>
                            )}
                        </div>
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
                                        นำเข้า {validCount} รายการ
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
