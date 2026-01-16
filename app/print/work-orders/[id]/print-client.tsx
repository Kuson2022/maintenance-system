"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function PrintClientTrigger() {
    useEffect(() => {
        // Small delay to ensure styles are loaded
        const timer = setTimeout(() => {
            window.print();
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="no-print fixed top-4 right-4 z-50">
            <Button onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Print Again
            </Button>
        </div>
    );
}
