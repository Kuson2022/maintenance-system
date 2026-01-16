"use client";

/**
 * Expense Filters Component
 * Filter ค่าใช้จ่ายตามช่วงเวลา, ประเภท, เครื่องจักร
 */

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { CalendarIcon, Filter, RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getExpenseTypesAction } from "@/app/actions/expenses";
import { getAvailableEquipmentAction } from "@/app/actions/equipment";

interface ExpenseType {
    id: string;
    name: string;
}

interface Equipment {
    id: string;
    code: string;
    name: string;
}

interface ExpenseFiltersProps {
    onFilterChange: (filters: FilterValues) => void;
    initialFilters?: FilterValues;
}

export interface FilterValues {
    startDate?: Date;
    endDate?: Date;
    expenseTypeId?: string;
    equipmentId?: string;
}

const ALL_VALUE = "__all__"; // Special value for "All" option

export function ExpenseFilters({ onFilterChange, initialFilters }: ExpenseFiltersProps) {
    const [startDate, setStartDate] = useState<Date | undefined>(initialFilters?.startDate);
    const [endDate, setEndDate] = useState<Date | undefined>(initialFilters?.endDate);
    const [expenseTypeId, setExpenseTypeId] = useState<string>(initialFilters?.expenseTypeId || ALL_VALUE);
    const [equipmentId, setEquipmentId] = useState<string>(initialFilters?.equipmentId || ALL_VALUE);

    const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch options on mount
    useEffect(() => {
        async function fetchOptions() {
            try {
                setLoading(true);
                const [typesRes, equipmentRes] = await Promise.all([
                    getExpenseTypesAction(),
                    getAvailableEquipmentAction(),
                ]);

                if (typesRes.success && typesRes.data) {
                    setExpenseTypes(typesRes.data);
                }
                if (equipmentRes.success && equipmentRes.data) {
                    setEquipment(equipmentRes.data.map((eq: any) => ({
                        id: eq.id,
                        code: eq.code,
                        name: eq.name,
                    })));
                }
            } catch (error) {
                console.error("Failed to fetch filter options:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchOptions();
    }, []);

    const handleApplyFilters = () => {
        onFilterChange({
            startDate,
            endDate,
            expenseTypeId: expenseTypeId === ALL_VALUE ? undefined : expenseTypeId,
            equipmentId: equipmentId === ALL_VALUE ? undefined : equipmentId,
        });
    };

    const handleResetFilters = () => {
        setStartDate(undefined);
        setEndDate(undefined);
        setExpenseTypeId(ALL_VALUE);
        setEquipmentId(ALL_VALUE);
        onFilterChange({});
    };

    const hasFilters = startDate || endDate || expenseTypeId !== ALL_VALUE || equipmentId !== ALL_VALUE;

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex flex-col gap-4">
                    {/* Header */}
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Filter className="h-4 w-4" />
                        <span>ตัวกรองข้อมูล</span>
                    </div>

                    {/* Filters Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* Start Date */}
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">วันที่เริ่มต้น</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !startDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {startDate ? format(startDate, "d MMM yyyy", { locale: th }) : "เลือกวันที่"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={startDate}
                                        onSelect={setStartDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* End Date */}
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">วันที่สิ้นสุด</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !endDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {endDate ? format(endDate, "d MMM yyyy", { locale: th }) : "เลือกวันที่"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={endDate}
                                        onSelect={setEndDate}
                                        initialFocus
                                        disabled={(date) => startDate ? date < startDate : false}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Expense Type */}
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">ประเภทค่าใช้จ่าย</label>
                            <Select value={expenseTypeId} onValueChange={setExpenseTypeId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="ทั้งหมด" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={ALL_VALUE}>ทั้งหมด</SelectItem>
                                    {expenseTypes.map((type) => (
                                        <SelectItem key={type.id} value={type.id}>
                                            {type.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Equipment */}
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">เครื่องจักร</label>
                            <Select value={equipmentId} onValueChange={setEquipmentId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="ทั้งหมด" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={ALL_VALUE}>ทั้งหมด</SelectItem>
                                    {equipment.map((eq) => (
                                        <SelectItem key={eq.id} value={eq.id}>
                                            {eq.code} - {eq.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-end gap-2">
                            <Button onClick={handleApplyFilters} className="flex-1">
                                <Search className="h-4 w-4 mr-2" />
                                ค้นหา
                            </Button>
                            {hasFilters && (
                                <Button variant="outline" onClick={handleResetFilters} size="icon">
                                    <RotateCcw className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
