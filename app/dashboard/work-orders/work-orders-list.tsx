"use client";

//app/dashboard/work-order/work-orders-list.tsx
/**
 * Work Orders List Component (Client Component)
 * จัดการ state, filters, pagination
 */

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { WorkOrdersTable } from "@/components/tables/work-orders-table";
import { WorkOrderFilters } from "@/components/tables/work-orders-filters";
import { Pagination } from "@/components/shared/pagination";
import { getWorkOrdersAction, getCurrentUserRoleAction } from "@/app/actions/work-orders";
import { SerializedWorkOrderWithRelations } from "@/lib/api/work-orders/serialized-types"; // ✅ ใช้ serialized type
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";

export function WorkOrdersList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State - ✅ ใช้ SerializedWorkOrderWithRelations
  const [workOrders, setWorkOrders] = useState<SerializedWorkOrderWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get("page")) || 1
  );
  const [pageSize, setPageSize] = useState(
    Number(searchParams.get("limit")) || 20
  );
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filters state
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || undefined,
    status: searchParams.get("status") || undefined,
    priority: searchParams.get("priority") || undefined,
    equipmentId: searchParams.get("equipmentId") || undefined,
    assignedTo: searchParams.get("assignedTo") || undefined,
    dateFrom: searchParams.get("dateFrom") || undefined,
    dateTo: searchParams.get("dateTo") || undefined,
    location: searchParams.get("location") || undefined,
  });

  // Sort state
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "reportedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    (searchParams.get("sortOrder") as "asc" | "desc") || "desc"
  );

  // Fetch data
  useEffect(() => {
    fetchWorkOrders();
  }, [currentPage, pageSize, filters, sortBy, sortOrder]);

  // Fetch user role on mount
  useEffect(() => {
    async function fetchUserRole() {
      const result = await getCurrentUserRoleAction();
      if (result.success && result.data) {
        setIsAdmin(result.data.isAdmin);
      }
    }
    fetchUserRole();
  }, []);

  const fetchWorkOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getWorkOrdersAction({
        filters: {
          ...filters,
          // Convert date strings to Date objects
          dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
          dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
        },
        pagination: {
          page: currentPage,
          limit: pageSize,
          sortBy,
          sortOrder,
        },
      });

      if (result.success && result.data) {
        setWorkOrders(result.data.data);
        setTotalPages(result.data.pagination.totalPages);
        setTotalItems(result.data.pagination.total);
      } else {
        setError(result.error || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
      }
    } catch (err) {
      console.error("Fetch work orders error:", err);
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  // Update URL params
  const updateUrlParams = (newParams: any) => {
    const params = new URLSearchParams();

    Object.entries({ ...filters, ...newParams, page: currentPage, limit: pageSize }).forEach(
      ([key, value]) => {
        if (value !== undefined && value !== "") {
          params.set(key, String(value));
        }
      }
    );

    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Handle filter change
  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page
    updateUrlParams(newFilters);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrlParams({ page });
  };

  // Handle page size change
  const handlePageSizeChange = (limit: number) => {
    setPageSize(limit);
    setCurrentPage(1); // Reset to first page
    updateUrlParams({ limit, page: 1 });
  };

  // Handle sort
  const handleSort = (column: string) => {
    const newSortOrder =
      sortBy === column && sortOrder === "desc" ? "asc" : "desc";
    setSortBy(column);
    setSortOrder(newSortOrder);
    updateUrlParams({ sortBy: column, sortOrder: newSortOrder });
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <WorkOrderFilters
        currentFilters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Table */}
          <WorkOrdersTable
            data={workOrders}
            onSort={handleSort}
            currentSort={{ column: sortBy, order: sortOrder }}
            onRefresh={fetchWorkOrders}
            isAdmin={isAdmin}
          />

          {/* Pagination */}
          {totalItems > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </>
      )}
    </div>
  );
}