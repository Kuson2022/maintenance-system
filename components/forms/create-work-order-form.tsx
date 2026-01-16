"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EquipmentSelector } from "./equipment-selector";
import { createWorkOrderAction } from "@/app/actions/work-orders";
import { WorkOrderPriority, PRIORITY_CONFIG } from "@/lib/api/work-orders/types";
import { createWorkOrderSchema, type CreateWorkOrderInput } from "@/lib/api/work-orders/validation";
import { Loader2, Save, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function CreateWorkOrderForm() {
  return (
    <Suspense fallback={<div>Loading form...</div>}>
      <CreateWorkOrderFormContent />
    </Suspense>
  );
}

function CreateWorkOrderFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledEquipmentId = searchParams.get("equipmentId");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use UseFormReturn specific type or allow inference to handle mismatched coercion types
  // The schema produces Date objects for dueDate, but input is string.
  // We use 'any' for the resolver to bypass the strict type check conflict between Input/Output of Zod with RHF.
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<CreateWorkOrderInput>({
    resolver: zodResolver(createWorkOrderSchema) as any,
    defaultValues: {
      priority: "MEDIUM" as WorkOrderPriority,
      equipmentId: prefilledEquipmentId || undefined,
    },
  });

  const watchEquipment = watch("equipmentId");
  const watchPriority = watch("priority");
  const watchDueDate = watch("dueDate");

  // Effect to set default due date based on priority
  // Only sets if the user hasn't manually modified the due date (dirtyFields)
  useEffect(() => {
    // If user has manually touched the due date, don't override it
    if (dirtyFields.dueDate) return;

    // Skip if priority is not set
    if (!watchPriority) return;

    const now = new Date();
    const targetDate = new Date(now);

    // Add days based on priority
    switch (watchPriority) {
      case "LOW":
        targetDate.setDate(now.getDate() + 5);
        break;
      case "MEDIUM":
        targetDate.setDate(now.getDate() + 3);
        break;
      case "HIGH":
        targetDate.setDate(now.getDate() + 2);
        break;
      case "CRITICAL":
        targetDate.setDate(now.getDate() + 1);
        break;
      default:
        return;
    }

    // Manual formatting to ensure local time is preserved in the string
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    const hours = String(targetDate.getHours()).padStart(2, '0');
    const minutes = String(targetDate.getMinutes()).padStart(2, '0');

    const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;

    // Set value but DO NOT mark as dirty, so subsequent priority changes can still update it
    // unless the user manually edits the input.
    setValue("dueDate", formattedDate as any, {
      shouldValidate: true,
      shouldDirty: false
    });

  }, [watchPriority, setValue, dirtyFields.dueDate]);

  const onSubmit = async (data: CreateWorkOrderInput) => {
    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append("equipmentId", data.equipmentId);
      // Optional fields handling
      if (data.title) formData.append("title", data.title);
      if (data.description) formData.append("description", data.description);
      if (data.priority) formData.append("priority", data.priority);

      if (data.dueDate) {
        // data.dueDate is a Date object due to Zod coercion
        formData.append("dueDate", data.dueDate.toISOString());
      }

      const result = await createWorkOrderAction(formData);

      if (!result.success) {
        throw new Error(result.error || "ไม่สามารถสร้างใบแจ้งซ่อมได้");
      }

      toast.success("สร้างใบแจ้งซ่อมสำเร็จ!");

      // Redirect to list or detail
      if (result.data?.id) {
        router.push(`/dashboard/work-orders/${result.data.id}`);
      } else {
        router.push("/dashboard/work-orders");
      }
    } catch (err) {
      console.error("Submit error:", err);
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการสร้างใบแจ้งซ่อม");
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลการแจ้งซ่อม</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Equipment */}
          <EquipmentSelector
            value={watchEquipment}
            onChange={(value) => setValue("equipmentId", value, { shouldValidate: true })}
            error={errors.equipmentId?.message}
            disabled={loading || !!prefilledEquipmentId}
          />

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              หัวเรื่อง <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              {...register("title")}
              disabled={loading}
              placeholder="ระบุหัวเรื่อง เช่น แอร์เครื่องที่ 1 ไม่เย็น"
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              รายละเอียดปัญหา <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              rows={5}
              {...register("description")}
              disabled={loading}
              placeholder="อธิบายอาการเสียและรายละเอียดอื่นๆ ที่เกี่ยวข้อง"
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Priority */}
            <div className="space-y-2">
              <Label>
                ระดับความเร่งด่วน <span className="text-red-500">*</span>
              </Label>
              <Select
                value={watchPriority}
                onValueChange={(value) => setValue("priority", value as WorkOrderPriority, { shouldValidate: true })}
                disabled={loading}
              >
                <SelectTrigger className={errors.priority ? "border-red-500" : ""}>
                  <SelectValue placeholder="เลือกระดับความเร่งด่วน" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_CONFIG).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        <span>{config.icon}</span>
                        <span>{config.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.priority && (
                <p className="text-sm text-red-500">{errors.priority.message}</p>
              )}
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="dueDate">กำหนดเวลาเสร็จ (ถ้ามี)</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                {...register("dueDate")}
                disabled={loading}
              />
              {/* Note: React Hook Form will capture string value, Zod coercion converts to Date */}
              {errors.dueDate && (
                <p className="text-sm text-red-500">{errors.dueDate.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          <X className="h-4 w-4 mr-2" />
          ยกเลิก
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              กำลังบันทึก...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              สร้างใบแจ้งซ่อม
            </>
          )}
        </Button>
      </div>
    </form>
  );
}