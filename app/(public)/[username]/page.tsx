import { Section, Container } from "@/components/ds";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileFooter } from "@/components/profile/profile-footer";
import { 
  MasonryGrid, 
  StandardGrid, 
  MinimalGrid, 
  SquareGrid 
} from "@/components/profile/grids";

import { getProjectsByUsername } from "@/lib/data/project";
import { getProfileByUsername } from "@/lib/data/profile";
import { getUserByUsername } from "@/lib/data/user";
import { getAllUsers } from "@/lib/data/user";
import { getThemeByUsername } from "@/lib/actions/theme";
import { notFound } from "next/navigation";

import type { Metadata } from "next";

import {
  getFeaturedImageByProjectId,
  getAllProjectImages,
} from "@/lib/data/media";

type Props = {
  params: Promise<{ username: string }>;
};

// SSG
export async function generateStaticParams() {
  const users = await getAllUsers();
  return users.map((user) => ({ username: user.username }));
}

// Metadata Generation
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  const user = await getUserByUsername(username);

  return {
    title: `${user.name} | ${profile?.title || "Wrk.so"}`,
    description:
      profile?.bio ||
      `Collection of works created by ${user.name}. Portfolio created using Wrk.so.`,
  };
}

// Page
export default async function PortfolioPage({ params }: Props) {
  const { username } = await params;

  const allProjects = await getProjectsByUsername(username);

  if (!allProjects) {
    return notFound();
  }

  // Get user's theme preference
  const userTheme = await getThemeByUsername(username);
  const gridType = userTheme?.gridType || "masonry"; // Default to masonry

  const projects = await Promise.all(
    allProjects.map(async (project) => {
      const featuredImage = await getFeaturedImageByProjectId(project.id);
      const allImages = await getAllProjectImages(project.id);
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
        <Container>
          {renderGrid()}
        </Container>
      </Section>
      <ProfileFooter username={username} />
    </>
  );
}
