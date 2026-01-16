import { Suspense } from "react";
import { getSchedules } from "@/lib/api/schedules/queries";
import { ScheduleCalendar } from "@/components/schedules/schedule-calendar";
import { Button } from "@/components/ui/button";
import { Plus, Calendar as CalendarIcon, List as ListIcon } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/server";
import { checkSchedulePermissions } from "@/lib/api/schedules/permissions";
import prisma from "@/lib/prisma";
import { SchedulesPageClient } from "./schedules-page-client";

// Get equipment and technician lists for filters
async function getFilterData() {
  const [equipment, technicians] = await Promise.all([
    prisma.equipment.findMany({
      where: { status: { in: ["ACTIVE", "MAINTENANCE"] } },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { role: { in: ["TECHNICIAN", "ADMIN"] }, status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return { equipment, technicians };
}

export default async function SchedulesPage() {
  // Get current user and permissions
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">กรุณาเข้าสู่ระบบ</p>
      </div>
    );
  }

  const permissions = await checkSchedulePermissions(user.id);

  // Check if user can view
  if (!permissions.canView) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">ไม่มีสิทธิ์เข้าถึงหน้านี้</p>
      </div>
    );
  }

  // Fetch data in parallel
  const [schedules, filterData] = await Promise.all([
    getSchedules({ status: undefined }), // Fetch all
    getFilterData(),
  ]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
          Maintenance Schedules
        </h2>
        <div className="flex items-center gap-2">
          {permissions.canCreate && (
            <Link href="/dashboard/schedules/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Create Schedule
              </Button>
            </Link>
          )}
        </div>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="list">
              <ListIcon className="mr-2 h-4 w-4" /> List
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <CalendarIcon className="mr-2 h-4 w-4" /> Calendar
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="list" className="space-y-4">
          <Suspense fallback={<div>กำลังโหลด...</div>}>
            <SchedulesPageClient
              initialSchedules={schedules}
              permissions={permissions}
              equipmentList={filterData.equipment}
              technicianList={filterData.technicians}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Suspense fallback={<div>กำลังโหลด Calendar...</div>}>
            <ScheduleCalendar schedules={schedules} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}