import { Section, Container } from "@/components/ds";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileFooter } from "@/components/profile/profile-footer";
import {
  MasonryGrid,
  StandardGrid,
  MinimalGrid,
  SquareGrid,
} from "@/components/profile/grids";

import { getProjectsByUsername } from "@/lib/data/project";
import { getProfileByUsername } from "@/lib/data/profile";
import { getUserByUsername } from "@/lib/data/user";
import { getThemeByUsername } from "@/lib/actions/theme";
import { isNotNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import { user } from "@/db/schema";
import { db } from "@/db/drizzle";

import type { Metadata } from "next";

import {
  getFeaturedImageByProjectId,
  getAllProjectImages,
} from "@/lib/data/media";

type Props = {
  params: Promise<{ username: string }>;
};

// Configure ISR with different strategies based on content type
export const revalidate = 180; // 3 minutes - more reasonable for UGC platforms

// SSG
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
        username: u.username!,
      }));
  } catch (error) {
    console.error("Error generating static params for username pages:", error);
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

// Page
export default async function PortfolioPage({ params }: Props) {
  // Add cache timestamp for debugging
  const cacheTimestamp = new Date().toISOString();
  const { username } = await params;

  const projectsResult = await getProjectsByUsername(username);

  if (!projectsResult.success || projectsResult.data.items.length === 0) {
    return notFound();
  }

  // Get user's theme preference
  const userTheme = await getThemeByUsername(username);
  const gridType = userTheme?.gridType || "masonry"; // Default to masonry

  const projects = await Promise.all(
    projectsResult.data.items.map(async (project) => {
      const featuredImageResult = await getFeaturedImageByProjectId(project.id);
      const allImagesResult = await getAllProjectImages(project.id);

      const featuredImage = featuredImageResult.success
        ? featuredImageResult.data
        : null;
      const allImages = allImagesResult.success ? allImagesResult.data : [];

      return { project, featuredImage, allImages };
    })
  );

  // Render the appropriate grid based on theme selection
  const renderGrid = () => {
    switch (gridType) {
      case "masonry":
        return <MasonryGrid projects={projects} username={username} />;
      case "grid":
        return <StandardGrid projects={projects} username={username} />;
      case "minimal":
        return <MinimalGrid projects={projects} username={username} />;
      case "square":
        return <SquareGrid projects={projects} username={username} />;
      default:
        return <MasonryGrid projects={projects} username={username} />;
    }
  };

  return (
    <>
      <ProfileHeader username={username} />
      <Section>
        <Container>{renderGrid()}</Container>
      </Section>
      <ProfileFooter username={username} />
      {/* Debug: Cache timestamp */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-0 right-0 p-2 bg-black/50 text-white text-xs">
          Rendered: {cacheTimestamp}
        </div>
      )}
    </>
  );
}
