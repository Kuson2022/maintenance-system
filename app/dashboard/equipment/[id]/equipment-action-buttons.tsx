"use client";

/**
 * Equipment Action Buttons
 * Role-based action buttons for equipment detail page
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Wrench, Calendar, Pencil, Printer } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

interface EquipmentActionButtonsProps {
    equipmentId: string;
}

export function EquipmentActionButtons({ equipmentId }: EquipmentActionButtonsProps) {
    const { userProfile } = useAuth();

    const role = userProfile?.role;

    // Permissions:
    // - USER: only Create Work Order
    // - TECHNICIAN: Create Work Order + Edit
    // - ADMIN/SUPERVISOR: All buttons
    const canEdit = role === "ADMIN" || role === "SUPERVISOR" || role === "TECHNICIAN";
    const canCreateSchedule = role === "ADMIN" || role === "SUPERVISOR";

    return (
        <div className="flex flex-wrap gap-2 pl-11 sm:pl-0 sm:justify-end">
            {/* Print Button - All roles */}
            <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none">
                <Link href={`/dashboard/equipment/${equipmentId}/print`} target="_blank">
                    <Printer className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">พิมพ์</span>
                </Link>
            </Button>

            {/* สร้างใบแจ้งซ่อม - All roles can use this */}
            <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none">
                <Link href={`/dashboard/work-orders/new?equipmentId=${equipmentId}`}>
                    <Wrench className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">สร้างใบแจ้งซ่อม</span>
                </Link>
            </Button>

            {/* สร้างตารางซ่อมบำรุง - Only ADMIN/SUPERVISOR */}
            {canCreateSchedule && (
                <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none">
                    <Link href={`/dashboard/schedules/new?equipmentId=${equipmentId}`}>
                        <Calendar className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">สร้างตารางซ่อมบำรุง</span>
                    </Link>
                </Button>
            )}

            {/* แก้ไข - ADMIN, SUPERVISOR, TECHNICIAN */}
            {canEdit && (
                <Button size="sm" asChild>
                    <Link href={`/dashboard/equipment/${equipmentId}/edit`}>
                        <Pencil className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">แก้ไข</span>
                    </Link>
                </Button>
            )}
        </div>
    );
}
