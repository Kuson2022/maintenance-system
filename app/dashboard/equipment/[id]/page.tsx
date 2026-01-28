import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    ChevronLeft,
    Pencil,
    QrCode,
    Package,
    MapPin,
    User,
    Calendar,
    Shield,
    Wrench,
    FileText,
    ExternalLink,
} from "lucide-react";
import { QrCodeDisplay } from "./qr-code-display";
import { EquipmentActionButtons } from "./equipment-action-buttons";
import { EquipmentWorkOrders } from "./equipment-work-orders";
import { EquipmentSchedules } from "./equipment-schedules";
import { EquipmentMaintenanceHistory } from "./equipment-maintenance-history";
import { EquipmentExpenses } from "./equipment-expenses";
import { EquipmentSpecifications } from "./equipment-specifications";
import { getEquipmentById } from "@/lib/api/equipment";
import { format } from "date-fns";
import { th } from "date-fns/locale";

// ... inside space-y-6
{/* Work Orders, Schedules & History */ }





// Status badge styles
const statusStyles: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    ACTIVE: { label: "พร้อมใช้งาน", variant: "default" },
    INACTIVE: { label: "ไม่พร้อมใช้งาน", variant: "secondary" },
    MAINTENANCE: { label: "กำลังซ่อมบำรุง", variant: "outline" },
    RETIRED: { label: "ปลดระวาง", variant: "destructive" },
};

interface Props {
    params: Promise<{ id: string }>;
}

export default async function EquipmentDetailPage({ params }: Props) {
    const { id } = await params;
    const equipment = await getEquipmentById(id);

    if (!equipment) {
        notFound();
    }

    const formatDate = (date: Date | null) => {
        if (!date) return "-";
        return format(new Date(date), "d MMM yyyy", { locale: th });
    };

    const formatCurrency = (amount: number | null) => {
        if (!amount) return "-";
        return new Intl.NumberFormat("th-TH", {
            style: "currency",
            currency: "THB",
        }).format(amount);
    };

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4">
                {/* Back button and Title */}
                <div className="flex items-start gap-3">
                    <Button variant="ghost" size="icon" asChild className="flex-shrink-0 mt-1">
                        <Link href="/dashboard/equipment">
                            <ChevronLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">{equipment.name}</h1>
                            <Badge variant={statusStyles[equipment.status]?.variant || "default"}>
                                {statusStyles[equipment.status]?.label || equipment.status}
                            </Badge>
                        </div>
                        <p className="text-sm sm:text-base text-muted-foreground">รหัส: {equipment.code}</p>
                    </div>
                </div>

                {/* Action Buttons - Role-based visibility */}
                <EquipmentActionButtons equipmentId={equipment.id} />
            </div>



            <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                ข้อมูลพื้นฐาน
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">

                                <div>
                                    <p className="text-sm text-muted-foreground">หมวดหมู่</p>
                                    <p className="font-medium">{equipment.category?.name || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">ประเภท</p>
                                    <p className="font-medium">{equipment.type || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">ผู้ผลิต</p>
                                    <p className="font-medium">{equipment.manufacturer || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">รุ่น / Model</p>
                                    <p className="font-medium">{equipment.model || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Serial Number</p>
                                    <p className="font-medium font-mono">{equipment.serialNumber || "-"}</p>
                                </div>
                            </div>

                            {equipment.description && (
                                <>
                                    <Separator />
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">รายละเอียด</p>
                                        <p>{equipment.description}</p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Specifications Card */}
                    <EquipmentSpecifications specifications={equipment.specifications} />

                    {/* Location & Responsibility */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                ตำแหน่งและผู้รับผิดชอบ
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <p className="text-sm text-muted-foreground">เครื่องจักรหลัก (Parent)</p>
                                    <p className="font-medium">
                                        {(equipment as any).parent ? (
                                            <Link href={`/dashboard/equipment/${(equipment as any).parent.id}`} className="hover:underline text-primary">
                                                {(equipment as any).parent.name}
                                            </Link>
                                        ) : "-"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">ตำแหน่งที่ติดตั้ง</p>
                                    <p className="font-medium">{(equipment as any).locationRef?.name || (equipment as any).location || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">ชั้น</p>
                                    <p className="font-medium">{(equipment as any).floor || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">ผู้รับผิดชอบ</p>
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <p className="font-medium">
                                            {equipment.responsiblePerson?.name || "ไม่ได้ระบุ"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Purchase Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                ข้อมูลการจัดซื้อ
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <p className="text-sm text-muted-foreground">ราคา</p>
                                    <p className="font-medium text-lg">
                                        {formatCurrency(equipment.cost?.toNumber?.() || equipment.cost as number | null)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">วันที่ติดตั้ง</p>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <p className="font-medium">{formatDate(equipment.installationDate)}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">วันหมดประกัน</p>
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-muted-foreground" />
                                        <p className="font-medium">{formatDate(equipment.warrantyExpiry)}</p>
                                    </div>
                                </div>
                            </div>

                            {equipment.supplierContact && (
                                <>
                                    <Separator className="my-4" />
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">ข้อมูลติดต่อผู้จำหน่าย</p>
                                        <p className="whitespace-pre-wrap">{equipment.supplierContact}</p>
                                    </div>
                                </>
                            )}

                            {equipment.manualUrl && (
                                <div className="mt-4">
                                    <Button variant="outline" size="sm" asChild>
                                        <a href={equipment.manualUrl} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="mr-2 h-4 w-4" />
                                            ดูคู่มือ
                                        </a>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Work Orders & Schedules */}
                    {/* Work Orders, Schedules & History */}
                    <div className="space-y-6">
                        <EquipmentWorkOrders equipmentId={equipment.id} />
                        <EquipmentSchedules
                            schedules={equipment.maintenanceSchedules as any[]}
                            equipmentId={equipment.id}
                            totalCount={equipment._count?.maintenanceSchedules}
                        />
                        <div className="hidden md:block">
                            <EquipmentMaintenanceHistory
                                history={(equipment as any).maintenanceHistory || []}
                                totalCount={(equipment as any)._count?.maintenanceHistory}
                            />
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Image Card */}
                    {equipment.image && (
                        <Card className="overflow-hidden">
                            <div className="aspect-video w-full bg-muted/30 flex items-center justify-center relative">
                                <img
                                    src={equipment.image}
                                    alt={equipment.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </Card>
                    )}

                    {/* QR Code */}
                    <Card id="qrcode" className="hidden md:block">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <QrCode className="h-5 w-5" />
                                QR Code
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <QrCodeDisplay equipmentId={equipment.id} equipmentName={equipment.name} equipmentCode={equipment.code} />
                        </CardContent>
                    </Card>

                    {/* Stats */}
                    <Card className="hidden md:block">
                        <CardHeader>
                            <CardTitle>สถิติ</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">ใบแจ้งซ่อมทั้งหมด</span>
                                <span className="font-bold">{equipment._count?.workOrders || 0}</span>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">ตารางซ่อมบำรุง</span>
                                <span className="font-bold">{equipment._count?.maintenanceSchedules || 0}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Expenses Summary */}
                    <div className="hidden md:block">
                        <EquipmentExpenses equipmentId={equipment.id} />
                    </div>

                    {/* Timestamps */}
                    <Card className="hidden md:block">
                        <CardHeader>
                            <CardTitle>ข้อมูลระบบ</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">สร้างเมื่อ</span>
                                <span>{formatDate(equipment.createdAt)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">แก้ไขล่าสุด</span>
                                <span>{formatDate(equipment.updatedAt)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
