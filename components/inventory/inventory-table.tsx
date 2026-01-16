"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2, ArrowRightLeft, AlertTriangle, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AdjustStockDialog } from "./adjust-stock-dialog";
import { SparePartForm } from "./spare-part-form";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { deleteSparePart } from "@/app/actions/inventory";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface InventoryTableProps {
    parts: any[];
    permissions?: {
        canCreate: boolean;
        canEdit: boolean;
        canDelete: boolean;
        canAdjust: boolean;
    };
}

export function InventoryTable({ parts, permissions }: InventoryTableProps) {
    const router = useRouter();
    const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedPart, setSelectedPart] = useState<any>(null);

    const handleAdjust = (part: any) => {
        setSelectedPart(part);
        setAdjustDialogOpen(true);
    };

    const handleEdit = (part: any) => {
        setSelectedPart(part);
        setEditDialogOpen(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`คุณต้องการลบอะไหล่ "${name}" ใช่หรือไม่?`)) return;
        const result = await deleteSparePart(id);
        if (result.success) {
            toast.success("ลบอะไหล่เรียบร้อยแล้ว");
            router.refresh();
        } else {
            toast.error(result.error);
        }
    };

    const getStockStatus = (part: any) => {
        if (part.stockQuantity <= 0) return { label: "Out of Stock", color: "destructive" };
        if (part.stockQuantity <= (part.reorderPoint || part.minStockLevel || 0)) return { label: "Low Stock", color: "warning" };
        return { label: "In Stock", color: "success" };
    };

    return (
        <>
            {/* Mobile View - Cards */}
            <div className="block md:hidden space-y-4">
                {parts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/10">
                        ไม่พบรายการอะไหล่
                    </div>
                ) : (
                    parts.map((part) => {
                        const status = getStockStatus(part);
                        return (
                            <div key={part.id} className="bg-card text-card-foreground rounded-lg border shadow-sm p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-semibold text-lg">{part.name}</div>
                                        <div className="text-sm text-muted-foreground font-mono">{part.code}</div>
                                    </div>
                                    {part.location && (
                                        <Badge variant="outline" className="shrink-0">
                                            {part.location.name}
                                        </Badge>
                                    )}
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">หมวดหมู่:</span>
                                    <span>{part.category || "-"}</span>
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">ราคา:</span>
                                    <span>{Number(part.unitPrice).toLocaleString()} บาท</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="text-sm font-medium">
                                        สถานะ:
                                        <span className={status.label === "Out of Stock" ? "text-red-500 ml-1" : "ml-1"}>
                                            {part.stockQuantity} {part.unit}
                                        </span>
                                    </div>
                                    {status.label !== "In Stock" && (
                                        <Badge variant={status.color as any} className="ml-2">
                                            {status.label}
                                        </Badge>
                                    )}
                                </div>

                                <div className="pt-2 flex justify-end gap-2 border-t">
                                    <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/inventory/${part.id}`)}>
                                        <Search className="h-4 w-4" />
                                    </Button>

                                    {permissions?.canAdjust && (
                                        <Button variant="outline" size="sm" onClick={() => handleAdjust(part)}>
                                            <ArrowRightLeft className="h-4 w-4" />
                                        </Button>
                                    )}

                                    {permissions?.canEdit && (
                                        <Button variant="outline" size="sm" onClick={() => handleEdit(part)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    )}

                                    {permissions?.canDelete && (
                                        <Button variant="destructive" size="sm" onClick={() => handleDelete(part.id, part.name)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Desktop View - Table */}
            <div className="hidden md:block rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>รหัส</TableHead>
                            <TableHead>ชื่ออะไหล่</TableHead>
                            <TableHead>หมวดหมู่</TableHead>
                            <TableHead>สถานที่</TableHead>
                            <TableHead>ราคา/หน่วย</TableHead>
                            <TableHead className="text-center">คงเหลือ</TableHead>
                            <TableHead className="text-right">จัดการ</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {parts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    ไม่พบรายการอะไหล่
                                </TableCell>
                            </TableRow>
                        ) : (
                            parts.map((part) => {
                                const status = getStockStatus(part);
                                return (
                                    <TableRow key={part.id}>
                                        <TableCell className="font-mono text-sm">{part.code}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{part.name}</span>
                                                {status.label !== "In Stock" && (
                                                    <span className="text-xs text-red-500 flex items-center gap-1">
                                                        <AlertTriangle className="h-3 w-3" />
                                                        {status.label}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{part.category || "-"}</TableCell>
                                        <TableCell>
                                            {part.location ? (
                                                <Badge variant="outline">{part.location.name}</Badge>
                                            ) : (
                                                "-"
                                            )}
                                        </TableCell>
                                        <TableCell>{Number(part.unitPrice).toLocaleString()} บาท</TableCell>
                                        <TableCell className="text-center">
                                            <span className={status.label === "Out of Stock" ? "text-red-500 font-bold" : ""}>
                                                {part.stockQuantity} {part.unit}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>การจัดการ</DropdownMenuLabel>

                                                    {permissions?.canAdjust && (
                                                        <DropdownMenuItem onClick={() => handleAdjust(part)}>
                                                            <ArrowRightLeft className="mr-2 h-4 w-4" />
                                                            ปรับปรุงสต็อก
                                                        </DropdownMenuItem>
                                                    )}

                                                    <DropdownMenuItem onClick={() => router.push(`/dashboard/inventory/${part.id}`)}>
                                                        <Search className="mr-2 h-4 w-4" />
                                                        ดูรายละเอียด
                                                    </DropdownMenuItem>

                                                    {permissions?.canEdit && (
                                                        <DropdownMenuItem onClick={() => handleEdit(part)}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            แก้ไขข้อมูล
                                                        </DropdownMenuItem>
                                                    )}

                                                    {permissions?.canDelete && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-red-600"
                                                                onClick={() => handleDelete(part.id, part.name)}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                ลบข้อมูล
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {selectedPart && (
                <AdjustStockDialog
                    open={adjustDialogOpen}
                    onOpenChange={setAdjustDialogOpen}
                    partId={selectedPart.id}
                    partName={selectedPart.name}
                    currentStock={selectedPart.stockQuantity}
                    onSuccess={() => {
                        router.refresh();
                    }}
                />
            )}

            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>แก้ไขข้อมูลอะไหล่</DialogTitle>
                        <DialogDescription>
                            แก้ไขรายละเอียดของ {selectedPart?.name}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedPart && (
                        <SparePartForm
                            mode="edit"
                            part={selectedPart}
                            onSuccess={() => {
                                setEditDialogOpen(false);
                                router.refresh();
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
