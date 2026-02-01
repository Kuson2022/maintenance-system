"use client";

/**
 * Equipment List Component
 * แสดงตารางรายการเครื่องจักร พร้อม filters และ pagination
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Search,
    MoreHorizontal,
    Eye,
    Pencil,
    Trash2,
    QrCode,
    ChevronLeft,
    ChevronRight,
    Package,
    RefreshCw,
    UserPlus,
    X,
} from "lucide-react";
import { toast } from "sonner";
import {
    getEquipmentsAction,
    getEquipmentInitDataAction,
    getEquipmentLocationsAction,
    deleteEquipmentAction,
    retireEquipmentAction,
} from "@/app/actions/equipment";
import { SerializedEquipment, EquipmentPermissions } from "@/lib/api/equipment/types";
import { BulkStatusDialog } from "@/components/equipment/bulk-status-dialog";
import { BulkAssignDialog } from "@/components/equipment/bulk-assign-dialog";
import { EquipmentMobileList } from "@/components/equipment/equipment-mobile-card";

// Status badge styles
const statusStyles: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    ACTIVE: { label: "พร้อมใช้งาน", variant: "default" },
    INACTIVE: { label: "ไม่พร้อมใช้งาน", variant: "secondary" },
    MAINTENANCE: { label: "กำลังซ่อมบำรุง", variant: "outline" },
    RETIRED: { label: "ปลดระวาง", variant: "destructive" },
};

interface Category {
    id: string;
    name: string;
}

export function EquipmentList() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [equipments, setEquipments] = useState<SerializedEquipment[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [locations, setLocations] = useState<string[]>([]);
    const [floors, setFloors] = useState<string[]>([]);
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 10,
        count: 0,
        totalPages: 0,
    });

    // Filters
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [locationFilter, setLocationFilter] = useState<string>("all");
    const [floorFilter, setFloorFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Selection
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Delete dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [equipmentToDelete, setEquipmentToDelete] = useState<SerializedEquipment | null>(null);

    // Bulk action dialogs
    const [bulkStatusDialogOpen, setBulkStatusDialogOpen] = useState(false);
    const [bulkAssignDialogOpen, setBulkAssignDialogOpen] = useState(false);

    // Permissions
    const [permissions, setPermissions] = useState<EquipmentPermissions>({
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
    });

    // Fetch equipments
    const fetchEquipments = useCallback(async () => {
        setLoading(true);
        try {
            const filters: any = {};
            if (search) filters.search = search;
            if (categoryFilter && categoryFilter !== "all") filters.categoryId = categoryFilter;
            if (statusFilter && statusFilter !== "all") filters.status = statusFilter;
            if (locationFilter && locationFilter !== "all") filters.location = locationFilter;
            if (floorFilter && floorFilter !== "all") filters.floor = floorFilter;

            const result = await getEquipmentsAction({
                filters,
                pagination: {
                    page: pagination.page,
                    pageSize: pagination.pageSize,
                },
            });

            if (result.success && result.data) {
                setEquipments(result.data.data);
                setPagination((prev) => ({
                    ...prev,
                    count: result.data.count,
                    totalPages: result.data.totalPages,
                }));
            }
        } catch (error) {
            console.error("Error fetching equipments:", error);
            toast.error("เกิดข้อผิดพลาดในการดึงข้อมูล");
        } finally {
            setLoading(false);
        }
    }, [search, categoryFilter, statusFilter, locationFilter, floorFilter, pagination.page, pagination.pageSize]);

    // Fetch initial data (categories, floors, permissions) - Combined API call for performance
    useEffect(() => {
        async function fetchInitData() {
            try {
                const result = await getEquipmentInitDataAction();

                if (result.success && result.data) {
                    const { categories: cats, floors: flrs, permissions: perms } = result.data;

                    if (cats) {
                        setCategories(cats.map((c: any) => ({ id: c.id, name: c.name })));
                    }

                    if (flrs) {
                        setFloors(flrs);
                    }

                    if (perms) {
                        setPermissions(perms);
                    }
                }
            } catch (error) {
                console.error("Error fetching init data:", error);
            }
        }
        fetchInitData();
    }, []);

    // Fetch locations when floor changes
    useEffect(() => {
        async function fetchLocations() {
            try {
                // If "all" floors selected, fetch all locations (pass undefined or empty string)
                // If specific floor, pass the floor name
                const floorParam = floorFilter !== "all" ? floorFilter : undefined;

                const result = await getEquipmentLocationsAction(floorParam);

                if (result.success && result.data) {
                    setLocations(result.data);
                }
            } catch (error) {
                console.error("Error fetching locations:", error);
            }
        }

        fetchLocations();
    }, [floorFilter]);

    // Fetch equipments on filter change
    useEffect(() => {
        fetchEquipments();
    }, [fetchEquipments]);

    // Listen for refresh event from Import button
    useEffect(() => {
        const handleRefresh = () => {
            fetchEquipments();
        };

        window.addEventListener("equipmentListRefresh", handleRefresh);
        return () => {
            window.removeEventListener("equipmentListRefresh", handleRefresh);
        };
    }, [fetchEquipments]);

    // Handle search with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setPagination((prev) => ({ ...prev, page: 1 }));
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    // Handle delete
    const handleDelete = async () => {
        if (!equipmentToDelete) return;

        try {
            const result = await deleteEquipmentAction(equipmentToDelete.id);
            if (result.success) {
                toast.success("ลบเครื่องจักรเรียบร้อยแล้ว");
                fetchEquipments();
            } else {
                toast.error(result.error || "เกิดข้อผิดพลาดในการลบ");
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการลบ");
        } finally {
            setDeleteDialogOpen(false);
            setEquipmentToDelete(null);
        }
    };

    // Handle retire (soft delete)
    const handleRetire = async (equipment: SerializedEquipment) => {
        try {
            const result = await retireEquipmentAction(equipment.id);
            if (result.success) {
                toast.success("ปลดระวางเครื่องจักรเรียบร้อยแล้ว");
                fetchEquipments();
            } else {
                toast.error(result.error || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาด");
        }
    };

    // Selection handlers
    const toggleSelectAll = () => {
        if (selectedIds.length === equipments.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(equipments.map((e) => e.id));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    if (loading && equipments.length === 0) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-10 flex-1 max-w-sm" />
                    <Skeleton className="h-10 w-[180px]" />
                    <Skeleton className="h-10 w-[180px]" />
                </div>
                <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col gap-3">
                {/* Search - Full width on mobile */}
                <div className="relative w-full md:max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="ค้นหารหัส, ชื่อ, สถานที่..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Filter Dropdowns - Scrollable on mobile */}
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
                    {/* Category Filter */}
                    {categories.length > 0 && (
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-[140px] md:w-[150px] flex-shrink-0">
                                <SelectValue placeholder="หมวดหมู่" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">หมวดหมู่ทั้งหมด</SelectItem>
                                {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {/* Status Filter */}
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px] md:w-[150px] flex-shrink-0">
                            <SelectValue placeholder="สถานะ" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">สถานะทั้งหมด</SelectItem>
                            <SelectItem value="ACTIVE">พร้อมใช้งาน</SelectItem>
                            <SelectItem value="INACTIVE">ไม่พร้อม / เสีย</SelectItem>
                            <SelectItem value="MAINTENANCE">ซ่อมบำรุง</SelectItem>
                            <SelectItem value="RETIRED">ปลดระวาง</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Floor Filter */}
                    {floors.length > 0 && (
                        <Select
                            value={floorFilter}
                            onValueChange={(value) => {
                                setFloorFilter(value);
                                setLocationFilter("all"); // Reset location when floor changes
                            }}
                        >
                            <SelectTrigger className="w-[140px] md:w-[150px] flex-shrink-0">
                                <SelectValue placeholder="ชั้น" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">ชั้นทั้งหมด</SelectItem>
                                {floors.map((f) => (
                                    <SelectItem key={f} value={f}>
                                        {f}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {/* Location Filter */}
                    {locations.length > 0 && (
                        <Select value={locationFilter} onValueChange={setLocationFilter}>
                            <SelectTrigger className="w-[140px] md:w-[150px] flex-shrink-0">
                                <SelectValue placeholder="สถานที่" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">สถานที่ทั้งหมด</SelectItem>
                                {locations.map((loc) => (
                                    <SelectItem key={loc} value={loc}>
                                        {loc}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </div>

            {/* Bulk Actions Bar - Only show if user has bulk permissions */}
            {selectedIds.length > 0 && (permissions.canBulkUpdate || permissions.canBulkAssign) && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                            เลือกแล้ว {selectedIds.length} รายการ
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedIds([])}
                            className="h-7 px-2"
                        >
                            <X className="h-3 w-3 mr-1" />
                            ยกเลิก
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        {permissions.canBulkUpdate && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setBulkStatusDialogOpen(true)}
                                className="flex-1 sm:flex-none"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">เปลี่ยน</span>สถานะ
                            </Button>
                        )}
                        {permissions.canBulkAssign && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setBulkAssignDialogOpen(true)}
                                className="flex-1 sm:flex-none"
                            >
                                <UserPlus className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">มอบหมาย</span>ผู้ดูแล
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Mobile Card View - Only on small screens */}
            <div className="block md:hidden">
                <EquipmentMobileList
                    equipments={equipments}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelect}
                    onRetire={handleRetire}
                    onDelete={(eq) => {
                        setEquipmentToDelete(eq);
                        setDeleteDialogOpen(true);
                    }}
                    permissions={permissions}
                />
            </div>

            {/* Desktop Table View - Only on medium screens and up */}
            <div className="hidden md:block rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">
                                <Checkbox
                                    checked={
                                        equipments.length > 0 &&
                                        selectedIds.length === equipments.length
                                    }
                                    onCheckedChange={toggleSelectAll}
                                />
                            </TableHead>
                            <TableHead className="w-[100px]">รูปภาพ</TableHead>
                            <TableHead>รหัส</TableHead>
                            <TableHead>ชื่อ</TableHead>
                            <TableHead>หมวดหมู่</TableHead>
                            <TableHead>สถานที่</TableHead>
                            <TableHead>ชั้น</TableHead>
                            <TableHead>เครื่องจักรหลัก</TableHead>
                            <TableHead>สถานะ</TableHead>
                            <TableHead className="text-center">ใบแจ้งซ่อม</TableHead>
                            <TableHead className="w-12"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {equipments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-24 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <Package className="h-8 w-8 text-muted-foreground" />
                                        <p className="text-muted-foreground">ไม่พบเครื่องจักร</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            equipments.map((equipment) => (
                                <TableRow key={equipment.id}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedIds.includes(equipment.id)}
                                            onCheckedChange={() => toggleSelect(equipment.id)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-12 w-16 rounded overflow-hidden bg-muted/30 flex items-center justify-center border">
                                            {equipment.image ? (
                                                <img
                                                    src={equipment.image}
                                                    alt={equipment.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <Package className="h-6 w-6 text-muted-foreground/50" />
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <Link
                                            href={`/dashboard/equipment/${equipment.id}`}
                                            className="hover:underline"
                                        >
                                            {equipment.code}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{equipment.name}</TableCell>
                                    <TableCell>{equipment.category?.name || "-"}</TableCell>
                                    <TableCell>{equipment.locationRef?.name || equipment.location || "-"}</TableCell>
                                    <TableCell>{equipment.floor || "-"}</TableCell>
                                    <TableCell>
                                        {equipment.parent ? (
                                            <Link href={`/dashboard/equipment/${equipment.parent.id}`} className="hover:underline text-primary">
                                                {equipment.parent.name}
                                            </Link>
                                        ) : "-"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={statusStyles[equipment.status]?.variant || "default"}>
                                            {statusStyles[equipment.status]?.label || equipment.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {equipment._count?.workOrders || 0}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>การดำเนินการ</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/dashboard/equipment/${equipment.id}`}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        ดูรายละเอียด
                                                    </Link>
                                                </DropdownMenuItem>
                                                {permissions.canEdit && (
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/dashboard/equipment/${equipment.id}/edit`}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            แก้ไข
                                                        </Link>
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/dashboard/equipment/${equipment.id}#qrcode`}>
                                                        <QrCode className="mr-2 h-4 w-4" />
                                                        ดู QR Code
                                                    </Link>
                                                </DropdownMenuItem>
                                                {(permissions.canRetire || permissions.canDelete) && (
                                                    <DropdownMenuSeparator />
                                                )}
                                                {permissions.canRetire && equipment.status !== "RETIRED" && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleRetire(equipment)}
                                                        className="text-orange-600"
                                                    >
                                                        <Package className="mr-2 h-4 w-4" />
                                                        ปลดระวาง
                                                    </DropdownMenuItem>
                                                )}
                                                {permissions.canDelete && (
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setEquipmentToDelete(equipment);
                                                            setDeleteDialogOpen(true);
                                                        }}
                                                        className="text-red-600"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        ลบ
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {pagination.totalPages >= 1 && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4 border-t">
                    {/* Info and Page Size */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                        <span>
                            แสดง {equipments.length} จาก {pagination.count} รายการ
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="hidden sm:inline">|</span>
                            <span>แสดง</span>
                            <Select
                                value={pagination.pageSize.toString()}
                                onValueChange={(value) =>
                                    setPagination((prev) => ({
                                        ...prev,
                                        pageSize: parseInt(value),
                                        page: 1,
                                    }))
                                }
                            >
                                <SelectTrigger className="w-[70px] h-8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="5">5</SelectItem>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                            </Select>
                            <span>รายการ</span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between sm:justify-end gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                            }
                            disabled={pagination.page <= 1}
                            className="flex-1 sm:flex-none"
                        >
                            <ChevronLeft className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">ก่อนหน้า</span>
                        </Button>

                        {/* Page Numbers - Desktop only */}
                        <div className="hidden md:flex items-center gap-1">
                            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                let pageNum;
                                if (pagination.totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (pagination.page <= 3) {
                                    pageNum = i + 1;
                                } else if (pagination.page >= pagination.totalPages - 2) {
                                    pageNum = pagination.totalPages - 4 + i;
                                } else {
                                    pageNum = pagination.page - 2 + i;
                                }
                                return (
                                    <Button
                                        key={pageNum}
                                        variant={pagination.page === pageNum ? "default" : "outline"}
                                        size="sm"
                                        className="w-8 h-8 p-0"
                                        onClick={() =>
                                            setPagination((prev) => ({ ...prev, page: pageNum }))
                                        }
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            })}
                        </div>

                        {/* Mobile Page Indicator */}
                        <span className="text-sm md:hidden px-2">
                            {pagination.page} / {pagination.totalPages}
                        </span>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                            }
                            disabled={pagination.page >= pagination.totalPages}
                            className="flex-1 sm:flex-none"
                        >
                            <span className="hidden sm:inline">ถัดไป</span>
                            <ChevronRight className="h-4 w-4 sm:ml-1" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Delete Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
                        <AlertDialogDescription>
                            คุณต้องการลบเครื่องจักร "{equipmentToDelete?.name}" หรือไม่?
                            การดำเนินการนี้ไม่สามารถย้อนกลับได้
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            ลบ
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Bulk Status Dialog */}
            <BulkStatusDialog
                open={bulkStatusDialogOpen}
                onOpenChange={setBulkStatusDialogOpen}
                selectedIds={selectedIds}
                onSuccess={() => {
                    setSelectedIds([]);
                    fetchEquipments();
                }}
            />

            {/* Bulk Assign Dialog */}
            <BulkAssignDialog
                open={bulkAssignDialogOpen}
                onOpenChange={setBulkAssignDialogOpen}
                selectedIds={selectedIds}
                onSuccess={() => {
                    setSelectedIds([]);
                    fetchEquipments();
                }}
            />
        </div>
    );
}
