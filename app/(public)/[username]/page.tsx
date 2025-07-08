import type { Metadata } from "next";

import { isNotNull } from "drizzle-orm";

import { PortfolioGrid } from "@/components/profile/portfolio-grid";
import { ProfileFooter } from "@/components/profile/profile-footer";
import { ProfileHeader } from "@/components/profile/profile-header";
import { Container, Section } from "@/components/ds";

import { getPortfolioData } from "@/hooks/use-portfolio-data";

import { getProfileByUsername } from "@/lib/data/profile";
import { usernameSchema } from "@/lib/data/schemas";
import { getUserByUsername } from "@/lib/data/user";

import { user } from "@/db/schema";
import { db } from "@/db/drizzle";

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateStaticParams() {
  try {
    const users = await db
      .select({ username: user.username })
      .from(user)
      .where(isNotNull(user.username));

    return users
      .filter((u) => {
        if (!u.username) return false;
        const usernameValidation = usernameSchema.safeParse(u.username);
        if (!usernameValidation.success) {
          console.warn(
            `Skipping invalid username "${u.username}" during static generation`
          );
          return false;
        }
        return true;
      })
      .map((u) => ({
        username: u.username,
      }));
  } catch (error) {
    console.error("Error generating static params for username pages:", error);
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profileResult = await getProfileByUsername(username);
  const userResult = await getUserByUsername(username);

  if (!userResult.success || !userResult.data) {
    return {
      title: "Portfolio | Wrk.so",
      description: "Portfolio created using Wrk.so.",
    };
  }

  const user = userResult.data;
  const profile = profileResult.success ? profileResult.data : null;

  return {
    title: `${user.name} | ${profile?.profile.title || "Wrk.so"}`,
    description:
      profile?.profile.bio ||
      `Collection of works created by ${user.name}. Portfolio created using Wrk.so.`,
  };
}

export default async function PortfolioPage({ params }: Props) {
  const { username } = await params;

  const { projects, gridType } = await getPortfolioData(username);

  return (
    <main className="flex min-h-screen flex-col">
      <ProfileHeader username={username} />
      <Section className="flex-1">
        <Container>
          <PortfolioGrid
            projects={projects}
            username={username}
            gridType={gridType}
          />
        </Container>
      </Section>
      <ProfileFooter username={username} />
    </main>
  );
}
