// lib/auth/sync-user.ts
import { prisma } from "@/lib/prisma";
import type { User as SupabaseUser } from "@supabase/supabase-js";

/**
 * Sync Supabase user to our database
 * Call this after login or signup
 */
export async function syncUserToDatabase(supabaseUser: SupabaseUser) {
  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: supabaseUser.id },
    });

    if (existingUser) {
      // Update existing user
      await prisma.user.update({
        where: { id: supabaseUser.id },
        data: {
          email: supabaseUser.email!,
          name:
            supabaseUser.user_metadata?.name ||
            supabaseUser.email?.split("@")[0] ||
            "User",
          lastLoginAt: new Date(),
        },
      });
    } else {
      // Create new user
      await prisma.user.create({
        data: {
          id: supabaseUser.id,
          email: supabaseUser.email!,
          name:
            supabaseUser.user_metadata?.name ||
            supabaseUser.email?.split("@")[0] ||
            "User",
          role: "USER", // Default role
          status: "ACTIVE",
          lastLoginAt: new Date(),
        },
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error syncing user to database:", error);
    return { success: false, error };
  }
}

/**
 * Get or create user in database
 * Returns the user from our database that matches the Supabase user
 */
export async function getOrCreateUser(supabaseUser: SupabaseUser) {
  try {
    // First, try to find by ID (ideal case)
    let user = await prisma.user.findUnique({
      where: { id: supabaseUser.id },
    });

    if (user) {
      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
      return user;
    }

    // If not found by ID, try to find by email
    user = await prisma.user.findUnique({
      where: { email: supabaseUser.email! },
    });

    if (user) {
      // User exists with same email but different ID
      // This can happen if user was created before Supabase Auth
      console.warn(
        `User with email ${supabaseUser.email} exists with ID ${user.id}, but Supabase ID is ${supabaseUser.id}`
      );
      
      // Update last login for the existing user
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
      
      return user;
    }

    // If user doesn't exist at all, create new one
    user = await prisma.user.create({
      data: {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        name:
          supabaseUser.user_metadata?.name ||
          supabaseUser.email?.split("@")[0] ||
          "User",
        role: "USER",
        status: "ACTIVE",
        lastLoginAt: new Date(),
      },
    });

    console.log(`Created new user: ${user.email} with ID ${user.id}`);
    return user;
  } catch (error) {
    console.error("Error getting or creating user:", error);
    
    // If it's a unique constraint error on email, return the existing user
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      const existingUser = await prisma.user.findUnique({
        where: { email: supabaseUser.email! },
      });
      
      if (existingUser) {
        console.log(`Using existing user with email ${supabaseUser.email}`);
        return existingUser;
      }
    }
    
    throw error;
  }
}