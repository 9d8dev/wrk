import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Revalidates cache entries and critical paths related to a user's profile.
 *
 * Performs tag-based and selective path-based revalidation for the specified user, ensuring that profile, user, and global profile caches are updated. If a user ID is provided, additional user- and project-specific tags are revalidated. Also refreshes the user's profile page and relevant admin pages.
 *
 * @param username - The username whose profile cache should be revalidated
 * @param userId - Optional user ID for additional cache revalidation
 */
export async function revalidateUserProfile(username: string, userId?: string) {
  try {
    // Tag-based revalidation (efficient)
    revalidateTag(`profile:${username}`);
    revalidateTag(`user:${username}`);
    revalidateTag("profiles"); // Global profiles cache

    if (userId) {
      revalidateTag(`user:${userId}`);
      revalidateTag(`projects:${userId}`);
    }

      // Only revalidate specific paths that are critical
  revalidatePath(`/${username}`);
  revalidatePath("/admin/profile");
  revalidatePath("/admin"); // Also revalidate admin layout
  } catch (error) {
    console.error(`Failed to revalidate profile for ${username}:`, error);
  }
}

/**
 * Legacy function for backwards compatibility
 * @deprecated Use revalidateUserProfile instead
 */
export async function forceRevalidateProfile(
  username: string,
  userId?: string
) {
  return revalidateUserProfile(username, userId);
}

/**
 * Revalidates cache tags and paths affected by a username change.
 *
 * Ensures that both old and new username references, user-specific data, global user caches, and critical admin pages are updated to reflect the change.
 *
 * @param oldUsername - The user's previous username
 * @param newUsername - The user's new username
 * @param userId - The unique identifier for the user
 */
export async function revalidateUsernameChange(
  oldUsername: string,
  newUsername: string,
  userId: string
) {
  try {
    // Revalidate old username cache
    if (oldUsername) {
      revalidateTag(`profile:${oldUsername}`);
      revalidateTag(`user:${oldUsername}`);
      revalidatePath(`/${oldUsername}`);
    }

    // Revalidate new username cache
    revalidateTag(`profile:${newUsername}`);
    revalidateTag(`user:${newUsername}`);
    revalidatePath(`/${newUsername}`);

    // User-specific tags
    revalidateTag(`user:${userId}`);
    revalidateTag(`projects:${userId}`);

    // Global caches that might contain user data
    revalidateTag("profiles");
    revalidateTag("users");

    // Critical admin paths
    revalidatePath("/admin/profile");
    revalidatePath("/admin"); // Revalidate admin layout for sidebar updates
  } catch (error) {
    console.error(`Failed to revalidate username change:`, error);
  }
}

/**
 * Legacy function for backwards compatibility
 * @deprecated Use revalidateUsernameChange instead
 */
export async function forceRevalidateUsernameChange(
  oldUsername: string,
  newUsername: string,
  userId: string
) {
  return revalidateUsernameChange(oldUsername, newUsername, userId);
}

/**
 * Revalidate project-related caches
 */
export async function revalidateUserProjects(username: string, userId: string) {
  try {
    revalidateTag(`projects:${userId}`);
    revalidateTag(`user:${username}`);
    revalidateTag("projects");

    // Revalidate profile page (projects are displayed there)
    revalidatePath(`/${username}`);
    revalidatePath("/admin/projects");
  } catch (error) {
    console.error(`Failed to revalidate projects for ${username}:`, error);
  }
}

/**
 * Revalidate theme changes
 */
export async function revalidateUserTheme(username: string, userId: string) {
  try {
    revalidateTag(`theme:${userId}`);
    revalidateTag(`user:${username}`);

    // Theme changes affect the profile display
    revalidatePath(`/${username}`);
    revalidatePath("/admin/theme");
  } catch (error) {
    console.error(`Failed to revalidate theme for ${username}:`, error);
  }
}

/**
 * Granular revalidation strategies for different content types
 */
export const RevalidationStrategies = {
  // Immediate revalidation for critical user data
  IMMEDIATE: {
    profile: (username: string, userId?: string) =>
      revalidateUserProfile(username, userId),
    username: (old: string, new_: string, userId: string) =>
      revalidateUsernameChange(old, new_, userId),
  },

  // Moderate revalidation for content changes
  CONTENT: {
    projects: (username: string, userId: string) =>
      revalidateUserProjects(username, userId),
    theme: (username: string, userId: string) =>
      revalidateUserTheme(username, userId),
  },

  // Batch revalidation for multiple operations
  BATCH: {
    userComplete: async (username: string, userId: string) => {
      // Revalidate everything for a user
      await Promise.all([
        revalidateUserProfile(username, userId),
        revalidateUserProjects(username, userId),
        revalidateUserTheme(username, userId),
      ]);
    },
  },
};

/**
 * Debug function to test revalidation
 */
export async function debugRevalidation(
  username: string,
  type: "profile" | "projects" | "theme" = "profile"
) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.log(`🔄 Debug revalidation: ${type} for ${username}`);

  try {
    switch (type) {
      case "profile":
        await revalidateUserProfile(username);
        break;
      case "projects":
        await revalidateUserProjects(username, "debug");
        break;
      case "theme":
        await revalidateUserTheme(username, "debug");
        break;
    }
    console.log(`✅ Debug revalidation successful`);
  } catch (error) {
    console.error(`❌ Debug revalidation failed:`, error);
  }
}
