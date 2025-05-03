"use server";

import { db } from "@/db/drizzle";
import { project } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Initialize display order for all existing projects
 * This should be run once after adding the displayOrder field
 */
export async function initializeDisplayOrder(userId: string) {
  try {
    // Get all projects for the user, ordered by creation date (oldest first)
    const projects = await db
      .select()
      .from(project)
      .where(eq(project.userId, userId))
      .orderBy(project.createdAt);
    
    // Update each project with a sequential display order
    for (let i = 0; i < projects.length; i++) {
      await db
        .update(project)
        .set({ displayOrder: i })
        .where(eq(project.id, projects[i].id));
    }
    
    return { success: true, message: `Updated ${projects.length} projects` };
  } catch (error) {
    console.error("Error initializing display order:", error);
    return { success: false, message: "Failed to initialize display order" };
  }
}
