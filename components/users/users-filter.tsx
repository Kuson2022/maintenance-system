"use client";

/**
 * Users Filter Component
 * ตัวกรองผู้ใช้ตาม Role และ Status
 */

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useCallback } from "react";

export function UsersFilter() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) {
                params.set(name, value);
            } else {
                params.delete(name);
            }
            return params.toString();
        },
        [searchParams]
    );

    const handleFilter = (name: string, value: string) => {
        const queryString = createQueryString(name, value);
        router.push(`${pathname}?${queryString}`);
    };

    const handleClearFilters = () => {
        router.push(pathname);
    };

    const hasFilters = role || status || search;

    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="ค้นหาชื่อหรืออีเมล..."
                    value={search}
                    onChange={(e) => handleFilter("search", e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Role Filter */}
            <Select value={role} onValueChange={(value) => handleFilter("role", value)}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="ทุก Role" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">ทุก Role</SelectItem>
                    <SelectItem value="USER">ผู้ใช้ทั่วไป</SelectItem>
                    <SelectItem value="TECHNICIAN">ช่างเทคนิค</SelectItem>
                    <SelectItem value="ADMIN">ผู้ดูแลระบบ</SelectItem>
                </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={status} onValueChange={(value) => handleFilter("status", value)}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="ทุกสถานะ" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">ทุกสถานะ</SelectItem>
                    <SelectItem value="ACTIVE">ใช้งาน</SelectItem>
                    <SelectItem value="INACTIVE">ไม่ใช้งาน</SelectItem>
                    <SelectItem value="SUSPENDED">ระงับการใช้งาน</SelectItem>
                </SelectContent>
            </Select>

            {/* Clear Filters */}
            {hasFilters && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                    <X className="mr-2 h-4 w-4" />
                    ล้างตัวกรอง
                </Button>
            )}
        </div>
    );
}
