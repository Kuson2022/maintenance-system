
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { History, Eye, CheckCircle, XCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface MaintenanceHistoryItem {
    id: string;
    performedAt: Date;
    status: string;
    notes: string | null;
    checklist: any; // Stored snapshot
    performer?: {
        name: string;
    } | null;
    schedule: {
        activityName: string;
    };
}

interface Props {
    history: MaintenanceHistoryItem[];
    totalCount?: number;
}

export function EquipmentMaintenanceHistory({ history, totalCount }: Props) {
    const [selectedItem, setSelectedItem] = useState<MaintenanceHistoryItem | null>(null);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    ประวัติการบำรุงรักษา (PM History)
                </CardTitle>
            </CardHeader>
            <CardContent>
                {history.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>ยังไม่มีประวัติการบำรุงรักษา</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>วันที่</TableHead>
                                <TableHead>กิจกรรม</TableHead>
                                <TableHead>ผู้ดำเนินการ</TableHead>
                                <TableHead>สถานะ</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {history.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        {format(new Date(item.performedAt), "d MMM yyyy HH:mm", { locale: th })}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {item.schedule.activityName}
                                    </TableCell>
                                    <TableCell>
                                        {item.performer?.name || "-"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                item.status === "COMPLETED" ? "default" :
                                                    item.status === "FAILED" ? "destructive" : "secondary"
                                            }
                                        >
                                            {item.status === "COMPLETED" ? "เสร็จสมบูรณ์" : item.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="sm" onClick={() => setSelectedItem(item)}>
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    View
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                                                <DialogHeader>
                                                    <DialogTitle>รายละเอียดการบำรุงรักษา</DialogTitle>
                                                    <DialogDescription>
                                                        บันทึกเมื่อ {format(new Date(item.performedAt), "d MMMM yyyy HH:mm น.", { locale: th })}
                                                    </DialogDescription>
                                                </DialogHeader>

                                                <div className="space-y-6">
                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <span className="text-muted-foreground">กิจกรรม:</span>
                                                            <p className="font-medium text-lg">{item.schedule.activityName}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">ผู้ดำเนินการ:</span>
                                                            <p className="font-medium">{item.performer?.name || "-"}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">สถานะ:</span>
                                                            <div className="mt-1">
                                                                <Badge
                                                                    variant={
                                                                        item.status === "COMPLETED" ? "default" :
                                                                            item.status === "FAILED" ? "destructive" : "secondary"
                                                                    }
                                                                >
                                                                    {item.status}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">หมายเหตุทั่วไป:</span>
                                                            <p className="whitespace-pre-wrap">{item.notes || "-"}</p>
                                                        </div>
                                                    </div>

                                                    <Separator />

                                                    <div>
                                                        <h4 className="font-semibold mb-3">ผลการตรวจเช็ค (Checklist Results)</h4>
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead>รายการ (Task)</TableHead>
                                                                    <TableHead>ผลลัพธ์ (Result)</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {Array.isArray(item.checklist) ? (
                                                                    item.checklist.map((checkItem: any, idx: number) => (
                                                                        <TableRow key={idx}>
                                                                            <TableCell className="font-medium align-top">
                                                                                {checkItem.task}
                                                                                {checkItem.required && <span className="text-red-500 ml-1">*</span>}
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                {checkItem.inputType === "BOOLEAN" && (
                                                                                    <div className="flex items-center gap-2">
                                                                                        {checkItem.value ? (
                                                                                            <span className="text-green-600 flex items-center gap-1"><CheckCircle className="h-4 w-4" /> ผ่าน / Done</span>
                                                                                        ) : (
                                                                                            <span className="text-muted-foreground flex items-center gap-1"><XCircle className="h-4 w-4" /> ไม่ผ่าน / Not Done</span>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                                {checkItem.inputType === "TEXT" && (
                                                                                    <p className="whitespace-pre-wrap">{checkItem.value || "-"}</p>
                                                                                )}
                                                                                {checkItem.inputType === "NUMBER" && (
                                                                                    <span className="font-mono">
                                                                                        {checkItem.value ?? "-"} {checkItem.unit}
                                                                                    </span>
                                                                                )}
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))
                                                                ) : (
                                                                    <TableRow>
                                                                        <TableCell colSpan={2} className="text-center text-muted-foreground py-4">
                                                                            ไม่พบข้อมูลรายละเอียด Checklist (Old Format)
                                                                        </TableCell>
                                                                    </TableRow>
                                                                )}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
