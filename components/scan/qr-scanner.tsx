"use client";

/**
 * QR Scanner Component
 * Uses html5-qrcode library for camera-based QR code scanning
 */

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeScanner } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, CameraOff, Loader2, QrCode, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface QRScannerProps {
    onScan: (result: string) => void;
    onError?: (error: string) => void;
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
    const [isScanning, setIsScanning] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const startScanner = async () => {
        if (!containerRef.current) return;

        setIsLoading(true);
        try {
            // Check for secure context (HTTPS required for camera access)
            if (!window.isSecureContext) {
                throw new Error("HTTPS_REQUIRED");
            }

            // Check if mediaDevices API is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("MEDIA_DEVICES_NOT_SUPPORTED");
            }

            // Request camera permission
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
            setHasPermission(true);

            // Initialize scanner
            scannerRef.current = new Html5Qrcode("qr-reader");

            await scannerRef.current.start(
                { facingMode: "environment" }, // Use back camera
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                (decodedText) => {
                    // Success callback
                    onScan(decodedText);
                    stopScanner();
                },
                (errorMessage) => {
                    // Error callback (silent, happens frequently during scanning)
                }
            );

            setIsScanning(true);
        } catch (error: any) {
            console.error("Scanner error:", error);
            setHasPermission(false);

            if (error.message === "HTTPS_REQUIRED") {
                toast.error("ต้องเข้าถึงผ่าน HTTPS เพื่อใช้งานกล้อง");
            } else if (error.message === "MEDIA_DEVICES_NOT_SUPPORTED") {
                toast.error("เบราว์เซอร์นี้ไม่รองรับการเข้าถึงกล้อง กรุณาใช้ Chrome หรือ Safari");
            } else if (error.name === "NotAllowedError") {
                toast.error("กรุณาอนุญาตการเข้าถึงกล้อง");
            } else if (error.name === "NotFoundError") {
                toast.error("ไม่พบกล้องในอุปกรณ์นี้");
            } else {
                toast.error("ไม่สามารถเปิดกล้องได้: " + error.message);
            }

            onError?.(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current && isScanning) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch (error) {
                console.error("Stop scanner error:", error);
            }
        }
        setIsScanning(false);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(() => { });
            }
        };
    }, []);

    return (
        <div className="space-y-4">
            {/* Scanner Container */}
            <Card className="overflow-hidden">
                <CardContent className="p-0">
                    <div
                        ref={containerRef}
                        className="relative aspect-square max-h-[400px] bg-black"
                    >
                        {/* QR Reader Element */}
                        <div id="qr-reader" className="w-full h-full" />

                        {/* Overlay when not scanning */}
                        {!isScanning && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white">
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-12 w-12 animate-spin mb-4" />
                                        <p>กำลังเปิดกล้อง...</p>
                                    </>
                                ) : hasPermission === false ? (
                                    <>
                                        <CameraOff className="h-12 w-12 mb-4 text-red-400" />
                                        <p className="text-center px-4">
                                            ไม่สามารถเข้าถึงกล้องได้
                                        </p>
                                        <p className="text-sm text-gray-400 text-center px-4 mt-2">
                                            กรุณาอนุญาตการเข้าถึงกล้องในการตั้งค่าเบราว์เซอร์
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <QrCode className="h-16 w-16 mb-4 text-gray-400" />
                                        <p className="text-gray-300">
                                            กดปุ่มด้านล่างเพื่อเริ่มสแกน
                                        </p>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Scanning indicator */}
                        {isScanning && (
                            <div className="absolute bottom-4 left-0 right-0 text-center">
                                <span className="bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                                    กำลังสแกน QR Code...
                                </span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Controls */}
            <div className="flex justify-center gap-4">
                {!isScanning ? (
                    <Button
                        size="lg"
                        onClick={startScanner}
                        disabled={isLoading}
                        className="w-full max-w-xs"
                    >
                        {isLoading ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                            <Camera className="mr-2 h-5 w-5" />
                        )}
                        {hasPermission === false ? "ลองใหม่อีกครั้ง" : "เริ่มสแกน"}
                    </Button>
                ) : (
                    <Button
                        size="lg"
                        variant="destructive"
                        onClick={stopScanner}
                        className="w-full max-w-xs"
                    >
                        <CameraOff className="mr-2 h-5 w-5" />
                        หยุดสแกน
                    </Button>
                )}
            </div>

            {/* Instructions */}
            <div className="text-center text-sm text-muted-foreground space-y-1">
                <p>ชี้กล้องไปที่ QR Code บนเครื่องจักร</p>
                <p className="text-xs">รองรับ QR Code ทั้งหมดที่สร้างจากระบบนี้</p>
            </div>
        </div>
    );
}
