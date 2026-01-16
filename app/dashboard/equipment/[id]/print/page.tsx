import { notFound } from "next/navigation";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { getEquipmentById } from "@/lib/api/equipment";
import { PrintClientTrigger } from "./print-client";
import Image from "next/image";

// Helper to serialize
function serializeEquipment(data: any) {
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

// Status translation
const statusLabels: Record<string, string> = {
    ACTIVE: "พร้อมใช้งาน",
    INACTIVE: "ไม่พร้อมใช้งาน",
    MAINTENANCE: "กำลังซ่อมบำรุง",
    RETIRED: "ปลดระวาง",
};

export default async function EquipmentPrintPage({
    params,
}: {
    params: { id: string };
}) {
    const { id } = await params;
    const equipmentRaw = await getEquipmentById(id);

    if (!equipmentRaw) {
        return notFound();
    }

    const equipment = serializeEquipment(equipmentRaw);

    const formatDate = (date: string | Date | null) => {
        if (!date) return "-";
        return format(new Date(date), "d MMM yyyy", { locale: th });
    };

    const formatCurrency = (amount: number | null) => {
        if (amount === null || amount === undefined) return "-";
        return new Intl.NumberFormat("th-TH", {
            style: "currency",
            currency: "THB",
        }).format(amount);
    };

    const specs = Array.isArray(equipment.specifications)
        ? equipment.specifications
        : (equipment.specifications && typeof equipment.specifications === 'object')
            ? Object.entries(equipment.specifications).map(([key, value]) => ({ key, value: String(value) }))
            : [];

    return (
        <div className="min-h-screen bg-white text-black p-8 max-w-[210mm] mx-auto print:p-0">
            <PrintClientTrigger />

            {/* Header */}
            <div className="border-b-2 border-black pb-4 mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold">รายละเอียดเครื่องจักร</h1>
                        <p className="text-xl text-gray-600">Equipment Detail Report</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-bold">{equipment.code}</h2>
                        <p className="text-sm text-gray-500">
                            วันที่พิมพ์: {new Date().toLocaleDateString("th-TH")}
                        </p>
                    </div>
                </div>
            </div>

            {/* Basic Info & Image */}
            <div className="flex gap-6 mb-8">
                <div className="flex-1 space-y-4">
                    <div>
                        <span className="font-bold text-gray-500 block text-xs uppercase tracking-wide">ชื่อเครื่องจักร (Name)</span>
                        <span className="text-xl font-semibold block">{equipment.name}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="font-bold text-gray-500 block text-xs uppercase tracking-wide">สถานะ (Status)</span>
                            <span className="text-lg font-medium">{statusLabels[equipment.status] || equipment.status}</span>
                        </div>
                        <div>
                            <span className="font-bold text-gray-500 block text-xs uppercase tracking-wide">หมวดหมู่ (Category)</span>
                            <span className="text-lg font-medium">{equipment.category?.name || "-"}</span>
                        </div>
                        <div>
                            <span className="font-bold text-gray-500 block text-xs uppercase tracking-wide">ผู้รับผิดชอบ (Responsible)</span>
                            <span className="text-lg font-medium">{equipment.responsiblePerson?.name || "-"}</span>
                        </div>
                        <div>
                            <span className="font-bold text-gray-500 block text-xs uppercase tracking-wide">เครื่องจักรแม่ (Parent)</span>
                            <span className="text-lg font-medium">{equipment.parent?.code ? `${equipment.parent.code} - ${equipment.parent.name}` : "-"}</span>
                        </div>
                    </div>

                    <div>
                        <span className="font-bold text-gray-500 block text-xs uppercase tracking-wide">รายละเอียด (Description)</span>
                        <p className="text-gray-700 whitespace-pre-wrap">{equipment.description || "-"}</p>
                    </div>
                </div>

                {equipment.image && (
                    <div className="w-48 h-48 shrink-0 border rounded-lg overflow-hidden bg-gray-50 relative">
                        <Image
                            src={equipment.image}
                            alt={equipment.name}
                            fill
                            className="object-cover"
                        />
                    </div>
                )}
            </div>

            {/* Technical Info */}
            <section className="mt-6">
                <h3 className="font-bold text-lg border-b border-gray-300 mb-3 pb-1">ข้อมูลทางเทคนิค (Technical Info)</h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8 pl-2">
                    <div>
                        <span className="font-semibold text-gray-600 block text-sm">ประเภท (Type):</span>
                        <span>{equipment.type || "-"}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-600 block text-sm">ผู้ผลิต (Manufacturer):</span>
                        <span>{equipment.manufacturer || "-"}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-600 block text-sm">รุ่น (Model):</span>
                        <span>{equipment.model || "-"}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-600 block text-sm">Serial Number:</span>
                        <span>{equipment.serialNumber || "-"}</span>
                    </div>
                </div>
            </section>

            {/* Location & Installation */}
            <section className="mt-6">
                <h3 className="font-bold text-lg border-b border-gray-300 mb-3 pb-1">สถานที่และการติดตั้ง (Location & Installation)</h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8 pl-2">
                    <div>
                        <span className="font-semibold text-gray-600 block text-sm">สถานที่ (Location):</span>
                        <span>{equipment.locationRef?.name || equipment.location || "-"}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-600 block text-sm">ชั้น (Floor):</span>
                        <span>{equipment.floor || "-"}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-600 block text-sm">วันที่ติดตั้ง (Installation Date):</span>
                        <span>{formatDate(equipment.installationDate)}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-600 block text-sm">วันหมดประกัน (Warranty Expiry):</span>
                        <span>{formatDate(equipment.warrantyExpiry)}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-600 block text-sm">ราคา (Cost):</span>
                        <span>{formatCurrency(equipment.cost)}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-600 block text-sm">ติดต่อผู้จำหน่าย (Supplier Contact):</span>
                        <span className="whitespace-pre-wrap">{equipment.supplierContact || "-"}</span>
                    </div>
                </div>
            </section>

            {/* Dynamic Specifications */}
            {specs.length > 0 && (
                <section className="mt-6">
                    <h3 className="font-bold text-lg border-b border-gray-300 mb-3 pb-1">สเปคเพิ่มเติม (Specifications)</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-8 pl-2">
                        {specs.map((spec: any, index: number) => (
                            <div key={index} className="flex justify-between border-b border-gray-100 py-1">
                                <span className="font-medium text-gray-600">{spec.key}:</span>
                                <span>{spec.value}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}


            {/* Work Orders */}
            {equipment.workOrders && equipment.workOrders.length > 0 && (
                <section className="mt-8 break-inside-avoid">
                    <h3 className="font-bold text-lg border-b border-gray-300 mb-3 pb-1">ใบแจ้งซ่อมล่าสุด (Recent Work Orders)</h3>
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="py-2 font-semibold text-gray-600">วันที่แจ้ง</th>
                                <th className="py-2 font-semibold text-gray-600">เลขที่</th>
                                <th className="py-2 font-semibold text-gray-600">หัวข้อ</th>
                                <th className="py-2 font-semibold text-gray-600">สถานะ</th>
                                <th className="py-2 font-semibold text-gray-600">ผู้รับผิดชอบ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {equipment.workOrders.map((wo: any) => (
                                <tr key={wo.id}>
                                    <td className="py-2">{formatDate(wo.reportedAt)}</td>
                                    <td className="py-2">{wo.woNumber}</td>
                                    <td className="py-2">{wo.title}</td>
                                    <td className="py-2">
                                        <span className={`px-2 py-0.5 rounded text-xs border ${wo.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' :
                                                wo.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                    'bg-gray-50 text-gray-700 border-gray-200'
                                            }`}>
                                            {wo.status}
                                        </span>
                                    </td>
                                    <td className="py-2">{wo.assignee?.name || "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            )}

            {/* Maintenance Schedules */}
            {equipment.maintenanceSchedules && equipment.maintenanceSchedules.length > 0 && (
                <section className="mt-8 break-inside-avoid">
                    <h3 className="font-bold text-lg border-b border-gray-300 mb-3 pb-1">แผนซ่อมบำรุง (Maintenance Schedules)</h3>
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="py-2 font-semibold text-gray-600">กำหนดครั้งถัดไป</th>
                                <th className="py-2 font-semibold text-gray-600">กิจกรรม</th>
                                <th className="py-2 font-semibold text-gray-600">ความถี่</th>
                                <th className="py-2 font-semibold text-gray-600">ผู้รับผิดชอบ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {equipment.maintenanceSchedules.map((schedule: any) => (
                                <tr key={schedule.id}>
                                    <td className="py-2">{formatDate(schedule.nextDueDate)}</td>
                                    <td className="py-2">{schedule.activityName}</td>
                                    <td className="py-2">{schedule.interval} วัน</td>
                                    <td className="py-2">{schedule.assignee?.name || "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            )}

            {/* Maintenance History */}
            {equipment.maintenanceHistory && equipment.maintenanceHistory.length > 0 && (
                <section className="mt-8 break-inside-avoid">
                    <h3 className="font-bold text-lg border-b border-gray-300 mb-3 pb-1">ประวัติการซ่อมบำรุง (Maintenance History)</h3>
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="py-2 font-semibold text-gray-600">วันที่ดำเนินการ</th>
                                <th className="py-2 font-semibold text-gray-600">กิจกรรม/บันทึก</th>
                                <th className="py-2 font-semibold text-gray-600">ผู้ดำเนินการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {equipment.maintenanceHistory.map((history: any) => (
                                <tr key={history.id}>
                                    <td className="py-2">{formatDate(history.performedAt)}</td>
                                    <td className="py-2">
                                        <div className="font-medium">{history.schedule?.activityName}</div>
                                        <div className="text-gray-500">{history.note || "-"}</div>
                                    </td>
                                    <td className="py-2">{history.performer?.name || "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            )}

            {/* Footer */}
            <div className="fixed bottom-0 left-0 w-full text-center text-xs text-gray-400 p-4 bg-white border-t no-print">
                System Generated Report
            </div>
        </div>
    );
}
