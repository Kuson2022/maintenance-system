/**
 * Serialized Types for Client Components
 * Types หลัง serialize (Decimal → number, Date → string)
 */

import { User } from "@prisma/client";
import { WorkOrderPriority, WorkOrderStatus } from "./types";

// =====================================
// SERIALIZED EQUIPMENT
// =====================================

export interface SerializedEquipment {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  type: string | null;
  manufacturer: string | null;
  serialNumber: string | null;
  location: string | null;
  installationDate: string | null;    // Date → string
  warrantyExpiry: string | null;      // Date → string
  cost: number | null;                // Decimal → number
  status: string;
  qrCode: string;
  description: string | null;
  manualUrl: string | null;
  specifications: any;
  responsiblePersonId: string | null;
  supplierContact: string | null;
  createdAt: string;                  // Date → string
  updatedAt: string;                  // Date → string
}

// =====================================
// SERIALIZED WORK ORDER
// =====================================

export interface SerializedWorkOrder {
  id: string;
  woNumber: string;
  equipmentId: string;
  title: string;
  description: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  reportedBy: string;
  assignedTo: string | null;
  reportedAt: string;                 // Date → string
  startedAt: string | null;           // Date → string
  completedAt: string | null;         // Date → string
  dueDate: string | null;             // Date → string
  resolutionTimeHours: number | null; // Decimal → number
  createdAt: string;                  // Date → string
  updatedAt: string;                  // Date → string
}

// =====================================
// SERIALIZED WORK ORDER WITH RELATIONS
// =====================================

export interface SerializedWorkOrderWithRelations extends SerializedWorkOrder {
  equipment: SerializedEquipment;
  reporter: Pick<User, "id" | "email" | "name">;
  assignee: Pick<User, "id" | "email" | "name"> | null;
  _count?: {
    comments: number;
    attachments: number;
    maintenanceLogs: number;
  };
}

// =====================================
// SERIALIZED PAGINATED RESPONSE
// =====================================

export interface SerializedPaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}