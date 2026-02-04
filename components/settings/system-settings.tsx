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
import { Settings, Bell, AlertTriangle, Loader2, Save, Info } from "lucide-react";
import { toast } from "sonner";
import {
    getNotificationSettingsAction,
    updateNotificationSettingsAction
} from "@/app/actions/notification-settings";

interface NotificationSettings {
    pmNotificationEnabled: boolean;
    pmNotificationTime: string;
    pmOverdueEnabled: boolean;
    pmOverdueDays: number;
}

export function SystemSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<NotificationSettings>({
        pmNotificationEnabled: true,
        pmNotificationTime: "06:00",
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
            const result = await updateNotificationSettingsAction({
                ...settings,
                pmDaysBefore: 0, // แจ้งเตือนในวันที่มี PM เสมอ
            });

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
                        ตั้งค่าการแจ้งเตือนในวันที่ถึงกำหนด PM ผ่าน LINE และ Telegram
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Enable/Disable PM Notifications */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">เปิดใช้งานแจ้งเตือน PM</Label>
                            <p className="text-sm text-muted-foreground">
                                ส่งแจ้งเตือนในวันที่ถึงกำหนดทำ PM
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
                            {/* Info Box */}
                            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-medium text-blue-700 dark:text-blue-300">
                                        แจ้งเตือนวันที่มี PM
                                    </p>
                                    <p className="text-blue-600 dark:text-blue-400">
                                        ระบบจะส่งแจ้งเตือนทุกวันเวลา 06:00 น. (เวลาประเทศไทย)
                                        สำหรับ PM ที่ถึงกำหนดในวันนั้น
                                    </p>
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
                                <p className="text-xs text-muted-foreground">
                                    ระบบจะส่งแจ้งเตือนซ้ำเมื่อ PM เกินกำหนดครบจำนวนวันที่กำหนด
                                </p>
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
                            <strong>เวลาแจ้งเตือน:</strong> 06:00 น. (เวลาประเทศไทย)
                        </p>
                        <p>
                            <strong>ช่องทางแจ้งเตือน:</strong> LINE, Telegram
                        </p>
                        <p>
                            <strong>รูปแบบการแจ้งเตือน:</strong>
                        </p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>แจ้งเตือนในวันที่ถึงกำหนด PM</li>
                            <li>แจ้งเตือนซ้ำเมื่อเกินกำหนด {settings.pmOverdueDays} วัน</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

