import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package } from "lucide-react";
import { EquipmentList } from "./equipment-list";
import { EquipmentStats } from "./equipment-stats";
import { WarrantyAlertsSection } from "@/components/equipment/warranty-alerts-section";
import { EquipmentActionButtons } from "@/components/equipment/equipment-action-buttons";

export default function EquipmentPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">เครื่องจักร</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            จัดการข้อมูลเครื่องจักรและอุปกรณ์
          </p>
        </div>
        <Suspense fallback={<Skeleton className="h-10 w-48" />}>
          <EquipmentActionButtons />
        </Suspense>
      </div>

      {/* Warranty Alerts */}
      <Suspense fallback={null}>
        <WarrantyAlertsSection />
      </Suspense>

      {/* Stats */}
      <Suspense fallback={<StatsLoadingSkeleton />}>
        <EquipmentStats />
      </Suspense>

      {/* Equipment List */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Package className="h-5 w-5" />
            รายการเครื่องจักร
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <Suspense fallback={<TableLoadingSkeleton />}>
            <EquipmentList />
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
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}