import { auth } from "@/lib/auth";

/**
 * Standard response types for all server actions
 */
export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Auth context type for authenticated actions
 */
export type AuthContext = {
  userId: string;
  email: string;
  username?: string;
};

/**
 * Wraps server actions with standard error handling and authentication
 */
export async function authenticatedAction<TInput, TOutput>(
  handler: (
    input: TInput,
    context: AuthContext
  ) => Promise<ActionResponse<TOutput>>
): Promise<(input: TInput) => Promise<ActionResponse<TOutput>>> {
  return async (input: TInput): Promise<ActionResponse<TOutput>> => {
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
      }

      const context: AuthContext = {
        userId: session.user.id,
        email: session.user.email,
        username: session.user.username || undefined,
      };

      return await handler(input, context);
    } catch (error) {
      console.error("Server action error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      };
    }
  };
}

/**
 * Wraps server actions with standard error handling (no auth required)
 */
export async function publicAction<TInput, TOutput>(
  handler: (input: TInput) => Promise<ActionResponse<TOutput>>
): Promise<(input: TInput) => Promise<ActionResponse<TOutput>>> {
  return async (input: TInput): Promise<ActionResponse<TOutput>> => {
    try {
      return await handler(input);
    } catch (error) {
      console.error("Server action error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      };
    }
  };
}

/**
 * Common path revalidation paths
 */
export const REVALIDATION_PATHS = {
  profile: (username: string) => [`/${username}`, `/admin/profile`],
  project: (username: string, slug?: string) => {
    const paths = [`/${username}`, `/admin`, `/admin/projects`];
    if (slug) {
      paths.push(`/${username}/${slug}`);
    }
    return paths;
  },
  theme: (username: string) => [`/${username}`, `/admin/theme`],
  leads: () => [`/admin/leads`],
} as const;

import { headers } from "next/headers";
