"use client";

/**
 * QR Scan Page Client Component
 * Handles QR scanning and navigation
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QRScanner } from "@/components/scan/qr-scanner";
import { ArrowLeft, Search, QrCode, Package } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export function ScanPage() {
    const router = useRouter();
    const [manualCode, setManualCode] = useState("");
    const [lastScanned, setLastScanned] = useState<string | null>(null);

    const handleScan = async (result: string) => {
        setLastScanned(result);

        // Try to parse the QR code
        // Expected formats:
        // 1. Direct equipment ID: UUID format "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
        // 2. URL format: "https://domain.com/equipment/xxxxx"
        // 3. QR Code format from system: "EQ-{code}-{timestamp}"

        let equipmentIdentifier: string | null = null;

        // Check if it's a UUID (equipment ID)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        if (uuidRegex.test(result)) {
            // Direct equipment ID
            equipmentIdentifier = result;
            toast.success("พบข้อมูลเครื่องจักร!");
            router.push(`/dashboard/equipment/${equipmentIdentifier}`);
        } else if (result.includes("/equipment/")) {
            // Extract ID from URL
            const match = result.match(/\/equipment\/([^\/\?]+)/);
            if (match) {
                equipmentIdentifier = match[1];
                toast.success("พบข้อมูลเครื่องจักร!");
                router.push(`/dashboard/equipment/${equipmentIdentifier}`);
            }
        } else if (result.startsWith("EQ-")) {
            // QR Code format from system: "EQ-{code}-{timestamp}"
            // Need to lookup equipment by QR code
            try {
                const response = await fetch(`/api/equipment/by-qr?qrCode=${encodeURIComponent(result)}`);
                if (response.ok) {
                    const equipment = await response.json();
                    if (equipment && equipment.id) {
                        toast.success(`พบเครื่องจักร: ${equipment.name}`);
                        router.push(`/dashboard/equipment/${equipment.id}`);
                    } else {
                        toast.error("ไม่พบเครื่องจักรที่ตรงกับ QR Code นี้");
                    }
                } else {
                    toast.error("ไม่พบเครื่องจักรที่ตรงกับ QR Code นี้");
                }
            } catch (error) {
                console.error("Error looking up equipment by QR:", error);
                toast.error("เกิดข้อผิดพลาดในการค้นหาเครื่องจักร");
            }
        } else {
            // Unknown format, show the result
            toast.info(`สแกนได้: ${result}`);
        }
    };

    const handleManualSearch = () => {
        if (!manualCode.trim()) {
            toast.error("กรุณากรอกรหัสเครื่องจักร");
            return;
        }

        router.push(`/dashboard/equipment?search=${encodeURIComponent(manualCode.trim())}`);
    };

    return (
        <div className="space-y-6 max-w-lg mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">สแกน QR Code</h1>
                    <p className="text-muted-foreground text-sm">
                        สแกนเพื่อดูข้อมูลเครื่องจักร
                    </p>
                </div>
            </div>

            {/* QR Scanner */}
            <QRScanner onScan={handleScan} />

            {/* Divider */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-gray-50 px-2 text-muted-foreground">
                        หรือ
                    </span>
                </div>
            </div>

            {/* Manual Input */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        ค้นหาด้วยรหัส
                    </CardTitle>
                    <CardDescription>
                        กรอกรหัสเครื่องจักรเพื่อค้นหา
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleManualSearch();
                        }}
                        className="flex gap-2"
                    >
                        <Input
                            placeholder="เช่น EQ-001, AC-001"
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                            className="flex-1"
                        />
                        <Button type="submit">
                            <Search className="h-4 w-4" />
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Last Scanned */}
            {lastScanned && (
                <Card className="border-green-200 bg-green-50">
                    <CardContent className="py-3">
                        <div className="flex items-center gap-3">
                            <QrCode className="h-5 w-5 text-green-600" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-green-900">
                                    สแกนล่าสุด
                                </p>
                                <p className="text-xs text-green-700 truncate">
                                    {lastScanned}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Quick Links */}
            <div className="grid grid-cols-2 gap-3">
                <Link href="/dashboard/equipment">
                    <Button variant="outline" className="w-full h-auto py-4">
                        <div className="flex flex-col items-center gap-1">
                            <Package className="h-5 w-5" />
                            <span className="text-xs">ดูเครื่องจักรทั้งหมด</span>
                        </div>
                    </Button>
                </Link>
                <Link href="/dashboard/work-orders/new">
                    <Button variant="outline" className="w-full h-auto py-4">
                        <div className="flex flex-col items-center gap-1">
                            <QrCode className="h-5 w-5" />
                            <span className="text-xs">แจ้งซ่อมใหม่</span>
                        </div>
                    </Button>
                </Link>
            </div>
        </div>
    );
}
