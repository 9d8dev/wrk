"use server";

import crypto from "node:crypto";

import { eq } from "drizzle-orm";

import { revalidateUserTheme } from "@/lib/utils/revalidation";

import { type gridTypes, theme, user } from "@/db/schema";
import { db } from "@/db/drizzle";

type GridType = (typeof gridTypes)[number];

type UpdateThemeParams = {
  userId: string;
  themeData: {
    gridType: GridType;
  };
};

export async function updateTheme({ userId, themeData }: UpdateThemeParams) {
  try {
    // Fetch existing theme and user info in parallel
    const [existingTheme, userResult] = await Promise.all([
      db.select().from(theme).where(eq(theme.userId, userId)).limit(1),
      db
        .select({ username: user.username })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1),
    ]);

    let themeId: string;

    if (existingTheme.length > 0) {
      // Update existing theme
      themeId = existingTheme[0].id;

      await db
        .update(theme)
        .set({
          gridType: themeData.gridType as GridType,
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
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    if (userResult.length > 0 && userResult[0].username) {
      // Use aggressive revalidation for theme changes
      await revalidateUserTheme(userResult[0].username, userId);
    }
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
    // Get theme directly with a join instead of two sequential queries
    const result = await db
      .select({ theme: theme })
      .from(theme)
      .innerJoin(user, eq(user.id, theme.userId))
      .where(eq(user.username, username))
      .limit(1);

    return result.length > 0 ? result[0].theme : null;
  } catch (error) {
    console.error("Error fetching theme by username:", error);
    return null;
  }
}
