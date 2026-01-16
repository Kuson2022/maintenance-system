import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { EquipmentForm } from "@/components/forms/equipment-form";

/**
 * New Equipment Page
 * หน้าเพิ่มเครื่องจักรใหม่
 */

export default function NewEquipmentPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/equipment">
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">เพิ่มเครื่องจักรใหม่</h1>
                    <p className="text-muted-foreground">
                        กรอกข้อมูลเครื่องจักรที่ต้องการเพิ่มเข้าระบบ
                    </p>
                </div>
            </div>

            {/* Form */}
            <EquipmentForm mode="create" />
        </div>
    );
}
