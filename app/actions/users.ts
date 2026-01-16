"use server";

/**
 * Users Server Actions
 * Actions สำหรับดึงข้อมูล Users พร้อม Serialization
 */

import { createClient } from "@/lib/supabase/server";
import {
  getTechnicians,
  getUserById,
  getAllUsers,
  getUserStats,
} from "@/lib/api/users/queries";

// Type for action responses
type ActionResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

// =====================================
// HELPER FUNCTIONS
// =====================================

/**
 * Get current authenticated user
 */
async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่");
  }

  return user;
}

/**
 * ✅ Serialize ข้อมูลให้เป็น plain objects
 * แปลง Decimal → number, Date → string, ลบ functions/Prisma references
 */
function serializeData<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (key, value) => {
      // แปลง Decimal เป็น number
      if (value && typeof value === 'object' && value.constructor?.name === 'Decimal') {
        return Number(value);
      }
      // แปลง Date เป็น ISO string
      if (value instanceof Date) {
        return value.toISOString();
      }
      // แปลง BigInt เป็น string
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    })
  );
}

// =====================================
// READ ACTIONS
// =====================================

/**
 * ดึง Technicians (สำหรับมอบหมายงาน)
 */
export async function getTechniciansAction(): Promise<ActionResponse> {
  try {
    await getCurrentUser(); // Check auth

    const technicians = await getTechnicians();

    return {
      success: true,
      data: serializeData(technicians), // ✅ Serialize
    };
  } catch (error) {
    console.error("Get technicians error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}

/**
 * ดึง User ตาม ID
 */
export async function getUserByIdAction(id: string): Promise<ActionResponse> {
  try {
    await getCurrentUser(); // Check auth

    const user = await getUserById(id);

    if (!user) {
      return {
        success: false,
        error: "ไม่พบผู้ใช้",
      };
    }

    return {
      success: true,
      data: serializeData(user), // ✅ Serialize
    };
  } catch (error) {
    console.error("Get user by id error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}

/**
 * ดึง Users ทั้งหมด (Admin only)
 */
export async function getAllUsersAction(): Promise<ActionResponse> {
  try {
    const currentUser = await getCurrentUser();

    // TODO: Check if user is admin
    // For now, allow all authenticated users

    const users = await getAllUsers();

    return {
      success: true,
      data: serializeData(users), // ✅ Serialize
    };
  } catch (error) {
    console.error("Get all users error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}

/**
 * ดึงสถิติ Users
 */
export async function getUserStatsAction(): Promise<ActionResponse> {
  try {
    await getCurrentUser(); // Check auth

    const stats = await getUserStats();

    return {
      success: true,
      data: serializeData(stats), // ✅ Serialize
    };
  } catch (error) {
    console.error("Get user stats error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}

/**
 * ดึง Current User Profile
 */
export async function getCurrentUserProfileAction(): Promise<ActionResponse> {
  try {
    const authUser = await getCurrentUser();

    const user = await getUserById(authUser.id);

    if (!user) {
      return {
        success: false,
        error: "ไม่พบข้อมูลผู้ใช้งาน",
      };
    }

    return {
      success: true,
      data: serializeData(user), // ✅ Serialize
    };
  } catch (error) {
    console.error("Get current user profile error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}