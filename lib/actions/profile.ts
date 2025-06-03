"use server";

import { db } from "@/db/drizzle";
import { profile, user, socialLink } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { uploadImage } from "@/lib/actions/media";
import { nanoid } from "nanoid";
import { ActionResponse, REVALIDATION_PATHS } from "./utils";
import { updateProfileSchema } from "./schemas";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

type UpdateProfileParams = {
  profileData: {
    bio: string | null;
    location: string | null;
  };
  userData: {
    name: string;
    username: string;
    email: string;
  };
  socialLinks?: {
    platform: string;
    url: string;
  }[];
  profileImageFormData?: FormData | null;
};

type ProfileResult = {
  profileId: string;
  username: string;
};

/**
 * Update user profile with validation
 */
export async function updateProfile(
  params: UpdateProfileParams
): Promise<ActionResponse<ProfileResult>> {
  try {
    // Get session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = session.user.id;

    // Validate input
    const validation = updateProfileSchema.safeParse({
      name: params.userData.name,
      username: params.userData.username,
      bio: params.profileData.bio,
      socialLinks: params.socialLinks?.map((link, index) => ({
        ...link,
        displayOrder: index,
      })),
    });

    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0]?.message || "Invalid input",
      };
    }

    // Check username availability if changed
    if (params.userData.username !== session.user.username) {
      const existingUser = await db
        .select()
        .from(user)
        .where(eq(user.username, params.userData.username))
        .limit(1);

      if (existingUser.length > 0) {
        return { success: false, error: "Username is already taken" };
      }
    }

    // Perform operations sequentially (no transactions with neon-http)
    try {
      // Update user data
      await db
        .update(user)
        .set({
          name: params.userData.name,
          username: params.userData.username,
          email: params.userData.email,
          displayUsername: params.userData.username,
          updatedAt: new Date(),
        })
        .where(eq(user.id, userId));

      // Check if profile exists
      const existingProfile = await db
        .select()
        .from(profile)
        .where(eq(profile.userId, userId))
        .limit(1);

      let profileId: string;

      if (existingProfile.length > 0) {
        // Update existing profile
        profileId = existingProfile[0].id;

        await db
          .update(profile)
          .set({
            bio: params.profileData.bio,
            location: params.profileData.location,
            updatedAt: new Date(),
          })
          .where(eq(profile.id, profileId));
      } else {
        // Create new profile
        profileId = nanoid();

        await db.insert(profile).values({
          id: profileId,
          userId,
          bio: params.profileData.bio,
          location: params.profileData.location,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Handle profile image upload if provided
      if (params.profileImageFormData) {
        const imageResult = await uploadImage(params.profileImageFormData);

        if (imageResult.success && imageResult.mediaId) {
          // Update profile with new image ID
          await db
            .update(profile)
            .set({
              profileImageId: imageResult.mediaId,
              updatedAt: new Date(),
            })
            .where(eq(profile.id, profileId));
        }
      }

      // Handle social links
      if (params.socialLinks && params.socialLinks.length > 0) {
        // First, delete all existing social links for this profile
        await db.delete(socialLink).where(eq(socialLink.profileId, profileId));

        // Then insert new social links
        const now = new Date();
        const socialLinkValues = params.socialLinks
          .filter((link) => link.platform && link.url)
          .map((link, i) => ({
            id: nanoid(),
            profileId,
            platform: link.platform,
            url: link.url,
            displayOrder: i,
            createdAt: now,
            updatedAt: now,
          }));

        if (socialLinkValues.length > 0) {
          await db.insert(socialLink).values(socialLinkValues);
        }
      }

      // Revalidate paths
      const paths = REVALIDATION_PATHS.profile(params.userData.username);
      for (const path of paths) {
        revalidatePath(path);
      }

      return {
        success: true,
        data: { profileId, username: params.userData.username },
      };
    } catch (dbError) {
      console.error("Database operation failed:", dbError);
      return {
        success: false,
        error: "Failed to update profile. Please try again.",
      };
    }
  } catch (error) {
    console.error("Error updating profile:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update profile",
    };
  }
}

type CreateProfileParams = {
  profileData: {
    title?: string;
    bio: string | null;
    location: string | null;
  };
  profileImageFormData?: FormData | null;
};

/**
 * Create a new profile for the authenticated user
 */
export async function createProfile(
  params: CreateProfileParams
): Promise<ActionResponse<ProfileResult>> {
  try {
    // Get session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = session.user.id;
    const username = session.user.username || session.user.email;

    // Check if profile already exists
    const existingProfile = await db
      .select()
      .from(profile)
      .where(eq(profile.userId, userId))
      .limit(1);

    if (existingProfile.length > 0) {
      return { success: false, error: "Profile already exists" };
    }

    // Create profile ID
    const profileId = nanoid();

    // Handle profile image upload if provided
    let profileImageId: string | null = null;
    if (params.profileImageFormData) {
      const imageResult = await uploadImage(params.profileImageFormData);
      if (imageResult.success && imageResult.mediaId) {
        profileImageId = imageResult.mediaId;
      }
    }

    // Create new profile
    await db.insert(profile).values({
      id: profileId,
      userId,
      title: params.profileData.title || null,
      bio: params.profileData.bio,
      location: params.profileData.location,
      profileImageId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Revalidate paths
    revalidatePath("/admin");
    revalidatePath("/onboarding");
    if (username) {
      revalidatePath(`/${username}`);
    }

    return { success: true, data: { profileId, username } };
  } catch (error) {
    console.error("Error creating profile:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create profile",
    };
  }
}

/**
 * Update username with validation
 */
export async function updateUsername(
  newUsername: string
): Promise<ActionResponse<{ username: string }>> {
  try {
    // Get session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = session.user.id;
    const oldUsername = session.user.username;

    // Validate username format
    const validation =
      updateProfileSchema.shape.username.safeParse(newUsername);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0]?.message || "Invalid username",
      };
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

    if (reservedUsernames.includes(newUsername.toLowerCase())) {
      return { success: false, error: "This username is reserved" };
    }

    // Check if username is already taken
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.username, newUsername))
      .limit(1);

    if (existingUser.length > 0) {
      return { success: false, error: "Username is already taken" };
    }

    // Update username
    await db
      .update(user)
      .set({
        username: newUsername,
        displayUsername: newUsername,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));

    // Revalidate paths
    if (oldUsername) {
      revalidatePath(`/${oldUsername}`);
    }
    const paths = REVALIDATION_PATHS.profile(newUsername);
    for (const path of paths) {
      revalidatePath(path);
    }

    return { success: true, data: { username: newUsername } };
  } catch (error) {
    console.error("Error updating username:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update username",
    };
  }
}
