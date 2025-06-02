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
  const profileResult = await getProfileByUsername(username);
  const userResult = await getUserByUsername(username);

  if (!profileResult.success || !profileResult.data || !userResult.success || !userResult.data) {
    return null;
  }

  const profile = profileResult.data.profile;
  const user = userResult.data;

  return (
    <footer className="border-t border-dashed bg-accent/20 mt-24">
      <Section>
        {profile.bio && (
          <Container className="text-sm">
            <p className="max-w-prose">{profile.bio}</p>
          </Container>
        )}
        <Container className="text-sm text-muted-foreground flex justify-between items-start gap-6">
          <div>
            <SocialLinks profile={profile} />
          </div>
          <div className="text-right flex items-end flex-col gap-1">
            <p>
              {new Date().getFullYear()} © {user.name}, All rights reserved.
            </p>
            <p className="flex items-center gap-1">
              ✏︎{" "}
              <Link
                className="underline underline-offset-2 flex items-center gap-1"
                href="/"
              >
                Made with Wrk.so
              </Link>
            </p>
          </div>
        </Container>
      </Section>
    </footer>
  );
};

const SocialLinks = async ({ profile }: { profile: Profile }) => {
  const socialLinksResult = await getSocialLinksByProfileId(profile.id);
  
  if (!socialLinksResult.success || socialLinksResult.data.length === 0) {
    return null;
  }

  const socialLinks = socialLinksResult.data;

  return (
    <div className="flex flex-col gap-1">
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
