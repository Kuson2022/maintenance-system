import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { CreateWorkOrderForm } from "@/components/forms/create-work-order-form";

/**
 * New Work Order Page
 * หน้าสร้างใบแจ้งซ่อมใหม่
 */

export default function NewWorkOrderPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/work-orders">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">สร้างใบแจ้งซ่อมใหม่</h1>
          <p className="text-muted-foreground">
            กรอกข้อมูลการแจ้งซ่อมให้ครบถ้วน
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">
          📋 คำแนะนำการแจ้งซ่อม
        </h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>เลือกเครื่องจักร/อุปกรณ์ที่มีปัญหา</li>
          <li>ระบุหัวเรื่องให้ชัดเจนและกระชับ</li>
          <li>อธิบายอาการหรือปัญหาโดยละเอียด</li>
          <li>เลือกระดับความเร่งด่วนที่เหมาะสม</li>
          <li>แนบรูปภาพประกอบจะช่วยให้ช่างเข้าใจปัญหาได้ดีขึ้น</li>
        </ul>
      </div>

      {/* Form */}
      <CreateWorkOrderForm />
    </div>
  );
}