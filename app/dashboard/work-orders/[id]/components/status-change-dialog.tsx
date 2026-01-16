// app/dashboard/work-orders/[id]/components/status-change-dialog.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { WorkOrderDetail, STATUS_CONFIG } from "@/lib/api/work-orders/types";
import { changeWorkOrderStatusAction } from "@/app/actions/work-orders";

const statusChangeSchema = z.object({
  newStatus: z.enum([
    "PENDING",
    "ASSIGNED",
    "IN_PROGRESS",
    "ON_HOLD",
    "COMPLETED",
    "CANCELLED",
  ]),
  notes: z.string().max(500).optional(),
});

interface StatusChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrder: WorkOrderDetail;
}

export function StatusChangeDialog({
  open,
  onOpenChange,
  workOrder,
}: StatusChangeDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof statusChangeSchema>>({
    resolver: zodResolver(statusChangeSchema),
    defaultValues: {
      newStatus: workOrder.status,
      notes: "",
    },
  });

  // Get available status options based on current status
  const getAvailableStatuses = () => {
    const current = workOrder.status;
    const all = Object.keys(STATUS_CONFIG);

    // Define allowed transitions
    const transitions: Record<string, string[]> = {
      PENDING: ["ASSIGNED", "CANCELLED"],
      ASSIGNED: ["IN_PROGRESS", "ON_HOLD", "CANCELLED"],
      IN_PROGRESS: ["ON_HOLD", "COMPLETED", "CANCELLED"],
      ON_HOLD: ["IN_PROGRESS", "CANCELLED"],
      COMPLETED: [], // Cannot change from completed
      CANCELLED: [], // Cannot change from cancelled
    };

    return transitions[current] || all;
  };

  const onSubmit = async (values: z.infer<typeof statusChangeSchema>) => {
    setIsSubmitting(true);
    try {
      const result = await changeWorkOrderStatusAction({
        workOrderId: workOrder.id,
        ...values,
      });

      if (result.success) {
        toast({
          title: "เปลี่ยนสถานะสำเร็จ",
          description: "เปลี่ยนสถานะใบแจ้งซ่อมเรียบร้อยแล้ว",
        });
        onOpenChange(false);
        router.refresh();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description:
          error instanceof Error ? error.message : "ไม่สามารถเปลี่ยนสถานะได้",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableStatuses = getAvailableStatuses();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>เปลี่ยนสถานะใบแจ้งซ่อม</DialogTitle>
          <DialogDescription>
            เลือกสถานะใหม่สำหรับใบแจ้งซ่อม {workOrder.woNumber}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Current Status */}
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-1">สถานะปัจจุบัน</p>
              <p className="text-lg font-semibold">
                {STATUS_CONFIG[workOrder.status].label}
              </p>
            </div>

            {/* New Status */}
            <FormField
              control={form.control}
              name="newStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>สถานะใหม่</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={availableStatuses.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกสถานะ" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {availableStatuses.length === 0 && (
                    <FormDescription className="text-destructive">
                      ไม่สามารถเปลี่ยนสถานะจากสถานะปัจจุบันได้
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>หมายเหตุ (ถ้ามี)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="เหตุผลในการเปลี่ยนสถานะ..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || availableStatuses.length === 0}
              >
                {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}