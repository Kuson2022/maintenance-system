import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getWorkOrderReportData } from "@/lib/api/reports/queries";
import { createClient } from "@/lib/supabase/server";
import { checkReportPermissions } from "@/lib/api/reports/permissions";
import { WorkOrdersReportClient } from "./work-orders-report-client";
import { subDays } from "date-fns";

async function checkAccess() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const permissions = await checkReportPermissions(user.id);
    if (!permissions.canView) {
        redirect("/dashboard");
    }
}

async function WorkOrdersReportContent() {
    await checkAccess();

    // Fetch initial data with 30-day default
    const now = new Date();
    const data = await getWorkOrderReportData({
        startDate: subDays(now, 30),
        endDate: now,
    });

    return <WorkOrdersReportClient initialData={data} />;
}

export default function WorkOrdersReportPage() {
    return (
        <Suspense
            fallback={
                <div className="space-y-6">
                    <div className="h-8 w-64 bg-muted animate-pulse rounded" />
                    <div className="grid gap-4 md:grid-cols-5">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-28 bg-muted animate-pulse rounded-lg" />
                        ))}
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                        {[1, 2].map((i) => (
                            <div key={i} className="h-80 bg-muted animate-pulse rounded-lg" />
                        ))}
                    </div>
                </div>
            }
        >
            <WorkOrdersReportContent />
        </Suspense>
    );
}
