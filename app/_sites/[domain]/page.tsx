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
import { getUserByCustomDomain } from "@/lib/data/user";
import { getThemeByUsername } from "@/lib/actions/theme";
import { notFound } from "next/navigation";

import type { Metadata } from "next";

import {
  getFeaturedImageByProjectId,
  getAllProjectImages,
} from "@/lib/data/media";

type Props = {
  params: Promise<{ domain: string }>;
};

// Configure ISR with different strategies based on content type
export const revalidate = 180; // 3 minutes - more reasonable for UGC platforms

// Metadata Generation
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { domain } = await params;
  
  // Get user by custom domain
  const userResult = await getUserByCustomDomain(domain);
  
  if (!userResult.success || !userResult.data) {
    return {
      title: "Portfolio | Wrk.so",
      description: "Portfolio created using Wrk.so.",
    };
  }

  const user = userResult.data;
  const profileResult = await getProfileByUsername(user.username);
  const profile = profileResult.success ? profileResult.data : null;

  return {
    title: `${user.name} | ${profile?.profile.title || user.name}`,
    description:
      profile?.profile.bio ||
      `Collection of works created by ${user.name}. Portfolio created using Wrk.so.`,
  };
}

// Page Component
export default async function CustomDomainPage({ params }: Props) {
  const { domain } = await params;
  
  // Get user by custom domain (includes Pro subscription validation)
  const userResult = await getUserByCustomDomain(domain);
  
  if (!userResult.success || !userResult.data) {
    return notFound();
  }

  const user = userResult.data;
  const username = user.username;

  // Get user's projects
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
      
      const featuredImage = featuredImageResult.success ? featuredImageResult.data : null;
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
      {/* No branding for Pro users on custom domains */}
    </>
  );
}