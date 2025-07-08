"use server";

import { eq, inArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { db } from "@/db/drizzle";
import type { Media, Project } from "@/db/schema";
import { media, project } from "@/db/schema";
import { mediaIdSchema, projectIdSchema } from "./schemas";
import { type DataResponse, dedupe, withErrorHandling } from "./utils";

/**
 * Media with related project
 */
export interface MediaWithProject {
	media: Media;
	project: Project | null;
}

/**
 * Create media input
 */
export interface CreateMediaInput {
	url: string;
	width: number;
	height: number;
	alt?: string;
	size?: number;
	mimeType?: string;
	projectId?: string;
}

/**
 * Creates a new media entry in the database
 */
export async function createMedia(
	input: CreateMediaInput,
): Promise<DataResponse<Media>> {
	return withErrorHandling(async () => {
		const id = nanoid();
		const now = new Date();

		const [newMedia] = await db
			.insert(media)
			.values({
				id,
				url: input.url,
				width: input.width,
				height: input.height,
				alt: input.alt || null,
				size: input.size || null,
				mimeType: input.mimeType || null,
				projectId: input.projectId || null,
				createdAt: now,
				updatedAt: now,
			})
			.returning();

		return newMedia;
	}, "Failed to create media");
}

/**
 * Creates multiple media entries in a batch
 */
export async function createMediaBatch(
	inputs: CreateMediaInput[],
): Promise<DataResponse<Media[]>> {
	return withErrorHandling(async () => {
		if (inputs.length === 0) {
			return [];
		}

		const now = new Date();
		const mediaValues = inputs.map((input) => ({
			id: nanoid(),
			url: input.url,
			width: input.width,
			height: input.height,
			alt: input.alt || null,
			size: input.size || null,
			mimeType: input.mimeType || null,
			projectId: input.projectId || null,
			createdAt: now,
			updatedAt: now,
		}));

		const newMediaItems = await db
			.insert(media)
			.values(mediaValues)
			.returning();

		return newMediaItems;
	}, "Failed to create media batch");
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
	},
): Promise<DataResponse<Media>> {
	return withErrorHandling(async () => {
		// Validate input
		const validation = mediaIdSchema.safeParse(id);
		if (!validation.success) {
			throw new Error(
				validation.error.errors[0]?.message || "Invalid media ID",
			);
		}

		const [updatedMedia] = await db
			.update(media)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.where(eq(media.id, id))
			.returning();

		if (!updatedMedia) {
			throw new Error("Media not found");
		}

		return updatedMedia;
	}, "Failed to update media");
}

/**
 * Deletes a media entry
 */
export async function deleteMedia(id: string): Promise<DataResponse<void>> {
	return withErrorHandling(async () => {
		// Validate input
		const validation = mediaIdSchema.safeParse(id);
		if (!validation.success) {
			throw new Error(
				validation.error.errors[0]?.message || "Invalid media ID",
			);
		}

		const [deletedMedia] = await db
			.delete(media)
			.where(eq(media.id, id))
			.returning();

		if (!deletedMedia) {
			throw new Error("Media not found");
		}

		return undefined;
	}, "Failed to delete media");
}

/**
 * Deletes multiple media entries in a batch
 */
export async function deleteMediaBatch(
	ids: string[],
): Promise<DataResponse<number>> {
	return withErrorHandling(async () => {
		if (ids.length === 0) {
			return 0;
		}

		// Validate all IDs
		for (const id of ids) {
			const validation = mediaIdSchema.safeParse(id);
			if (!validation.success) {
				throw new Error(`Invalid media ID: ${id}`);
			}
		}

		await db.delete(media).where(inArray(media.id, ids));

		// Return count of deleted items
		return ids.length;
	}, "Failed to delete media batch");
}

/**
 * Gets a media entry by ID with caching
 */
export const getMediaById = dedupe(
	async (id: string): Promise<DataResponse<Media | null>> => {
		return withErrorHandling(async () => {
			// Validate input
			const validation = mediaIdSchema.safeParse(id);
			if (!validation.success) {
				throw new Error(
					validation.error.errors[0]?.message || "Invalid media ID",
				);
			}

			const [mediaItem] = await db
				.select()
				.from(media)
				.where(eq(media.id, id))
				.limit(1);

			return mediaItem || null;
		}, "Failed to get media");
	},
);

/**
 * Gets multiple media entries by IDs in a single query
 */
export async function getMediaByIds(
	ids: string[],
): Promise<DataResponse<Media[]>> {
	return withErrorHandling(async () => {
		if (ids.length === 0) {
			return [];
		}

		// Validate all IDs
		for (const id of ids) {
			const validation = mediaIdSchema.safeParse(id);
			if (!validation.success) {
				throw new Error(`Invalid media ID: ${id}`);
			}
		}

		const mediaItems = await db
			.select()
			.from(media)
			.where(inArray(media.id, ids));

		// Return in the same order as requested
		const mediaMap = new Map(mediaItems.map((item) => [item.id, item]));
		return ids
			.map((id) => mediaMap.get(id))
			.filter((item): item is Media => item !== undefined);
	}, "Failed to get media by IDs");
}

/**
 * Gets all media for a project
 */
