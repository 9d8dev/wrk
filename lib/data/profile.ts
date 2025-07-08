"use server";

import { asc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/db/drizzle";
import type { Media, Profile, SocialLink, User } from "@/db/schema";
import { media, profile, socialLink, user } from "@/db/schema";
import { profileIdSchema, userIdSchema, usernameSchema } from "./schemas";
import { type DataResponse, dedupe, withErrorHandling } from "./utils";

/**
 * Profile with related data
 */
export interface ProfileWithRelations {
  profile: Profile;
  user: User;
  socialLinks: SocialLink[];
  profileImage: Media | null;
}

/**
 * Get profile by username with all related data
 */
const _getProfileByUsername = async (
  username: string
): Promise<DataResponse<ProfileWithRelations | null>> => {
  return withErrorHandling(async () => {
    // Validate input
    const validation = usernameSchema.safeParse(username);
    if (!validation.success) {
      throw new Error(
        validation.error.errors[0]?.message || "Invalid username"
      );
    }

    // Get user and profile with a single query
    const result = await db
      .select({
        user: user,
        profile: profile,
        profileImage: media,
      })
      .from(user)
      .leftJoin(profile, eq(profile.userId, user.id))
      .leftJoin(media, eq(media.id, profile.profileImageId))
      .where(eq(user.username, username))
      .limit(1);

    if (!result[0] || !result[0].profile) {
      return null;
    }

    const { user: userData, profile: profileData, profileImage } = result[0];

    // Get social links
    const socialLinks = await db
      .select()
      .from(socialLink)
      .where(eq(socialLink.profileId, profileData.id))
      .orderBy(asc(socialLink.displayOrder));

    return {
      profile: profileData,
      user: userData,
      socialLinks,
      profileImage,
    };
  }, "Failed to fetch profile by username");
};

// Create a cached version for better performance
const getCachedProfile = unstable_cache(
  async (username: string) => {
    return await _getProfileByUsername(username);
  },
  ["profile-by-username"],
  {
    tags: ["profiles"],
    revalidate: 300, // 5 minutes
  }
);

// Export with deduplication
export const getProfileByUsername = dedupe(getCachedProfile);

/**
 * Get profile by user ID
 */
export const getProfileByUserId = dedupe(
  async (userId: string): Promise<DataResponse<Profile | null>> => {
    return withErrorHandling(async () => {
      // Validate input
      const validation = userIdSchema.safeParse(userId);
      if (!validation.success) {
        throw new Error(
          validation.error.errors[0]?.message || "Invalid user ID"
        );
      }

      const userProfile = await db
        .select()
        .from(profile)
        .where(eq(profile.userId, userId))
        .limit(1);

      return userProfile[0] || null;
    }, "Failed to fetch profile by user ID");
  }
);

/**
 * Get social links by profile ID
 */
export const getSocialLinksByProfileId = dedupe(
  async (profileId: string): Promise<DataResponse<SocialLink[]>> => {
    return withErrorHandling(async () => {
      // Validate input
      const validation = profileIdSchema.safeParse(profileId);
      if (!validation.success) {
        throw new Error(
          validation.error.errors[0]?.message || "Invalid profile ID"
        );
      }

      const links = await db
        .select()
        .from(socialLink)
        .where(eq(socialLink.profileId, profileId))
        .orderBy(asc(socialLink.displayOrder));

      return links;
    }, "Failed to fetch social links");
  }
);

/**
 * Get profile with user data
 */
export const getProfileWithUser = dedupe(
  async (
    profileId: string
  ): Promise<DataResponse<{ profile: Profile; user: User } | null>> => {
    return withErrorHandling(async () => {
      // Validate input
      const validation = profileIdSchema.safeParse(profileId);
      if (!validation.success) {
        throw new Error(
          validation.error.errors[0]?.message || "Invalid profile ID"
        );
      }

      const result = await db
        .select({
          profile: profile,
          user: user,
        })
        .from(profile)
        .innerJoin(user, eq(user.id, profile.userId))
        .where(eq(profile.id, profileId))
        .limit(1);

      return result[0] || null;
    }, "Failed to fetch profile with user data");
  }
);

/**
 * Check if a user has completed their profile
 */
export async function hasCompletedProfile(
  userId: string
): Promise<DataResponse<boolean>> {
  return withErrorHandling(async () => {
    // Validate input
    const validation = userIdSchema.safeParse(userId);
    if (!validation.success) {
      throw new Error(validation.error.errors[0]?.message || "Invalid user ID");
    }

    const profileData = await db
      .select({ id: profile.id })
      .from(profile)
      .where(eq(profile.userId, userId))
      .limit(1);

    return profileData.length > 0;
  }, "Failed to check profile completion");
}

/**
 * Get profile statistics
 */
export async function getProfileStats(profileId: string): Promise<
  DataResponse<{
    socialLinkCount: number;
    hasProfileImage: boolean;
    completionPercentage: number;
  }>
> {
  return withErrorHandling(async () => {
    // Validate input
    const validation = profileIdSchema.safeParse(profileId);
    if (!validation.success) {
      throw new Error(
        validation.error.errors[0]?.message || "Invalid profile ID"
      );
    }

    // Get profile and social links count in parallel
    const [profileData, socialLinks] = await Promise.all([
      db
        .select({
          bio: profile.bio,
          location: profile.location,
          profileImageId: profile.profileImageId,
        })
        .from(profile)
        .where(eq(profile.id, profileId))
        .limit(1),
      db
        .select({ id: socialLink.id })
        .from(socialLink)
        .where(eq(socialLink.profileId, profileId)),
    ]);

    if (!profileData[0]) {
      throw new Error("Profile not found");
    }

    const { bio, location, profileImageId } = profileData[0];

    // Calculate completion percentage
    let completed = 0;
    const totalFields = 4; // bio, location, profileImage, socialLinks

    if (bio) completed++;
    if (location) completed++;
    if (profileImageId) completed++;
    if (socialLinks.length > 0) completed++;

    const completionPercentage = Math.round((completed / totalFields) * 100);

    return {
      socialLinkCount: socialLinks.length,
      hasProfileImage: !!profileImageId,
      completionPercentage,
    };
  }, "Failed to fetch profile statistics");
}
