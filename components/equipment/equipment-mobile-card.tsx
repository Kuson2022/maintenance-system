"use client";

/**
 * Equipment Mobile Card Component
 * แสดงรายการเครื่องจักรแบบ Card สำหรับมือถือ
 */

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    MoreVertical,
    Eye,
    Pencil,
    QrCode,
    MapPin,
    Tag,
    Wrench,
    Layers,
} from "lucide-react";
import { SerializedEquipment, EquipmentPermissions } from "@/lib/api/equipment/types";

// Status badge styles
const statusStyles: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
    ACTIVE: { label: "พร้อมใช้งาน", variant: "default", color: "bg-green-500" },
    INACTIVE: { label: "ไม่พร้อม", variant: "secondary", color: "bg-gray-400" },
    MAINTENANCE: { label: "ซ่อมบำรุง", variant: "outline", color: "bg-yellow-500" },
    RETIRED: { label: "ปลดระวาง", variant: "destructive", color: "bg-red-500" },
};

interface EquipmentMobileCardProps {
    equipment: SerializedEquipment;
    isSelected: boolean;
    onSelect: () => void;
    onRetire: () => void;
    onDelete: () => void;
    permissions: EquipmentPermissions;
}

export function EquipmentMobileCard({
    equipment,
    isSelected,
    onSelect,
    onRetire,
    onDelete,
    permissions,
}: EquipmentMobileCardProps) {
    const status = statusStyles[equipment.status] || statusStyles.ACTIVE;

    // Check if any action menu items should be shown
    const showActionMenu = (permissions.canRetire && equipment.status !== "RETIRED") || permissions.canDelete;

    return (
        <Card className={`transition-all ${isSelected ? "ring-2 ring-primary bg-primary/5" : ""}`}>
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <div className="pt-1">
                        <Checkbox
                            checked={isSelected}
                            onCheckedChange={onSelect}
                            className="h-5 w-5"
                        />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {/* Header: Code, Name, Status */}
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <Link
                                    href={`/dashboard/equipment/${equipment.id}`}
                                    className="font-semibold text-base hover:underline block truncate"
                                >
                                    {equipment.name}
                                </Link>
                                <p className="text-sm text-muted-foreground font-mono">
                                    {equipment.code}
                                </p>
                            </div>
                            <div className="flex items-center gap-1">
                                {/* Status Indicator */}
                                <div className={`w-2 h-2 rounded-full ${status.color}`} />
                                <Badge variant={status.variant} className="text-xs whitespace-nowrap">
                                    {status.label}
                                </Badge>
                            </div>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                            {/* Category */}
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Tag className="h-3.5 w-3.5" />
                                <span className="truncate">{equipment.category?.name || "-"}</span>
                            </div>

                            {/* Location */}
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5" />
                                <span className="truncate">{equipment.location || "-"}</span>
                            </div>

                            {/* Floor */}
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Layers className="h-3.5 w-3.5" />
                                <span className="truncate">ชั้น: {equipment.floor || "-"}</span>
                            </div>

                            {/* Work Orders Count */}
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Wrench className="h-3.5 w-3.5" />
                                <span>ใบแจ้งซ่อม: {equipment._count?.workOrders || 0}</span>
                            </div>

                            {/* Model/Manufacturer */}
                            {equipment.manufacturer && (
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <span className="truncate">{equipment.manufacturer}</span>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                asChild
                            >
                                <Link href={`/dashboard/equipment/${equipment.id}`}>
                                    <Eye className="h-4 w-4 mr-1" />
                                    ดูรายละเอียด
                                </Link>
                            </Button>
                            {permissions.canEdit && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                >
                                    <Link href={`/dashboard/equipment/${equipment.id}/edit`}>
                                        <Pencil className="h-4 w-4" />
                                    </Link>
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                asChild
                            >
                                <Link href={`/dashboard/equipment/${equipment.id}#qrcode`}>
                                    <QrCode className="h-4 w-4" />
                                </Link>
                            </Button>
                            {showActionMenu && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {permissions.canRetire && equipment.status !== "RETIRED" && (
                                            <DropdownMenuItem
                                                onClick={onRetire}
                                                className="text-orange-600"
                                            >
                                                ปลดระวาง
                                            </DropdownMenuItem>
                                        )}
                                        {permissions.canDelete && (
                                            <DropdownMenuItem
                                                onClick={onDelete}
                                                className="text-red-600"
                                            >
                                                ลบ
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

interface EquipmentMobileListProps {
    equipments: SerializedEquipment[];
    selectedIds: string[];
    onToggleSelect: (id: string) => void;
    onRetire: (equipment: SerializedEquipment) => void;
    onDelete: (equipment: SerializedEquipment) => void;
    permissions: EquipmentPermissions;
}

export function EquipmentMobileList({
    equipments,
    selectedIds,
    onToggleSelect,
    onRetire,
    onDelete,
    permissions,
}: EquipmentMobileListProps) {
    if (equipments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Tag className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">ไม่พบเครื่องจักร</p>
                <p className="text-sm text-muted-foreground mt-1">
                    ลองเปลี่ยน filter หรือเพิ่มเครื่องจักรใหม่
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {equipments.map((equipment) => (
                <EquipmentMobileCard
                    key={equipment.id}
                    equipment={equipment}
                    isSelected={selectedIds.includes(equipment.id)}
                    onSelect={() => onToggleSelect(equipment.id)}
                    onRetire={() => onRetire(equipment)}
                    onDelete={() => onDelete(equipment)}
                    permissions={permissions}
                />
            ))}
        </div>
    );
}

