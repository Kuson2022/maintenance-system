import {
    MaintenanceSchedule,
    MaintenanceScheduleType,
    MaintenanceScheduleFrequency,
    MaintenanceScheduleStatus,
    Equipment,
    User,
    Prisma
} from "@prisma/client";

// Raw types from Prisma
export type {
    MaintenanceSchedule,
    MaintenanceScheduleType,
    MaintenanceScheduleFrequency,
    MaintenanceScheduleStatus
};

// Relation types
export type MaintenanceScheduleWithRelations = MaintenanceSchedule & {
    equipment: Equipment;
    assignee: User | null;
};

// Serialized types for Client Components (Dates as strings)
export type SerializedMaintenanceSchedule = Omit<
    MaintenanceSchedule,
    "startDate" | "endDate" | "lastPerformedDate" | "nextDueDate" | "createdAt" | "updatedAt"
> & {
    startDate: string;
    endDate: string | null;
    lastPerformedDate: string | null;
    nextDueDate: string | null;
    createdAt: string;
    updatedAt: string;
};

export type SerializedMaintenanceScheduleWithRelations = SerializedMaintenanceSchedule & {
    equipment: Omit<Equipment, "installationDate" | "warrantyExpiry" | "createdAt" | "updatedAt" | "cost"> & {
        installationDate: string | null;
        warrantyExpiry: string | null;
        createdAt: string;
        updatedAt: string;
        cost: number;
    };
    assignee: (Omit<User, "createdAt" | "updatedAt" | "lastLoginAt"> & { createdAt: string; updatedAt: string; lastLoginAt: string | null }) | null;
};

// Checklist Item Type
export interface ChecklistItem {
    id: string;
    task: string;
    inputType: "BOOLEAN" | "TEXT" | "NUMBER";
    unit?: string;
    required: boolean;
    checked?: boolean; // For completed status (Boolean type)
    value?: string | number | boolean; // Result value
}

// Form Data Type
export interface ScheduleFormData {
    equipmentId: string;
    activityName: string;
    description?: string;
    type: MaintenanceScheduleType;
    frequency: MaintenanceScheduleFrequency;
    startDate: Date;
    endDate?: Date;
    assignedTo?: string;
    estimatedDuration?: number; // Minutes
    checklist: ChecklistItem[];
}
