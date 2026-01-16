import { z } from "zod";

export const createExpenseSchema = z.object({
    workOrderId: z.string().optional(),
    equipmentId: z.string().optional(),
    expenseTypeId: z.string().min(1, "กรุณาเลือกประเภทค่าใช้จ่าย"),
    description: z.string().min(1, "กรุณาระบุรายละเอียด"),
    quantity: z.coerce.number().min(1, "จำนวนต้องมากกว่า 0").default(1),
    unitPrice: z.coerce.number().min(0, "ราคาต่อหน่วยต้องไม่ติดลบ"),
    total: z.coerce.number().optional(), // Can be calculated
    date: z.coerce.date().default(() => new Date()),
    receiptUrl: z.string().optional(),
    notes: z.string().optional(),
}).refine((data) => data.workOrderId || data.equipmentId, {
    message: "ต้องระบุใบสั่งงานหรือเครื่องจักรอย่างใดอย่างหนึ่ง",
    path: ["equipmentId", "workOrderId"],
});

export const updateExpenseSchema = createExpenseSchema.partial().extend({
    id: z.string(),
});

export const expenseFiltersSchema = z.object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    minAmount: z.coerce.number().optional(),
    maxAmount: z.coerce.number().optional(),
    equipmentId: z.string().optional(),
    expenseTypeId: z.string().optional(),
    workOrderId: z.string().optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ExpenseFiltersInput = z.infer<typeof expenseFiltersSchema>;
