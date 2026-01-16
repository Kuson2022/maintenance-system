"use client";

/**
 * Work Orders Stats Toggle
 * Toggle button to show/hide stats cards on mobile
 */

import { useState, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, BarChart3 } from "lucide-react";

interface WorkOrdersStatsToggleProps {
    children: ReactNode;
}

export function WorkOrdersStatsToggle({ children }: WorkOrdersStatsToggleProps) {
    const [showStats, setShowStats] = useState(false);

    return (
        <>
            {/* Mobile Toggle Button */}
            <div className="md:hidden">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowStats(!showStats)}
                    className="w-full flex items-center justify-center gap-2"
                >
                    <BarChart3 className="h-4 w-4" />
                    <span>{showStats ? "ซ่อนสถิติ" : "แสดงสถิติ"}</span>
                    {showStats ? (
                        <ChevronUp className="h-4 w-4" />
                    ) : (
                        <ChevronDown className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* Stats Cards - Always visible on desktop, toggle on mobile */}
            <div className={`${showStats ? "block" : "hidden"} md:block`}>
                {children}
            </div>
        </>
    );
}
