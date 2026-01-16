// app/(dashboard)/work-orders/[id]/components/maintenance-log-dialog.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Check, ChevronsUpDown, Search } from "lucide-react";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { WorkOrderDetail } from "@/lib/api/work-orders/types";
import {
  createMaintenanceLogAction,
  updateMaintenanceLogAction,
  getSparePartsAction,
} from "@/app/actions/work-orders";

const maintenanceLogSchema = z.object({
  description: z
    .string()
    .min(10, "รายละเอียดต้องมีอย่างน้อย 10 ตัวอักษร")
    .max(2000),
  rootCause: z.string().max(1000).optional(),
  workHours: z.coerce
    .number()
    .min(0, "จำนวนชั่วโมงต้องไม่ติดลบ")
    .max(24, "ไม่เกิน 24 ชม.")
    .optional(),
  notes: z.string().max(1000).optional(),
  spareParts: z
    .array(
      z.object({
        sparePartId: z.string().min(1, "กรุณาเลือกอะไหล่"),
        quantity: z.coerce.number().int().positive("จำนวนต้องมากกว่า 0"),
        unitPrice: z.coerce.number().positive("ราคาต้องมากกว่า 0"),
      })
    )
    .optional(),
});

interface MaintenanceLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrder: WorkOrderDetail;
  mode?: "create" | "edit";
  initialData?: any;
}

interface SparePart {
  id: string;
  code: string;
  name: string;
  unit: string;
  unitPrice: number;
}

