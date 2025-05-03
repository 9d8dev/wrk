"use server";

import { db } from "@/db/drizzle";
import { profile, user, socialLink } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { uploadImage } from "@/lib/actions/media";

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
    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    throw new Error("Failed to update profile");
  }
}

export async function getProfileByUserId(userId: string) {
  try {
    const userProfile = await db
      .select()
      .from(profile)
      .where(eq(profile.userId, userId))
      .limit(1);

    return userProfile.length > 0 ? userProfile[0] : null;
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
}

export async function getSocialLinksByProfileId(profileId: string) {
  try {
    const links = await db
      .select()
      .from(socialLink)
      .where(eq(socialLink.profileId, profileId))
      .orderBy(socialLink.displayOrder);

    return links;
  } catch (error) {
    console.error("Error fetching social links:", error);
    return [];
  }
}
