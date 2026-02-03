"use client";

/**
 * System Settings Component
 * การตั้งค่าระบบสำหรับ ADMIN รวมถึงการตั้งค่าแจ้งเตือน PM
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings, Bell, Clock, CalendarDays, AlertTriangle, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import {
    getNotificationSettingsAction,
    updateNotificationSettingsAction
} from "@/app/actions/notification-settings";

interface NotificationSettings {
    pmNotificationEnabled: boolean;
    pmNotificationTime: string;
    pmDaysBefore: number;
    pmOverdueEnabled: boolean;
    pmOverdueDays: number;
}

export function SystemSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<NotificationSettings>({
        pmNotificationEnabled: true,
        pmNotificationTime: "17:00",
        pmDaysBefore: 1,
        pmOverdueEnabled: true,
        pmOverdueDays: 3,
    });

    // โหลดการตั้งค่าเมื่อ component mount
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const result = await getNotificationSettingsAction();
            if (result.success && result.data) {
                setSettings({
                    pmNotificationEnabled: result.data.pmNotificationEnabled,
                    pmNotificationTime: result.data.pmNotificationTime,
                    pmDaysBefore: result.data.pmDaysBefore,
                    pmOverdueEnabled: result.data.pmOverdueEnabled,
                    pmOverdueDays: result.data.pmOverdueDays,
                });
            }
        } catch (error) {
            console.error("Error loading settings:", error);
            toast.error("ไม่สามารถโหลดการตั้งค่าได้");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const result = await updateNotificationSettingsAction(settings);

            if (result.success) {
                toast.success("บันทึกการตั้งค่าเรียบร้อย");
            } else {
                toast.error(result.error || "ไม่สามารถบันทึกการตั้งค่าได้");
            }
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("เกิดข้อผิดพลาด");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="py-10">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>กำลังโหลด...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* PM Notification Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        การแจ้งเตือน PM (Preventive Maintenance)
                    </CardTitle>
                    <CardDescription>
                        ตั้งค่าการแจ้งเตือนก่อนถึงวันทำ PM ผ่าน LINE และ Telegram
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Enable/Disable PM Notifications */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">เปิดใช้งานแจ้งเตือน PM</Label>
                            <p className="text-sm text-muted-foreground">
                                ส่งแจ้งเตือนก่อนถึงวันที่กำหนดทำ PM
                            </p>
                        </div>
                        <Switch
                            checked={settings.pmNotificationEnabled}
                            onCheckedChange={(checked) =>
                                setSettings({ ...settings, pmNotificationEnabled: checked })
                            }
                        />
                    </div>

                    {settings.pmNotificationEnabled && (
                        <div className="space-y-4 border-t pt-4">
                            {/* Notification Time */}
                            <div className="grid gap-2">
                                <Label htmlFor="pmTime" className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    เวลาแจ้งเตือน
                                </Label>
                                <Input
                                    id="pmTime"
                                    type="time"
                                    value={settings.pmNotificationTime}
                                    onChange={(e) =>
                                        setSettings({ ...settings, pmNotificationTime: e.target.value })
                                    }
                                    className="w-32"
                                />
                                <p className="text-sm text-muted-foreground">
                                    ระบบจะส่งแจ้งเตือนทุกวันในเวลานี้ (เวลาประเทศไทย)
                                </p>
                            </div>

                            {/* Days Before */}
                            <div className="grid gap-2">
                                <Label htmlFor="pmDaysBefore" className="flex items-center gap-2">
                                    <CalendarDays className="h-4 w-4" />
                                    แจ้งเตือนก่อนถึงกำหนด
                                </Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="pmDaysBefore"
                                        type="number"
                                        min={1}
                                        max={30}
                                        value={settings.pmDaysBefore}
                                        onChange={(e) =>
                                            setSettings({ ...settings, pmDaysBefore: parseInt(e.target.value) || 1 })
                                        }
                                        className="w-20"
                                    />
                                    <span className="text-sm text-muted-foreground">วัน</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PM Overdue Settings */}
                    <div className="border-t pt-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                    แจ้งเตือน PM เกินกำหนด
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    ส่งแจ้งเตือนซ้ำเมื่อ PM เกินกำหนด
                                </p>
                            </div>
                            <Switch
                                checked={settings.pmOverdueEnabled}
                                onCheckedChange={(checked) =>
                                    setSettings({ ...settings, pmOverdueEnabled: checked })
                                }
                            />
                        </div>

                        {settings.pmOverdueEnabled && (
                            <div className="grid gap-2 mt-4">
                                <Label htmlFor="pmOverdueDays">แจ้งเตือนเมื่อเกินกำหนด</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="pmOverdueDays"
                                        type="number"
                                        min={1}
                                        max={30}
                                        value={settings.pmOverdueDays}
                                        onChange={(e) =>
                                            setSettings({ ...settings, pmOverdueDays: parseInt(e.target.value) || 3 })
                                        }
                                        className="w-20"
                                    />
                                    <span className="text-sm text-muted-foreground">วัน</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-4 border-t">
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    กำลังบันทึก...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    บันทึกการตั้งค่า
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* System Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        ข้อมูลระบบ
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground space-y-2">
                        <p>
                            <strong>Cron Schedule:</strong> ทุกวันเวลา {settings.pmNotificationTime} น.
                        </p>
                        <p>
                            <strong>ช่องทางแจ้งเตือน:</strong> LINE, Telegram
                        </p>
                        <p className="text-xs">
                            หมายเหตุ: การเปลี่ยนเวลาแจ้งเตือนจะต้อง deploy ใหม่เพื่อให้มีผล
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
