"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useDebounce } from "use-debounce";

export function InventoryFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [search, setSearch] = useState(searchParams.get("q") || "");
    const [lowStock, setLowStock] = useState(searchParams.get("lowStock") === "true");

    const [debouncedSearch] = useDebounce(search, 500);

    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());

        if (debouncedSearch) {
            params.set("q", debouncedSearch);
        } else {
            params.delete("q");
        }

        if (lowStock) {
            params.set("lowStock", "true");
        } else {
            params.delete("lowStock");
        }

        router.push(`/dashboard/inventory?${params.toString()}`);
    }, [debouncedSearch, lowStock, router, searchParams]);

    return (
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
            <div className="relative w-full sm:w-[300px]">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="ค้นหาชื่อ หรือ รหัส..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                />
            </div>
            <div className="flex items-center space-x-2">
                <Switch
                    id="low-stock-mode"
                    checked={lowStock}
                    onCheckedChange={setLowStock}
                />
                <Label htmlFor="low-stock-mode" className="cursor-pointer">
                    แสดงเฉพาะสินค้าใกล้หมด (Low Stock)
                </Label>
            </div>
        </div>
    );
}
