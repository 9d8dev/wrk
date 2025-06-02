import { cache } from "react";
import { unstable_cache } from "next/cache";

/**
 * Standard response types for data fetching
 */
export type DataResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string; data?: never };

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Cache tags for revalidation
 */
export const CACHE_TAGS = {
  user: (id: string) => `user:${id}`,
  profile: (id: string) => `profile:${id}`,
  project: (id: string) => `project:${id}`,
  projects: (userId: string) => `projects:${userId}`,
  media: (id: string) => `media:${id}`,
  leads: (userId: string) => `leads:${userId}`,
} as const;

/**
 * Default pagination values
 */
export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 20,
} as const;

/**
 * Wraps data fetching functions with error handling
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  errorMessage = "An error occurred while fetching data"
): Promise<DataResponse<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    console.error("Data fetching error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : errorMessage,
    };
  }
}

/**
 * Creates a cached version of a data fetching function
 * Use this for data that doesn't change often
 */
export function createCachedFetcher<TArgs extends readonly unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options?: {
    tags?: string[];
    revalidate?: number | false;
  }
) {
  return unstable_cache(fn, undefined, {
    revalidate: options?.revalidate ?? 3600, // Default 1 hour
    tags: options?.tags,
  });
}

/**
 * React cache wrapper for deduplicating requests in a single render
 */
export const dedupe = cache;

/**
 * Calculate pagination metadata
 */
export function calculatePagination(
  total: number,
  page: number,
  limit: number
): Omit<PaginatedResponse<unknown>, "items"> {
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.min(Math.max(1, page), totalPages || 1);

  return {
    total,
    page: currentPage,
    limit,
    totalPages,
  };
}

/**
 * Get pagination offset
 */
export function getPaginationOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}