"use client";

/**
 * Export Buttons Component
 * ปุ่ม Export PDF/Excel/CSV
 */

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, Loader2, Table2 } from "lucide-react";
import { useState } from "react";

interface ExportButtonsProps {
    data?: Record<string, any>[];
    filename?: string;
    disabled?: boolean;
}

export function ExportButtons({
    data = [],
    filename = "report",
    disabled = false,
}: ExportButtonsProps) {
    const [isExporting, setIsExporting] = useState(false);

    const handlePrintPDF = () => {
        setIsExporting(true);
        setTimeout(() => {
            window.print();
            setIsExporting(false);
        }, 100);
    };

    const handleExportCSV = () => {
        if (data.length === 0) return;
        setIsExporting(true);

        try {
            const headers = Object.keys(data[0]);
            const csvContent = [
                headers.join(","),
                ...data.map((row) =>
                    headers
                        .map((header) => {
                            const value = row[header];
                            if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
                                return `"${value.replace(/"/g, '""')}"`;
                            }
                            return value ?? "";
                        })
                        .join(",")
                ),
            ].join("\n");

            const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `${filename}.csv`;
            link.click();
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportExcel = async () => {
        if (data.length === 0) return;
        setIsExporting(true);

        try {
            // Dynamically import XLSX to reduce initial bundle size
            const XLSX = await import("xlsx");

            // Create a new workbook
            const wb = XLSX.utils.book_new();

            // Convert data to worksheet
            const ws = XLSX.utils.json_to_sheet(data);

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, "Report");

            // Generate Excel file and trigger download
            XLSX.writeFile(wb, `${filename}.xlsx`);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={disabled || isExporting}>
                    {isExporting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="mr-2 h-4 w-4" />
                    )}
                    ส่งออก
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handlePrintPDF}>
                    <FileText className="mr-2 h-4 w-4" />
                    พิมพ์ / PDF
                </DropdownMenuItem>
                {data.length > 0 && (
                    <>
                        <DropdownMenuItem onClick={handleExportExcel}>
                            <Table2 className="mr-2 h-4 w-4" />
                            Excel (.xlsx)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExportCSV}>
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                            CSV
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// Standalone utility function for CSV export (for use in client components)
export function exportDataToCSV(data: Record<string, any>[], filename: string) {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(","),
        ...data.map((row) =>
            headers
                .map((header) => {
                    const value = row[header];
                    if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value ?? "";
                })
                .join(",")
        ),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
}
