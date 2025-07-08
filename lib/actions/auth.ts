"use server";

import { Polar } from "@polar-sh/sdk";

// Validate required environment variables at module level
const POLAR_ACCESS_TOKEN = process.env.POLAR_ACCESS_TOKEN;

if (!POLAR_ACCESS_TOKEN) {
  throw new Error("Missing required environment variable: POLAR_ACCESS_TOKEN");
}

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db/drizzle";
import {
  account,
  lead,
  media,
  profile,
  project,
  socialLink,
  subscriptionHistory,
  theme,
  user,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { notifyNewUserSignup } from "@/lib/utils/discord";
import { deleteMediaBatchWithCleanup } from "./media";
import type { ActionResponse } from "./utils";

/**
 * Get the current user session
 * @returns The session object or null if not authenticated
 */
export const getSession = async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    return session;
  } catch (error) {
    console.error("Failed to get session:", error);
    return null;
  }
};

// These auth actions are kept for server-side use only
// For client-side auth, use authClient from lib/auth-client.ts

/**
 * Handle post-signup actions like sending Discord notifications
 * @param userData User data from signup
 * @returns Success or error response
 */
export const handlePostSignup = async (userData: {
  name: string;
  email: string;
  username: string;
}): Promise<ActionResponse<void>> => {
  try {
    // Send Discord notification for new signup
    await notifyNewUserSignup({
      ...userData,
      createdAt: new Date(),
    });

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Failed to handle post-signup:", error);
    // Don't fail the signup if Discord notification fails
    return { success: true, data: undefined };
  }
};

/**
 * Sign out the current user
 * @returns Never returns, redirects to home page
 */
export const signOut = async (): Promise<never> => {
  try {
    await auth.api.signOut({
      headers: await headers(),
    });
  } catch (error) {
    console.error("Failed to sign out:", error);
  } finally {
    redirect("/");
  }
};

/**
 * Delete user account and all associated data
 * This includes canceling subscriptions, deleting all projects, media files from R2, and user data
 */
export const deleteAccount = async (): Promise<ActionResponse<void>> => {
  try {
    // Get session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = session.user.id;

    // Get user data from database to access subscription info
    const userData = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!userData[0]) {
      return { success: false, error: "User not found" };
    }

    // Get all media associated with this user's projects
    const projectMedia = await db
      .select({ id: media.id })
      .from(media)
      .innerJoin(project, eq(media.projectId, project.id))
      .where(eq(project.userId, userId));

    // Get user's profile image
    const profileMedia = await db
      .select({ mediaId: profile.profileImageId })
      .from(profile)
      .where(eq(profile.userId, userId));

    // Collect all media IDs for deletion
    const allMediaIds = [
      ...projectMedia.map((item) => item.id),
      ...profileMedia
        .map((item) => item.mediaId)
        .filter((id): id is string => id !== null),
    ].filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicates

    // Delete all media files from both database and R2 storage
    if (allMediaIds.length > 0) {
      const mediaDeleteResult = await deleteMediaBatchWithCleanup(allMediaIds);
      if (!mediaDeleteResult.success) {
        console.warn(
          `Failed to delete some media for user ${userId}:`,
          mediaDeleteResult.error
        );
        // Continue with account deletion even if media cleanup partially fails
      }
    }

    // Cancel Polar subscription if user has one
    if (userData[0].subscriptionId) {
      try {
        // Use the Polar SDK to cancel subscription
        const polarClient = new Polar({
          accessToken: POLAR_ACCESS_TOKEN,
          server: "production",
        });

        await polarClient.subscriptions.update({
          id: userData[0].subscriptionId,
          subscriptionUpdate: {
            cancelAtPeriodEnd: true,
          },
        });

        console.log(
          `Subscription ${userData[0].subscriptionId} marked for cancellation`
        );
      } catch (error) {
        console.warn(
          `Failed to cancel subscription for user ${userId}:`,
          error
        );
        // Continue with account deletion even if subscription cancellation fails
      }
    }

    // Delete user data in the correct order (to respect foreign key constraints)
    // Note: Most tables have onDelete: "cascade" so deleting the user should cascade,
    // but we'll be explicit for safety

    // Get user's profile ID first
    const userProfile = await db
      .select({ id: profile.id })
      .from(profile)
      .where(eq(profile.userId, userId))
      .limit(1);

    // Delete social links if profile exists
    if (userProfile.length > 0) {
      await db
        .delete(socialLink)
        .where(eq(socialLink.profileId, userProfile[0].id));
    }

    // Delete subscription history
    await db
      .delete(subscriptionHistory)
      .where(eq(subscriptionHistory.userId, userId));

    // Delete leads
    await db.delete(lead).where(eq(lead.userId, userId));

    // Delete theme
    await db.delete(theme).where(eq(theme.userId, userId));

    // Delete projects (media should already be deleted above)
    await db.delete(project).where(eq(project.userId, userId));

    // Delete profile
    await db.delete(profile).where(eq(profile.userId, userId));

    // Delete accounts (OAuth connections)
    await db.delete(account).where(eq(account.userId, userId));

    // Finally delete the user
    await db.delete(user).where(eq(user.id, userId));

    // Sign out the user
    await auth.api.signOut({
      headers: await headers(),
    });

    // Revalidate relevant paths
    revalidatePath("/");
    revalidatePath("/admin");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error deleting account:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete account",
    };
  }
};
