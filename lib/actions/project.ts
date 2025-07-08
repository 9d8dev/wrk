"use server";

import type { ActionResponse } from "./utils";

import { and, asc, desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { nanoid } from "nanoid";

import { deleteMediaBatchWithCleanup } from "@/lib/actions/media";
import { revalidateUserProjects } from "@/lib/utils/revalidation";
import { getAllMediaByProjectId } from "@/lib/data/media";
import { auth } from "@/lib/auth";

import { project as projectTable } from "@/db/schema";
import { db } from "@/db/drizzle";

import {
  createProjectSchema,
  deleteProjectSchema,
  reorderProjectsSchema,
  updateProjectSchema,
} from "./schemas";

type ProjectData = {
  title: string;
  slug?: string;
  about?: string | null;
  externalLink?: string | null;
  imageIds?: string[];
  featuredImageId?: string | null;
  displayOrder?: number | null;
};

type ProjectResult = {
  id: string;
  slug: string;
  title: string;
};

/**
 * Create a new project with ownership and validation
 */
export async function createProject(
  data: ProjectData
): Promise<ActionResponse<ProjectResult>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = session.user.id;
    const username = session.user.username;

    // Validate input
    const validation = createProjectSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0]?.message || "Invalid input",
      };
    }

    // Find the highest display order for the current user's projects
    const highestOrderProjects = await db
      .select({ displayOrder: projectTable.displayOrder })
      .from(projectTable)
      .where(eq(projectTable.userId, userId))
      .orderBy(desc(projectTable.displayOrder))
      .limit(1);

    // Calculate the new display order
    const newDisplayOrder =
      highestOrderProjects.length > 0 &&
      highestOrderProjects[0].displayOrder !== null
        ? highestOrderProjects[0].displayOrder + 1
        : 0;

    // Generate unique slug - use provided slug or generate from title
    let slug: string;

    if (data.slug) {
      // User provided a custom slug
      slug = data.slug;
    } else {
      // Generate slug from title
      slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    // Ensure slug uniqueness within user's projects
    const originalSlug = slug;
    let counter = 1;

    while (true) {
      const existingProject = await db
        .select({ id: projectTable.id })
        .from(projectTable)
        .where(
          and(eq(projectTable.userId, userId), eq(projectTable.slug, slug))
        )
        .limit(1);

      if (existingProject.length === 0) {
        break; // Slug is unique
      }

      slug = `${originalSlug}-${counter}`;
      counter++;
    }

    // Validate and clean the data before insertion
    const cleanedData = {
      title: data.title,
      about: data.about || null,
      externalLink: data.externalLink || null,
      // Ensure imageIds is always an array, never null or undefined
      imageIds: Array.isArray(data.imageIds) ? data.imageIds : [],
      featuredImageId: data.featuredImageId || null,
      displayOrder: data.displayOrder || newDisplayOrder,
    };

    // Create project
    const newProject = await db
      .insert(projectTable)
      .values({
        id: nanoid(),
        title: cleanedData.title,
        about: cleanedData.about,
        slug,
        externalLink: cleanedData.externalLink,
        featuredImageId: cleanedData.featuredImageId,
        imageIds: cleanedData.imageIds,
        displayOrder: cleanedData.displayOrder,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId,
      })
      .returning();

    const result = newProject[0];

    // Use aggressive revalidation for project creation
    if (username) {
      await revalidateUserProjects(username, userId);
      // Revalidation is now handled by revalidateUserProjects
    }

    return {
      success: true,
      data: {
        id: result.id,
        slug: result.slug,
        title: result.title,
      },
    };
  } catch (error) {
    console.error("Error creating project:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create project",
    };
  }
}

/**
 * Update an existing project with ownership check
 */
