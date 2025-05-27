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
  const users = await getAllUsers();
  return users.map((user) => ({ username: user.username }));
}

// Metadata Generation
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, projectSlug } = await params;
  const profile = await getProfileByUsername(username);
  const user = await getUserByUsername(username);
  const project = await getProjectByUsernameAndSlug(username, projectSlug);
  const featuredImage = project
    ? await getFeaturedImageByProjectId(project.id)
    : null;

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
              <div className="relative w-full aspect-video overflow-hidden bg-muted">
                <AsyncImage
                  src={mainImage.url}
                  alt={mainImage.alt || project.title}
                  fill
                  priority
                  placeholder="shimmer"
                  className="object-contain"
                  sizes="(max-width: 1536px) 100vw, 1536px"
                />
              </div>
            )}
            {additionalImages.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {additionalImages.map((image) => (
                  <div
                    key={image.id}
                    className="relative w-full aspect-video overflow-hidden bg-muted"
                  >
                    <AsyncImage
                      src={image.url}
                      alt={image.alt || `${project.title} image`}
                      fill
                      placeholder="shimmer"
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </Container>
      </Section>
      <ProfileFooter username={username} />
    </>
  );
}
