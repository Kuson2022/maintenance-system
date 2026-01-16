"use client";

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
import { bulkCreateSpareParts, BulkCreateSparePartInput } from "@/app/actions/inventory-import";
import { useRouter } from "next/navigation";

interface ImportRow {
    code: string;
    name: string;
    category?: string;
    locationName?: string;
    unitPrice: number;
    initialStock: number;
    unit: string;
    minStockLevel: number;
    reorderPoint?: number;
    maxStockLevel?: number;
    supplier?: string;
    description?: string;
    error?: string;
    valid: boolean;
}

interface ImportInventoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

const REQUIRED_COLUMNS = ["รหัส", "ชื่ออะไหล่", "หน่วยนับ"];
const OPTIONAL_COLUMNS = ["หมวดหมู่", "สถานที่จัดเก็บ", "ราคาต่อหน่วย", "จำนวนคงเหลือ", "จุดสั่งซื้อ", "ขั้นต่ำ", "ขั้นสูง", "ผู้จำหน่าย", "รายละเอียด"];

export function ImportInventoryDialog({
    open,
    onOpenChange,
    onSuccess,
}: ImportInventoryDialogProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [previewData, setPreviewData] = useState<ImportRow[]>([]);
    const [step, setStep] = useState<"upload" | "preview" | "result">("upload");
    const [result, setResult] = useState<{ success: number; failed: number; errors: Array<{ row: number; code: string; error: string }> }>({
        success: 0,
        failed: 0,
        errors: [],
    });

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
                    const code = String(row["รหัส"] || "").trim();
                    const name = String(row["ชื่ออะไหล่"] || "").trim();
                    const unit = String(row["หน่วยนับ"] || "").trim(); // Required? Yes usually.

                    const category = row["หมวดหมู่"]?.toString().trim();
                    const locationName = row["สถานที่จัดเก็บ"]?.toString().trim();
                    const unitPrice = Number(row["ราคาต่อหน่วย"]) || 0;
                    const initialStock = Number(row["จำนวนคงเหลือ"]) || 0;
                    const minStockLevel = Number(row["ขั้นต่ำ"]) || 0;
                    const reorderPoint = Number(row["จุดสั่งซื้อ"]); // Optional, can be undefined/NaN
                    const maxStockLevel = Number(row["ขั้นสูง"]); // Optional
                    const supplier = row["ผู้จำหน่าย"]?.toString().trim();
                    const description = row["รายละเอียด"]?.toString().trim();

                    const errors: string[] = [];
                    if (!code) errors.push("ไม่มีรหัส");
                    if (!name) errors.push("ไม่มีชื่อ");
                    if (!unit) errors.push("ไม่มีหน่วยนับ");
                    if (unitPrice < 0) errors.push("ราคาติดลบ");
                    if (initialStock < 0) errors.push("จำนวนติดลบ");

                    return {
                        code,
                        name,
                        category,
                        locationName,
                        unitPrice,
                        initialStock,
                        unit,
                        minStockLevel,
                        reorderPoint: isNaN(reorderPoint) ? undefined : reorderPoint,
                        maxStockLevel: isNaN(maxStockLevel) ? undefined : maxStockLevel,
                        supplier,
                        description,
                        error: errors.length > 0 ? errors.join(", ") : undefined,
                        valid: errors.length === 0,
                    };
                });

                // Check for duplicate codes in import file
                const codeMap = new Map<string, number>();
                rows.forEach(r => {
                    if (r.code) codeMap.set(r.code, (codeMap.get(r.code) || 0) + 1);
                });

                rows.forEach(r => {
                    if (r.code && (codeMap.get(r.code) || 0) > 1) {
                        r.valid = false;
                        r.error = r.error ? `${r.error}, รหัสซ้ำในไฟล์` : "รหัสซ้ำในไฟล์";
                    }
                });

                setPreviewData(rows);
                setStep("preview");
            } catch (error: unknown) {
                console.error("Error reading file:", error);
                toast.error("ไม่สามารถอ่านไฟล์ได้");
            } finally {
                setLoading(false);
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
            // Map to server action input
            const partsInput: BulkCreateSparePartInput[] = validRows.map(row => ({
                code: row.code,
                name: row.name,
                category: row.category,
                locationName: row.locationName,
                unitPrice: row.unitPrice,
                initialStock: row.initialStock,
                unit: row.unit,
                minStockLevel: row.minStockLevel,
                reorderPoint: row.reorderPoint,
                maxStockLevel: row.maxStockLevel,
                supplier: row.supplier,
                description: row.description,
            }));

            const res = await bulkCreateSpareParts(partsInput);

            if (res.success && res.data) {
                setResult({
                    success: res.data.created,
                    failed: res.data.errors.length,
                    errors: res.data.errors,
                });
                setStep("result");
                router.refresh();
            } else {
                toast.error(res.error || "เกิดข้อผิดพลาดในการ import");
            }
        } catch (error: unknown) {
            toast.error("เกิดข้อผิดพลาด");
        } finally {
            setImporting(false);
            setProgress(100);
        }
    };

    const handleDownloadTemplate = () => {
        const headers = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS];
        const exampleRows = [
            {
                "รหัส": "SP-001",
                "ชื่ออะไหล่": "Bearing 6205",
                "หมวดหมู่": "Mechanical",
                "สถานที่จัดเก็บ": "Shelf A-01",
                "ราคาต่อหน่วย": 150,
                "จำนวนคงเหลือ": 10,
                "หน่วยนับ": "ชิ้น",
                "จุดสั่งซื้อ": 5,
                "ขั้นต่ำ": 2,
                "ขั้นสูง": 50,
                "ผู้จำหน่าย": "ABC Supply",
                "รายละเอียด": "ลูกปืนสำหรับมอเตอร์",
            },
            {
                "รหัส": "SP-002",
                "ชื่ออะไหล่": "Sensor Proximity",
                "หมวดหมู่": "Electrical",
                "สถานที่จัดเก็บ": "Cabinet E-02",
                "ราคาต่อหน่วย": 1200,
                "จำนวนคงเหลือ": 5,
                "หน่วยนับ": "ตัว",
                "จุดสั่งซื้อ": 3,
                "ขั้นต่ำ": 1,
                "ขั้นสูง": 20,
                "ผู้จำหน่าย": "Sensor Thai",
                "รายละเอียด": "เซนเซอร์ตรวจจับโลหะ",
            },
        ];

        const ws = XLSX.utils.json_to_sheet(exampleRows, { header: headers });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "SpareParts");

        const colWidths = headers.map((h) => ({ wch: Math.max(h.length + 5, 20) }));
        ws["!cols"] = colWidths;

        XLSX.writeFile(wb, "inventory_import_template.xlsx");
        toast.success("ดาวน์โหลด template สำเร็จ");
    };

    const handleClose = () => {
        if (step === "result" && result.success > 0) {
            onSuccess?.();
            onOpenChange(false);
        } else {
            onOpenChange(false);
        }
        // Cleanup after close is safer if we want to reset state fully only when reopening, but here works too.
        setTimeout(() => {
            if (!open) { // Check if closed
                setPreviewData([]);
                setStep("upload");
                setResult({ success: 0, failed: 0, errors: [] });
                setProgress(0);
            }
        }, 500);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5" />
                        นำเข้าอะไหล่จาก Excel
                    </DialogTitle>
                    <DialogDescription>
                        อัปโหลดไฟล์ Excel (.xlsx) เพื่อเพิ่มอะไหล่เข้าระบบ
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
                                ต้องการ Template?
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
                                ถูกต้อง: {previewData.filter(r => r.valid).length}
                            </Badge>
                            <Badge variant={previewData.some(r => !r.valid) ? "destructive" : "secondary"} className="py-1">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                ผิดพลาด: {previewData.filter(r => !r.valid).length}
                            </Badge>
                        </div>

                        <div className="border rounded-lg overflow-auto flex-1">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>รหัส</TableHead>
                                        <TableHead>ชื่อ</TableHead>
                                        <TableHead>ราคา</TableHead>
                                        <TableHead>จำนวน</TableHead>
                                        <TableHead>สถานะ</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {previewData.slice(0, 50).map((row, i) => (
                                        <TableRow key={i} className={!row.valid ? "bg-red-50" : ""}>
                                            <TableCell className="font-mono">{row.code}</TableCell>
                                            <TableCell>{row.name}</TableCell>
                                            <TableCell>{row.unitPrice}</TableCell>
                                            <TableCell>{row.initialStock}</TableCell>
                                            <TableCell>
                                                {row.valid ? (
                                                    <span className="text-green-600 flex items-center text-xs">
                                                        <CheckCircle className="h-3 w-3 mr-1" /> พร้อม
                                                    </span>
                                                ) : (
                                                    <span className="text-red-500 flex items-center text-xs">
                                                        <X className="h-3 w-3 mr-1" /> {row.error}
                                                    </span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        {previewData.length > 50 && (
                            <p className="text-xs text-center text-muted-foreground">แสดง 50 รายการแรกจากทั้งหมด {previewData.length}</p>
                        )}

                        {importing && (
                            <div className="space-y-2">
                                <Progress value={progress} />
                                <p className="text-xs text-center">กำลังนำเข้า...</p>
                            </div>
                        )}
                    </div>
                )}

                {step === "result" && (
                    <div className="py-8 text-center space-y-4">
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                        <h3 className="text-xl font-bold">นำเข้าเสร็จสิ้น</h3>
                        <div className="flex justify-center gap-4">
                            <Badge className="text-lg py-2 px-4">สำเร็จ: {result.success}</Badge>
                            {result.failed > 0 && <Badge variant="destructive" className="text-lg py-2 px-4">ล้มเหลว: {result.failed}</Badge>}
                        </div>

                        {result.errors.length > 0 && (
                            <div className="mt-4 text-left max-h-40 overflow-auto border rounded-md p-3">
                                <p className="font-medium text-sm mb-2 text-red-600">รายการที่ไม่สำเร็จ:</p>
                                {result.errors.map((err, i) => (
                                    <p key={i} className="text-sm text-muted-foreground">
                                        แถว {err.row} ({err.code}): {err.error}
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
                            <Button variant="outline" onClick={() => { setStep("upload"); setPreviewData([]); }} disabled={importing}>กลับ</Button>
                            <Button onClick={handleImport} disabled={importing || previewData.filter(r => r.valid).length === 0}>
                                {importing ? <Loader2 className="animate-spin h-4 w-4" /> : <Upload className="h-4 w-4 mr-2" />}
                                นำเข้าข้อมูล
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