export function MaintenanceLogDialog({
  open,
  onOpenChange,
  workOrder,
  mode = "create",
  initialData,
}: MaintenanceLogDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [isLoadingSpareParts, setIsLoadingSpareParts] = useState(true);
  const [openCombobox, setOpenCombobox] = useState(false);

  const form = useForm<z.infer<typeof maintenanceLogSchema>>({
    resolver: zodResolver(maintenanceLogSchema),
    defaultValues: {
      description: "",
      rootCause: "",
      workHours: 0,
      notes: "",
      spareParts: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "spareParts",
  });

  // Calculate total cost
  const totalCost = fields.reduce((sum, field, index) => {
    const qty = form.watch(`spareParts.${index}.quantity`) || 0;
    const price = form.watch(`spareParts.${index}.unitPrice`) || 0;
    return sum + qty * price;
  }, 0);

  // Load spare parts
  useEffect(() => {
    async function loadSpareParts() {
      const result = await getSparePartsAction();
      if (result.success && result.data) {
        setSpareParts(result.data);
      }
      setIsLoadingSpareParts(false);
    }
    if (open) {
      loadSpareParts();

      // Pre-fill form if edit mode
      if (mode === "edit" && initialData) {
        form.reset({
          description: initialData.description || "",
          rootCause: initialData.rootCause || "",
          workHours: Number(initialData.workHours) || 0,
          notes: initialData.notes || "",
          spareParts: initialData.parts?.map((p: any) => ({ // parts is mapped from workOrderParts in queries usually? OR check actual data passed. 
            // The maintenanceLog object from 'MaintenanceLogSection' usually comes from 'getWorkOrderById' which includes 'parts' relation?
            // Wait, query includes 'parts: WorkOrderPart[]'? 
            // No, the schema change added 'parts' relation to MaintenanceLog.
            // But we need to verify if 'getWorkOrderById' includes it.
            // It includes 'maintenanceLogs', does it include 'parts' inside maintenanceLogs?
            // Let's assume it does or I should have updated the query. 
            // In 'maintenance-log-section.tsx', we pass 'workOrder' which comes from 'getWorkOrderById'.
            // I need to check if 'maintenanceLogs' includes 'parts'.
            // Step 108 View File 'queries.ts':
            // maintenanceLogs: { include: { technician: ... } } It DOES NOT include parts!
            // I need to update queries.ts to include parts in maintenanceLogs.

            sparePartId: p.sparePartId,
            quantity: p.quantity,
            unitPrice: Number(p.unitPrice),
          })) || [],
        });
      } else {
        form.reset({
          description: "",
          rootCause: "",
          workHours: 0,
          notes: "",
          spareParts: [],
        });
      }
    }
  }, [open, mode, initialData, form]);

  const onSubmit = async (values: z.infer<typeof maintenanceLogSchema>) => {
    setIsSubmitting(true);
    try {
      // Set start/end time based on work hours (for backward compatibility if backend requires it)
      // Actually backend handles workHours now, but let's provide dummy times to satisfy schema types if needed
      // The schema in validations.ts makes start/end optional, so we are good.
      // But mutations.ts might expect them... let's check validation.ts again.
      // createMaintenanceLogSchema has optional startTime/endTime.

      let result;

      if (mode === "edit" && initialData) {
        result = await updateMaintenanceLogAction({
          id: initialData.id,
          workOrderId: workOrder.id,
          ...values,
        });
      } else {
        result = await createMaintenanceLogAction({
          workOrderId: workOrder.id,
          ...values,
        });
      }

      if (result.success) {
        toast({
          title: "บันทึกสำเร็จ",
          description: "บันทึกการซ่อมเรียบร้อยแล้ว",
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
          error instanceof Error ? error.message : "ไม่สามารถบันทึกได้",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addSparePart = (partId: string) => {
    const part = spareParts.find((p) => p.id === partId);
    if (part) {
      append({
        sparePartId: part.id,
        quantity: 1,
        unitPrice: Number(part.unitPrice),
      });
      setOpenCombobox(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "แก้ไขบันทึกการซ่อม" : "บันทึกการซ่อม"}</DialogTitle>
          <DialogDescription>
            {mode === "edit" ? "แก้ไขรายละเอียดการซ่อม" : `บันทึกรายละเอียดการซ่อมสำหรับ ${workOrder.woNumber}`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Details */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>รายละเอียดการซ่อม *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="อธิบายขั้นตอนการซ่อมและสิ่งที่ทำ..."
                          rows={5}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rootCause"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>สาเหตุของปัญหา</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="วิเคราะห์สาเหตุที่แท้จริงของปัญหา..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="workHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ชั่วโมงการทำงาน (ชม.)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.5" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Right Column: Spare Parts */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-base font-semibold">
                    เบิกอะไหล่/อุปกรณ์
                  </div>
                  <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCombobox}
                        className="w-[200px] justify-between"
                        disabled={isLoadingSpareParts}
                      >
                        {isLoadingSpareParts ? "กำลังโหลด..." : "ค้นหาอะไหล่..."}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="พิมพ์ชื่อหรือรหัสอะไหล่..." />
                        <CommandList>
                          <CommandEmpty>ไม่พบอะไหล่</CommandEmpty>
                          <CommandGroup>
                            {spareParts.map((part) => (
                              <CommandItem
                                key={part.id}
                                value={`${part.code} ${part.name}`}
                                onSelect={() => addSparePart(part.id)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    fields.some((f) => f.sparePartId === part.id)
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span>{part.name}</span>
                                  <span className="text-xs text-muted-foreground">{part.code}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>รายการ</TableHead>
                        <TableHead className="w-[80px] text-center">จำนวน</TableHead>
                        <TableHead className="w-[100px] text-right">ราคา</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.length > 0 ? (
                        fields.map((field, index) => {
                          const part = spareParts.find(
                            (p) => p.id === form.watch(`spareParts.${index}.sparePartId`)
                          );
                          return (
                            <TableRow key={field.id}>
                              <TableCell className="text-sm">
                                <div className="font-medium">{part?.name || "Unknown"}</div>
                                <div className="text-xs text-muted-foreground">{part?.code}</div>
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="1"
                                  className="h-8 text-center"
                                  {...form.register(`spareParts.${index}.quantity`, {
                                    valueAsNumber: true,
                                  })}
                                />
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                {((form.watch(`spareParts.${index}.quantity`) || 0) * (form.watch(`spareParts.${index}.unitPrice`) || 0)).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => remove(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="h-24 text-center text-muted-foreground text-sm"
                          >
                            ยังไม่มีรายการอะไหล่
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {fields.length > 0 && (
                  <div className="flex justify-end items-center gap-2 pt-2">
                    <span className="text-sm font-medium">รวมเป็นเงิน:</span>
                    <span className="text-lg font-bold text-primary">
                      ฿{totalCost.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Bottom: Notes and Buttons */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>หมายเหตุเพิ่มเติม</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="ข้อมูลเพิ่มเติม, คำแนะนำ..."
                      rows={2}
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "กำลังบันทึก..." : (mode === "edit" ? "บันทึกการแก้ไข" : "บันทึกการซ่อม")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}