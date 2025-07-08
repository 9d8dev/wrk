import { z } from "zod";

/**
 * Validation schemas for data layer
 */

// Pagination schemas
export const paginationSchema = z.object({
	page: z.number().int().min(1).optional().default(1),
	limit: z.number().int().min(1).max(100).optional().default(20),
});

// ID validation schemas
export const userIdSchema = z.string().min(1, "User ID is required");
export const projectIdSchema = z.string().min(1, "Project ID is required");
export const profileIdSchema = z.string().min(1, "Profile ID is required");
export const mediaIdSchema = z.string().min(1, "Media ID is required");
export const leadIdSchema = z.string().min(1, "Lead ID is required");

// Username validation
export const usernameSchema = z
	.string()
	.min(3, "Username must be at least 3 characters")
	.max(20, "Username must be at most 20 characters")
	.regex(
		/^[a-zA-Z0-9_-]+$/,
		"Username can only contain letters, numbers, underscores, and hyphens",
	);

// Project slug validation
export const projectSlugSchema = z
	.string()
	.min(1, "Project slug is required")
	.regex(
		/^[a-z0-9-]+$/,
		"Slug can only contain lowercase letters, numbers, and hyphens",
	);

// Media filter schemas
export const mediaFilterSchema = z.object({
	projectId: projectIdSchema.optional(),
	userId: userIdSchema.optional(),
	mimeType: z.string().optional(),
});

// Project filter schemas
export const projectFilterSchema = z.object({
	userId: userIdSchema.optional(),
	featured: z.boolean().optional(),
	hasMedia: z.boolean().optional(),
});
