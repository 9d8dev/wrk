"use server";

import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/db/drizzle";
import type { Media, Project, User } from "@/db/schema";
import { media, project, user } from "@/db/schema";
import {
	paginationSchema,
	projectSlugSchema,
	userIdSchema,
	usernameSchema,
} from "./schemas";
import {
	calculatePagination,
	type DataResponse,
	dedupe,
	getPaginationOffset,
	type PaginatedResponse,
	withErrorHandling,
} from "./utils";

/**
 * Project with related data
 */
export interface ProjectWithRelations {
	project: Project;
	featuredImage: Media | null;
	images: Media[];
	user: User;
}

/**
 * Internal function for getting projects by username with pagination
 */
const _getProjectsByUsername = async (
	username: string,
	params?: {
		page?: number;
		limit?: number;
	},
): Promise<DataResponse<PaginatedResponse<Project>>> => {
	return withErrorHandling(async () => {
		// Validate inputs
		const usernameValidation = usernameSchema.safeParse(username);
		if (!usernameValidation.success) {
			throw new Error(
				usernameValidation.error.errors[0]?.message || "Invalid username",
			);
		}

		const paginationValidation = paginationSchema.safeParse({
			page: params?.page,
			limit: params?.limit,
		});
		if (!paginationValidation.success) {
			throw new Error(
				paginationValidation.error.errors[0]?.message ||
					"Invalid pagination parameters",
			);
		}

		const { page, limit } = paginationValidation.data;
		const offset = getPaginationOffset(page, limit);

		// Get user
		const userData = await db
			.select({ id: user.id })
			.from(user)
			.where(eq(user.username, username))
			.limit(1);

		if (!userData[0]) {
			return {
				items: [],
				total: 0,
				page,
				limit,
				totalPages: 0,
			};
		}

		const userId = userData[0].id;

		// Get total count
		const countQuery = await db
			.select({ count: sql<number>`count(*)` })
			.from(project)
			.where(eq(project.userId, userId));

		const total = countQuery[0].count;

		// Get paginated projects
		const projects = await db
			.select()
			.from(project)
			.where(eq(project.userId, userId))
			.orderBy(asc(project.displayOrder))
			.limit(limit)
			.offset(offset);

		return {
			items: projects,
			...calculatePagination(total, page, limit),
		};
	}, "Failed to fetch projects by username");
};

// Create a cached version for better performance
const getCachedProjects = unstable_cache(
	async (username: string, params?: { page?: number; limit?: number }) => {
		return await _getProjectsByUsername(username, params);
	},
	["projects-by-username"],
	{
		tags: ["projects"],
		revalidate: 300, // 5 minutes
	},
);

/**
 * Get projects by username with pagination (cached)
 */
export const getProjectsByUsername = getCachedProjects;

/**
 * Get a single project by username and slug
 */
export const getProjectByUsernameAndSlug = dedupe(
	async (
		username: string,
		projectSlug: string,
	): Promise<DataResponse<ProjectWithRelations | null>> => {
		return withErrorHandling(async () => {
			// Validate inputs
			const usernameValidation = usernameSchema.safeParse(username);
			if (!usernameValidation.success) {
				throw new Error(
					usernameValidation.error.errors[0]?.message || "Invalid username",
				);
			}

			const slugValidation = projectSlugSchema.safeParse(projectSlug);
			if (!slugValidation.success) {
				throw new Error(
					slugValidation.error.errors[0]?.message || "Invalid project slug",
				);
			}

			// Get project with user and featured image in a single query
			const result = await db
				.select({
					project: project,
					user: user,
					featuredImage: media,
				})
				.from(project)
				.innerJoin(user, eq(user.id, project.userId))
				.leftJoin(media, eq(media.id, project.featuredImageId))
				.where(and(eq(user.username, username), eq(project.slug, projectSlug)))
				.limit(1);

			if (!result[0]) {
				return null;
			}

			const { project: projectData, user: userData, featuredImage } = result[0];

			// Get all project images if there are any
			let images: Media[] = [];
			if (projectData.imageIds && projectData.imageIds.length > 0) {
				images = await db
					.select()
					.from(media)
					.where(inArray(media.id, projectData.imageIds));
			}

			return {
				project: projectData,
				featuredImage,
				images,
				user: userData,
			};
		}, "Failed to fetch project");
	},
);

/**
 * Get all projects for a user with pagination
 */