export async function updateProject(
  id: string,
  data: Partial<ProjectData>
): Promise<ActionResponse<ProjectResult>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = session.user.id;
    const username = session.user.username;

    // Validate input
    const validation = updateProjectSchema.safeParse({ id, ...data });
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0]?.message || "Invalid input",
      };
    }

    // Check ownership
    const existing = await db
      .select()
      .from(projectTable)
      .where(and(eq(projectTable.id, id), eq(projectTable.userId, userId)))
      .limit(1);

    if (!existing || existing.length === 0) {
      return { success: false, error: "Project not found or unauthorized" };
    }

    // Handle slug changes - respect user-provided slug, or generate from title
    let slug = existing[0].slug;

    // If user provided a custom slug, use it
    if (data.slug && data.slug !== existing[0].slug) {
      slug = data.slug;
    }
    // Otherwise, if title changed and no custom slug provided, generate from title
    else if (data.title && data.title !== existing[0].title && !data.slug) {
      const baseSlug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      slug = baseSlug;
      let counter = 1;

      while (true) {
        const existingProject = await db
          .select({ id: projectTable.id })
          .from(projectTable)
          .where(
            and(
              eq(projectTable.userId, userId),
              eq(projectTable.slug, slug),
              // Exclude current project from check
              sql`${projectTable.id} != ${id}`
            )
          )
          .limit(1);

        if (existingProject.length === 0) {
          break; // Slug is unique
        }

        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    // Ensure slug uniqueness if user provided a custom slug
    if (data.slug && data.slug !== existing[0].slug) {
      let counter = 1;
      const originalSlug = slug;

      while (true) {
        const existingProject = await db
          .select({ id: projectTable.id })
          .from(projectTable)
          .where(
            and(
              eq(projectTable.userId, userId),
              eq(projectTable.slug, slug),
              // Exclude current project from check
              sql`${projectTable.id} != ${id}`
            )
          )
          .limit(1);

        if (existingProject.length === 0) {
          break; // Slug is unique
        }

        slug = `${originalSlug}-${counter}`;
        counter++;
      }
    }

    // Validate and clean the data before update
    const cleanedData = {
      ...data,
      // Ensure imageIds is always an array if provided
      imageIds: data.imageIds
        ? Array.isArray(data.imageIds)
          ? data.imageIds
          : []
        : undefined,
    };

    // Update project
    const updated = await db
      .update(projectTable)
      .set({
        ...cleanedData,
        slug,
        updatedAt: new Date(),
      })
      .where(eq(projectTable.id, id))
      .returning();

    const result = updated[0];

    // Use aggressive revalidation for project update
    if (username) {
      await revalidateUserProjects(username, userId);
      // Revalidation is now handled by revalidateUserProjects
      // If slug changed, revalidate old slug too
      if (existing[0].slug !== result.slug) {
        revalidatePath(`/${username}/${existing[0].slug}`);
      }
    }

    return {
      success: true,
      data: {
        id: result.id,
        slug: result.slug,
        title: result.title,
      },
    };
  } catch (error) {
    console.error("Error updating project:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update project",
    };
  }
}

/**
 * Delete a project with ownership check
 */
export async function deleteProject(id: string): Promise<ActionResponse<void>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = session.user.id;
    const username = session.user.username;

    // Validate input
    const validation = deleteProjectSchema.safeParse({ id });
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0]?.message || "Invalid input",
      };
    }

    // Check ownership before deleting
    const existing = await db
      .select()
      .from(projectTable)
      .where(and(eq(projectTable.id, id), eq(projectTable.userId, userId)))
      .limit(1);

    if (!existing || existing.length === 0) {
      return { success: false, error: "Project not found or unauthorized" };
    }

    // Get all media associated with this project before deletion
    const mediaResult = await getAllMediaByProjectId(id);
    const mediaIds = mediaResult.success
      ? mediaResult.data.map((m) => m.id)
      : [];

    // Delete associated media files from both database and R2 storage
    if (mediaIds.length > 0) {
      const mediaDeleteResult = await deleteMediaBatchWithCleanup(mediaIds);
      if (!mediaDeleteResult.success) {
        console.warn(
          `Failed to delete some media for project ${id}:`,
          mediaDeleteResult.error
        );
        // Continue with project deletion even if media cleanup partially fails
      }
    }

    // Delete project
    await db.delete(projectTable).where(eq(projectTable.id, id));

    // Reorder remaining projects
    const remainingProjects = await db
      .select()
      .from(projectTable)
      .where(eq(projectTable.userId, userId))
      .orderBy(asc(projectTable.displayOrder));

    // Update display orders to be sequential
    for (let i = 0; i < remainingProjects.length; i++) {
      await db
        .update(projectTable)
        .set({ displayOrder: i })
        .where(eq(projectTable.id, remainingProjects[i].id));
    }

    // Use aggressive revalidation for project deletion
    if (username) {
      await revalidateUserProjects(username, userId);
    }

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error deleting project:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete project",
    };
  }
}

