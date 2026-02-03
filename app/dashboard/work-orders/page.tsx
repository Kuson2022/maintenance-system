//app/dashboard/work-order/page.tsx
import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText } from "lucide-react";
import { WorkOrdersList } from "./work-orders-list";
import { WorkOrdersStats } from "./work-orders-stats";
import { WorkOrdersStatsToggle } from "./work-orders-stats-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkOrdersExportButton } from "@/components/work-orders/export-button";

export const revalidate = 30; // Cache for 30 seconds

/**
 * Work Orders Main Page (Server Component)
 * หน้ารายการใบแจ้งซ่อม
 */

export default function WorkOrdersPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">ใบแจ้งซ่อม</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            จัดการและติดตามใบแจ้งซ่อมทั้งหมด
          </p>
        </div>
        <div className="flex gap-2">
          <WorkOrdersExportButton />
          <Button asChild>
            <Link href="/dashboard/work-orders/new">
              <Plus className="h-4 w-4 mr-2" />
              สร้างใบแจ้งซ่อม
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards - Toggle on mobile */}
      <WorkOrdersStatsToggle>
        <Suspense fallback={<StatsLoadingSkeleton />}>
          <WorkOrdersStats />
        </Suspense>
      </WorkOrdersStatsToggle>

      {/* Work Orders List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            รายการใบแจ้งซ่อม
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<TableLoadingSkeleton />}>
            <WorkOrdersList />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

// Loading Skeletons
function StatsLoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TableLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 flex-1 max-w-sm" />
        <Skeleton className="h-10 w-[180px]" />
        <Skeleton className="h-10 w-[180px]" />
        <Skeleton className="h-10 w-[150px]" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}