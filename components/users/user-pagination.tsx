"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Pagination } from "@/components/shared/pagination";

interface UserPaginationProps {
    totalPages: number;
    pageSize: number;
    totalItems: number;
    currentPage: number;
}

export function UserPagination({
    totalPages,
    pageSize,
    totalItems,
    currentPage,
}: UserPaginationProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handlePageChange = (page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", page.toString());
        router.push(`?${params.toString()}`);
    };

    const handlePageSizeChange = (size: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("limit", size.toString());
        params.set("page", "1"); // Reset to page 1 when changing size
        router.push(`?${params.toString()}`);
    };

    return (
        <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
        />
    );
}
