import { Suspense } from "react";
import { Metadata } from "next";
import {
    Plus,
    Search,
    Filter,
    Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSpareParts, checkInventoryPermissions } from "@/app/actions/inventory";
import { InventoryTable } from "@/components/inventory/inventory-table";
import { SparePartForm } from "@/components/inventory/spare-part-form";
import { InventoryFilters } from "@/components/inventory/inventory-filters";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { redirect } from "next/navigation";
import { InventoryImportButton } from "@/components/inventory/inventory-import-button";
import { PaginationControls } from "@/components/ui/pagination-controls";

export const metadata: Metadata = {
    title: "คลังอะไหล่ | Maintenance System",
    description: "จัดการอะไหล่และอุปกรณ์",
};

export default async function InventoryPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; category?: string; lowStock?: string; page?: string }>;
}) {
    let permissions;
    let role;
    try {
        const result = await checkInventoryPermissions();
        permissions = result.permissions;
        role = result.role;
    } catch (error) {
        // Redirect or show error if not authorized (e.g. USER role)
        // If sidebar is hidden, they shouldn't trigger this unless direct link.
        redirect("/dashboard");
    }

    const { q, category, lowStock: lowStockParam, page: pageParam } = await searchParams;
    const query = q || "";
    const lowStock = lowStockParam === "true";
    const page = Number(pageParam) || 1;
    const pageSize = 10;

    const { data: parts = [], meta } = await getSpareParts({
        search: query,
        category,
        lowStock,
        page,
        pageSize
    });

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">คลังอะไหล่</h2>
                <div className="flex items-center space-x-2">
                    {role === "ADMIN" && <InventoryImportButton />}
                    {permissions.canCreate && (
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    เพิ่มอะไหล่
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>เพิ่มอะไหล่ใหม่</DialogTitle>
                                    <DialogDescription>
                                        กรอกข้อมูลอะไหล่เพื่อเพิ่มลงในระบบ
                                    </DialogDescription>
                                </DialogHeader>
                                <SparePartForm />
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between space-x-2">
                <InventoryFilters />
            </div>

            <div className="space-y-4">
                <Suspense fallback={<div>Loading...</div>}>
                    <InventoryTable parts={parts} permissions={permissions} />
                </Suspense>
                {meta && (
                    <PaginationControls meta={meta} />
                )}
            </div>
        </div>
    );
}
