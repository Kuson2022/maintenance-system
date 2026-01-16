import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getSparePartById, checkInventoryPermissions } from "@/app/actions/inventory";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { InventoryAdjustButton } from "@/components/inventory/inventory-adjust-button";
import { redirect } from "next/navigation";
import { InventoryQrCode } from "./inventory-qr-code";

export default async function SparePartDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    let permissions;
    try {
        const result = await checkInventoryPermissions();
        permissions = result.permissions;
    } catch (error) {
        redirect("/dashboard");
    }

    const { id } = await params;
    const { data: part, error } = await getSparePartById(id);

    if (error || !part) {
        notFound();
    }

    const { transactions } = part as any;

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center space-x-2">
                <Link href="/dashboard/inventory">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        กลับ
                    </Button>
                </Link>
                <h2 className="text-3xl font-bold tracking-tight">{part.name}</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>ข้อมูลทั่วไป</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between">
                            <span className="font-semibold">รหัส:</span>
                            <span className="font-mono">{part.code}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">หมวดหมู่:</span>
                            <span>{part.category || "-"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">สถานที่จัดเก็บ:</span>
                            <span>{(part as any).location?.name || "-"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">ราคาต่อหน่วย:</span>
                            <span>{Number(part.unitPrice).toLocaleString()} บาท</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">ผู้จำหน่าย:</span>
                            <span>{part.supplier || "-"}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle>สถานะสต็อก</CardTitle>
                        {permissions.canAdjust && <InventoryAdjustButton part={part} />}
                    </CardHeader>
                    <CardContent className="mt-4 space-y-4">
                        <div className="text-4xl font-bold text-center">
                            {part.stockQuantity} <span className="text-xl font-normal text-muted-foreground">{part.unit}</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Min Stock:</span>
                                <span>{part.minStockLevel}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Reorder Point:</span>
                                <span>{(part as any).reorderPoint || "-"}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Max Stock:</span>
                                <span>{(part as any).maxStockLevel || "-"}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2 lg:col-span-1">
                    <CardHeader>
                        <CardTitle>QR Code</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <InventoryQrCode
                            inventoryId={part.id}
                            inventoryName={part.name}
                            inventoryCode={part.code}
                        />
                    </CardContent>
                </Card>

                <Card className="md:col-span-2 lg:col-span-3">
                    <CardHeader>
                        <CardTitle>รายละเอียดเพิ่มเติม</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {part.description || "ไม่มีรายละเอียด"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>ประวัติการเคลื่อนไหว (Recent Transactions)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>วันที่-เวลา</TableHead>
                                    <TableHead>รายการ</TableHead>
                                    <TableHead>จำนวน</TableHead>
                                    <TableHead>คงเหลือ</TableHead>
                                    <TableHead>โดย</TableHead>
                                    <TableHead>หมายเหตุ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions && transactions.length > 0 ? (
                                    transactions.map((tx: any) => (
                                        <TableRow key={tx.id}>
                                            <TableCell className="font-mono text-sm whitespace-nowrap">
                                                {format(new Date(tx.createdAt), "dd/MM/yyyy HH:mm", { locale: th })}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    tx.type === "IN" ? "default" :
                                                        tx.type === "OUT" ? "destructive" : "secondary"
                                                }>
                                                    {tx.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className={tx.type === "OUT" ? "text-red-500" : "text-green-500"}>
                                                    {tx.type === "OUT" ? "-" : "+"}{tx.quantity}
                                                </span>
                                            </TableCell>
                                            <TableCell>{tx.balanceAfter}</TableCell>
                                            <TableCell className="whitespace-nowrap">{tx.createdBy?.name || "-"}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground min-w-[150px]">{tx.notes}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                                            ยังไม่มีประวัติการเคลื่อนไหว
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
