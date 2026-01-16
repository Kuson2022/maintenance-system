"use client";

/**
 * Work Orders Export Button Component
 * ปุ่ม Export ข้อมูลใบแจ้งซ่อมเป็น Excel
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { getWorkOrdersAction } from "@/app/actions/work-orders";
import { format } from "date-fns";
import { th } from "date-fns/locale";

export function WorkOrdersExportButton() {
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        try {
            setLoading(true);
            toast.info("กำลังเตรียมข้อมูลสำหรับ Export...");

            // Fetch all work orders (large pageSize)
            const result = await getWorkOrdersAction({
                filters: {},
                pagination: { page: 1, limit: 10000 },
            });

            if (!result.success || !result.data) {
                throw new Error(result.error || "ไม่สามารถดึงข้อมูลได้");
            }

            const workOrders = result.data.data;

            if (workOrders.length === 0) {
                toast.warning("ไม่พบข้อมูลสำหรับ Export");
                return;
            }

            // Transform data for Excel
            const exportData = workOrders.map((item: any) => ({
                "เลขที่ใบแจ้งซ่อม": item.woNumber,
                "หัวเรื่อง": item.title,
                "เครื่องจักร": item.equipment?.name || "-",
                "รหัสเครื่อง": item.equipment?.code || "-",
                "สถานะ": mapStatus(item.status),
                "ความเร่งด่วน": mapPriority(item.priority),
                "ผู้แจ้ง": item.reporter?.name || "-",
                "ช่างผู้รับผิดชอบ": item.assignee?.name || "-",
                "วันที่แจ้ง": item.reportedAt
                    ? format(new Date(item.reportedAt), "dd/MM/yyyy HH:mm", { locale: th })
                    : "-",
                "วันครบกำหนด": item.dueDate
                    ? format(new Date(item.dueDate), "dd/MM/yyyy", { locale: th })
                    : "-",
                "วันที่เริ่มงาน": item.startedAt
                    ? format(new Date(item.startedAt), "dd/MM/yyyy HH:mm", { locale: th })
                    : "-",
                "วันที่เสร็จสิ้น": item.completedAt
                    ? format(new Date(item.completedAt), "dd/MM/yyyy HH:mm", { locale: th })
                    : "-",
                "รายละเอียด": item.description || "-",
            }));

            // Create workbook and worksheet
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(exportData);

            // Auto-size columns
            const colWidths = [
                { wch: 15 }, // WO Number
                { wch: 35 }, // Title
                { wch: 25 }, // Equipment Name
                { wch: 15 }, // Equipment Code
                { wch: 15 }, // Status
                { wch: 12 }, // Priority
                { wch: 20 }, // Reporter
                { wch: 20 }, // Assignee
                { wch: 18 }, // Reported At
                { wch: 15 }, // Due Date
                { wch: 18 }, // Started At
                { wch: 18 }, // Completed At
                { wch: 50 }, // Description
            ];
            ws["!cols"] = colWidths;

            XLSX.utils.book_append_sheet(wb, ws, "Work Orders");

            // Generate filename with timestamp
            const filename = `work_orders_${format(new Date(), "yyyy-MM-dd_HH-mm")}.xlsx`;

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
            PENDING: "รอดำเนินการ",
            ASSIGNED: "มอบหมายแล้ว",
            IN_PROGRESS: "กำลังดำเนินการ",
            COMPLETED: "เสร็จสิ้น",
            CANCELLED: "ยกเลิก",
        };
        return statusMap[status] || status;
    };

    const mapPriority = (priority: string) => {
        const priorityMap: Record<string, string> = {
            LOW: "ต่ำ",
            MEDIUM: "ปานกลาง",
            HIGH: "สูง",
            URGENT: "เร่งด่วน",
        };
        return priorityMap[priority] || priority;
    };

    return (
        <Button variant="outline" onClick={handleExport} disabled={loading}>
            {loading ? (
                <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    กำลัง Export...
                </>
            ) : (
                <>
                    <Download className="h-4 w-4 mr-2" />
                    Export Excel
                </>
            )}
        </Button>
    );
}
