"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createScheduleSchema, updateScheduleSchema } from "./validation";
import { MaintenanceScheduleFrequency, MaintenanceScheduleStatus } from "@prisma/client";
import { addDays, addWeeks, addMonths, addQuarters, addYears } from "date-fns";

/**
 * Normalize a date to noon UTC (12:00:00.000Z) to prevent timezone shift issues
 * This ensures the date stays the same regardless of local timezone
 */
function normalizeDateToNoonUTC(date: Date): Date {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    // Create date at noon UTC to prevent day shift across timezones
    return new Date(Date.UTC(year, month, day, 12, 0, 0, 0));
}

// Helper to calculate next due date
function calculateNextDueDate(currentDate: Date, frequency: MaintenanceScheduleFrequency): Date {
    let nextDate: Date;
    switch (frequency) {
        case "DAILY": nextDate = addDays(currentDate, 1); break;
        case "WEEKLY": nextDate = addWeeks(currentDate, 1); break;
        case "BI_WEEKLY": nextDate = addWeeks(currentDate, 2); break;
        case "MONTHLY": nextDate = addMonths(currentDate, 1); break;
        case "QUARTERLY": nextDate = addQuarters(currentDate, 1); break;
        case "SEMI_ANNUALLY": nextDate = addMonths(currentDate, 6); break;
        case "ANNUALLY": nextDate = addYears(currentDate, 1); break;
        default: nextDate = currentDate; // CUSTOM needs manual intervention usually
    }
    // Normalize result to noon UTC as well
    return normalizeDateToNoonUTC(nextDate);
}

export async function createSchedule(data: any) {
    const validated = createScheduleSchema.parse(data);

    // Normalize startDate to noon UTC to prevent timezone issues
    const normalizedStartDate = normalizeDateToNoonUTC(validated.startDate);

    const schedule = await prisma.maintenanceSchedule.create({
        data: {
            ...validated,
            startDate: normalizedStartDate,
            nextDueDate: normalizedStartDate,
            status: "ACTIVE",
        },
    });

    revalidatePath("/dashboard/schedules");
    return schedule;
}

export async function updateSchedule(data: any) {
    const validated = updateScheduleSchema.parse(data);
    const { id, ...updateData } = validated;

    // Normalize startDate if it's being updated
    if (updateData.startDate) {
        updateData.startDate = normalizeDateToNoonUTC(updateData.startDate);
    }

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
