"use client";

/**
 * Warranty Alerts Section Component
 * แสดงรายการเครื่องจักรที่ประกันใกล้หมดอายุ
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ChevronDown, ChevronUp, Shield, ExternalLink } from "lucide-react";
import { getWarrantyAlertsAction } from "@/app/actions/equipment";
import { format } from "date-fns";
import { th } from "date-fns/locale";

interface WarrantyAlert {
    id: string;
    code: string;
    name: string;
    warrantyExpiry: string;
    daysRemaining: number;
}

export function WarrantyAlertsSection() {
    const [loading, setLoading] = useState(true);
    const [alerts, setAlerts] = useState<WarrantyAlert[]>([]);
    const [isOpen, setIsOpen] = useState(true);

    useEffect(() => {
        async function fetchAlerts() {
            try {
                const result = await getWarrantyAlertsAction();
                if (result.success && result.data) {
                    setAlerts(result.data);
                }
            } catch (error) {
                console.error("Error fetching warranty alerts:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchAlerts();
    }, []);

    if (loading) {
        return (
            <div className="rounded-lg border p-4 bg-yellow-50/50">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-5 w-48" />
                </div>
            </div>
        );
    }

    if (alerts.length === 0) {
        return null;
    }

    const getUrgencyColor = (days: number) => {
        if (days <= 7) return "destructive";
        if (days <= 30) return "default";
        return "secondary";
    };

    return (
        <Alert variant="default" className="border-yellow-500/50 bg-yellow-50/50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="flex items-center justify-between">
                <span className="text-yellow-800">
                    <Shield className="h-4 w-4 inline mr-1" />
                    เครื่องจักรที่ประกันใกล้หมดอายุ ({alerts.length} รายการ)
                </span>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? (
                        <ChevronUp className="h-4 w-4" />
                    ) : (
                        <ChevronDown className="h-4 w-4" />
                    )}
                </Button>
            </AlertTitle>
            {isOpen && (
                <AlertDescription className="mt-3">
                    <div className="space-y-2">
                        {alerts.map((alert) => (
                            <div
                                key={alert.id}
                                className="flex items-center justify-between p-2 bg-white rounded border"
                            >
                                <div className="flex items-center gap-3">
                                    <Badge variant={getUrgencyColor(alert.daysRemaining)}>
                                        {alert.daysRemaining <= 0
                                            ? "หมดอายุแล้ว"
                                            : `อีก ${alert.daysRemaining} วัน`}
                                    </Badge>
                                    <div>
                                        <Link
                                            href={`/dashboard/equipment/${alert.id}`}
                                            className="font-medium hover:underline"
                                        >
                                            {alert.code} - {alert.name}
                                        </Link>
                                        <p className="text-xs text-muted-foreground">
                                            หมดประกัน:{" "}
                                            {format(new Date(alert.warrantyExpiry), "d MMMM yyyy", {
                                                locale: th,
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/dashboard/equipment/${alert.id}`}>
                                        <ExternalLink className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        ))}
                    </div>
                </AlertDescription>
            )}
        </Alert>
    );
}

