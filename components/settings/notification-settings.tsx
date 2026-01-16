"use client";

/**
 * Notification Settings Component
 * Toggle switches for notification preferences
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Loader2, Bell, Mail, Smartphone, Save } from "lucide-react";
import { toast } from "sonner";

interface NotificationSetting {
    id: string;
    label: string;
    description: string;
    enabled: boolean;
}

export function NotificationSettings() {
    const [isLoading, setIsLoading] = useState(false);
    const [emailNotifications, setEmailNotifications] = useState<NotificationSetting[]>([
        {
            id: "work_order_assigned",
            label: "งานที่ได้รับมอบหมาย",
            description: "รับอีเมลเมื่อมีงานใหม่มอบหมายให้คุณ",
            enabled: true,
        },
        {
            id: "work_order_status",
            label: "การเปลี่ยนสถานะงาน",
            description: "รับอีเมลเมื่อสถานะงานที่คุณเกี่ยวข้องเปลี่ยนแปลง",
            enabled: true,
        },
        {
            id: "maintenance_due",
            label: "กำหนด PM",
            description: "รับอีเมลแจ้งเตือนก่อนถึงกำหนด PM",
            enabled: true,
        },
        {
            id: "weekly_report",
            label: "รายงานประจำสัปดาห์",
            description: "รับสรุปรายงานทุกวันจันทร์",
            enabled: false,
        },
    ]);

    const [inAppNotifications, setInAppNotifications] = useState<NotificationSetting[]>([
        {
            id: "new_work_order",
            label: "งานซ่อมใหม่",
            description: "แจ้งเตือนเมื่อมีการแจ้งซ่อมใหม่",
            enabled: true,
        },
        {
            id: "comments",
            label: "ความคิดเห็น",
            description: "แจ้งเตือนเมื่อมีความคิดเห็นใหม่ในงานที่คุณเกี่ยวข้อง",
            enabled: true,
        },
        {
            id: "overdue",
            label: "งานเกินกำหนด",
            description: "แจ้งเตือนเมื่อมีงานเกินกำหนด",
            enabled: true,
        },
    ]);

    const toggleEmailSetting = (id: string) => {
        setEmailNotifications((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, enabled: !item.enabled } : item
            )
        );
    };

    const toggleInAppSetting = (id: string) => {
        setInAppNotifications((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, enabled: !item.enabled } : item
            )
        );
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            // TODO: Save to database
            await new Promise((resolve) => setTimeout(resolve, 1000));
            toast.success("บันทึกการตั้งค่าสำเร็จ");
        } catch (err) {
            toast.error("เกิดข้อผิดพลาด");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Email Notifications */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        การแจ้งเตือนทางอีเมล
                    </CardTitle>
                    <CardDescription>
                        เลือกประเภทการแจ้งเตือนที่ต้องการรับทางอีเมล
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {emailNotifications.map((setting) => (
                        <div
                            key={setting.id}
                            className="flex items-center justify-between space-x-4 rounded-lg border p-4"
                        >
                            <div className="space-y-0.5">
                                <Label htmlFor={setting.id} className="text-base">
                                    {setting.label}
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    {setting.description}
                                </p>
                            </div>
                            <Switch
                                id={setting.id}
                                checked={setting.enabled}
                                onCheckedChange={() => toggleEmailSetting(setting.id)}
                            />
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* In-App Notifications */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        การแจ้งเตือนในแอป
                    </CardTitle>
                    <CardDescription>
                        เลือกประเภทการแจ้งเตือนที่ต้องการรับในระบบ
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {inAppNotifications.map((setting) => (
                        <div
                            key={setting.id}
                            className="flex items-center justify-between space-x-4 rounded-lg border p-4"
                        >
                            <div className="space-y-0.5">
                                <Label htmlFor={setting.id} className="text-base">
                                    {setting.label}
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    {setting.description}
                                </p>
                            </div>
                            <Switch
                                id={setting.id}
                                checked={setting.enabled}
                                onCheckedChange={() => toggleInAppSetting(setting.id)}
                            />
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            กำลังบันทึก...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            บันทึกการตั้งค่า
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
