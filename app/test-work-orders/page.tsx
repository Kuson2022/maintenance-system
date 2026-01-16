/**
 * หน้าทดสอบ Work Orders API
 * เข้าที่ http://localhost:3000/test-work-orders
 */

import { getWorkOrderStats } from "@/lib/api/work-orders";

export default async function TestWorkOrdersPage() {
  try {
    // ทดสอบดึงสถิติ
    const stats = await getWorkOrderStats();

    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">
          🧪 ทดสอบ Work Orders API
        </h1>

        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Work Order Stats:</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border rounded p-4">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="border rounded p-4">
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.pending}
              </p>
            </div>
            <div className="border rounded p-4">
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats.inProgress}
              </p>
            </div>
            <div className="border rounded p-4">
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.completed}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm text-gray-600">Avg Resolution Time</p>
            <p className="text-xl font-bold">
              {stats.avgResolutionTime
                ? `${stats.avgResolutionTime.toFixed(2)} hours`
                : "N/A"}
            </p>
          </div>

          <div className="mt-6">
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
              {JSON.stringify(stats, null, 2)}
            </pre>
          </div>
        </div>

        <div className="mt-4 text-green-600 font-medium">
          ✅ Work Orders Data Layer ทำงานได้แล้ว!
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4 text-red-600">
          ❌ เกิดข้อผิดพลาด
        </h1>
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <pre className="text-sm text-red-800">
            {error instanceof Error ? error.message : String(error)}
          </pre>
        </div>
      </div>
    );
  }
}