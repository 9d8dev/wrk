"use server";

import { project as projectTable } from "@/db/schema";
import { eq, desc, and, isNull, lt, asc, gt } from "drizzle-orm";
import { db } from "@/db/drizzle";

import { revalidatePath } from "next/cache";
import { getSession } from "./auth";
import { project } from "@/db/schema";

import type { Project } from "@/db/schema";

export const createProject = async (data: Project) => {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  // Find the highest display order for the current user's projects
  const highestOrderProjects = await db
    .select({ displayOrder: projectTable.displayOrder })
    .from(projectTable)
    .where(eq(projectTable.userId, session.user.id))
    .orderBy(desc(projectTable.displayOrder))
    .limit(1);

  // Calculate the new display order (highest + 1, or 0 if no projects exist)
  const newDisplayOrder =
    highestOrderProjects.length > 0
      ? (highestOrderProjects[0].displayOrder || 0) + 1
      : 0;

  const res = await db
    .insert(projectTable)
    .values({
      ...data,
      userId: session.user.id,
      displayOrder: newDisplayOrder,
    })
    .returning();

  revalidatePath("/admin");
  revalidatePath("/(admin)/admin");
  revalidatePath("/(public)/[username]");

  return res;
};

export const editProject = async (id: string, data: Partial<Project>) => {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const res = await db
    .update(projectTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(projectTable.id, id))
    .returning();

  revalidatePath("/admin");
  return res;
};

export const deleteProject = async (id: string) => {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const res = await db
    .delete(projectTable)
    .where(eq(projectTable.id, id))
    .returning();

  revalidatePath("/admin");
  return res;
};

export const updateProject = async (
  id: string,
  data: Partial<Omit<Project, "id" | "userId" | "createdAt">>
) => {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const res = await db
    .update(projectTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(projectTable.id, id))
    .returning();

  revalidatePath("/admin");
  return res;
};

/**
 * Update the display order of multiple projects
 */
export async function updateProjectOrder(
  projects: Array<{ id: string; displayOrder: number }>,
  userId: string
) {
  try {
    // Update each project's display order
    for (const project of projects) {
      await db
        .update(projectTable)
        .set({
          displayOrder: project.displayOrder,
          updatedAt: new Date(),
        })
        .where(
          and(eq(projectTable.id, project.id), eq(projectTable.userId, userId))
        );
    }

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error updating project order:", error);
    return { error: "Failed to update project order" };
  }
}

/**
 * Fix duplicate display orders for a user's projects
 * This assigns sequential display orders (0, 1, 2, ...) to all projects
 * This function is internal and not exposed in the UI
 */
