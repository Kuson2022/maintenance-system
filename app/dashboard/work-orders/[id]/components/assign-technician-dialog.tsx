// app/dashboard/work-orders/[id]/components/assign-technician-dialog.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { WorkOrderDetail } from "@/lib/api/work-orders/types";
import {
  assignTechnicianAction,
  getAvailableTechniciansAction,
} from "@/app/actions/work-orders";

const assignTechnicianSchema = z.object({
  technicianId: z.string().min(1, "กรุณาเลือกช่าง"),
  dueDate: z.date().optional(),
  notes: z.string().max(500).optional(),
});

interface AssignTechnicianDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrder: WorkOrderDetail;
}

interface Technician {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  activeWorkOrders: number;
}

export function AssignTechnicianDialog({
  open,
  onOpenChange,
  workOrder,
}: AssignTechnicianDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<z.infer<typeof assignTechnicianSchema>>({
    resolver: zodResolver(assignTechnicianSchema),
    defaultValues: {
      technicianId: workOrder.assignee?.id || "",
      dueDate: workOrder.dueDate ? new Date(workOrder.dueDate) : undefined,
      notes: "",
    },
  });

  // Load technicians
  useEffect(() => {
    async function loadTechnicians() {
      const result = await getAvailableTechniciansAction();
      if (result.success && result.data) {
        setTechnicians(result.data);
      }
      setIsLoading(false);
    }
    if (open) {
      loadTechnicians();
    }
  }, [open]);

  const onSubmit = async (values: z.infer<typeof assignTechnicianSchema>) => {
    setIsSubmitting(true);
    try {
      const result = await assignTechnicianAction({
        workOrderId: workOrder.id,
        ...values,
      });

      if (result.success) {
        toast({
          title: "มอบหมายสำเร็จ",
          description: "มอบหมายช่างเรียบร้อยแล้ว",
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
          error instanceof Error ? error.message : "ไม่สามารถมอบหมายได้",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>มอบหมายช่าง</DialogTitle>
          <DialogDescription>
            เลือกช่างที่จะรับผิดชอบใบแจ้งซ่อม {workOrder.woNumber}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Current Assignee */}
            {workOrder.assignee && (
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">ช่างปัจจุบัน</p>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={workOrder.assignee.avatarUrl || undefined} />
                    <AvatarFallback>
                      {getInitials(workOrder.assignee.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{workOrder.assignee.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {workOrder.assignee.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Technician Select */}
            <FormField
              control={form.control}
              name="technicianId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>เลือกช่าง</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกช่าง" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {technicians.map((tech) => (
                        <SelectItem key={tech.id} value={tech.id}>
                          <div className="flex items-center gap-2">
                            <span>{tech.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {tech.activeWorkOrders} งาน
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    แสดงจำนวนงานที่กำลังดำเนินการอยู่
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Due Date */}
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>กำหนดเวลาเสร็จ (ถ้ามี)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "d MMMM yyyy", { locale: th })
                          ) : (
                            <span>เลือกวันที่</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    วันที่คาดว่าจะเสร็จ (ไม่บังคับ)
                  </FormDescription>
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
                      placeholder="ข้อมูลเพิ่มเติมสำหรับช่าง..."
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
              <Button type="submit" disabled={isSubmitting || isLoading}>
                {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}