import { getUserByUsername } from "@/lib/data/user";
import { profile } from "@/db/schema";
import { socialLink } from "@/db/schema";
import { db } from "@/db/drizzle";
import { eq } from "drizzle-orm";

export const getProfileByUsername = async (username: string) => {
  const userInfo = await getUserByUsername(username);

  if (!userInfo) return null;

  const user = userInfo;

  const data = await db
    .select()
    .from(profile)
    .where(eq(profile.userId, user.id))
    .limit(1);

  return data.length > 0 ? data[0] : null;
};

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
