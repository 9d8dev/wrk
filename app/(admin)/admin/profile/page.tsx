import { ProfileForm } from "@/components/admin/profile-form";
import { PageWrapper } from "@/components/admin/page-wrapper";
import { AdminHeader } from "@/components/admin/admin-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import {
  getProfileByUserId,
  getSocialLinksByProfileId,
} from "@/lib/data/profile";
import { db } from "@/db/drizzle";
import { media } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function getProfileData(userId: string) {
  try {
    // Get profile
    const profileResult = await getProfileByUserId(userId);
    const profile = profileResult.success ? profileResult.data : null;

    // Get social links if profile exists
    let socialLinks = [];
    if (profile) {
      const socialLinksResult = await getSocialLinksByProfileId(profile.id);
      socialLinks = socialLinksResult.success ? socialLinksResult.data : [];
    }

    // Get profile image URL if profile image exists
    let profileImageUrl;
    if (profile?.profileImageId) {
      const [profileImage] = await db
        .select()
        .from(media)
        .where(eq(media.id, profile.profileImageId))
        .limit(1);

      profileImageUrl = profileImage?.url;
    }

    return {
      profile,
      socialLinks,
      profileImageUrl,
    };
  } catch (error) {
    console.error("Error fetching profile data:", error);
    return {
      profile: null,
      socialLinks: [],
      profileImageUrl: undefined,
    };
  }
}

export default async function ProfilePage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/sign-in");
  }

  const { profile, socialLinks, profileImageUrl } = await getProfileData(
    session.user.id
  );

  return (
    <>
      <AdminHeader pageTitle="Profile" />
      <PageWrapper>
        <ProfileForm
          user={session.user}
          profile={profile}
          socialLinks={socialLinks}
          profileImageUrl={profileImageUrl}
        />
      </PageWrapper>
    </>
  );
}
