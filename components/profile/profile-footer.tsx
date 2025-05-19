import { Section, Container } from "@/components/ds";

import { getUserByUsername } from "@/lib/data/user";
import {
  getProfileByUsername,
  getSocialLinksByProfileId,
} from "@/lib/data/profile";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

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
            <p>{profile.bio}</p>
          </Container>
        )}
        <Container className="text-sm text-muted-foreground flex justify-between items-start gap-6">
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
          <SocialLinks profile={profile} />
        </Container>
      </Section>
    </footer>
  );
};

const SocialLinks = async ({ profile }: { profile: any }) => {
  const socialLinks = profile
    ? await getSocialLinksByProfileId(profile.id)
    : [];

  if (socialLinks.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-4">
      {socialLinks.map((link: any) => (
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
