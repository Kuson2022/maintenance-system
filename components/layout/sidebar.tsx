"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Wrench,
  Package,
  DollarSign,
  Calendar,
  FileText,
  Users,
  Settings,
  Warehouse,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { checkReportPermissionsAction } from "@/lib/api/reports/actions";
import { useAuth } from "@/lib/auth/auth-context";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MenuItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  hideForUser?: boolean;
}

const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "ใบแจ้งซ่อม",
    href: "/dashboard/work-orders",
    icon: Wrench,
  },
  {
    title: "เครื่องจักร",
    href: "/dashboard/equipment",
    icon: Package,
  },
  {
    title: "ค่าใช้จ่าย",
    href: "/dashboard/expenses",
    icon: DollarSign,
  },
  {
    title: "คลังอะไหล่",
    href: "/dashboard/inventory",
    icon: Warehouse,
    hideForUser: true,
  },
  {
    title: "ตารางซ่อมบำรุง",
    href: "/dashboard/schedules",
    icon: Calendar,
    hideForUser: true,
  },
  {
    title: "รายงาน",
    href: "/dashboard/reports",
    icon: FileText,
    adminOnly: true,
  },
  {
    title: "ผู้ใช้งาน",
    href: "/dashboard/users",
    icon: Users,
    adminOnly: true,
  },
  {
    title: "ตั้งค่า",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

interface SidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed = false, onCollapsedChange }: SidebarProps) {
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
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col border-r bg-white transition-all duration-300",
          collapsed ? "lg:w-16" : "lg:w-64"
        )}
      >
        {/* Logo */}
        <div className="p-4 border-b">
          <div className={cn(
            "flex items-center",
            collapsed ? "justify-center" : "gap-3"
          )}>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary flex-shrink-0">
              <span className="text-white font-bold text-lg">MS</span>
            </div>
            {!collapsed && (
              <div>
                <h1 className="font-bold text-lg">Maintenance</h1>
                <p className="text-xs text-muted-foreground">System</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            const linkContent = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  collapsed && "justify-center px-2",
                  isActive
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    {linkContent}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return linkContent;
          })}
        </nav>

        {/* Toggle Button & Footer */}
        <div className="border-t p-2">
          {/* Toggle Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCollapsedChange?.(!collapsed)}
            className={cn(
              "w-full flex items-center gap-2 text-muted-foreground hover:text-foreground",
              collapsed ? "justify-center px-2" : "justify-start"
            )}
          >
            {collapsed ? (
              <PanelLeft className="h-5 w-5" />
            ) : (
              <>
                <PanelLeftClose className="h-5 w-5" />
                <span>ซ่อนเมนู</span>
              </>
            )}
          </Button>

          {/* Footer - Only show when expanded */}
          {!collapsed && (
            <div className="mt-2 rounded-lg bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-900">ต้องการความช่วยเหลือ?</p>
              <p className="text-xs text-blue-700 mt-1">
                ติดต่อฝ่าย IT Support
              </p>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
