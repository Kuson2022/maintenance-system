// app/(dashboard)/work-orders/[id]/edit/page.tsx

import { notFound, redirect } from "next/navigation";
import { getWorkOrderById } from "@/lib/api/work-orders/queries";
import { createClient } from "@/lib/supabase/server";
import { checkWorkOrderPermissions } from "@/lib/api/work-orders/queries";
import { EditWorkOrderForm } from "./component/edit-work-order-form";

interface EditWorkOrderPageProps {
  params: {
    id: string;
  };
}

/**
 * Helper function to serialize data
 */
function serializeWorkOrder(data: any) {
  return JSON.parse(
    JSON.stringify(data, (key, value) => {
      if (value && typeof value === "object" && value.constructor?.name === "Decimal") {
        return Number(value);
      }
      if (value instanceof Date) {
        return value.toISOString();
      }
      if (typeof value === "bigint") {
        return value.toString();
      }
      return value;
    })
  );
}

export default async function EditWorkOrderPage({
  params,
}: EditWorkOrderPageProps) {
  // Await params (Next.js 15)
  const { id } = await params;

  // Get current user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch work order
  const workOrderRaw = await getWorkOrderById(id);

  if (!workOrderRaw) {
    notFound();
  }

  // Check permissions
  const permissions = await checkWorkOrderPermissions(id, user.id);

  if (!permissions.canEdit) {
    redirect(`/dashboard/work-orders/${id}`);
  }

  // Serialize work order
  const workOrder = serializeWorkOrder(workOrderRaw);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">แก้ไขใบแจ้งซ่อม</h1>
        <p className="text-muted-foreground mt-2">
          แก้ไขข้อมูลใบแจ้งซ่อม {workOrder.woNumber}
        </p>
      </div>

      {/* Form */}
      <EditWorkOrderForm workOrder={workOrder} />
    </div>
  );
}

// Generate metadata
export async function generateMetadata({ params }: EditWorkOrderPageProps) {
  const { id } = await params;
  const workOrder = await getWorkOrderById(id);

  if (!workOrder) {
    return {
      title: "ไม่พบใบแจ้งซ่อม",
    };
  }

  return {
    title: `แก้ไข ${workOrder.woNumber} - ${workOrder.title}`,
  };
}