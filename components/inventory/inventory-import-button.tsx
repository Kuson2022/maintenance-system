"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";
import { ImportInventoryDialog } from "./import-inventory-dialog";

export function InventoryImportButton() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button variant="outline" onClick={() => setOpen(true)}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Import Excel
            </Button>
            <ImportInventoryDialog
                open={open}
                onOpenChange={setOpen}
                onSuccess={() => setOpen(false)}
            />
        </>
    );
}
