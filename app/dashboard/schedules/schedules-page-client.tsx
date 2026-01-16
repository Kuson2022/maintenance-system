"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { SchedulesTable } from "@/components/schedules/schedules-table";
import { ScheduleFiltersComponent, ScheduleFilters } from "@/components/schedules/schedule-filters";
import { SerializedMaintenanceScheduleWithRelations } from "@/lib/api/schedules/types";
import { SchedulePermissions } from "@/lib/api/schedules/permissions";
import { pauseScheduleAction, resumeScheduleAction } from "@/app/actions/schedules";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface SchedulesPageClientProps {
    initialSchedules: SerializedMaintenanceScheduleWithRelations[];
    permissions: SchedulePermissions;
    equipmentList: { id: string; name: string; code: string }[];
    technicianList: { id: string; name: string }[];
}

export function SchedulesPageClient({
    initialSchedules,
    permissions,
    equipmentList,
    technicianList,
}: SchedulesPageClientProps) {
    const router = useRouter();
    const [filters, setFilters] = useState<ScheduleFilters>({});
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Filter schedules based on current filters
    const filteredSchedules = useMemo(() => {
        let result = initialSchedules;

        if (filters.search) {
            const search = filters.search.toLowerCase();
            result = result.filter(
                (s) =>
                    s.activityName.toLowerCase().includes(search) ||
                    s.equipment.name.toLowerCase().includes(search) ||
                    s.equipment.code.toLowerCase().includes(search)
            );
        }

        if (filters.equipmentId) {
            result = result.filter((s) => s.equipmentId === filters.equipmentId);
        }

        if (filters.assignedTo) {
            result = result.filter((s) => s.assignedTo === filters.assignedTo);
        }

        if (filters.type) {
            result = result.filter((s) => s.type === filters.type);
        }

        if (filters.frequency) {
            result = result.filter((s) => s.frequency === filters.frequency);
        }

        if (filters.status) {
            result = result.filter((s) => s.status === filters.status);
        }

        return result;
    }, [initialSchedules, filters]);

    // Pagination
    const totalItems = filteredSchedules.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedSchedules = filteredSchedules.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    const handleFiltersChange = (newFilters: ScheduleFilters) => {
        setFilters(newFilters);
        setPage(1);
    };

    const handleComplete = (id: string) => {
        // Navigate to detail page to complete
        router.push(`/dashboard/schedules/${id}`);
    };

    const handlePause = async (id: string) => {
        const result = await pauseScheduleAction(id);
        if (result.success) {
            toast.success("หยุดตารางบำรุงรักษาชั่วคราวแล้ว");
            router.refresh();
        } else {
            toast.error(result.error || "เกิดข้อผิดพลาด");
        }
    };

    const handleResume = async (id: string) => {
        const result = await resumeScheduleAction(id);
        if (result.success) {
            toast.success("เปิดใช้งานตารางบำรุงรักษาแล้ว");
            router.refresh();
        } else {
            toast.error(result.error || "เกิดข้อผิดพลาด");
        }
    };

    const handleRefresh = () => {
        router.refresh();
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="rounded-lg border bg-card p-4">
                <ScheduleFiltersComponent
                    equipmentList={equipmentList}
                    technicianList={technicianList}
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                />
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                    แสดง {startIndex + 1}-{Math.min(endIndex, totalItems)} จาก {totalItems} รายการ
                </span>
            </div>

            {/* Table */}
            <SchedulesTable
                data={paginatedSchedules}
                permissions={permissions}
                onComplete={handleComplete}
                onPause={handlePause}
                onResume={handleResume}
                onRefresh={handleRefresh}
            />

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">แสดง</span>
                        <Select
                            value={String(pageSize)}
                            onValueChange={(value) => {
                                setPageSize(Number(value));
                                setPage(1);
                            }}
                        >
                            <SelectTrigger className="w-[80px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                        </Select>
                        <span className="text-sm text-muted-foreground">รายการ</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(page - 1)}
                            disabled={page === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm">
                            หน้า {page} / {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(page + 1)}
                            disabled={page === totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
