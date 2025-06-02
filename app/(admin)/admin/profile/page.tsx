import { ProfileForm } from "@/components/admin/profile-form";
import { PageWrapper } from "@/components/admin/page-wrapper";
import { AdminHeader } from "@/components/admin/admin-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

import {
  getProfileByUserId,
  getSocialLinksByProfileId,
} from "@/lib/data/profile";

import { getSession } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { db } from "@/db/drizzle";
import { media, Profile, SocialLink } from "@/db/schema";
import { eq } from "drizzle-orm";

function ErrorDisplay({ error }: { error: string }) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Error loading profile</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
}

type SessionUser = {
  id: string;
  name?: string | null;
  username?: string | null;
  email: string;
  image?: string | null;
};

function ProfileFormWrapper({ 
  user, 
  profile, 
  socialLinks, 
  profileImageUrl 
}: { 
  user: SessionUser;
  profile: Profile | null;
  socialLinks: SocialLink[];
  profileImageUrl?: string;
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProfileForm
        user={user}
        profile={profile}
        socialLinks={socialLinks}
        profileImageUrl={profileImageUrl}
      />
    </Suspense>
  );
}

export default async function ProfilePage() {
  try {
    const session = await getSession();

    if (!session?.user) {
      redirect("/sign-in");
    }

    const profileResult = await getProfileByUserId(session.user.id);
    
    // Even if profile fetch fails, show form for creation
    const profile = profileResult.success ? profileResult.data : null;

    let socialLinks: SocialLink[] = [];
    if (profile) {
      try {
        const socialLinksResult = await getSocialLinksByProfileId(profile.id);
        socialLinks = socialLinksResult.success ? socialLinksResult.data : [];
      } catch (error) {
        console.error("Failed to load social links:", error);
        // Continue with empty social links
      }
    }

    let profileImageUrl: string | undefined = undefined;
    if (profile?.profileImageId) {
      try {
        const [profileImage] = await db
          .select()
          .from(media)
          .where(eq(media.id, profile.profileImageId))
          .limit(1);

        profileImageUrl = profileImage?.url;
      } catch (error) {
        console.error("Failed to load profile image:", error);
        // Continue without profile image
      }
    }

    return (
      <>
        <AdminHeader pageTitle="Profile" />
        <PageWrapper>
          <ProfileFormWrapper
            user={session.user}
            profile={profile}
            socialLinks={socialLinks}
            profileImageUrl={profileImageUrl}
          />
        </PageWrapper>
      </>
    );
  } catch (error) {
    // Re-throw redirect errors
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error;
    }

    console.error("Failed to load profile page:", error);

    return (
      <>
        <AdminHeader pageTitle="Profile" />
        <PageWrapper>
          <ErrorDisplay error="Failed to load profile data. Please try refreshing the page." />
        </PageWrapper>
      </>
    );
  }
}
