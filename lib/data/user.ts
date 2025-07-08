"use server";

import type { User } from "@/db/schema";

import { desc, eq, ilike, sql } from "drizzle-orm";

import { user } from "@/db/schema";
import { db } from "@/db/drizzle";

import {
  calculatePagination,
  type DataResponse,
  dedupe,
  getPaginationOffset,
  type PaginatedResponse,
  withErrorHandling,
} from "./utils";
import { paginationSchema, userIdSchema, usernameSchema } from "./schemas";

/**
 * Get all users with pagination
 */
export async function getAllUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<DataResponse<PaginatedResponse<User>>> {
  return withErrorHandling(async () => {
    const validation = paginationSchema.safeParse({
      page: params?.page,
      limit: params?.limit,
    });

    if (!validation.success) {
      throw new Error(
        validation.error.errors[0]?.message || "Invalid pagination parameters"
      );
    }

    const { page, limit } = validation.data;
    const offset = getPaginationOffset(page, limit);

    // Build query conditions
    const conditions = [];
    if (params?.search) {
      conditions.push(ilike(user.username, `%${params.search}%`));
    }

    // Get total count
    const countQuery = await db
      .select({ count: sql<number>`count(*)` })
      .from(user)
      .where(conditions.length > 0 ? conditions[0] : undefined);

    const total = countQuery[0].count;

    // Get paginated users
    const users = await db
      .select()
      .from(user)
      .where(conditions.length > 0 ? conditions[0] : undefined)
      .orderBy(desc(user.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      items: users,
      ...calculatePagination(total, page, limit),
    };
  }, "Failed to fetch users");
}

/**
 * Get a user by ID with caching
 */
export const getUserById = dedupe(
  async (userId: string): Promise<DataResponse<User | null>> => {
    return withErrorHandling(async () => {
      // Validate input
      const validation = userIdSchema.safeParse(userId);
      if (!validation.success) {
        throw new Error(
          validation.error.errors[0]?.message || "Invalid user ID"
        );
      }

      const data = await db
        .select()
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      return data[0] || null;
    }, "Failed to fetch user");
  }
);

/**
 * Get a user by username with caching
 */
export const getUserByUsername = dedupe(
  async (username: string): Promise<DataResponse<User | null>> => {
    return withErrorHandling(async () => {
      // Validate input
      const validation = usernameSchema.safeParse(username);
      if (!validation.success) {
        throw new Error(
          validation.error.errors[0]?.message || "Invalid username"
        );
      }

      const data = await db
        .select()
        .from(user)
        .where(eq(user.username, username))
        .limit(1);

      return data[0] || null;
    }, "Failed to fetch user by username");
  }
);

/**
 * Get a user by custom domain with caching (Pro users only)
 */
export const getUserByCustomDomain = dedupe(
  async (domain: string): Promise<DataResponse<User | null>> => {
    return withErrorHandling(async () => {
      // Basic domain validation
      if (!domain || typeof domain !== "string" || domain.length < 3) {
        throw new Error("Invalid domain");
      }

      const data = await db
        .select()
        .from(user)
        .where(eq(user.customDomain, domain))
        .limit(1);

      const foundUser = data[0] || null;

      // Check if user has active Pro subscription
      if (foundUser && foundUser.subscriptionStatus !== "active") {
        throw new Error("Domain access requires active Pro subscription");
      }

      return foundUser;
    }, "Failed to fetch user by custom domain");
  }
);

/**
 * Check if a username is available
 */
export async function isUsernameAvailable(
  username: string
): Promise<DataResponse<boolean>> {
  return withErrorHandling(async () => {
    // Validate input
    const validation = usernameSchema.safeParse(username);
    if (!validation.success) {
      throw new Error(
        validation.error.errors[0]?.message || "Invalid username"
      );
    }

    // Check reserved usernames
    const reservedUsernames = [
      "admin",
      "posts",
      "privacy-policy",
      "terms-of-use",
      "about",
      "contact",
      "dashboard",
      "login",
      "sign-in",
      "sign-up",
      "sign-out",
    ];

    if (reservedUsernames.includes(username.toLowerCase())) {
      return false;
    }

    // Check database
    const existing = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.username, username))
      .limit(1);

    return existing.length === 0;
  }, "Failed to check username availability");
}

/**
 * Get user statistics
 */
export async function getUserStats(userId: string): Promise<
  DataResponse<{
    projectCount: number;
    leadCount: number;
    totalViews: number;
  }>
> {
  return withErrorHandling(async () => {
    // Validate input
    const validation = userIdSchema.safeParse(userId);
    if (!validation.success) {
      throw new Error(validation.error.errors[0]?.message || "Invalid user ID");
    }

    // Import here to avoid circular dependencies
    const { project, lead } = await import("@/db/schema");

    // Get counts in parallel
    const [projectCount, leadCount] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(project)
        .where(eq(project.userId, userId)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(lead)
        .where(eq(lead.userId, userId)),
    ]);

    return {
      projectCount: projectCount[0].count,
      leadCount: leadCount[0].count,
      totalViews: 0, // TODO: Implement view tracking
    };
  }, "Failed to fetch user statistics");
}
