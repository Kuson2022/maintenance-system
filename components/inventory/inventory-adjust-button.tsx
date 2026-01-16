"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft } from "lucide-react";
import { AdjustStockDialog } from "./adjust-stock-dialog";
import { useRouter, useSearchParams } from "next/navigation";

interface InventoryAdjustButtonProps {
    part: {
        id: string;
        name: string;
        stockQuantity: number;
    };
}

export function InventoryAdjustButton({ part }: InventoryAdjustButtonProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [open, setOpen] = useState(false);

    // Auto-open dialog if url has ?action=adjust
    useEffect(() => {
        if (searchParams.get("action") === "adjust") {
            setOpen(true);
        }
    }, [searchParams]);

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);

        // When closing, remove the query parameter
        if (!isOpen && searchParams.get("action") === "adjust") {
            const newParams = new URLSearchParams(searchParams.toString());
            newParams.delete("action");
            router.replace(`?${newParams.toString()}`);
        }
    };

    return (
        <>
            <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                ปรับปรุงสต็อก
            </Button>
            <AdjustStockDialog
                open={open}
                onOpenChange={handleOpenChange}
                partId={part.id}
                partName={part.name}
                currentStock={part.stockQuantity}
                onSuccess={() => {
                    handleOpenChange(false);
                    router.refresh();
                }}
            />
        </>
    );
}
