/**
 * Users Queries
 * ดึงข้อมูล Users จาก database
 */

import { prisma } from "@/lib/prisma";
import { User } from "@prisma/client";

/**
 * ดึง Users ที่เป็น Technician และ Admin (สำหรับมอบหมายงาน)
 */
export async function getTechnicians(): Promise<User[]> {
  try {
    const technicians = await prisma.user.findMany({
      where: {
        role: {
          in: ["TECHNICIAN", "ADMIN"],
        },
        status: "ACTIVE",
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        // ไม่ select sensitive fields
        phone: false,
        lastLoginAt: false,
      },
    });

    return technicians as User[];
  } catch (error) {
    console.error("Failed to fetch technicians:", error);
    throw new Error("ไม่สามารถดึงข้อมูลช่างได้");
  }
}

/**
 * ดึง User ตาม ID
 */
export async function getUserById(id: string): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        status: true,
        phone: true,
        position: true,
        department: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: false,
      },
    });

    return user as User | null;
  } catch (error) {
    console.error("Failed to fetch user by id:", error);
    return null;
  }
}

/**
 * ดึง Users ทั้งหมด (สำหรับ Admin)
 */
/**
 * ดึง Users ทั้งหมด (สำหรับ Admin)
 * รองรับ Pagination และ Filter
 */
export async function getAllUsers(options?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}) {
  try {
    const { page = 1, limit = 10, search, role, status } = options || {};
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (role && role !== "all") {
      where.role = role;
    }

    if (status && status !== "all") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } }, // Case-insensitive handled by DB collation usually, or use mode: 'insensitive' if Postgres
        { email: { contains: search } },
      ];
    }

    // Get total count for pagination
    const total = await prisma.user.count({ where });

    // Get paginated data
    const users = await prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        status: true,
        phone: true,
        position: true,
        department: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      users: users as User[],
      metadata: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  } catch (error) {
    console.error("Failed to fetch users:", error);
    throw new Error("ไม่สามารถดึงข้อมูลผู้ใช้ได้");
  }
}

/**
 * นับจำนวน Users แยกตาม Role
 */
export async function getUserStats() {
  try {
    const stats = await prisma.user.groupBy({
      by: ["role"],
      _count: true,
      where: {
        status: "ACTIVE",
      },
    });

    return stats;
  } catch (error) {
    console.error("Failed to fetch user stats:", error);
    throw new Error("ไม่สามารถดึงสถิติผู้ใช้ได้");
  }
}