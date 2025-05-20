import { Section, Container } from "@/components/ds";
import { ArrowUpRight } from "lucide-react";

import Link from "next/link";

import { getUserByUsername } from "@/lib/data/user";
import {
  getProfileByUsername,
  getSocialLinksByProfileId,
} from "@/lib/data/profile";

import type { Profile } from "@/db/schema";

export const ProfileFooter = async ({ username }: { username: string }) => {
  const profile = await getProfileByUsername(username);
  const user = await getUserByUsername(username);

  if (!profile || !user) {
    return null;
  }

  return (
    <footer>
      <Section>
        {profile.bio && (
          <Container className="text-sm">
            <p className="max-w-prose">{profile.bio}</p>
          </Container>
        )}
        <Container className="text-sm text-muted-foreground flex justify-between items-start gap-6">
          <SocialLinks profile={profile} />
          <div className="space-y-1">
            <p>
              {new Date().getFullYear()} © {user.name}, All rights reserved.
            </p>
            <Link
              className="underline underline-offset-2 flex items-center gap-1"
              href="/"
            >
              Made with Wrk.so <ArrowUpRight size={12} />
            </Link>
          </div>
        </Container>
      </Section>
    </footer>
  );
};

const SocialLinks = async ({ profile }: { profile: Profile }) => {
  const socialLinks = profile
    ? await getSocialLinksByProfileId(profile.id)
    : [];

  if (socialLinks.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {socialLinks.map((link) => (
        <a
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          {link.platform} <ArrowUpRight size={12} />
        </a>
      ))}
    </div>
  );
};