export async function getAllProjects(
	userId: string,
	params?: {
		page?: number;
		limit?: number;
	},
): Promise<DataResponse<PaginatedResponse<Project>>> {
	return withErrorHandling(async () => {
		// Validate inputs
		const userValidation = userIdSchema.safeParse(userId);
		if (!userValidation.success) {
			throw new Error(
				userValidation.error.errors[0]?.message || "Invalid user ID",
			);
		}

		const paginationValidation = paginationSchema.safeParse({
			page: params?.page,
			limit: params?.limit,
		});
		if (!paginationValidation.success) {
			throw new Error(
				paginationValidation.error.errors[0]?.message ||
					"Invalid pagination parameters",
			);
		}

		const { page, limit } = paginationValidation.data;
		const offset = getPaginationOffset(page, limit);

		// Get total count
		const countQuery = await db
			.select({ count: sql<number>`count(*)` })
			.from(project)
			.where(eq(project.userId, userId));

		const total = countQuery[0].count;

		// Get paginated projects
		const projects = await db
			.select()
			.from(project)
			.where(eq(project.userId, userId))
			.orderBy(asc(project.displayOrder))
			.limit(limit)
			.offset(offset);

		return {
			items: projects,
			...calculatePagination(total, page, limit),
		};
	}, "Failed to fetch user projects");
}

/**
 * Get projects with their featured images
 */
export async function getProjectsWithImages(
	userId: string,
	params?: {
		page?: number;
		limit?: number;
	},
): Promise<
	DataResponse<
		PaginatedResponse<{
			project: Project;
			featuredImage: Media | null;
		}>
	>
> {
	return withErrorHandling(async () => {
		// Validate inputs
		const userValidation = userIdSchema.safeParse(userId);
		if (!userValidation.success) {
			throw new Error(
				userValidation.error.errors[0]?.message || "Invalid user ID",
			);
		}

		const paginationValidation = paginationSchema.safeParse({
			page: params?.page,
			limit: params?.limit,
		});
		if (!paginationValidation.success) {
			throw new Error(
				paginationValidation.error.errors[0]?.message ||
					"Invalid pagination parameters",
			);
		}

		const { page, limit } = paginationValidation.data;
		const offset = getPaginationOffset(page, limit);

		// Get total count
		const countQuery = await db
			.select({ count: sql<number>`count(*)` })
			.from(project)
			.where(eq(project.userId, userId));

		const total = countQuery[0].count;

		// Get projects with featured images
		const results = await db
			.select({
				project: project,
				featuredImage: media,
			})
			.from(project)
			.leftJoin(media, eq(media.id, project.featuredImageId))
			.where(eq(project.userId, userId))
			.orderBy(asc(project.displayOrder))
			.limit(limit)
			.offset(offset);

		return {
			items: results,
			...calculatePagination(total, page, limit),
		};
	}, "Failed to fetch projects with images");
}

/**
 * Get featured projects
 */
export async function getFeaturedProjects(
	limit = 6,
): Promise<DataResponse<ProjectWithRelations[]>> {
	return withErrorHandling(async () => {
		// Get random featured projects with user and media
		const results = await db
			.select({
				project: project,
				user: user,
				featuredImage: media,
			})
			.from(project)
			.innerJoin(user, eq(user.id, project.userId))
			.leftJoin(media, eq(media.id, project.featuredImageId))
			.where(sql`${project.featuredImageId} IS NOT NULL`)
			.orderBy(sql`RANDOM()`)
			.limit(limit);

		// Get images for each project
		const projectsWithImages = await Promise.all(
			results.map(async (result) => {
				let images: Media[] = [];
				if (result.project.imageIds && result.project.imageIds.length > 0) {
					images = await db
						.select()
						.from(media)
						.where(inArray(media.id, result.project.imageIds));
				}

				return {
					project: result.project,
					featuredImage: result.featuredImage,
					images,
					user: result.user,
				};
			}),
		);

		return projectsWithImages;
	}, "Failed to fetch featured projects");
}

/**
 * Get project count for a user
 */
export const getProjectCount = dedupe(
	async (userId: string): Promise<DataResponse<number>> => {
		return withErrorHandling(async () => {
			// Validate input
			const validation = userIdSchema.safeParse(userId);
			if (!validation.success) {
				throw new Error(
					validation.error.errors[0]?.message || "Invalid user ID",
				);
			}

			const countQuery = await db
				.select({ count: sql<number>`count(*)` })
				.from(project)
				.where(eq(project.userId, userId));

			return countQuery[0].count;
		}, "Failed to fetch project count");
	},
);
