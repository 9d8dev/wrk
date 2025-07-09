import type { Metadata } from "next";

import { notFound } from "next/navigation";
import { isNotNull } from "drizzle-orm";

import { ProfileFooter } from "@/components/profile/profile-footer";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ContactForm } from "@/components/profile/contact-form";
import { Container, Section } from "@/components/ds";

import { getProfileByUsername } from "@/lib/data/profile";
import { getUserByUsername } from "@/lib/data/user";

import { user } from "@/db/schema";
import { db } from "@/db/drizzle";

type Props = {
  params: Promise<{ username: string }>;
};

// Generate static params for all usernames
export async function generateStaticParams() {
  try {
    // Get all users with usernames
    const users = await db
      .select({ username: user.username })
      .from(user)
      .where(isNotNull(user.username));

    // Return params for each username
    return users
      .filter((u) => u.username) // Extra safety check
      .map((u) => ({
        username: u.username,
      }));
  } catch (error) {
    console.error("Error generating static params for contact pages:", error);
    // Return empty array on error to fallback to on-demand generation
    return [];
  }
}

// Metadata Generation
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profileResult = await getProfileByUsername(username);
  const userResult = await getUserByUsername(username);

  if (!userResult.success || !userResult.data) {
    return {
      title: "Contact | Wrk.so",
      description: "Get in touch via Wrk.so.",
    };
  }

  const user = userResult.data;
  const profile = profileResult.success ? profileResult.data?.profile : null;
  const profileImage = profileResult.success
    ? profileResult.data?.profileImage
    : null;

  const imageSrc = profileImage?.url || user.image || null;

  return {
    title: `Contact ${user.name} | ${profile?.title || "Wrk.so"}`,
    description: `Get in touch with ${user.name}. ${
      profile?.bio && profile.bio.length > 160
        ? `${profile.bio.substring(0, 120)}...`
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

  const userResult = await getUserByUsername(username);

  if (!userResult.success || !userResult.data) {
    return notFound();
  }

  const user = userResult.data;

  return (
    <>
      <ProfileHeader username={username} />
      <Section>
        <Container className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_2fr]">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Contact {user.name}</h1>
            <p className="text-muted-foreground">
              Send a message to {user.name}.
            </p>
          </div>
          <ContactForm userId={user.id} portfolioOwner={username} />
        </Container>
      </Section>
      <ProfileFooter username={username} />
    </>
  );
}
