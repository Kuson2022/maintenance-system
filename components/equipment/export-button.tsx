"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { getEquipmentsAction } from "@/app/actions/equipment";
import { format } from "date-fns";
import { th } from "date-fns/locale";

export function ExportButton() {
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        try {
            setLoading(true);
            toast.info("กำลังเตรียมข้อมูลสำหรับ Export...");

            // Fetch all equipments (large pageSize)
            const result = await getEquipmentsAction({
                pagination: { pageSize: 10000 },
            });

            if (!result.success || !result.data) {
                throw new Error(result.error || "ไม่สามารถดึงข้อมูลได้");
            }

            const equipments = result.data.data;

            if (equipments.length === 0) {
                toast.warning("ไม่พบข้อมูลสำหรับ Export");
                return;
            }

            // Transform data for Excel
            const exportData = equipments.map((item: any) => ({
                "รหัส": item.code,
                "ชื่อเครื่องจักร": item.name,
                "หมวดหมู่": item.category?.name || "-",
                "สถานะ": mapStatus(item.status),
                "ตำแหน่ง": item.location || "-",
                "ผู้รับผิดชอบ": item.responsiblePerson?.name || "-",
                "Serial Number": item.serialNumber || "-",
                "วันที่ติดตั้ง": item.installationDate ? format(new Date(item.installationDate), "dd/MM/yyyy", { locale: th }) : "-",
                "ราคา": item.cost || "-",
                "ผู้ผลิต": item.manufacturer || "-",
                "รุ่น/Model": item.model || "-", // Check if model exists in data, otherwise ignore
            }));

            // Create workbook and worksheet
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(exportData);

            // Auto-size columns (simple approximation)
            const colWidths = [
                { wch: 15 }, // Code
                { wch: 30 }, // Name
                { wch: 15 }, // Category
                { wch: 15 }, // Status
                { wch: 20 }, // Location
                { wch: 20 }, // Responsible
                { wch: 20 }, // Serial
                { wch: 15 }, // Install Date
                { wch: 15 }, // Cost
                { wch: 20 }, // Manufacturer
                { wch: 20 }, // Model
            ];
            ws["!cols"] = colWidths;

            XLSX.utils.book_append_sheet(wb, ws, "Equipment List");

            // Generate filename with timestamp
            const filename = `equipment_list_${format(new Date(), "yyyy-MM-dd_HH-mm")}.xlsx`;

            // Download file
            XLSX.writeFile(wb, filename);

            toast.success("Export ข้อมูลเรียบร้อยแล้ว");
        } catch (error: any) {
            console.error("Export error:", error);
            toast.error(error.message || "เกิดข้อผิดพลาดในการ Export");
        } finally {
            setLoading(false);
        }
    };

    const mapStatus = (status: string) => {
        const statusMap: Record<string, string> = {
            ACTIVE: "พร้อมใช้งาน",
            INACTIVE: "ไม่พร้อมใช้งาน",
            MAINTENANCE: "กำลังซ่อมบำรุง",
            RETIRED: "ปลดระวาง",
        };
        return statusMap[status] || status;
    };

    return (
        <Button variant="outline" onClick={handleExport} disabled={loading}>
            <Download className="h-4 w-4 mr-2" />
            {loading ? "Exporting..." : "Export Excel"}
        </Button>
    );
}
