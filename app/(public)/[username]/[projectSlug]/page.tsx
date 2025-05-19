import {
  getFeaturedImageByProjectId,
  getAllProjectImages,
} from "@/lib/data/media";
import { getProjectByUsernameAndSlug } from "@/lib/data/project";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Container, Section } from "@/components/ds";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileFooter } from "@/components/profile/profile-footer";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ username: string; projectSlug: string }>;
}) {
  const { username, projectSlug } = await params;
  const project = await getProjectByUsernameAndSlug(username, projectSlug);

  if (!project) {
    return notFound();
  }

  const featuredImage = await getFeaturedImageByProjectId(project.id);
  const allImages = await getAllProjectImages(project.id);

  // Use featured image as first image, or use the first image from allImages
  const mainImage =
    featuredImage || (allImages.length > 0 ? allImages[0] : null);

  // Get all other images (excluding the main one)
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
