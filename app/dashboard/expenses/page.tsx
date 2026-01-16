import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getExpensesAction, getExpenseStatsAction, checkExpensePermissionsAction } from "@/app/actions/expenses";
import { ExpensesPageClient, ExpensesPageSkeleton } from "@/components/expenses/expenses-page-client";

export default async function ExpensesPage() {
  // Fetch initial data in parallel
  const [expensesResult, statsResult, permissionsResult] = await Promise.all([
    getExpensesAction({}, { page: 1, pageSize: 50 }),
    getExpenseStatsAction("year"),
    checkExpensePermissionsAction(),
  ]);

  const expenses = expensesResult.success && expensesResult.data ? expensesResult.data : [];
  const stats = statsResult.success && statsResult.data ? statsResult.data : {
    totalAmount: 0,
    totalCount: 0,
    byType: [],
    byMonth: [],
  };
  const canCreate = permissionsResult.success && permissionsResult.data?.canCreate;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">ค่าใช้จ่าย</h2>
          <p className="text-muted-foreground">
            ติดตามและวิเคราะห์ค่าใช้จ่ายในการซ่อมบำรุง
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/dashboard/expenses/new">
              <Plus className="mr-2 h-4 w-4" /> บันทึกค่าใช้จ่าย
            </Link>
          </Button>
        )}
      </div>

      {/* Main Content */}
      <Suspense fallback={<ExpensesPageSkeleton />}>
        <ExpensesPageClient initialExpenses={expenses} initialStats={stats} />
      </Suspense>
    </div>
  );
}