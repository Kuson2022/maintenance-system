/**
 * Cached Equipment Queries
 * ใช้ unstable_cache สำหรับ static data ที่ไม่เปลี่ยนบ่อย
 */

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// =====================================
// CACHE TAGS
// =====================================
export const CACHE_TAGS = {
    CATEGORIES: "equipment-categories",
    FLOORS: "equipment-floors",
    LOCATIONS: "equipment-locations",
} as const;

// =====================================
// CACHED QUERIES
// =====================================

/**
 * ดึงหมวดหมู่เครื่องจักรทั้งหมด (Cached)
 * Cache จะหมดอายุเมื่อมีการ revalidate tag
 */
export const getCachedCategories = unstable_cache(
    async () => {
        return prisma.equipmentCategory.findMany({
            orderBy: { name: "asc" },
            select: {
                id: true,
                name: true,
                description: true,
                _count: {
                    select: { equipment: true },
                },
            },
        });
    },
    [CACHE_TAGS.CATEGORIES],
    {
        tags: [CACHE_TAGS.CATEGORIES],
        revalidate: false, // ไม่หมดอายุจนกว่าจะ revalidate
    }
);

/**
 * ดึงรายชื่อชั้น (floor) ที่มีในระบบ (Cached)
 */
export const getCachedFloors = unstable_cache(
    async () => {
        const floors = await prisma.equipment.findMany({
            where: {
                floor: { not: null },
            },
            select: { floor: true },
            distinct: ["floor"],
            orderBy: { floor: "asc" },
        });

        return floors
            .map((e) => e.floor)
            .filter((f): f is string => f !== null);
    },
    [CACHE_TAGS.FLOORS],
    {
        tags: [CACHE_TAGS.FLOORS],
        revalidate: false,
    }
);

/**
 * ดึงรายชื่อ locations ที่มีในระบบ (Cached)
 * Note: locations ขึ้นกับ floor ที่เลือก ดังนั้นใช้ floor เป็น key
 */
export const getCachedLocations = (floor?: string) =>
    unstable_cache(
        async () => {
            const where: Prisma.EquipmentWhereInput = {
                location: { not: null },
            };

            if (floor) {
                where.floor = floor;
            }

            const locations = await prisma.equipment.findMany({
                where,
                select: { location: true },
                distinct: ["location"],
                orderBy: { location: "asc" },
            });

            return locations
                .map((e) => e.location)
                .filter((loc): loc is string => loc !== null);
        },
        [CACHE_TAGS.LOCATIONS, floor || "all"],
        {
            tags: [CACHE_TAGS.LOCATIONS],
            revalidate: false,
        }
    )();
