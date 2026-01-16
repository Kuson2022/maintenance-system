"use client";

/**
 * Equipment Expenses Component
 * แสดงสรุปค่าใช้จ่ายของเครื่องจักร
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { DollarSign, ExternalLink, TrendingUp } from "lucide-react";
import { getEquipmentExpensesAction } from "@/app/actions/equipment";

interface ExpenseSummary {
    totalExpenses: number;
    byType: {
        typeId: string;
        typeName: string;
        total: number;
    }[];
    recentCount: number;
}

interface EquipmentExpensesProps {
    equipmentId: string;
}

export function EquipmentExpenses({ equipmentId }: EquipmentExpensesProps) {
    const [loading, setLoading] = useState(true);
    const [expenses, setExpenses] = useState<ExpenseSummary | null>(null);

    useEffect(() => {
        async function fetchExpenses() {
            try {
                const result = await getEquipmentExpensesAction(equipmentId);
                if (result.success && result.data) {
                    setExpenses(result.data);
                }
            } catch (error) {
                console.error("Error fetching expenses:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchExpenses();
    }, [equipmentId]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("th-TH", {
            style: "currency",
            currency: "THB",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-4 w-full mt-4" />
                </CardContent>
            </Card>
        );
    }

    if (!expenses) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    ค่าใช้จ่าย
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Total */}
                <div>
                    <p className="text-sm text-muted-foreground">ค่าใช้จ่ายทั้งหมด</p>
                    <p className="text-2xl font-bold text-primary">
                        {formatCurrency(expenses.totalExpenses)}
                    </p>
                </div>

                {/* By Type */}
                {expenses.byType.length > 0 && (
                    <>
                        <Separator />
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">
                                แยกตามประเภท
                            </p>
                            {expenses.byType.slice(0, 5).map((item) => (
                                <div
                                    key={item.typeId}
                                    className="flex items-center justify-between text-sm"
                                >
                                    <span>{item.typeName}</span>
                                    <span className="font-medium">
                                        {formatCurrency(item.total)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Recent */}
                {expenses.recentCount > 0 && (
                    <>
                        <Separator />
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <TrendingUp className="h-4 w-4" />
                            <span>{expenses.recentCount} รายการใน 30 วันที่ผ่านมา</span>
                        </div>
                    </>
                )}

                {/* Link to expenses page */}
                <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={`/dashboard/expenses?equipmentId=${equipmentId}`}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        ดูรายละเอียดค่าใช้จ่าย
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}
