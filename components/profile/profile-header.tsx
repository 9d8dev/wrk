import { Section, Container } from "@/components/ds";
import { ProfileNav } from "@/components/profile/profile-nav";

import { Pin } from "lucide-react";

import { getProfileByUsername } from "@/lib/data/profile";
import { getUserByUsername } from "@/lib/data/user";
import { getMediaById } from "@/lib/data/media";

import Image from "next/image";
import Link from "next/link";

export const ProfileHeader = async ({ username }: { username: string }) => {
  const profile = await getProfileByUsername(username);
  const user = await getUserByUsername(username);

  if (!profile || !user) {
    return null;
  }

  let profileImage;

  if (profile.profileImageId) {
    profileImage = await getMediaById(profile.profileImageId);
  }

  const imageSrc = profileImage?.media?.url || null;

  return (
    <Section>
      <Container className="flex justify-between items-start gap-6">
        <Info profile={profile} user={user} imageSrc={imageSrc} />
        <ProfileNav user={user} />
      </Container>
    </Section>
  );
};

const Info = ({
  profile,
  user,
  imageSrc,
}: {
  profile: any;
  user: any;
  imageSrc: string | null;
}) => {
  return (
    <Link href={`/${user.username}`} className="flex gap-4">
      {imageSrc && (
        <Image
          src={imageSrc}
          alt={user.name || user.username}
          width={48}
          height={48}
          className="rounded-full"
          priority
        />
      )}
      <div>
        <div className="flex items-center gap-2">
          <h1>{user.name}</h1>
          <h2 className="text-sm text-muted-foreground">@{user.username}</h2>
          {profile.location && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Pin size={12} /> {profile.location}
            </p>
          )}
        </div>
        {profile.bio && (
          <p className="max-w-2xl text-sm text-muted-foreground">
            {profile.bio}
          </p>
        )}
      </div>
    </Link>
  );
};
