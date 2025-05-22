"use server";

import { db } from "@/db/drizzle";
import { theme, gridTypes, modes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

type GridType = typeof gridTypes[number];
type Mode = typeof modes[number];

type UpdateThemeParams = {
  userId: string;
  themeData: {
    gridType: GridType;
    mode: Mode;
  };
};

export async function updateTheme({ userId, themeData }: UpdateThemeParams) {
  try {
    // Check if user already has a theme
    const existingTheme = await db
      .select()
      .from(theme)
      .where(eq(theme.userId, userId))
      .limit(1);

    let themeId: string;

    if (existingTheme.length > 0) {
      // Update existing theme
      themeId = existingTheme[0].id;

      await db
        .update(theme)
        .set({
          gridType: themeData.gridType as GridType,
          mode: themeData.mode as Mode,
          updatedAt: new Date(),
        })
        .where(eq(theme.id, themeId));
    } else {
      // Create new theme
      themeId = crypto.randomUUID();

      await db.insert(theme).values({
        id: themeId,
        userId,
        gridType: themeData.gridType as GridType,
        mode: themeData.mode as Mode,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Get user to revalidate their profile page
    const { user } = await import("@/db/schema");
    const userResult = await db
      .select({ username: user.username })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    
    if (userResult.length > 0 && userResult[0].username) {
      revalidatePath(`/${userResult[0].username}`);
    }
    
    revalidatePath("/admin/theme");
    return { success: true };
  } catch (error) {
    console.error("Error updating theme:", error);
    return { success: false, error };
  }
}

export async function getThemeByUserId(userId: string) {
  try {
    const userTheme = await db
      .select()
      .from(theme)
      .where(eq(theme.userId, userId))
      .limit(1);

    return userTheme.length > 0 ? userTheme[0] : null;
  } catch (error) {
    console.error("Error fetching theme:", error);
    return null;
  }
}

export async function getThemeByUsername(username: string) {
  try {
    // First get the user to get their ID
    const { getUserByUsername } = await import("@/lib/data/user");
    const user = await getUserByUsername(username);
    
    if (!user) {
      return null;
    }

    // Then get their theme
    const userTheme = await db
      .select()
      .from(theme)
      .where(eq(theme.userId, user.id))
      .limit(1);

    return userTheme.length > 0 ? userTheme[0] : null;
  } catch (error) {
    console.error("Error fetching theme by username:", error);
    return null;
  }
}
