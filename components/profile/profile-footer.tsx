import { Section, Container } from "@/components/ds";
import { ArrowUpRight, MapPin } from "lucide-react";

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
          <div className="space-y-2">
            <h3>
              {user.name}{" "}
              <span className="text-muted-foreground">@{user.username}</span>
            </h3>
            <h4 className="flex items-center gap-1">
              <MapPin size={12} /> {profile.location}
            </h4>
            {profile.bio && <p className="max-w-prose">{profile.bio}</p>}
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
                ✏︎{" "}
                <Link
                  className="underline underline-offset-2 decoration-muted flex items-center gap-1"
                  href="/"
                >
                  Create your Portfolio with Wrk.so
                </Link>
              </p>
            </div>
          )}
        </Container>
      </Section>
    </footer>
  );
};

const SocialLinks = async ({ profile }: { profile: Profile }) => {
  const socialLinksResult = await getSocialLinksByProfileId(profile.id);

  // if (!socialLinksResult.success || socialLinksResult.data.length === 0) {
  //   return null;
  // }

  const socialLinks = socialLinksResult.data;

  return (
    <div className="flex flex-col gap-1">
      <a
        className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        href="https://example"
      >
        Example <ArrowUpRight size={12} />
      </a>
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
