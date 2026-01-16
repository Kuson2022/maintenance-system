"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { generateQrCodeImageAction } from "@/app/actions/equipment";

interface InventoryQrCodeProps {
    inventoryId: string;
    inventoryName: string;
    inventoryCode: string;
}

export function InventoryQrCode({ inventoryId, inventoryName, inventoryCode }: InventoryQrCodeProps) {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    // Construct the URL with the query parameter
    const qrContent = `${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard/inventory/${inventoryId}?action=adjust`;

    useEffect(() => {
        async function generateQr() {
            if (typeof window === 'undefined') return;
            
            try {
                const result = await generateQrCodeImageAction(qrContent);
                if (result.success && result.data) {
                    setImageUrl(result.data);
                }
            } catch (error) {
                console.error("Error generating QR code:", error);
                toast.error("ไม่สามารถสร้าง QR Code ได้");
            } finally {
                setLoading(false);
            }
        }
        generateQr();
    }, [qrContent]);

    const handleDownload = () => {
        if (!imageUrl) return;

        const link = document.createElement("a");
        link.href = imageUrl;
        link.download = `QR-INV-${inventoryCode}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("ดาวน์โหลด QR Code เรียบร้อย");
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(qrContent);
            setCopied(true);
            toast.success("คัดลอก QR URL เรียบร้อย");
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            toast.error("ไม่สามารถคัดลอกได้");
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center gap-4 py-4">
                <Skeleton className="h-48 w-48" />
                <Skeleton className="h-4 w-32" />
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-4 py-4">
            {imageUrl ? (
                <img
                    src={imageUrl}
                    alt={`QR Code for ${inventoryName}`}
                    className="h-48 w-48 border rounded-lg"
                />
            ) : (
                <div className="h-48 w-48 border rounded-lg flex items-center justify-center text-muted-foreground">
                    ไม่สามารถสร้าง QR ได้
                </div>
            )}

            <p className="text-sm text-muted-foreground font-mono font-semibold">{inventoryCode}</p>

            <div className="flex gap-2 w-full justify-center">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                    {copied ? (
                        <Check className="mr-2 h-4 w-4" />
                    ) : (
                        <Copy className="mr-2 h-4 w-4" />
                    )}
                    {copied ? "คัดลอกแล้ว" : "Copy Link"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload} disabled={!imageUrl}>
                    <Download className="mr-2 h-4 w-4" />
                    Save Image
                </Button>
            </div>
        </div>
    );
}
