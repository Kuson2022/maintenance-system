
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EquipmentDetailStats } from "@/lib/api/equipment/types";
import { formatCurrency } from "@/lib/utils";
import { Activity, Banknote, Clock, ListTodo } from "lucide-react";

interface Props {
    stats: EquipmentDetailStats;
}

export function EquipmentStatsCards({ stats }: Props) {
    const formatTime = (hours: number | null) => {
        if (hours === null) return "-";
        if (hours < 1) return `${Math.round(hours * 60)} นาที`;
        return `${hours.toFixed(1)} ชม.`;
    };

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">ความพร้อมใช้งาน (Uptime)</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.uptime}%</div>
                    <p className="text-xs text-muted-foreground">
                        จากใบแจ้งซ่อมทั้งหมด {stats.totalWorkOrders} ใบ
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">ค่าใช้จ่ายรวม</CardTitle>
                    <Banknote className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {new Intl.NumberFormat("th-TH", {
                            style: "currency",
                            currency: "THB",
                            maximumFractionDigits: 0,
                        }).format(stats.totalMaintenanceCost)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        ค่าซ่อมและอะไหล่ทั้งหมด
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">เวลาซ่อมเฉลี่ย (MTTR)</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatTime(stats.averageRepairTime)}</div>
                    <p className="text-xs text-muted-foreground">
                        จากงานที่เสร็จสิ้น {stats.completedWorkOrders} งาน
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">งานคงค้าง</CardTitle>
                    <ListTodo className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.pendingWorkOrders}</div>
                    <p className="text-xs text-muted-foreground">
                        งานที่กำลังดำเนินการ
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