/**
 * Update the display order of multiple projects
 */
export async function updateProjectOrder(
  projectIds: string[]
): Promise<ActionResponse<void>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = session.user.id;

    // Validate input
    const validation = reorderProjectsSchema.safeParse({ projectIds });
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0]?.message || "Invalid input",
      };
    }

    // Verify all projects belong to the user
    const userProjects = await db
      .select({ id: projectTable.id })
      .from(projectTable)
      .where(eq(projectTable.userId, userId));

    const userProjectIds = new Set(userProjects.map((p) => p.id));
    const allProjectsBelongToUser = projectIds.every((id) =>
      userProjectIds.has(id)
    );

    if (!allProjectsBelongToUser) {
      return {
        success: false,
        error: "Unauthorized: Not all projects belong to user",
      };
    }

    // Update each project's display order
    for (let i = 0; i < projectIds.length; i++) {
      await db
        .update(projectTable)
        .set({
          displayOrder: i,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(projectTable.id, projectIds[i]),
            eq(projectTable.userId, userId)
          )
        );
    }

    // Revalidation is now handled by revalidateUserProjects

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error updating project order:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update project order",
    };
  }
}

/**
 * Move a project up in the display order
 */
export async function moveProjectUp(
  projectId: string
): Promise<ActionResponse<void>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = session.user.id;

    // Get current project with ownership check
    const currentProject = await db
      .select()
      .from(projectTable)
      .where(
        and(eq(projectTable.id, projectId), eq(projectTable.userId, userId))
      )
      .limit(1);

    if (!currentProject || currentProject.length === 0) {
      return { success: false, error: "Project not found or unauthorized" };
    }

    const current = currentProject[0];

    if (current.displayOrder === null || current.displayOrder === 0) {
      return { success: false, error: "Project is already at the top" };
    }

    // Find the project directly above
    const previousProject = await db
      .select()
      .from(projectTable)
      .where(
        and(
          eq(projectTable.userId, userId),
          eq(projectTable.displayOrder, current.displayOrder - 1)
        )
      )
      .limit(1);

    if (!previousProject || previousProject.length === 0) {
      return { success: false, error: "No project found above" };
    }

    // Swap display orders
    await db
      .update(projectTable)
      .set({ displayOrder: current.displayOrder - 1 })
      .where(eq(projectTable.id, current.id));

    await db
      .update(projectTable)
      .set({ displayOrder: current.displayOrder })
      .where(eq(projectTable.id, previousProject[0].id));

    // Revalidation is now handled by revalidateUserProjects

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error moving project up:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to move project",
    };
  }
}

/**
 * Legacy alias for updateProject - used by existing components
 */
export async function editProject(
  id: string,
  data: Partial<ProjectData>
): Promise<ActionResponse<ProjectResult>> {
  return updateProject(id, data);
}

/**
 * Move a project down in the display order
 */
export async function moveProjectDown(
  projectId: string
): Promise<ActionResponse<void>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = session.user.id;

    // Get current project with ownership check
    const currentProject = await db
      .select()
      .from(projectTable)
      .where(
        and(eq(projectTable.id, projectId), eq(projectTable.userId, userId))
      )
      .limit(1);

    if (!currentProject || currentProject.length === 0) {
      return { success: false, error: "Project not found or unauthorized" };
    }

    const current = currentProject[0];

    // Get total count of projects
    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(projectTable)
      .where(eq(projectTable.userId, userId));

    const maxOrder = totalCount[0].count - 1;

    if (current.displayOrder === null || current.displayOrder >= maxOrder) {
      return { success: false, error: "Project is already at the bottom" };
    }

    // Find the project directly below
    const nextProject = await db
      .select()
      .from(projectTable)
      .where(
        and(
          eq(projectTable.userId, userId),
          eq(projectTable.displayOrder, current.displayOrder + 1)
        )
      )
      .limit(1);

    if (!nextProject || nextProject.length === 0) {
      return { success: false, error: "No project found below" };
    }

    // Swap display orders
    await db
      .update(projectTable)
      .set({ displayOrder: current.displayOrder + 1 })
      .where(eq(projectTable.id, current.id));

    await db
      .update(projectTable)
      .set({ displayOrder: current.displayOrder })
      .where(eq(projectTable.id, nextProject[0].id));

    // Revalidation is now handled by revalidateUserProjects

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error moving project down:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to move project",
    };
  }
}
