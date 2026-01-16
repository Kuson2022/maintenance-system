"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { LocationType } from "@prisma/client";

export type LocationResult = {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
};

async function checkPermission() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function getLocations(): Promise<LocationResult> {
  try {
    await checkPermission();
    const locations = await prisma.location.findMany({
      include: {
        children: {
          include: {
            children: true, // Only go 2 levels deep for now in list
          },
        },
      },
      where: {
        parentId: null, // Get root locations
      },
      orderBy: {
        name: "asc",
      },
    });
    return { success: true, data: locations };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to fetch locations" };
  }
}

export async function getAllLocationsFlat(): Promise<LocationResult> {
  try {
    await checkPermission();
    const locations = await prisma.location.findMany({
      orderBy: {
        name: "asc",
      },
    });
    return { success: true, data: locations };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to fetch locations" };
  }
}

export async function createLocation(data: {
  name: string;
  description?: string;
  type: LocationType;
  parentId?: string;
}): Promise<LocationResult> {
  try {
    const user = await checkPermission();
    // Use user.id for logging if needed

    const location = await prisma.location.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        parentId: data.parentId || null,
      },
    });

    revalidatePath("/dashboard/settings"); // Assuming settings page for locations
    return { success: true, data: location };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to create location" };
  }
}

export async function updateLocation(
  id: string,
  data: {
    name?: string;
    description?: string;
    type?: LocationType;
    parentId?: string;
  }
): Promise<LocationResult> {
  try {
    await checkPermission();

    const location = await prisma.location.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        parentId: data.parentId || null,
      },
    });

    revalidatePath("/dashboard/settings");
    return { success: true, data: location };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to update location" };
  }
}

export async function deleteLocation(id: string): Promise<LocationResult> {
  try {
    await checkPermission();

    // Check if used
    const usage = await prisma.equipment.count({ where: { locationId: id } });
    if (usage > 0) {
      return { success: false, error: "Cannot delete location: It is used by equipment." };
    }

    await prisma.location.delete({
      where: { id },
    });

    revalidatePath("/dashboard/settings");
    return { success: true, message: "Location deleted" };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to delete location" };
  }
}