export async function fixProjectDisplayOrders(userId: string) {
  try {
    // Get all projects for this user
    const projects = await db
      .select()
      .from(project)
      .where(eq(project.userId, userId));

    // Sort them manually (null displayOrder at end, then by displayOrder, then by createdAt)
    const sortedProjects = [...projects].sort((a, b) => {
      // Handle null display orders
      if (a.displayOrder === null && b.displayOrder === null) {
        return a.createdAt.getTime() - b.createdAt.getTime();
      }
      if (a.displayOrder === null) return 1;
      if (b.displayOrder === null) return -1;

      // Compare by display order
      if (a.displayOrder !== b.displayOrder) {
        return a.displayOrder - b.displayOrder;
      }

      // If display orders are the same, sort by creation date
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    // Update each project with a new sequential display order
    for (let i = 0; i < sortedProjects.length; i++) {
      await db
        .update(project)
        .set({ displayOrder: i })
        .where(eq(project.id, sortedProjects[i].id));
    }

    // Revalidate paths
    revalidatePath("/admin");
    revalidatePath("/(admin)/admin");
    revalidatePath("/(public)/[username]");

    return { success: true };
  } catch (error) {
    console.error("Error fixing project display orders:", error);
    return { success: false, message: "Failed to fix project display orders" };
  }
}

/**
 * Check if project orders need fixing (have duplicates or nulls)
 */
async function needsOrderFix(userId: string): Promise<boolean> {
  // Get all projects for this user
  const projects = await db
    .select({ displayOrder: project.displayOrder })
    .from(project)
    .where(eq(project.userId, userId));

  // Check for null display orders using isNull for at least one project
  const nullOrderExists = await db
    .select({ id: project.id })
    .from(project)
    .where(and(eq(project.userId, userId), isNull(project.displayOrder)))
    .limit(1);

  if (nullOrderExists.length > 0) {
    return true;
  }

  // Check for duplicate display orders
  const orders = projects.map((p) => p.displayOrder).filter((o) => o !== null);
  const uniqueOrders = new Set(orders);

  // If there are duplicates, we need to fix
  return orders.length !== uniqueOrders.size;
}

/**
 * Move a project up in the display order (lower number = higher position)
 */
export async function moveProjectUp(projectId: string, userId: string) {
  try {
    // Check if we need to fix display orders first
    if (await needsOrderFix(userId)) {
      await fixProjectDisplayOrders(userId);
    }

    // Get the current project
    const currentProject = await db
      .select()
      .from(project)
      .where(and(eq(project.id, projectId), eq(project.userId, userId)))
      .limit(1);

    if (!currentProject || currentProject.length === 0) {
      return { success: false, message: "Project not found" };
    }

    const current = currentProject[0];

    // If display order is null, fix it first
    if (current.displayOrder === null) {
      await fixProjectDisplayOrders(userId);
      return moveProjectUp(projectId, userId);
    }

    // Find the project that is directly above this one in display order
    const previousProjects = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.userId, userId),
          lt(project.displayOrder, current.displayOrder || 0)
        )
      )
      .orderBy(desc(project.displayOrder))
      .limit(1);

    // If there's no project above, this is already at the top
    if (!previousProjects || previousProjects.length === 0) {
      return { success: false, message: "Project is already at the top" };
    }

    const previous = previousProjects[0];

    // Swap the display orders
    await db
      .update(project)
      .set({ displayOrder: previous.displayOrder })
      .where(eq(project.id, current.id));

    await db
      .update(project)
      .set({ displayOrder: current.displayOrder })
      .where(eq(project.id, previous.id));

    // Revalidate the paths where projects are displayed
    revalidatePath("/admin");
    revalidatePath("/(admin)/admin");
    revalidatePath("/(public)/[username]");

    return { success: true };
  } catch (error) {
    console.error("Error moving project up:", error);
    return { success: false, message: "Failed to update project order" };
  }
}

/**
 * Move a project down in the display order (higher number = lower position)
 */
export async function moveProjectDown(projectId: string, userId: string) {
  try {
    // Check if we need to fix display orders first
    if (await needsOrderFix(userId)) {
      await fixProjectDisplayOrders(userId);
    }

    // Get the current project
    const currentProject = await db
      .select()
      .from(project)
      .where(and(eq(project.id, projectId), eq(project.userId, userId)))
      .limit(1);

    if (!currentProject || currentProject.length === 0) {
      return { success: false, message: "Project not found" };
    }

    const current = currentProject[0];

    // If display order is null, fix it first
    if (current.displayOrder === null) {
      await fixProjectDisplayOrders(userId);
      return moveProjectDown(projectId, userId);
    }

    // Find the project that is directly below this one in display order
    const nextProjects = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.userId, userId),
          gt(project.displayOrder, current.displayOrder || 0)
        )
      )
      .orderBy(asc(project.displayOrder))
      .limit(1);

    // If there's no project below, this is already at the bottom
    if (!nextProjects || nextProjects.length === 0) {
      return { success: false, message: "Project is already at the bottom" };
    }

    const next = nextProjects[0];

    // Swap the display orders
    await db
      .update(project)
      .set({ displayOrder: next.displayOrder })
      .where(eq(project.id, current.id));

    await db
      .update(project)
      .set({ displayOrder: current.displayOrder })
      .where(eq(project.id, next.id));

    // Revalidate the paths where projects are displayed
    revalidatePath("/admin");
    revalidatePath("/(admin)/admin");
    revalidatePath("/(public)/[username]");

    return { success: true };
  } catch (error) {
    console.error("Error moving project down:", error);
    return { success: false, message: "Failed to update project order" };
  }
}
