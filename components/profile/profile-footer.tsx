import { Section, Container } from "@/components/ds";

import { getUserByUsername } from "@/lib/data/user";
import {
  getProfileByUsername,
  getSocialLinksByProfileId,
} from "@/lib/data/profile";

import Link from "next/link";

export const ProfileFooter = async ({ username }: { username: string }) => {
  const profile = await getProfileByUsername(username);
  const user = await getUserByUsername(username);

  if (!profile || !user) {
    return null;
  }

  return (
    <footer>
      <Section>
        <Container className="text-sm flex justify-between items-start gap-6">
          <div>
            <p>
              © {new Date().getFullYear()} {user.name}
            </p>
            <Link href="/">Made with Wrk.so</Link>
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

  return (
    <div>
      {socialLinks.map((link: any) => (
        <a
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {link.name}
        </a>
      ))}
    </div>
  );
};
