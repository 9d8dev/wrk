"use server";

import { db } from "@/db/drizzle";
import { profile, user, socialLink } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { uploadImage } from "@/lib/actions/media";
import { nanoid } from "nanoid";

type UpdateProfileParams = {
  userId: string;
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

export async function updateProfile({
  userId,
  profileData,
  userData,
  socialLinks = [],
  profileImageFormData,
}: UpdateProfileParams) {
  try {
    // Update user data
    await db
      .update(user)
      .set({
        name: userData.name,
        username: userData.username,
        email: userData.email,
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
          bio: profileData.bio,
          location: profileData.location,
          updatedAt: new Date(),
        })
        .where(eq(profile.id, profileId));
    } else {
      // Create new profile
      profileId = crypto.randomUUID();

      await db.insert(profile).values({
        id: profileId,
        userId,
        bio: profileData.bio,
        location: profileData.location,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Handle profile image upload if provided
    if (profileImageFormData) {
      const imageResult = await uploadImage(profileImageFormData);

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
    if (socialLinks && socialLinks.length > 0) {
      // First, delete all existing social links for this profile
      await db.delete(socialLink).where(eq(socialLink.profileId, profileId));

      // Then insert new social links
      const now = new Date();

      for (let i = 0; i < socialLinks.length; i++) {
        const link = socialLinks[i];

        if (link.platform && link.url) {
          await db.insert(socialLink).values({
            id: crypto.randomUUID(),
            profileId,
            platform: link.platform,
            url: link.url,
            displayOrder: i,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    }

    revalidatePath("/admin/profile");
    revalidatePath("/admin");
    revalidatePath("/(admin)/admin");
    revalidatePath(`/${userData.username}`);
    revalidatePath("/(public)/[username]");
    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    throw new Error("Failed to update profile");
  }
}

type CreateProfileParams = {
  userId: string;
  profileData: {
    title?: string;
    bio: string | null;
    location: string | null;
  };
  profileImageFormData?: FormData | null;
};

export async function createProfile({
  userId,
  profileData,
  profileImageFormData,
}: CreateProfileParams) {
  try {
    // Check if profile already exists
    const existingProfile = await db
      .select()
      .from(profile)
      .where(eq(profile.userId, userId))
      .limit(1);

    if (existingProfile.length > 0) {
      throw new Error("Profile already exists");
    }

    // Create profile ID
    const profileId = nanoid();

    // Handle profile image upload if provided
    let profileImageId: string | null = null;
    if (profileImageFormData) {
      const imageResult = await uploadImage(profileImageFormData);
      if (imageResult.success && imageResult.mediaId) {
        profileImageId = imageResult.mediaId;
      }
    }

    // Create new profile
    await db.insert(profile).values({
      id: profileId,
      userId,
      title: profileData.title || null,
      bio: profileData.bio,
      location: profileData.location,
      profileImageId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    revalidatePath("/admin");
    revalidatePath("/(admin)/admin");
    revalidatePath("/onboarding");

    return { success: true, profileId };
  } catch (error) {
    console.error("Error creating profile:", error);
    throw new Error("Failed to create profile");
  }
}

export async function updateUsername(userId: string, username: string) {
  try {
    // Validate username
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
      throw new Error("This username is reserved");
    }

    // Check if username is already taken
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.username, username))
      .limit(1);

    if (existingUser.length > 0) {
      throw new Error("Username is already taken");
    }

    // Update username
    await db
      .update(user)
      .set({
        username,
        displayUsername: username,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));

    // Revalidate paths since username change affects public profile URL
    revalidatePath("/admin");
    revalidatePath("/admin/profile");
    revalidatePath(`/${username}`);
    revalidatePath("/(public)/[username]");

    return { success: true };
  } catch (error) {
    console.error("Error updating username:", error);
    throw error;
  }
}
