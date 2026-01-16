/**
 * Equipment Types
 * Type definitions for Equipment module
 */

import { Equipment, EquipmentCategory, EquipmentStatus, User, WorkOrder, MaintenanceSchedule, MaintenanceHistory } from "@prisma/client";

// =====================================
// INPUT TYPES
// =====================================

export interface CreateEquipmentInput {
  code: string;
  name: string;
  categoryId: string;
  type?: string;
  manufacturer?: string;
  serialNumber?: string;
  location?: string;
  floor?: string;
  installationDate?: Date;
  warrantyExpiry?: Date;
  cost?: number;
  status?: EquipmentStatus;
  description?: string;
  manualUrl?: string;
  specifications?: Record<string, any>;
  responsiblePersonId?: string;
  supplierContact?: string;
  image?: string;
}

export interface UpdateEquipmentInput {
  id: string;
  code?: string;
  name?: string;
  categoryId?: string;
  type?: string;
  manufacturer?: string;
  serialNumber?: string;
  location?: string;
  floor?: string;
  installationDate?: Date;
  warrantyExpiry?: Date;
  cost?: number;
  status?: EquipmentStatus;
  description?: string;
  manualUrl?: string;
  specifications?: Record<string, any>;
  responsiblePersonId?: string;
  supplierContact?: string;
  image?: string;
}

// =====================================
// FILTER TYPES
// =====================================

export interface EquipmentFilters {
  search?: string;
  categoryId?: string;
  status?: EquipmentStatus;
  location?: string;
  responsiblePersonId?: string;
  warrantyExpired?: boolean;
  hasActiveWorkOrders?: boolean;
  floor?: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// =====================================
// RESPONSE TYPES
// =====================================

export interface EquipmentWithRelations extends Equipment {
  category: EquipmentCategory;
  responsiblePerson: User | null;
  workOrders?: WorkOrder[];
  maintenanceSchedules?: MaintenanceSchedule[];
  maintenanceHistory?: MaintenanceHistory[];
  parent?: Equipment | null;
  locationRef?: any; // Location type is not imported from client, using any or manual type
  _count?: {
    workOrders: number;
    maintenanceSchedules: number;
    maintenanceHistory: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface EquipmentStats {
  total: number;
  byStatus: {
    active: number;
    inactive: number;
    maintenance: number;
    retired: number;
  };
  byCategory: {
    categoryId: string;
    categoryName: string;
    count: number;
  }[];
  warrantyExpiringSoon: number;
  recentlyAdded: number;
}

export interface EquipmentDetailStats {
  totalWorkOrders: number;
  completedWorkOrders: number;
  pendingWorkOrders: number;
  totalMaintenanceCost: number;
  lastMaintenanceDate: Date | null;
  nextScheduledMaintenance: Date | null;
  averageRepairTime: number | null;
  uptime: number; // percentage
}

// =====================================
// SERIALIZED TYPES (for client)
// =====================================

export interface SerializedEquipment {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  type: string | null;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  location: string | null;
  floor: string | null;
  installationDate: string | null;
  warrantyExpiry: string | null;
  cost: number | null;
  status: EquipmentStatus;
  qrCode: string;
  description: string | null;
  manualUrl: string | null;
  image: string | null;
  specifications: Record<string, any> | null;
  responsiblePersonId: string | null;
  supplierContact: string | null;
  createdAt: string;
  updatedAt: string;
  parentId?: string | null;
  locationId?: string | null;
  parent?: {
    id: string;
    name: string;
    code: string;
  } | null;
  locationRef?: {
    id: string;
    name: string;
  } | null;
  category?: {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
  };
  responsiblePerson?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  } | null;
  _count?: {
    workOrders: number;
    maintenanceSchedules: number;
  };
}

export interface SerializedEquipmentCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    equipment: number;
  };
}

// =====================================
// PERMISSION TYPES
// =====================================

/**
 * Equipment Permissions Interface
 * Defines role-based access controls for Equipment module
 */
export interface EquipmentPermissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canRetire: boolean;
  canBulkUpdate: boolean;
  canBulkAssign: boolean;
  canImport: boolean;
  canExport: boolean;
  canManageCategories: boolean;
}
