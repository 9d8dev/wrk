import { Container, Section } from "@/components/ds";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileFooter } from "@/components/profile/profile-footer";

import Image from "next/image";

import { getProjectByUsernameAndSlug } from "@/lib/data/project";
import { getProfileByUsername } from "@/lib/data/profile";
import { getUserByUsername } from "@/lib/data/user";
import { getAllUsers } from "@/lib/data/user";
import { notFound } from "next/navigation";
import {
  getFeaturedImageByProjectId,
  getAllProjectImages,
} from "@/lib/data/media";

import type { Metadata, ResolvingMetadata } from "next";

type Props = {
  params: Promise<{ username: string; projectSlug: string }>;
};

// SSG
export async function generateStaticParams() {
  const users = await getAllUsers();
  return users.map((user) => ({ username: user.username }));
}

// Metadata Generation
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { username, projectSlug } = await params;
  const profile = await getProfileByUsername(username);
  const user = await getUserByUsername(username);
  const project = await getProjectByUsernameAndSlug(username, projectSlug);
  const featuredImage = project
    ? await getFeaturedImageByProjectId(project.id)
    : null;

  // Fallback to first project image if no featured image
  const allImages = project ? await getAllProjectImages(project.id) : [];
  const ogImage = featuredImage || (allImages.length > 0 ? allImages[0] : null);

  return {
    title: `${project?.title} by ${user.name} | ${profile?.title || "Wrk.so"}`,
    description:
      (project?.about && project.about.length > 160
        ? project.about.substring(0, 157) + "..."
        : project?.about) ||
      `${project?.title} created by ${user.name}. Portfolio created using Wrk.so.`,
    openGraph: ogImage
      ? {
          images: [
            {
              url: ogImage.url,
              width: ogImage.width || 1200,
              height: ogImage.height || 630,
              alt: ogImage.alt || project?.title || "Project image",
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
              alt: ogImage.alt || project?.title || "Project image",
            },
          ],
        }
      : undefined,
  };
}

// Page
export default async function ProjectPage({ params }: Props) {
  const { username, projectSlug } = await params;
  const project = await getProjectByUsernameAndSlug(username, projectSlug);

  if (!project) {
    return notFound();
  }

  const featuredImage = await getFeaturedImageByProjectId(project.id);
  const allImages = await getAllProjectImages(project.id);

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
          {mainImage && (
            <Image
              src={mainImage.url}
              alt={mainImage.alt || project.title}
              width={mainImage.width || 1200}
              height={mainImage.height || 800}
              priority
            />
          )}
          {additionalImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {additionalImages.map((image) => (
                <Image
                  key={image.id}
                  src={image.url}
                  alt={image.alt || `${project.title} image`}
                  width={400}
                  height={400}
                />
              ))}
            </div>
          )}
        </Container>
      </Section>
      <ProfileFooter username={username} />
    </>
  );
}
