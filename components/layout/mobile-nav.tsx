"use client";

/**
 * Mobile Bottom Navigation
 * Fixed bottom navigation bar for mobile devices
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Wrench,
    QrCode,
    Package,
    Menu,
} from "lucide-react";

const navItems = [
    {
        title: "หน้าแรก",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "แจ้งซ่อม",
        href: "/dashboard/work-orders",
        icon: Wrench,
    },
    {
        title: "สแกน",
        href: "/dashboard/scan",
        icon: QrCode,
        highlight: true,
    },
    {
        title: "เครื่องจักร",
        href: "/dashboard/equipment",
        icon: Package,
    },
];

interface MobileNavProps {
    onMenuClick?: () => void;
}

export function MobileNav({ onMenuClick }: MobileNavProps) {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t lg:hidden safe-area-bottom">
            <div className="flex items-center justify-around h-16">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href ||
                        (item.href !== "/dashboard" && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center flex-1 h-full px-1 transition-colors",
                                item.highlight && !isActive && "relative",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {item.highlight ? (
                                <div className={cn(
                                    "flex items-center justify-center w-12 h-12 -mt-6 rounded-full shadow-lg transition-colors",
                                    isActive
                                        ? "bg-primary text-white"
                                        : "bg-primary/90 text-white"
                                )}>
                                    <Icon className="h-6 w-6" />
                                </div>
                            ) : (
                                <Icon className={cn(
                                    "h-5 w-5",
                                    isActive && "text-primary"
                                )} />
                            )}
                            <span className={cn(
                                "text-[10px] mt-1",
                                item.highlight && "-mt-0.5"
                            )}>
                                {item.title}
                            </span>
                        </Link>
                    );
                })}

                {/* More Menu */}
                <button
                    onClick={onMenuClick}
                    className="flex flex-col items-center justify-center flex-1 h-full px-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <Menu className="h-5 w-5" />
                    <span className="text-[10px] mt-1">เพิ่มเติม</span>
                </button>
            </div>
        </nav>
    );
}
