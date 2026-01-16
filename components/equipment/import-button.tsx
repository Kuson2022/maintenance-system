"use client";

/**
 * Import Button Component
 * ปุ่มสำหรับเปิด Import Excel Dialog (เฉพาะ Admin)
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { ImportExcelDialog } from "./import-excel-dialog";
import { useRouter } from "next/navigation";
import { checkEquipmentPermissionsAction } from "@/app/actions/equipment";

export function ImportButton() {
    const router = useRouter();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [canImport, setCanImport] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function checkPermissions() {
            try {
                const result = await checkEquipmentPermissionsAction();
                if (result.success && result.data) {
                    setCanImport(result.data.canImport);
                }
            } catch (error) {
                console.error("Error checking permissions:", error);
            } finally {
                setLoading(false);
            }
        }
        checkPermissions();
    }, []);

    const handleSuccess = () => {
        // Dispatch custom event to refresh EquipmentList
        window.dispatchEvent(new CustomEvent("equipmentListRefresh"));
        // Also refresh page data
        router.refresh();
    };

    // Don't render if user doesn't have import permission
    if (loading || !canImport) {
        return null;
    }

    return (
        <>
            <Button variant="outline" onClick={() => setDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Import Excel
            </Button>
            <ImportExcelDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSuccess={handleSuccess}
            />
        </>
    );
}
