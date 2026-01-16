"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, X, Filter } from "lucide-react";
import { MaintenanceScheduleType, MaintenanceScheduleFrequency } from "@prisma/client";

export interface ScheduleFilters {
    search?: string;
    equipmentId?: string;
    assignedTo?: string;
    type?: string;
    frequency?: string;
    status?: string;
}

interface ScheduleFiltersProps {
    equipmentList: { id: string; name: string; code: string }[];
    technicianList: { id: string; name: string }[];
    filters: ScheduleFilters;
    onFiltersChange: (filters: ScheduleFilters) => void;
}

export function ScheduleFiltersComponent({
    equipmentList,
    technicianList,
    filters,
    onFiltersChange,
}: ScheduleFiltersProps) {
    const [localSearch, setLocalSearch] = useState(filters.search || "");

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            if (localSearch !== filters.search) {
                onFiltersChange({ ...filters, search: localSearch || undefined });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [localSearch]);

    const handleFilterChange = (key: keyof ScheduleFilters, value: string) => {
        onFiltersChange({
            ...filters,
            [key]: value === "all" ? undefined : value,
        });
    };

    const clearFilters = () => {
        setLocalSearch("");
        onFiltersChange({});
    };

    const hasActiveFilters = Object.values(filters).some((v) => v !== undefined && v !== "");

    return (
        <div className="space-y-4">
            {/* Search bar */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="ค้นหาตามชื่อกิจกรรมหรืออุปกรณ์..."
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                {hasActiveFilters && (
                    <Button variant="outline" onClick={clearFilters} className="shrink-0">
                        <X className="mr-2 h-4 w-4" />
                        ล้างตัวกรอง
                    </Button>
                )}
            </div>

            {/* Filter controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* Equipment Filter */}
                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">อุปกรณ์</Label>
                    <Select
                        value={filters.equipmentId || "all"}
                        onValueChange={(value) => handleFilterChange("equipmentId", value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="ทั้งหมด" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">ทั้งหมด</SelectItem>
                            {equipmentList.map((eq) => (
                                <SelectItem key={eq.id} value={eq.id}>
                                    {eq.name} ({eq.code})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Type Filter */}
                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">ประเภท</Label>
                    <Select
                        value={filters.type || "all"}
                        onValueChange={(value) => handleFilterChange("type", value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="ทั้งหมด" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">ทั้งหมด</SelectItem>
                            {Object.values(MaintenanceScheduleType).map((type) => (
                                <SelectItem key={type} value={type}>
                                    {type === "PREVENTIVE" ? "Preventive" :
                                        type === "PREDICTIVE" ? "Predictive" :
                                            type === "ROUTINE" ? "Routine" : type}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Frequency Filter */}
                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">ความถี่</Label>
                    <Select
                        value={filters.frequency || "all"}
                        onValueChange={(value) => handleFilterChange("frequency", value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="ทั้งหมด" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">ทั้งหมด</SelectItem>
                            {Object.values(MaintenanceScheduleFrequency).map((freq) => (
                                <SelectItem key={freq} value={freq}>
                                    {freq === "DAILY" ? "รายวัน" :
                                        freq === "WEEKLY" ? "รายสัปดาห์" :
                                            freq === "BI_WEEKLY" ? "ทุก 2 สัปดาห์" :
                                                freq === "MONTHLY" ? "รายเดือน" :
                                                    freq === "QUARTERLY" ? "รายไตรมาส" :
                                                        freq === "SEMI_ANNUALLY" ? "ทุก 6 เดือน" :
                                                            freq === "ANNUALLY" ? "รายปี" : freq}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">สถานะ</Label>
                    <Select
                        value={filters.status || "all"}
                        onValueChange={(value) => handleFilterChange("status", value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="ทั้งหมด" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">ทั้งหมด</SelectItem>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Assignee Filter */}
                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">ผู้รับผิดชอบ</Label>
                    <Select
                        value={filters.assignedTo || "all"}
                        onValueChange={(value) => handleFilterChange("assignedTo", value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="ทั้งหมด" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">ทั้งหมด</SelectItem>
                            {technicianList.map((tech) => (
                                <SelectItem key={tech.id} value={tech.id}>
                                    {tech.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}
