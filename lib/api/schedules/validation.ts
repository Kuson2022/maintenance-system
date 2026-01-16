import { z } from "zod";
import { MaintenanceScheduleType, MaintenanceScheduleFrequency } from "@prisma/client";

export const checklistItemSchema = z.object({
    id: z.string(),
    task: z.string().min(1, "Task description is required"),
    inputType: z.enum(["BOOLEAN", "TEXT", "NUMBER"]).default("BOOLEAN"),
    unit: z.string().optional(), // e.g. "PSI", "°C"
    required: z.boolean().default(false),
    checked: z.boolean().optional(),
});

export const createScheduleSchema = z.object({
    equipmentId: z.string().uuid("Invalid Equipment ID"),
    activityName: z.string().min(3, "Activity name must be at least 3 characters"),
    description: z.string().optional(),
    type: z.nativeEnum(MaintenanceScheduleType),
    frequency: z.nativeEnum(MaintenanceScheduleFrequency),
    startDate: z.date({ message: "Start date is required" }),
    endDate: z.date().optional().nullable(),
    assignedTo: z.string().uuid().optional().nullable(),
    estimatedDuration: z.coerce.number().min(0, "Duration must be positive").optional(),
    checklist: z.array(checklistItemSchema).optional(),
});

export const updateScheduleSchema = createScheduleSchema.partial().extend({
    id: z.string().uuid(),
});

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
