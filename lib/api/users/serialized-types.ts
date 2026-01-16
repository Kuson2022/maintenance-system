/**
 * Serialized User Types
 * Types หลัง serialize (Date → string)
 */

// =====================================
// ENUMS
// =====================================

export enum UserRole {
  USER = "USER",
  TECHNICIAN = "TECHNICIAN",
  ADMIN = "ADMIN",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}

// =====================================
// SERIALIZED USER
// =====================================

export interface SerializedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  phone: string | null;
  avatarUrl: string | null;
  lastLoginAt: string | null;  // Date → string
  createdAt: string;            // Date → string
  updatedAt: string;            // Date → string
}

// =====================================
// SERIALIZED TECHNICIAN (subset of User)
// =====================================

export interface SerializedTechnician {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string | null;
}

// =====================================
// EXPORT ALIASES
// =====================================

export type { 
  SerializedUser as User,
  SerializedTechnician as Technician 
};