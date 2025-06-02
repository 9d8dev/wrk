import { z } from "zod";

/**
 * Common validation schemas for server actions
 */

// Auth schemas
export const signUpSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Profile schemas
export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  bio: z.string().max(500, "Bio must be at most 500 characters").optional(),
  avatar: z.string().url("Invalid avatar URL").optional(),
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens")
    .optional(),
  socialLinks: z.array(z.object({
    id: z.string().optional(),
    platform: z.string().min(1, "Platform is required"),
    url: z.string().url("Invalid URL"),
    displayOrder: z.number().int().min(0),
  })).optional(),
});

// Project schemas
export const createProjectSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be at most 100 characters"),
  about: z.string().max(1000, "About must be at most 1000 characters").optional(),
  externalLink: z.string().url("Invalid project URL").optional().or(z.literal("")),
  imageIds: z.array(z.string()).optional(),
  featuredImageId: z.string().optional(),
  displayOrder: z.number().int().min(0).optional(),
});

export const updateProjectSchema = createProjectSchema.extend({
  id: z.string().min(1, "Project ID is required"),
});

export const deleteProjectSchema = z.object({
  id: z.string().min(1, "Project ID is required"),
});

export const reorderProjectsSchema = z.object({
  projectIds: z.array(z.string()).min(1, "At least one project ID is required"),
});

// Media schemas
export const uploadMediaSchema = z.object({
  files: z.array(z.object({
    name: z.string(),
    type: z.string(),
    size: z.number().max(20 * 1024 * 1024, "File size must be less than 20MB"),
  })),
});

export const deleteMediaSchema = z.object({
  id: z.string().min(1, "Media ID is required"),
});

// Theme schemas
export const updateThemeSchema = z.object({
  gridLayout: z.enum(["masonry", "standard", "minimal", "square"]).optional(),
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color").optional(),
  backgroundColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color").optional(),
  textColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color").optional(),
  font: z.string().optional(),
  showProjectTitles: z.boolean().optional(),
  projectsPerRow: z.number().int().min(1).max(6).optional(),
  spacing: z.enum(["tight", "normal", "loose"]).optional(),
});

// Lead schemas
export const createLeadSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  message: z.string().min(1, "Message is required").max(1000),
  username: z.string().min(1, "Username is required"),
});

export const deleteLeadSchema = z.object({
  id: z.string().min(1, "Lead ID is required"),
});

// Subscription schemas
export const createCheckoutSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  successUrl: z.string().url("Invalid success URL"),
  customerId: z.string().optional(),
});