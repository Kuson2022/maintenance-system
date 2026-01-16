import { ExpenseForm } from "@/components/expenses/expense-form";

export default function NewExpensePage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">บันทึกค่าใช้จ่ายใหม่</h2>
            </div>
            <div className="mx-auto max-w-2xl">
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <ExpenseForm />
                </div>
            </div>
        </div>
    );
}
