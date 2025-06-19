import { Section, Container } from "@/components/ds";
import { ProfileNav } from "@/components/profile/profile-nav";

import { getProfileByUsername } from "@/lib/data/profile";
import { getUserByUsername } from "@/lib/data/user";
import { isProUser } from "@/lib/actions/subscription";

import Image from "next/image";
import Link from "next/link";

import type { Profile, User } from "@/db/schema";

export const ProfileHeader = async ({ username }: { username: string }) => {
  const profileResult = await getProfileByUsername(username);
  const userResult = await getUserByUsername(username);
  const isPro = await isProUser(userResult.data?.id || "");

  if (
    !profileResult.success ||
    !profileResult.data ||
    !userResult.success ||
    !userResult.data
  ) {
    return null;
  }

  const profile = profileResult.data.profile;
  const user = userResult.data;
  const profileImage = profileResult.data.profileImage;

  const imageSrc = profileImage?.url || null;

  return (
    <Section>
      <Container className="flex justify-between items-start gap-6">
        <Info profile={profile} user={user} imageSrc={imageSrc} isPro={isPro} />
        <ProfileNav user={user} isPro={isPro} />
      </Container>
    </Section>
  );
};

const Info = ({
  profile,
  user,
  imageSrc,
  isPro,
}: {
  profile: Profile;
  user: User;
  imageSrc: string | null;
  isPro: boolean;
}) => {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-4">
      {imageSrc && (
        <Link href={`/${user.username}`}>
          <Image
            src={imageSrc}
            alt={user.name || user.username}
            width={48}
            height={48}
            className="rounded-full"
            priority
          />
        </Link>
      )}
      <Link href={`/${user.username}`}>
        <div className="flex items-center gap-2">
          <h1>{user.name}</h1>
          {!isPro && (
            <h2 className="text-sm text-muted-foreground">@{user.username}</h2>
          )}
        </div>
        {profile.title && (
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            {profile.title}
          </p>
        )}
      </Link>
    </div>
  );
};
