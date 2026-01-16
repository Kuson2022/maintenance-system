import prisma from "@/lib/prisma";
import { MaintenanceScheduleStatus } from "@prisma/client";
import { MaintenanceScheduleWithRelations, SerializedMaintenanceScheduleWithRelations } from "./types";

// Serialize Helper
function serializeSchedule(schedule: MaintenanceScheduleWithRelations): SerializedMaintenanceScheduleWithRelations {
    return {
        ...schedule,
        startDate: schedule.startDate.toISOString(),
        endDate: schedule.endDate ? schedule.endDate.toISOString() : null,
        lastPerformedDate: schedule.lastPerformedDate ? schedule.lastPerformedDate.toISOString() : null,
        nextDueDate: schedule.nextDueDate ? schedule.nextDueDate.toISOString() : null,
        createdAt: schedule.createdAt.toISOString(),
        updatedAt: schedule.updatedAt.toISOString(),
        equipment: {
            ...schedule.equipment,
            cost: Number(schedule.equipment.cost),
            installationDate: schedule.equipment.installationDate?.toISOString() ?? null,
            warrantyExpiry: schedule.equipment.warrantyExpiry?.toISOString() ?? null,
            createdAt: schedule.equipment.createdAt.toISOString(),
            updatedAt: schedule.equipment.updatedAt.toISOString(),
        },
        assignee: schedule.assignee ? {
            ...schedule.assignee,
            createdAt: schedule.assignee.createdAt.toISOString(),
            updatedAt: schedule.assignee.updatedAt.toISOString(),
            lastLoginAt: schedule.assignee.lastLoginAt?.toISOString() ?? null,
        } : null,
    };
}

export async function getSchedules(filters?: {
    equipmentId?: string;
    assignedTo?: string;
    status?: MaintenanceScheduleStatus;
}) {
    const where: any = {};
    if (filters?.equipmentId && filters.equipmentId !== "all") where.equipmentId = filters.equipmentId;
    if (filters?.assignedTo && filters.assignedTo !== "all") where.assignedTo = filters.assignedTo;
    if (filters?.status && (filters.status as any) !== "all") where.status = filters.status;

    const schedules = await prisma.maintenanceSchedule.findMany({
        where,
        include: {
            equipment: true,
            assignee: true,
        },
        orderBy: {
            nextDueDate: "asc",
        },
    });

    return schedules.map(serializeSchedule);
}

export async function getScheduleById(id: string) {
    const schedule = await prisma.maintenanceSchedule.findUnique({
        where: { id },
        include: {
            equipment: true,
            assignee: true,
        },
    });

    if (!schedule) return null;
    return serializeSchedule(schedule);
}

export async function getUpcomingSchedules(days: number = 7) {
    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + days);

    const schedules = await prisma.maintenanceSchedule.findMany({
        where: {
            nextDueDate: {
                gte: today,
                lte: future,
            },
            status: "ACTIVE",
        },
        include: {
            equipment: true,
            assignee: true,
        },
        orderBy: {
            nextDueDate: "asc",
        },
    });

    return schedules.map(serializeSchedule);
}

export async function getOverdueSchedules() {
    const today = new Date();

    const schedules = await prisma.maintenanceSchedule.findMany({
        where: {
            nextDueDate: {
                lt: today,
            },
            status: "ACTIVE",
        },
        include: {
            equipment: true,
            assignee: true,
        },
        orderBy: {
            nextDueDate: "asc",
        },
    });

    return schedules.map(serializeSchedule);
}
