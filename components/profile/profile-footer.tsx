import { ArrowUpRight, MapPin } from "lucide-react";
import { Section, Container } from "@/components/ds";
import { ThemeToggle } from "@/components/theme/theme-toggle";

import Link from "next/link";

import { getUserByUsername } from "@/lib/data/user";
import { isProUser } from "@/lib/actions/subscription";
import {
  getProfileByUsername,
  getSocialLinksByProfileId,
} from "@/lib/data/profile";

import type { Profile } from "@/db/schema";

export const ProfileFooter = async ({ username }: { username: string }) => {
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

  return (
    <footer className="border-t border-dashed bg-accent/20 mt-24">
      <Section>
        <Container className="text-sm flex items-start justify-between gap-4">
          <div className="space-y-4">
            <h3>
              {user.name}{" "}
              {!isPro && (
                <span className="text-muted-foreground">@{user.username}</span>
              )}
            </h3>
            <div className="flex items-center gap-2">
              {profile.title && (
                <h4 className="text-muted-foreground">{profile.title}</h4>
              )}
              {profile.title && profile.location && "|"}
              {profile.location && (
                <h4 className="flex text-muted-foreground items-center gap-1">
                  <MapPin size={12} /> {profile.location}
                </h4>
              )}
            </div>
            {profile.bio && <p className="max-w-prose mt-8">{profile.bio}</p>}
          </div>
          <SocialLinks profile={profile} />
        </Container>
        <Container className="text-sm text-muted-foreground flex justify-between items-start gap-4">
          <p>
            {new Date().getFullYear()} © {user.name}, All rights reserved.
          </p>
          {!isPro && (
            <div>
              <p className="flex items-center gap-1">
                ✏︎ <Link href="/">Create your Portfolio with Wrk.so</Link>
              </p>
              <ThemeToggle />
            </div>
          )}
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
