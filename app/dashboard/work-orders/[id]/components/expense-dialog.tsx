// app/(dashboard)/work-orders/[id]/components/expense-dialog.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon, Upload } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { WorkOrderDetail } from "@/lib/api/work-orders/types";
import {
  createExpenseAction,
  getExpenseTypesAction,
} from "@/app/actions/work-orders";

const expenseSchema = z.object({
  expenseTypeId: z.string().min(1, "กรุณาเลือกประเภทค่าใช้จ่าย"),
  description: z
    .string()
    .min(3, "รายละเอียดต้องมีอย่างน้อย 3 ตัวอักษร")
    .max(200),
  quantity: z.number().int().positive("จำนวนต้องมากกว่า 0"),
  unitPrice: z.number().positive("ราคาต้องมากกว่า 0"),
  date: z.date({ required_error: "กรุณาเลือกวันที่" }),
  receiptUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().max(500).optional(),
});

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrder: WorkOrderDetail;
}

interface ExpenseType {
  id: string;
  name: string;
  description: string | null;
}

export function ExpenseDialog({
  open,
  onOpenChange,
  workOrder,
}: ExpenseDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);

  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      expenseTypeId: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      date: new Date(),
      receiptUrl: "",
      notes: "",
    },
  });

  // Load expense types
  useEffect(() => {
    async function loadExpenseTypes() {
      const result = await getExpenseTypesAction();
      if (result.success && result.data) {
        setExpenseTypes(result.data);
      }
      setIsLoadingTypes(false);
    }
    if (open) {
      loadExpenseTypes();
    }
  }, [open]);

  // Watch quantity and unitPrice to calculate total
  const quantity = form.watch("quantity") || 0; // ✅ Default to 0 ถ้าเป็น undefined/NaN
  const unitPrice = form.watch("unitPrice") || 0; // ✅ Default to 0 ถ้าเป็น undefined/NaN
  const total = (quantity || 0) * (unitPrice || 0); // ✅ ป้องกัน NaN ในการคำนวณ

  const onSubmit = async (values: z.infer<typeof expenseSchema>) => {
    setIsSubmitting(true);
    try {
      const result = await createExpenseAction({
        workOrderId: workOrder.id,
        ...values,
        receiptUrl: values.receiptUrl || undefined,
      });

      if (result.success) {
        toast({
          title: "เพิ่มสำเร็จ",
          description: "เพิ่มค่าใช้จ่ายเรียบร้อยแล้ว",
        });
        onOpenChange(false);
        form.reset();
        router.refresh();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description:
          error instanceof Error ? error.message : "ไม่สามารถเพิ่มได้",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>เพิ่มค่าใช้จ่าย</DialogTitle>
          <DialogDescription>
            บันทึกค่าใช้จ่ายสำหรับ {workOrder.woNumber}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Expense Type */}
            <FormField
              control={form.control}
              name="expenseTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ประเภทค่าใช้จ่าย *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoadingTypes}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกประเภท" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {expenseTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          <div>
                            <p className="font-medium">{type.name}</p>
                            {type.description && (
                              <p className="text-xs text-muted-foreground">
                                {type.description}
                              </p>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <FormLabel>รายละเอียด *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="เช่น ค่าอะไหล่, ค่าแรง..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quantity and Unit Price */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>จำนวน *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        value={field.value || ""} 
                        onChange={(e) => {
                          const value = e.target.value;
                          // ✅ ป้องกัน NaN
                          const parsed = parseInt(value);
                          field.onChange(isNaN(parsed) ? 1 : parsed);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ราคาต่อหน่วย (฿) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={field.value || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          // ✅ ป้องกัน NaN
                          const parsed = parseFloat(value);
                          field.onChange(isNaN(parsed) ? 0 : parsed);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Total Display */}
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">ราคารวม</span>
                <span className="text-2xl font-bold text-primary">
                  ฿{total.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            {/* Date */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>วันที่ *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-left font-normal",
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
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Receipt URL */}
            <FormField
              control={form.control}
              name="receiptUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL ใบเสร็จ/บิล (ถ้ามี)</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://..."
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled
                        title="อัพโหลดไฟล์ (Coming soon)"
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    วาง URL ของใบเสร็จที่อัพโหลดไว้แล้ว
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
                      placeholder="ข้อมูลเพิ่มเติม..."
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
              <Button type="submit" disabled={isSubmitting || isLoadingTypes}>
                {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}