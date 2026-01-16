// app/(dashboard)/work-orders/[id]/edit/components/edit-work-order-form.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { updateWorkOrderAction } from "@/app/actions/work-orders";
import {
  WorkOrderPriority,
  WorkOrderStatus,
  PRIORITY_CONFIG,
  STATUS_CONFIG,
} from "@/lib/api/work-orders/types";

const updateWorkOrderSchema = z.object({
  title: z
    .string()
    .min(5, "หัวเรื่องต้องมีอย่างน้อย 5 ตัวอักษร")
    .max(200, "หัวเรื่องต้องไม่เกิน 200 ตัวอักษร"),
  description: z
    .string()
    .min(10, "รายละเอียดต้องมีอย่างน้อย 10 ตัวอักษร")
    .max(2000, "รายละเอียดต้องไม่เกิน 2000 ตัวอักษร"),
  priority: z.nativeEnum(WorkOrderPriority),
  status: z.nativeEnum(WorkOrderStatus),
  dueDate: z.string().optional().nullable(),
});

interface EditWorkOrderFormProps {
  workOrder: any;
}

export function EditWorkOrderForm({ workOrder }: EditWorkOrderFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof updateWorkOrderSchema>>({
    resolver: zodResolver(updateWorkOrderSchema),
    defaultValues: {
      title: workOrder.title,
      description: workOrder.description,
      priority: workOrder.priority,
      status: workOrder.status,
      dueDate: workOrder.dueDate
        ? new Date(workOrder.dueDate).toISOString().slice(0, 16)
        : "",
    },
  });

  const onSubmit = async (values: z.infer<typeof updateWorkOrderSchema>) => {
    setIsSubmitting(true);
    try {
      const result = await updateWorkOrderAction({
        id: workOrder.id,
        title: values.title,
        description: values.description,
        priority: values.priority,
        status: values.status,
        dueDate: values.dueDate ? new Date(values.dueDate) : null,
      });

      if (result.success) {
        toast({
          title: "บันทึกสำเร็จ",
          description: "แก้ไขข้อมูลใบแจ้งซ่อมเรียบร้อยแล้ว",
        });
        router.push(`/dashboard/work-orders/${workOrder.id}`);
        router.refresh();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description:
          error instanceof Error ? error.message : "ไม่สามารถบันทึกได้",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Header Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>ข้อมูลปัจจุบัน</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{workOrder.woNumber}</Badge>
                <Badge className={STATUS_CONFIG[workOrder.status].color}>
                  {STATUS_CONFIG[workOrder.status].label}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Equipment Info (Read-only) */}
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">เครื่องจักร/อุปกรณ์</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{workOrder.equipment.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {workOrder.equipment.code}
                  </p>
                </div>
                <Badge variant="outline">
                  {workOrder.equipment.category?.name || "ไม่ระบุ"}
                </Badge>
              </div>
            </div>

            {/* Reporter Info (Read-only) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium mb-1">ผู้แจ้ง</p>
                <p className="text-sm">{workOrder.reporter.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">วันที่แจ้ง</p>
                <p className="text-sm">
                  {new Date(workOrder.reportedAt).toLocaleDateString("th-TH", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Editable Fields */}
        <Card>
          <CardHeader>
            <CardTitle>แก้ไขข้อมูล</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    หัวเรื่อง <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="เช่น แอร์ไม่เย็น, ลิฟต์เสีย"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    รายละเอียดปัญหา <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="อธิบายอาการหรือปัญหาที่พบ..."
                      rows={5}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Priority */}
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      ระดับความเร่งด่วน <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      สถานะ <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                          <SelectItem key={value} value={value}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      เปลี่ยนสถานะตามความคืบหน้า
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Due Date */}
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>กำหนดเวลาเสร็จ</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      value={field.value || ""}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    เว้นว่างถ้าไม่ต้องการกำหนดเวลา
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Warning Alert */}
        <Alert>
          <AlertDescription>
            💡 <strong>หมายเหตุ:</strong> การเปลี่ยนแปลงข้อมูลจะถูกบันทึกและแจ้งเตือนไปยังผู้ที่เกี่ยวข้อง
          </AlertDescription>
        </Alert>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/dashboard/work-orders/${workOrder.id}`)}
            disabled={isSubmitting}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            ยกเลิก
          </Button>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                บันทึกการแก้ไข
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}