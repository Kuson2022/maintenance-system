"use client";

/**
 * Settings Tabs Component
 * Main container for settings with tabbed navigation
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Bell, Settings, DollarSign, Layers, MapPin } from "lucide-react";
import { ProfileSettings } from "./profile-settings";
import { PasswordChange } from "./password-change";
import { NotificationSettings } from "./notification-settings";
import { ExpenseTypesSettings } from "./expense-types-settings";
import { EquipmentCategoriesSettings } from "./equipment-categories-settings";
import { LocationSettings } from "./location-settings";
import { SystemSettings } from "./system-settings";

interface SettingsTabsProps {
    user: {
        id: string;
        name: string;
        email: string;
        phone?: string | null;
        avatarUrl?: string | null;
        role: string;
        position?: string | null;
        department?: string | null;
    };
}

export function SettingsTabs({ user }: SettingsTabsProps) {
    const isAdmin = user.role === "ADMIN";

    return (
        <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-3 md:grid-cols-6' : 'grid-cols-2 md:grid-cols-2'} lg:w-auto lg:inline-grid`}>
                <TabsTrigger value="profile" className="gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">โปรไฟล์</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="gap-2">
                    <Bell className="h-4 w-4" />
                    <span className="hidden sm:inline">การแจ้งเตือน</span>
                </TabsTrigger>
                {isAdmin && (
                    <>
                        <TabsTrigger value="expense-types" className="gap-2">
                            <DollarSign className="h-4 w-4" />
                            <span className="hidden sm:inline">ประเภทค่าใช้จ่าย</span>
                        </TabsTrigger>
                        <TabsTrigger value="categories" className="gap-2">
                            <Layers className="h-4 w-4" />
                            <span className="hidden sm:inline">หมวดหมู่</span>
                        </TabsTrigger>
                        <TabsTrigger value="locations" className="gap-2">
                            <MapPin className="h-4 w-4" />
                            <span className="hidden sm:inline">สถานที่</span>
                        </TabsTrigger>
                        <TabsTrigger value="system" className="gap-2">
                            <Settings className="h-4 w-4" />
                            <span className="hidden sm:inline">แจ้งเตือนPM</span>
                        </TabsTrigger>
                    </>
                )}
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                    <ProfileSettings user={user} />
                    <PasswordChange />
                </div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
                <NotificationSettings />
            </TabsContent>

            {/* Expense Types Tab (Admin only) */}
            {isAdmin && (
                <TabsContent value="expense-types">
                    <ExpenseTypesSettings />
                </TabsContent>
            )}

            {/* Equipment Categories Tab (Admin only) */}
            {isAdmin && (
                <TabsContent value="categories">
                    <EquipmentCategoriesSettings />
                </TabsContent>
            )}

            {/* Locations Tab (Admin only) */}
            {isAdmin && (
                <TabsContent value="locations">
                    <LocationSettings />
                </TabsContent>
            )}

            {/* System Settings Tab (Admin only) */}
            {isAdmin && (
                <TabsContent value="system">
                    <SystemSettings />
                </TabsContent>
            )}
        </Tabs>
    );
}