export async function getAllMediaByProjectId(
	projectId: string,
): Promise<DataResponse<Media[]>> {
	return withErrorHandling(async () => {
		// Validate input
		const validation = projectIdSchema.safeParse(projectId);
		if (!validation.success) {
			throw new Error(
				validation.error.errors[0]?.message || "Invalid project ID",
			);
		}

		const mediaItems = await db
			.select()
			.from(media)
			.where(eq(media.projectId, projectId));

		return mediaItems;
	}, "Failed to get project media");
}

/**
 * Associates media with a project
 */
export async function associateMediaWithProject(
	mediaId: string,
	projectId: string,
): Promise<DataResponse<Media>> {
	return withErrorHandling(async () => {
		// Validate inputs
		const mediaValidation = mediaIdSchema.safeParse(mediaId);
		if (!mediaValidation.success) {
			throw new Error(
				mediaValidation.error.errors[0]?.message || "Invalid media ID",
			);
		}

		const projectValidation = projectIdSchema.safeParse(projectId);
		if (!projectValidation.success) {
			throw new Error(
				projectValidation.error.errors[0]?.message || "Invalid project ID",
			);
		}

		const [updatedMedia] = await db
			.update(media)
			.set({
				projectId,
				updatedAt: new Date(),
			})
			.where(eq(media.id, mediaId))
			.returning();

		if (!updatedMedia) {
			throw new Error("Media not found");
		}

		revalidatePath(`/admin/projects/${projectId}`);
		return updatedMedia;
	}, "Failed to associate media with project");
}

/**
 * Gets the featured image for a project
 */
export const getFeaturedImageByProjectId = dedupe(
	async (projectId: string): Promise<DataResponse<Media | null>> => {
		return withErrorHandling(async () => {
			// Validate input
			const validation = projectIdSchema.safeParse(projectId);
			if (!validation.success) {
				throw new Error(
					validation.error.errors[0]?.message || "Invalid project ID",
				);
			}

			// Get project with featured image in a single query
			const result = await db
				.select({
					media: media,
				})
				.from(project)
				.leftJoin(media, eq(media.id, project.featuredImageId))
				.where(eq(project.id, projectId))
				.limit(1);

			return result[0]?.media || null;
		}, "Failed to fetch featured image");
	},
);

/**
 * Gets all images for a project using the imageIds array
 */
export async function getAllProjectImages(
	projectId: string,
): Promise<DataResponse<Media[]>> {
	return withErrorHandling(async () => {
		// Validate input
		const validation = projectIdSchema.safeParse(projectId);
		if (!validation.success) {
			throw new Error(
				validation.error.errors[0]?.message || "Invalid project ID",
			);
		}

		// Get the project to find the imageIds
		const [projectData] = await db
			.select({
				imageIds: project.imageIds,
				projectId: project.id,
			})
			.from(project)
			.where(eq(project.id, projectId))
			.limit(1);

		if (
			!projectData ||
			!projectData.imageIds ||
			projectData.imageIds.length === 0
		) {
			// If no imageIds, get all media associated with the project
			const allMedia = await db
				.select()
				.from(media)
				.where(eq(media.projectId, projectId));
			return allMedia;
		}

		// Get all media items using the imageIds array in a single query
		const mediaResult = await getMediaByIds(projectData.imageIds);

		if (!mediaResult.success) {
			throw new Error(mediaResult.error);
		}

		return mediaResult.data;
	}, "Failed to fetch project images");
}

/**
 * Get media statistics for a user
 */
export async function getUserMediaStats(userId: string): Promise<
	DataResponse<{
		totalMedia: number;
		totalSize: number;
		mediaByType: Record<string, number>;
	}>
> {
	return withErrorHandling(async () => {
		// Get all media for user's projects
		const userProjects = await db
			.select({ id: project.id })
			.from(project)
			.where(eq(project.userId, userId));

		if (userProjects.length === 0) {
			return {
				totalMedia: 0,
				totalSize: 0,
				mediaByType: {},
			};
		}

		const projectIds = userProjects.map((p) => p.id);

		// Get media statistics
		const mediaStats = await db
			.select({
				count: sql<number>`count(*)`,
				totalSize: sql<number>`sum(${media.size})`,
				mimeType: media.mimeType,
			})
			.from(media)
			.where(inArray(media.projectId, projectIds))
			.groupBy(media.mimeType);

		const totalMedia = mediaStats.reduce((sum, stat) => sum + stat.count, 0);
		const totalSize = mediaStats.reduce(
			(sum, stat) => sum + (stat.totalSize || 0),
			0,
		);
		const mediaByType = mediaStats.reduce(
			(acc, stat) => {
				if (stat.mimeType) {
					acc[stat.mimeType] = stat.count;
				}
				return acc;
			},
			{} as Record<string, number>,
		);

		return {
			totalMedia,
			totalSize,
			mediaByType,
		};
	}, "Failed to fetch media statistics");
}

/**
 * Legacy functions for backward compatibility
 */

/**
 * Gets a media item by ID (legacy version)
 */
export const getMedia = async (id: string): Promise<Media | null> => {
	const result = await getMediaById(id);
	return result.success ? result.data : null;
};

/**
 * Gets all media for a project (legacy version)
 */
export const getMediaByProjectId = async (
	projectId: string,
): Promise<Media[]> => {
	const result = await getAllMediaByProjectId(projectId);
	return result.success ? result.data : [];
};
