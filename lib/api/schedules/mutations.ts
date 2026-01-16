"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createScheduleSchema, updateScheduleSchema } from "./validation";
import { MaintenanceScheduleFrequency, MaintenanceScheduleStatus } from "@prisma/client";
import { addDays, addWeeks, addMonths, addQuarters, addYears } from "date-fns";

// Helper to calculate next due date
function calculateNextDueDate(currentDate: Date, frequency: MaintenanceScheduleFrequency): Date {
    switch (frequency) {
        case "DAILY": return addDays(currentDate, 1);
        case "WEEKLY": return addWeeks(currentDate, 1);
        case "BI_WEEKLY": return addWeeks(currentDate, 2);
        case "MONTHLY": return addMonths(currentDate, 1);
        case "QUARTERLY": return addQuarters(currentDate, 1);
        case "SEMI_ANNUALLY": return addMonths(currentDate, 6);
        case "ANNUALLY": return addYears(currentDate, 1);
        default: return currentDate; // CUSTOM needs manual intervention usually
    }
}

export async function createSchedule(data: any) {
    const validated = createScheduleSchema.parse(data);

    // Set initial nextDueDate to startDate
    const nextDueDate = validated.startDate;

    const schedule = await prisma.maintenanceSchedule.create({
        data: {
            ...validated,
            nextDueDate,
            status: "ACTIVE",
        },
    });

    revalidatePath("/dashboard/schedules");
    return schedule;
}

export async function updateSchedule(data: any) {
    const validated = updateScheduleSchema.parse(data);
    const { id, ...updateData } = validated;

    const schedule = await prisma.maintenanceSchedule.update({
        where: { id },
        data: updateData,
    });

    revalidatePath("/dashboard/schedules");
    revalidatePath(`/dashboard/schedules/${id}`);
    return schedule;
}

export async function deleteSchedule(id: string) {
    await prisma.maintenanceSchedule.delete({
        where: { id },
    });
    revalidatePath("/dashboard/schedules");
}

export async function completeSchedule(id: string, results?: Record<string, any>, userId?: string) {
    const schedule = await prisma.maintenanceSchedule.findUnique({
        where: { id },
    });

    if (!schedule) throw new Error("Schedule not found");

    const now = new Date();
    const nextDate = calculateNextDueDate(schedule.nextDueDate || now, schedule.frequency);

    // Use a transaction To update schedule and log the history
    await prisma.$transaction(async (tx) => {
        // 1. Update Schedule
        await tx.maintenanceSchedule.update({
            where: { id },
            data: {
                lastPerformedDate: now,
                nextDueDate: nextDate,
                status: "ACTIVE",
            },
        });

        // 2. Prepare Checklist Snapshot
        // Merge the current checklist definition with the captured results
        const currentChecklist = (schedule.checklist as any[]) || [];
        const checklistSnapshot = currentChecklist.map((item: any) => ({
            ...item,
            value: results ? results[item.id] : undefined, // Inject the result value
            checked: results ? !!results[item.id] : false, // For legacy/boolean support
        }));

        // 3. Create Maintenance History Record
        await tx.maintenanceHistory.create({
            data: {
                scheduleId: id,
                equipmentId: schedule.equipmentId,
                performerId: userId || schedule.assignedTo, // Use provided user or fallback to assignee
                performedAt: now,
                status: "COMPLETED",
                checklist: checklistSnapshot, // Save the full snapshot
                notes: (results as any)?.notes || "", // Capture notes if passed in results
            },
        });

        // 4. (Optional) Log to ActivityLog for System Audit if needed
        // For now, MaintenanceHistory serves as the source of truth for execution
    });

    revalidatePath("/dashboard/schedules");
    revalidatePath(`/dashboard/equipment/${schedule.equipmentId}`);
}
