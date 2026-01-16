// app/dashboard/work-orders/[id]/page.tsx

import { notFound } from "next/navigation";
import { getWorkOrderById } from "@/lib/api/work-orders/queries";
import { createClient } from "@/lib/supabase/server";
import { WorkOrderHeader } from "./components/work-order-header";
import { WorkOrderInfo } from "./components/work-order-info";
import { WorkOrderTimeline } from "./components/work-order-timeline";
import { MaintenanceLogSection } from "./components/maintenance-log-section";
import { ExpensesSection } from "./components/expenses-section";
import { AttachmentsSection } from "./components/attachments-section";
import { CommentsSection } from "./components/comments-section";
import { WorkOrderStats } from "./components/work-order-stats";

interface WorkOrderDetailPageProps {
  params: {
    id: string;
  };
}

/**
 * ✅ Helper function to serialize data
 * แปลง Decimal → number, Date → string
 */
function serializeWorkOrder(data: any) {
  return JSON.parse(
    JSON.stringify(data, (key, value) => {
      // แปลง Decimal เป็น number
      if (value && typeof value === "object" && value.constructor?.name === "Decimal") {
        return Number(value);
      }
      // แปลง Date เป็น ISO string
      if (value instanceof Date) {
        return value.toISOString();
      }
      // แปลง BigInt เป็น string
      if (typeof value === "bigint") {
        return value.toString();
      }
      return value;
    })
  );
}

export default async function WorkOrderDetailPage({
  params,
}: WorkOrderDetailPageProps) {
  // ✅ Await params ใน Next.js 15
  const { id } = await params;

  // Get current user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return notFound();
  }

  // Fetch DB user for role
  const dbUser = await import("@/lib/prisma").then((m) =>
    m.prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    })
  );

  const isAdmin = dbUser?.role === "ADMIN";

  // Fetch work order with all relations
  const workOrderRaw = await getWorkOrderById(id);

  if (!workOrderRaw) {
    return notFound();
  }

  // ✅ Serialize work order เพื่อแปลง Decimal และ Date
  const workOrder = serializeWorkOrder(workOrderRaw);

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <WorkOrderHeader workOrder={workOrder} currentUserId={user.id} />

      {/* Stats cards */}
      <WorkOrderStats
        stats={{
          totalExpenses: (workOrder.expenses || []).reduce(
            (sum: number, exp: any) => sum + Number(exp.total),
            0
          ),
          totalWorkHours: (workOrder.maintenanceLogs || []).reduce(
            (sum: number, log: any) => sum + Number(log.workHours || 0),
            0
          ),
          commentsCount: workOrder._count?.comments || 0,
          attachmentsCount: workOrder._count?.attachments || 0,
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Work Order Information */}
          <WorkOrderInfo workOrder={workOrder} />

          {/* Maintenance Logs */}
          <MaintenanceLogSection
            workOrder={workOrder}
            currentUserId={user.id}
            isAdmin={isAdmin}
          />

          {/* Expenses */}
          <ExpensesSection workOrder={workOrder} currentUserId={user.id} />

          {/* Attachments */}
          <AttachmentsSection
            workOrder={workOrder}
            currentUserId={user.id}
            isAdmin={isAdmin}
          />

          {/* Comments */}
          <CommentsSection workOrder={workOrder} currentUserId={user.id} />
        </div>

        {/* Right Column - Timeline */}
        <div className="lg:col-span-1">
          <WorkOrderTimeline workOrderId={workOrder.id} />
        </div>
      </div>
    </div>
  );
}

// Generate metadata
export async function generateMetadata({
  params,
}: WorkOrderDetailPageProps) {
  // ✅ Await params ใน Next.js 15
  const { id } = await params;

  const workOrder = await getWorkOrderById(id);

  if (!workOrder) {
    return {
      title: "ไม่พบใบแจ้งซ่อม",
    };
  }

  return {
    title: `${workOrder.woNumber} - ${workOrder.title}`,
    description: workOrder.description,
  };
}