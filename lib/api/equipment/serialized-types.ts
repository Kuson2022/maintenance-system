/**
 * Serialized Equipment Types
 * Types หลัง serialize (Decimal → number, Date → string)
 */

// =====================================
// SERIALIZED EQUIPMENT CATEGORY
// =====================================

export interface SerializedEquipmentCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  createdAt: string;  // Date → string
  updatedAt: string;  // Date → string
}

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
  floor: string | null;                 // ชั้นที่ติดตั้ง
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
// SERIALIZED EQUIPMENT WITH CATEGORY
// =====================================

export interface SerializedEquipmentWithCategory extends SerializedEquipment {
  category: SerializedEquipmentCategory;
}

// =====================================
// EXPORT ALIASES
// =====================================

export type {
  SerializedEquipment as Equipment,
  SerializedEquipmentWithCategory as EquipmentWithCategory
};