/**
 * Cache Utilities
 * Helper functions for cache management
 */

import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/api/equipment/cached-queries";

// =====================================
// CACHE INVALIDATION FUNCTIONS
// =====================================

/**
 * Invalidate equipment categories cache
 * เรียกใช้เมื่อ: สร้าง/แก้ไข/ลบ category
 */
export function invalidateCategoriesCache() {
    revalidateTag(CACHE_TAGS.CATEGORIES);
}

/**
 * Invalidate equipment floors cache
 * เรียกใช้เมื่อ: สร้าง/แก้ไข/ลบ equipment ที่มี floor เปลี่ยน
 */
export function invalidateFloorsCache() {
    revalidateTag(CACHE_TAGS.FLOORS);
}

/**
 * Invalidate equipment locations cache
 * เรียกใช้เมื่อ: สร้าง/แก้ไข/ลบ equipment ที่มี location เปลี่ยน
 */
export function invalidateLocationsCache() {
    revalidateTag(CACHE_TAGS.LOCATIONS);
}

/**
 * Invalidate all equipment-related caches
 * เรียกใช้เมื่อ: สร้าง/แก้ไข/ลบ equipment
 */
export function invalidateEquipmentCaches() {
    invalidateFloorsCache();
    invalidateLocationsCache();
}

/**
 * Invalidate all caches
 */
export function invalidateAllCaches() {
    invalidateCategoriesCache();
    invalidateFloorsCache();
    invalidateLocationsCache();
}
