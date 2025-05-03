"use server";

import { db } from "@/db/drizzle";
import { media, project } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Creates a new media entry in the database
 */
export async function createMedia({
  url,
  width,
  height,
  alt,
  size,
  mimeType,
  projectId,
}: {
  url: string;
  width: number;
  height: number;
  alt?: string;
  size?: number;
  mimeType?: string;
  projectId?: string;
}) {
  try {
    const id = crypto.randomUUID();
    const now = new Date();

    const [newMedia] = await db
      .insert(media)
      .values({
        id,
        url,
        width,
        height,
        alt: alt || null,
        size: size || null,
        mimeType: mimeType || null,
        projectId: projectId || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return { success: true, media: newMedia };
  } catch (error) {
    console.error("Error creating media:", error);
    return { success: false, error: "Failed to create media" };
  }
}

/**
 * Updates an existing media entry
 */
export async function updateMedia(
  id: string,
  data: {
    url?: string;
    width?: number;
    height?: number;
    alt?: string;
    size?: number;
    mimeType?: string;
    projectId?: string | null;
  }
) {
  try {
    const [updatedMedia] = await db
      .update(media)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(media.id, id))
      .returning();

    if (!updatedMedia) {
      return { success: false, error: "Media not found" };
    }

    return { success: true, media: updatedMedia };
  } catch (error) {
    console.error("Error updating media:", error);
    return { success: false, error: "Failed to update media" };
  }
}

/**
 * Deletes a media entry
 */
export async function deleteMedia(id: string) {
  try {
    const [deletedMedia] = await db
      .delete(media)
      .where(eq(media.id, id))
      .returning();

    if (!deletedMedia) {
      return { success: false, error: "Media not found" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting media:", error);
    return { success: false, error: "Failed to delete media" };
  }
}

/**
 * Gets a media entry by ID
 */
export async function getMediaById(id: string) {
  try {
    const mediaItems = await db
      .select()
      .from(media)
      .where(eq(media.id, id))
      .limit(1);

    if (!mediaItems || mediaItems.length === 0) {
      return { success: false, error: "Media not found" };
    }

    return { success: true, media: mediaItems[0] };
  } catch (error) {
    console.error("Error getting media:", error);
    return { success: false, error: "Failed to get media" };
  }
}

/**
 * Gets all media for a project
 */
export async function getAllMediaByProjectId(projectId: string) {
  try {
    const mediaItems = await db
      .select()
      .from(media)
      .where(eq(media.projectId, projectId));

    return { success: true, media: mediaItems };
  } catch (error) {
    console.error("Error getting project media:", error);
    return { success: false, error: "Failed to get project media" };
  }
}

/**
 * Associates media with a project
 */
export async function associateMediaWithProject(
  mediaId: string,
  projectId: string
) {
  try {
    const [updatedMedia] = await db
      .update(media)
      .set({
        projectId,
        updatedAt: new Date(),
      })
      .where(eq(media.id, mediaId))
      .returning();

    if (!updatedMedia) {
      return { success: false, error: "Media not found" };
    }

    revalidatePath(`/admin/projects/${projectId}`);
    return { success: true, media: updatedMedia };
  } catch (error) {
    console.error("Error associating media with project:", error);
    return { success: false, error: "Failed to associate media with project" };
  }
}

/**
 * Legacy functions for backward compatibility
 */

/**
 * Gets a media item by ID (legacy version)
 */
export const getMedia = async (id: string) => {
  const data = await db.select().from(media).where(eq(media.id, id)).limit(1);
  return data.length > 0 ? data[0] : null;
};

/**
 * Gets all media for a project (legacy version)
 */
export const getMediaByProjectId = async (projectId: string) => {
  const data = await db
    .select()
    .from(media)
    .where(eq(media.projectId, projectId));

  return data;
};

/**
 * Gets the featured image for a project using the featuredImageId field
 */
export const getFeaturedImageByProjectId = async (projectId: string) => {
  // First, get the project to find the featuredImageId
  const projectData = await db
    .select()
    .from(project)
    .where(eq(project.id, projectId))
    .limit(1);

  if (!projectData.length || !projectData[0].featuredImageId) {
    // If no project found or no featuredImageId, try to get the first media item as fallback
    const mediaData = await db
      .select()
      .from(media)
      .where(eq(media.projectId, projectId))
      .limit(1);
    
    return mediaData.length > 0 ? mediaData[0] : null;
  }

  // Get the featured image using the featuredImageId
  const featuredImageData = await db
    .select()
    .from(media)
    .where(eq(media.id, projectData[0].featuredImageId))
    .limit(1);

  return featuredImageData.length > 0 ? featuredImageData[0] : null;
};
