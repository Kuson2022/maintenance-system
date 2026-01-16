"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface PaginationControlsProps {
    meta: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    };
}

export function PaginationControls({ meta }: PaginationControlsProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", newPage.toString());
        router.push(`?${params.toString()}`);
    };

    if (meta.totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between px-2">
            <div className="text-sm text-muted-foreground">
                แสดง {((meta.page - 1) * meta.pageSize) + 1} ถึง {Math.min(meta.page * meta.pageSize, meta.total)} จาก {meta.total} รายการ
            </div>
            <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(meta.page - 1)}
                    disabled={meta.page <= 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                    ก่อนหน้า
                </Button>
                <div className="text-sm font-medium">
                    หน้าที่ {meta.page} จาก {meta.totalPages}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(meta.page + 1)}
                    disabled={meta.page >= meta.totalPages}
                >
                    ถัดไป
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
