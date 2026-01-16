"use client";

/**
 * Mobile Sidebar Drawer
 * Slide-out menu for mobile devices
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    LayoutDashboard,
    Wrench,
    Package,
    DollarSign,
    Calendar,
    FileText,
    Users,
    Settings,
    QrCode,
    X,
    Warehouse,
} from "lucide-react";
import { checkReportPermissionsAction } from "@/lib/api/reports/actions";
import { useAuth } from "@/lib/auth/auth-context";

interface MenuItem {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    adminOnly?: boolean;
    hideForUser?: boolean;
}

const menuItems: MenuItem[] = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "สแกน QR", href: "/dashboard/scan", icon: QrCode },
    { title: "ใบแจ้งซ่อม", href: "/dashboard/work-orders", icon: Wrench },
    { title: "เครื่องจักร", href: "/dashboard/equipment", icon: Package },
    { title: "ค่าใช้จ่าย", href: "/dashboard/expenses", icon: DollarSign },
    { title: "คลังอะไหล่", href: "/dashboard/inventory", icon: Warehouse, hideForUser: true },
    { title: "ตารางซ่อมบำรุง", href: "/dashboard/schedules", icon: Calendar, hideForUser: true },
    { title: "รายงาน", href: "/dashboard/reports", icon: FileText, adminOnly: true },
    { title: "ผู้ใช้งาน", href: "/dashboard/users", icon: Users, adminOnly: true },
    { title: "ตั้งค่า", href: "/dashboard/settings", icon: Settings },
];

interface MobileSidebarProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
    const pathname = usePathname();
    const { userProfile } = useAuth();
    const [canViewReports, setCanViewReports] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const isUserRole = userProfile?.role === "USER";

    useEffect(() => {
        const checkPermissions = async () => {
            try {
                const permissions = await checkReportPermissionsAction();
                setCanViewReports(permissions.canView);
            } catch (error) {
                console.error("Error checking report permissions:", error);
                setCanViewReports(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkPermissions();
    }, []);

    // Filter menu items based on permissions
    const filteredMenuItems = menuItems.filter((item) => {
        if (item.adminOnly && !canViewReports) {
            return false;
        }
        if (item.hideForUser && isUserRole) {
            return false;
        }
        return true;
    });

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="left" className="w-[280px] p-0">
                <SheetHeader className="p-6 border-b">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
                            <span className="text-white font-bold text-lg">MS</span>
                        </div>
                        <div>
                            <SheetTitle className="text-left">Maintenance</SheetTitle>
                            <p className="text-xs text-muted-foreground">System</p>
                        </div>
                    </div>
                </SheetHeader>

                <nav className="p-4 space-y-1">
                    {filteredMenuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href ||
                            (item.href !== "/dashboard" && pathname.startsWith(item.href));

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => onOpenChange(false)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary text-white"
                                        : "text-gray-700 hover:bg-gray-100 active:bg-gray-200"
                                )}
                            >
                                <Icon className="h-5 w-5" />
                                <span>{item.title}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
                    <div className="rounded-lg bg-blue-50 p-4">
                        <p className="text-sm font-medium text-blue-900">
                            ต้องการความช่วยเหลือ?
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                            ติดต่อฝ่าย IT Support
                        </p>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

