import { getUserByUsername } from "@/lib/data/user";
import { getProfileByUsername } from "@/lib/data/profile";
import { notFound } from "next/navigation";

import { Container, Section } from "@/components/ds";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileFooter } from "@/components/profile/profile-footer";
import { ContactForm } from "@/components/profile/contact-form";

import type { Metadata } from "next";

type Props = {
  params: Promise<{ username: string }>;
};

// Metadata Generation
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  const user = await getUserByUsername(username);

  // Get profile image if available
  let profileImage = null;
  if (profile?.profileImageId) {
    const { getMediaById } = await import("@/lib/data/media");
    profileImage = await getMediaById(profile.profileImageId);
  }

  const imageSrc = profileImage?.media?.url || user.image || null;

  return {
    title: `Contact ${user.name} | ${profile?.title || "Wrk.so"}`,
    description: `Get in touch with ${user.name}. ${
      profile?.bio && profile.bio.length > 160
        ? profile.bio.substring(0, 120) + "..."
        : profile?.bio || ""
    }`.trim(),
    openGraph: imageSrc
      ? {
          images: [
            {
              url: imageSrc,
              width: 1200,
              height: 630,
              alt: `Contact ${user.name}`,
            },
          ],
        }
      : undefined,
    twitter: imageSrc
      ? {
          card: "summary_large_image",
          images: [
            {
              url: imageSrc,
              alt: `Contact ${user.name}`,
            },
          ],
        }
      : undefined,
  };
}

export default async function ContactPage({ params }: Props) {
  const { username } = await params;

  const user = await getUserByUsername(username);

  if (!user) {
    return notFound();
  }

  return (
    <>
      <ProfileHeader username={username} />
      <Section>
        <Container>
          <ContactForm userId={user.id} />
        </Container>
      </Section>
      <ProfileFooter username={username} />
    </>
  );
}
