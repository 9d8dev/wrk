import { Container, Section } from "@/components/ds";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileFooter } from "@/components/profile/profile-footer";
import { AsyncImage } from "@/components/ui/async-image";

import { getProjectByUsernameAndSlug } from "@/lib/data/project";
import { getProfileByUsername } from "@/lib/data/profile";
import { getUserByUsername } from "@/lib/data/user";
import { getAllUsers } from "@/lib/data/user";
import { notFound } from "next/navigation";
import {
  getFeaturedImageByProjectId,
  getAllProjectImages,
} from "@/lib/data/media";

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpLeft } from "lucide-react";

type Props = {
  params: Promise<{ username: string; projectSlug: string }>;
};

// SSG
export async function generateStaticParams() {
  const usersResult = await getAllUsers();
  if (!usersResult.success) {
    return [];
  }
  return usersResult.data.items.map((user) => ({ username: user.username }));
}

// Metadata Generation
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, projectSlug } = await params;
  const profileResult = await getProfileByUsername(username);
  const userResult = await getUserByUsername(username);
  const projectResult = await getProjectByUsernameAndSlug(username, projectSlug);
  
  if (!userResult.success || !userResult.data || !projectResult.success || !projectResult.data) {
    return {
      title: "Project | Wrk.so",
      description: "Portfolio project created using Wrk.so.",
    };
  }
  
  const user = userResult.data;
  const profile = profileResult.success ? profileResult.data : null;
  const project = projectResult.data.project;
  
  const featuredImageResult = await getFeaturedImageByProjectId(project.id);
  const allImagesResult = await getAllProjectImages(project.id);
  
  const featuredImage = featuredImageResult.success ? featuredImageResult.data : null;
  const allImages = allImagesResult.success ? allImagesResult.data : [];
  const ogImage = featuredImage || (allImages.length > 0 ? allImages[0] : null);

  return {
    title: `${project.title} by ${user.name} | ${profile?.profile.title || "Wrk.so"}`,
    description:
      (project.about && project.about.length > 160
        ? project.about.substring(0, 157) + "..."
        : project.about) ||
      `${project.title} created by ${user.name}. Portfolio created using Wrk.so.`,
    openGraph: ogImage
      ? {
          images: [
            {
              url: ogImage.url,
              width: ogImage.width || 1200,
              height: ogImage.height || 630,
              alt: ogImage.alt || project.title || "Project image",
            },
          ],
        }
      : undefined,
    twitter: ogImage
      ? {
          card: "summary_large_image",
          images: [
            {
              url: ogImage.url,
              alt: ogImage.alt || project.title || "Project image",
            },
          ],
        }
      : undefined,
  };
}

// Page
export default async function ProjectPage({ params }: Props) {
  const { username, projectSlug } = await params;
  const projectResult = await getProjectByUsernameAndSlug(username, projectSlug);

  if (!projectResult.success || !projectResult.data) {
    return notFound();
  }

  const project = projectResult.data.project;
  const featuredImageResult = await getFeaturedImageByProjectId(project.id);
  const allImagesResult = await getAllProjectImages(project.id);
  
  const featuredImage = featuredImageResult.success ? featuredImageResult.data : null;
  const allImages = allImagesResult.success ? allImagesResult.data : [];

  const mainImage =
    featuredImage || (allImages.length > 0 ? allImages[0] : null);

  const additionalImages = featuredImage
    ? allImages.filter((img) => img.id !== featuredImage.id)
    : allImages.slice(1);

  return (
    <>
      <ProfileHeader username={username} />
      <Section>
        <Container className="flex justify-between items-start gap-6">
          <div>
            <h1>{project.title}</h1>
            {project.about && (
              <h3 className="text-muted-foreground">{project.about}</h3>
            )}
            <Link
              href={`/${username}`}
              className="text-muted-foreground hover:text-foreground transition-colors text-sm mt-4 flex items-center gap-1"
            >
              <ArrowUpLeft size={12} /> Back to Portfolio
            </Link>
          </div>
          {project.externalLink && (
            <a
              href={project.externalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors text-sm mt-4 block"
            >
              Visit Project
            </a>
          )}
        </Container>
        <Container>
          <div className="space-y-4">
            {mainImage && (
              <AsyncImage
                src={mainImage.url}
                alt={mainImage.alt || project.title}
                placeholder="shimmer"
                width={mainImage.width}
                height={mainImage.height}
              />
            )}
            {additionalImages.map((image) => (
              <AsyncImage
                key={image.id}
                src={image.url}
                alt={image.alt || `${project.title} image`}
                placeholder="shimmer"
                width={image.width}
                height={image.height}
              />
            ))}
          </div>
        </Container>
      </Section>
      <ProfileFooter username={username} />
    </>
  );
}
