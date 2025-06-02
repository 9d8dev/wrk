import { ProfileForm } from "@/components/admin/profile-form";
import { PageWrapper } from "@/components/admin/page-wrapper";
import { AdminHeader } from "@/components/admin/admin-header";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

import {
  getProfileByUserId,
  getSocialLinksByProfileId,
} from "@/lib/data/profile";

import { getSession } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { db } from "@/db/drizzle";
import { media } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function ProfilePage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/sign-in");
  }

  const profile = await getProfileByUserId(session.user.id);

  const socialLinks = profile
    ? await getSocialLinksByProfileId(profile.id)
    : [];

  let profileImageUrl = undefined;

  if (profile?.profileImageId) {
    const [profileImage] = await db
      .select()
      .from(media)
      .where(eq(media.id, profile.profileImageId))
      .limit(1);

    profileImageUrl = profileImage?.url;
  }

  return (
    <>
      <AdminHeader pageTitle="Profile" />
      <PageWrapper>
        <Suspense fallback={<div>Loading...</div>}>
          <ProfileForm
            user={session.user}
            profile={profile}
            socialLinks={socialLinks}
            profileImageUrl={profileImageUrl}
          />
        </Suspense>
      </PageWrapper>
    </>
  );
}
