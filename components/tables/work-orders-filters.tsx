"use client";

/**
 * Work Orders Filters Component
 * Filters สำหรับกรอง Work Orders - Mobile-responsive version
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  STATUS_CONFIG,
  PRIORITY_CONFIG,
} from "@/lib/api/work-orders/types";
import { Filter, X, Search } from "lucide-react";
import { getAvailableTechniciansAction } from "@/app/actions/work-orders";

interface Technician {
  id: string;
  name: string;
  email: string;
}

interface WorkOrderFiltersProps {
  onFilterChange: (filters: any) => void;
  currentFilters: any;
}

export function WorkOrderFilters({
  onFilterChange,
  currentFilters,
}: WorkOrderFiltersProps) {
  const [localFilters, setLocalFilters] = useState(currentFilters);
  const [isOpen, setIsOpen] = useState(false);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(true);

  // Debounced search
  const [searchValue, setSearchValue] = useState(currentFilters.search || "");

  // Load technicians on mount (for advanced filters)
  useEffect(() => {
    async function loadFilterData() {
      try {
        setLoadingFilters(true);
        const technicianResult = await getAvailableTechniciansAction();

        if (technicianResult.success && technicianResult.data) {
          setTechnicians(technicianResult.data);
        }
      } catch (error) {
        console.error("Error loading filter data:", error);
      } finally {
        setLoadingFilters(false);
      }
    }
    loadFilterData();
  }, []);

  // Debounced search - wait 300ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== currentFilters.search) {
        onFilterChange({ ...currentFilters, search: searchValue || undefined });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue]);

  // Sync search value with currentFilters
  useEffect(() => {
    setSearchValue(currentFilters.search || "");
  }, [currentFilters.search]);

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
    setIsOpen(false);
  };

  const handleResetFilters = () => {
    const emptyFilters = {};
    setLocalFilters(emptyFilters);
    setSearchValue("");
    onFilterChange(emptyFilters);
  };

  const getActiveFiltersCount = () => {
    return Object.keys(currentFilters).filter(
      (key) => currentFilters[key] !== undefined && currentFilters[key] !== ""
    ).length;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="space-y-3">
      {/* Row 1: Search - Full width */}
      <div className="relative w-full md:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="ค้นหา WO Number, หัวเรื่อง, เครื่องจักร, สถานที่..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Row 2: Quick Filters - Scrollable on mobile like Equipment */}
      <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
        {/* Status Filter */}
        <Select
          value={currentFilters.status || "all"}
          onValueChange={(value) =>
            onFilterChange({
              ...currentFilters,
              status: value === "all" ? undefined : value,
            })
          }
        >
          <SelectTrigger className="w-[140px] md:w-[180px] flex-shrink-0">
            <SelectValue placeholder="สถานะ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">สถานะทั้งหมด</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([value, config]) => (
              <SelectItem key={value} value={value}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Priority Filter */}
        <Select
          value={currentFilters.priority || "all"}
          onValueChange={(value) =>
            onFilterChange({
              ...currentFilters,
              priority: value === "all" ? undefined : value,
            })
          }
        >
          <SelectTrigger className="w-[140px] md:w-[180px] flex-shrink-0">
            <SelectValue placeholder="ความเร่งด่วน" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกระดับ</SelectItem>
            {Object.entries(PRIORITY_CONFIG).map(([value, config]) => (
              <SelectItem key={value} value={value}>
                {config.icon} {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>


        {/* Advanced Filters Button */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="flex-shrink-0 relative">
              <Filter className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">ตัวกรองขั้นสูง</span>
              {activeFiltersCount > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-1 md:ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[320px] sm:w-[400px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>ตัวกรองขั้นสูง</SheetTitle>
              <SheetDescription>
                กรองข้อมูลใบแจ้งซ่อมตามเงื่อนไขที่ต้องการ
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 py-6">
              {/* Date Range */}
              <div className="space-y-2">
                <Label>ช่วงวันที่แจ้งซ่อม</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      จากวันที่
                    </Label>
                    <Input
                      type="date"
                      value={localFilters.dateFrom || ""}
                      onChange={(e) =>
                        setLocalFilters({
                          ...localFilters,
                          dateFrom: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      ถึงวันที่
                    </Label>
                    <Input
                      type="date"
                      value={localFilters.dateTo || ""}
                      onChange={(e) =>
                        setLocalFilters({
                          ...localFilters,
                          dateTo: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Multiple Status Selection */}
              <div className="space-y-2">
                <Label>สถานะ (เลือกหลายรายการ)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                    <label
                      key={value}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={
                          Array.isArray(localFilters.status)
                            ? localFilters.status.includes(value)
                            : localFilters.status === value
                        }
                        onChange={(e) => {
                          let newStatus = Array.isArray(localFilters.status)
                            ? [...localFilters.status]
                            : localFilters.status
                              ? [localFilters.status]
                              : [];

                          if (e.target.checked) {
                            newStatus.push(value);
                          } else {
                            newStatus = newStatus.filter((s) => s !== value);
                          }

                          setLocalFilters({
                            ...localFilters,
                            status: newStatus.length > 0 ? newStatus : undefined,
                          });
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{config.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Multiple Priority Selection */}
              <div className="space-y-2">
                <Label>ความเร่งด่วน (เลือกหลายรายการ)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(PRIORITY_CONFIG).map(([value, config]) => (
                    <label
                      key={value}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={
                          Array.isArray(localFilters.priority)
                            ? localFilters.priority.includes(value)
                            : localFilters.priority === value
                        }
                        onChange={(e) => {
                          let newPriority = Array.isArray(localFilters.priority)
                            ? [...localFilters.priority]
                            : localFilters.priority
                              ? [localFilters.priority]
                              : [];

                          if (e.target.checked) {
                            newPriority.push(value);
                          } else {
                            newPriority = newPriority.filter((p) => p !== value);
                          }

                          setLocalFilters({
                            ...localFilters,
                            priority:
                              newPriority.length > 0 ? newPriority : undefined,
                          });
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">
                        {config.icon} {config.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Technician */}
              <div className="space-y-2">
                <Label>ช่างผู้รับผิดชอบ</Label>
                <Select
                  value={localFilters.assignedTo || "all"}
                  onValueChange={(value) =>
                    setLocalFilters({
                      ...localFilters,
                      assignedTo: value === "all" ? undefined : value,
                    })
                  }
                  disabled={loadingFilters}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingFilters ? "กำลังโหลด..." : "เลือกช่าง"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ช่างทั้งหมด</SelectItem>
                    {technicians.map((tech) => (
                      <SelectItem key={tech.id} value={tech.id}>
                        {tech.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={handleResetFilters} variant="outline" className="flex-1">
                <X className="h-4 w-4 mr-2" />
                ล้างตัวกรอง
              </Button>
              <Button onClick={handleApplyFilters} className="flex-1">
                <Filter className="h-4 w-4 mr-2" />
                ใช้ตัวกรอง
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Clear All Filters Button */}
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="text-muted-foreground hover:text-foreground flex-shrink-0"
          >
            <X className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">ล้างทั้งหมด</span>
          </Button>
        )}
      </div>
    </div>
  );
}