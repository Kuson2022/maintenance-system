"use client";

/**
 * Date Range Picker Component
 * ตัวเลือกช่วงวันที่สำหรับกรองข้อมูล
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { format, subDays, subMonths, subYears, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface DateRange {
    from: Date | undefined;
    to: Date | undefined;
}

interface DateRangePickerProps {
    value: DateRange;
    onChange: (range: DateRange) => void;
    className?: string;
}

const presets = [
    { label: "7 วันที่แล้ว", value: "7d" },
    { label: "30 วันที่แล้ว", value: "30d" },
    { label: "เดือนนี้", value: "this-month" },
    { label: "เดือนที่แล้ว", value: "last-month" },
    { label: "ปีนี้", value: "this-year" },
    { label: "ปีที่แล้ว", value: "last-year" },
    { label: "12 เดือนที่แล้ว", value: "12m" },
];

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handlePresetChange = (presetValue: string) => {
        const now = new Date();
        let from: Date;
        let to: Date = now;

        switch (presetValue) {
            case "7d":
                from = subDays(now, 7);
                break;
            case "30d":
                from = subDays(now, 30);
                break;
            case "this-month":
                from = startOfMonth(now);
                to = endOfMonth(now);
                break;
            case "last-month":
                from = startOfMonth(subMonths(now, 1));
                to = endOfMonth(subMonths(now, 1));
                break;
            case "this-year":
                from = startOfYear(now);
                to = endOfYear(now);
                break;
            case "last-year":
                from = startOfYear(subYears(now, 1));
                to = endOfYear(subYears(now, 1));
                break;
            case "12m":
                from = subMonths(now, 12);
                break;
            default:
                from = subMonths(now, 12);
        }

        onChange({ from, to });
    };

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Select onValueChange={handlePresetChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="เลือกช่วงเวลา" />
                </SelectTrigger>
                <SelectContent>
                    {presets.map((preset) => (
                        <SelectItem key={preset.value} value={preset.value}>
                            {preset.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className={cn(
                            "justify-start text-left font-normal min-w-[280px]",
                            !value.from && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {value.from ? (
                            value.to ? (
                                <>
                                    {format(value.from, "d MMM yy", { locale: th })} -{" "}
                                    {format(value.to, "d MMM yy", { locale: th })}
                                </>
                            ) : (
                                format(value.from, "d MMM yyyy", { locale: th })
                            )
                        ) : (
                            "เลือกช่วงวันที่"
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={value.from}
                        selected={{ from: value.from, to: value.to }}
                        onSelect={(range) => {
                            onChange({ from: range?.from, to: range?.to });
                            if (range?.from && range?.to) {
                                setIsOpen(false);
                            }
                        }}
                        numberOfMonths={2}
                        locale={th}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}
