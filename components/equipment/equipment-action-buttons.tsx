"use client";

/**
 * Equipment Action Buttons Component
 * แสดงปุ่มการดำเนินการสำหรับหน้า Equipment พร้อม permission control
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ImportButton } from "@/components/equipment/import-button";
import { ExportButton } from "@/components/equipment/export-button";
import { checkEquipmentPermissionsAction } from "@/app/actions/equipment";
import { EquipmentPermissions } from "@/lib/api/equipment/types";

interface EquipmentActionButtonsProps {
    /** Optional permissions to avoid duplicate API call */
    initialPermissions?: EquipmentPermissions;
}

export function EquipmentActionButtons({ initialPermissions }: EquipmentActionButtonsProps) {
    const [permissions, setPermissions] = useState<EquipmentPermissions>(
        initialPermissions || {
            canView: true,
            canCreate: false,
            canEdit: false,
            canDelete: false,
            canRetire: false,
            canBulkUpdate: false,
            canBulkAssign: false,
            canImport: false,
            canExport: false,
            canManageCategories: false,
        }
    );
    const [loading, setLoading] = useState(!initialPermissions);

    useEffect(() => {
        // Skip fetching if permissions were provided via props
        if (initialPermissions) {
            setPermissions(initialPermissions);
            setLoading(false);
            return;
        }

        async function checkPermissions() {
            try {
                const result = await checkEquipmentPermissionsAction();
                if (result.success && result.data) {
                    setPermissions(result.data);
                }
            } catch (error) {
                console.error("Error checking permissions:", error);
            } finally {
                setLoading(false);
            }
        }
        checkPermissions();
    }, [initialPermissions]);

    return (
        <div className="flex gap-2">
            {/* ImportButton handles its own permission check */}
            <ImportButton />

            {/* Export - show for ADMIN and TECHNICIAN */}
            {(permissions.canExport || loading) && <ExportButton />}

            {/* Add Equipment - show for ADMIN and TECHNICIAN */}
            {permissions.canCreate && (
                <Button asChild className="flex-1 sm:flex-none">
                    <Link href="/dashboard/equipment/new">
                        <Plus className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">เพิ่มเครื่องจักร</span>
                    </Link>
                </Button>
            )}
        </div>
    );
}
