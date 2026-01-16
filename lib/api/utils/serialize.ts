//lib/api/utils/serialize.ts
/**
 * Serialization Utilities
 * แปลง objects ที่มี Decimal, Date ให้เป็น plain objects
 * สำหรับส่งจาก Server Components/Actions ไป Client Components
 */

import { Decimal } from "@prisma/client/runtime/library";

/**
 * แปลง value ใดๆ ให้เป็น serializable
 */
export function serializeValue(value: any): any {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return value;
  }

  // Handle Decimal objects
  if (value instanceof Decimal) {
    return Number(value);
  }

  // Handle Date objects
  if (value instanceof Date) {
    return value.toISOString();
  }

  // Handle Arrays
  if (Array.isArray(value)) {
    return value.map(serializeValue);
  }

  // Handle Objects
  if (typeof value === "object") {
    return serializeObject(value);
  }

  // Return primitive values as-is
  return value;
}

/**
 * แปลง object ให้เป็น plain object (recursive)
 */
export function serializeObject<T extends Record<string, any>>(
  obj: T
): any {
  const serialized: any = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      serialized[key] = serializeValue(obj[key]);
    }
  }

  return serialized;
}

/**
 * แปลง array of objects
 */
export function serializeArray<T extends Record<string, any>>(
  arr: T[]
): any[] {
  return arr.map(serializeObject);
}

/**
 * Type-safe serialization สำหรับ Prisma models
 */
export type Serialized<T> = {
  [K in keyof T]: T[K] extends Decimal
    ? number | null
    : T[K] extends Date
    ? string
    : T[K] extends Date | null
    ? string | null
    : T[K] extends object
    ? Serialized<T[K]>
    : T[K];
};

/**
 * ตัวอย่างการใช้งาน:
 * 
 * // Single object
 * const serialized = serializeObject(equipment);
 * 
 * // Array of objects
 * const serializedArray = serializeArray(equipmentList);
 * 
 * // In Server Actions
 * return {
 *   success: true,
 *   data: serializeObject(result),
 * };
 */

// lib/api/utils/serialize.ts

/**
 * ✅ Serialize ข้อมูลให้เป็น plain objects
 * แปลง Decimal → number, Date → string, ลบ functions/Prisma references
 * 
 * ใช้สำหรับ serialize data ก่อนส่งจาก Server Component → Client Component
 */
export function serializeData<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (key, value) => {
      // แปลง Decimal เป็น number
      if (value && typeof value === "object" && value.constructor?.name === "Decimal") {
        return Number(value);
      }
      // แปลง Date เป็น ISO string
      if (value instanceof Date) {
        return value.toISOString();
      }
      // แปลง BigInt เป็น string
      if (typeof value === "bigint") {
        return value.toString();
      }
      return value;
    })
  );
}

/**
 * ✅ Deserialize ISO date strings back to Date objects
 * ใช้เมื่อต้องการแปลง string กลับเป็น Date object
 */
export function deserializeDates<T extends Record<string, any>>(
  data: T,
  dateFields: (keyof T)[]
): T {
  const result = { ...data };
  
  dateFields.forEach((field) => {
    if (result[field] && typeof result[field] === "string") {
      result[field] = new Date(result[field] as string) as any;
    }
  });
  
  return result;
}

/**
 * ✅ Check if value is a plain object (not Date, not Array, not null)
 */
export function isPlainObject(value: any): boolean {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !(value instanceof Date) &&
    value.constructor === Object
  );
}

/**
 * ✅ Deep clone object (removing non-serializable values)
 */
export function deepClone<T>(obj: T): T {
  return serializeData(obj);
}