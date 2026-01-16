import { notFound } from "next/navigation";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { getWorkOrderById } from "@/lib/api/work-orders/queries";
import { PrintClientTrigger } from "./print-client";
import { PRIORITY_CONFIG, STATUS_CONFIG } from "@/lib/api/work-orders/types";

// Helper to serialize (same as main page)
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

export default async function WorkOrderPrintPage({
    params,
}: {
    params: { id: string };
}) {
    const { id } = await params;
    const workOrderRaw = await getWorkOrderById(id);

    if (!workOrderRaw) {
        return notFound();
    }

    const workOrder = serializeWorkOrder(workOrderRaw);
    const priorityConfig = PRIORITY_CONFIG[workOrder.priority];
    const statusConfig = STATUS_CONFIG[workOrder.status];

    const formatDate = (date: string | Date | null) => {
        if (!date) return "-";
        return format(new Date(date), "d MMM yyyy, HH:mm น.", { locale: th });
    };

    // Calculate total expenses
    const totalExpenses = (workOrder.expenses || []).reduce(
        (sum: number, exp: any) => sum + Number(exp.total),
        0
    );

    // Filter images
    const images = (workOrder.attachments || []).filter((att: any) =>
        att.fileType.startsWith("image/")
    );

    return (
        <div className="min-h-screen bg-white text-black p-8 max-w-[210mm] mx-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            <PrintClientTrigger />

            {/* Header */}
            <div className="border-b-2 border-black pb-4 mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold">ใบแจ้งซ่อม</h1>
                        <p className="text-xl text-gray-600">Work Order Request</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl font-bold">{workOrder.woNumber}</h2>
                        <p className="text-sm text-gray-500">
                            วันที่พิมพ์: {new Date().toLocaleDateString("th-TH")}
                        </p>
                    </div>
                </div>
            </div>

            {/* Status & Priority Banner */}
            <div className="grid grid-cols-2 gap-4 mb-8 bg-gray-50 p-4 border rounded">
                <div>
                    <span className="font-bold text-gray-500 block text-xs uppercase tracking-wide">สถานะ (Status)</span>
                    <span className={`text-lg font-semibold ${statusConfig.color.replace('bg-', 'text-').replace('-100', '-700')}`}>
                        {statusConfig.label}
                    </span>
                </div>
                <div>
                    <span className="font-bold text-gray-500 block text-xs uppercase tracking-wide">ความสำคัญ (Priority)</span>
                    <span className={`text-lg font-semibold flex items-center gap-2 ${priorityConfig.color.replace('bg-', 'text-').replace('-100', '-700')}`}>
                        {priorityConfig.label}
                    </span>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="space-y-6">

                {/* Issue Details */}
                <section>
                    <h3 className="font-bold text-lg border-b border-gray-300 mb-3 pb-1">รายละเอียดปัญหา (Issue Details)</h3>
                    <div className="pl-2">
                        <h4 className="font-semibold">{workOrder.title}</h4>
                        <p className="whitespace-pre-wrap mt-2 text-gray-700 leading-relaxed">
                            {workOrder.description}
                        </p>
                    </div>
                </section>

                {/* Equipment & Location */}
                <section className="mt-6">
                    <h3 className="font-bold text-lg border-b border-gray-300 mb-3 pb-1">เครื่องจักร/อุปกรณ์ (Equipment)</h3>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8 pl-2">
                        <div>
                            <span className="font-semibold text-gray-600 block text-sm">ชื่ออุปกรณ์:</span>
                            <span>{workOrder.equipment.name}</span>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-600 block text-sm">รหัสอุปกรณ์:</span>
                            <span>{workOrder.equipment.code}</span>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-600 block text-sm">หมวดหมู่:</span>
                            <span>{workOrder.equipment.category.name}</span>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-600 block text-sm">สถานที่:</span>
                            <span>{workOrder.equipment.location || "-"}</span>
                        </div>
                    </div>
                </section>

                {/* People */}
                <section className="mt-6">
                    <h3 className="font-bold text-lg border-b border-gray-300 mb-3 pb-1">ผู้เกี่ยวข้อง (People)</h3>
                    <div className="grid grid-cols-2 gap-8 pl-2">
                        <div>
                            <span className="font-semibold text-gray-600 block text-sm mb-1">ผู้แจ้ง (Reporter):</span>
                            <div className="border p-3 rounded bg-white">
                                <p className="font-medium">{workOrder.reporter.name}</p>
                                <p className="text-sm text-gray-500">{workOrder.reporter.email}</p>
                            </div>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-600 block text-sm mb-1">ช่างผู้รับผิดชอบ (Assignee):</span>
                            <div className="border p-3 rounded bg-white">
                                {workOrder.assignee ? (
                                    <>
                                        <p className="font-medium">{workOrder.assignee.name}</p>
                                        <p className="text-sm text-gray-500">{workOrder.assignee.email}</p>
                                    </>
                                ) : (
                                    <p className="text-gray-400 italic">ยังไม่ได้มอบหมาย</p>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Timeline */}
                <section className="mt-6">
                    <h3 className="font-bold text-lg border-b border-gray-300 mb-3 pb-1">ไทม์ไลน์ (Timeline)</h3>
                    <div className="grid grid-cols-2 gap-4 pl-2 text-sm">
                        <div><span className="font-semibold inline-block w-24">วันที่แจ้ง:</span> {formatDate(workOrder.reportedAt)}</div>
                        <div><span className="font-semibold inline-block w-24">กำหนดเสร็จ:</span> {formatDate(workOrder.dueDate)}</div>
                        <div><span className="font-semibold inline-block w-24">เริ่มงาน:</span> {formatDate(workOrder.startedAt)}</div>
                        <div><span className="font-semibold inline-block w-24">เสร็จสิ้น:</span> {formatDate(workOrder.completedAt)}</div>
                    </div>
                </section>

                {/* Maintenance Logs */}
                {workOrder.maintenanceLogs && workOrder.maintenanceLogs.length > 0 && (
                    <section className="mt-8 break-inside-avoid">
                        <h3 className="font-bold text-lg border-b border-gray-300 mb-3 pb-1">บันทึกการซ่อม (Maintenance Logs)</h3>
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-gray-100 border-b">
                                    <th className="py-2 px-3 text-left w-32 border">วันที่</th>
                                    <th className="py-2 px-3 text-left border">รายละเอียด</th>
                                    <th className="py-2 px-3 text-left w-40 border">ผู้ดำเนินการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {workOrder.maintenanceLogs.map((log: any) => (
                                    <tr key={log.id} className="border-b">
                                        <td className="py-2 px-3 align-top border bg-white">{formatDate(log.createdAt)}</td>
                                        <td className="py-2 px-3 border bg-white">
                                            <p>{log.description}</p>
                                            {log.notes && <p className="text-gray-500 text-xs mt-1">Note: {log.notes}</p>}
                                        </td>
                                        <td className="py-2 px-3 align-top border bg-white text-gray-600">{log.technician.name}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>
                )}

                {/* Expenses */}
                <section className="mt-8 break-inside-avoid">
                    <h3 className="font-bold text-lg border-b border-gray-300 mb-3 pb-1">ค่าใช้จ่าย (Expenses)</h3>
                    {workOrder.expenses && workOrder.expenses.length > 0 ? (
                        <>
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-gray-100 border-b">
                                        <th className="py-2 px-3 text-left w-32 border">วันที่</th>
                                        <th className="py-2 px-3 text-left border">รายการ</th>
                                        <th className="py-2 px-3 text-right w-20 border">จำนวน</th>
                                        <th className="py-2 px-3 text-right w-28 border">ราคา/หน่วย</th>
                                        <th className="py-2 px-3 text-right w-28 border">รวม</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {workOrder.expenses.map((expense: any) => (
                                        <tr key={expense.id} className="border-b">
                                            <td className="py-2 px-3 align-top border bg-white">{formatDate(expense.date)}</td>
                                            <td className="py-2 px-3 border bg-white">
                                                {expense.description}
                                            </td>
                                            <td className="py-2 px-3 text-right border bg-white">{expense.quantity}</td>
                                            <td className="py-2 px-3 text-right border bg-white">฿{Number(expense.unitPrice).toLocaleString()}</td>
                                            <td className="py-2 px-3 text-right border bg-white font-medium">฿{Number(expense.total).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-gray-50 font-bold border-t-2">
                                        <td colSpan={4} className="py-3 px-3 text-right border">รวมค่าใช้จ่ายทั้งหมด</td>
                                        <td className="py-3 px-3 text-right border text-lg">฿{totalExpenses.toLocaleString()}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </>
                    ) : (
                        <p className="text-gray-500 italic p-4 text-center border rounded bg-gray-50">ไม่มีรายการค่าใช้จ่าย</p>
                    )}
                </section>

                {/* Attachments (Images) */}
                {images.length > 0 && (
                    <section className="mt-8 break-inside-avoid">
                        <h3 className="font-bold text-lg border-b border-gray-300 mb-3 pb-1">รูปภาพประกอบ (Images)</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {images.map((img: any) => (
                                <div key={img.id} className="border p-2 rounded bg-white">
                                    <div className="aspect-video relative overflow-hidden rounded bg-gray-100 flex items-center justify-center">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={img.fileUrl}
                                            alt={img.fileName}
                                            className="object-contain max-h-full max-w-full"
                                        />
                                    </div>
                                    <p className="text-xs text-center mt-2 text-gray-500 truncate">{img.fileName}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

            </div>

            {/* Footer */}
            <div className="fixed bottom-0 left-0 w-full text-center text-xs text-gray-400 p-4 bg-white border-t no-print">
                System Generated Report
            </div>
        </div>
    );
}
