import {
  getFeaturedImageByProjectId,
  getAllProjectImages,
} from "@/lib/data/media";
import { getProjectsByUsername } from "@/lib/data/project";
import { notFound } from "next/navigation";

import { Section, Container } from "@/components/ds";
import { MasonryGrid } from "@/components/masonary/masonary-grid";

import Link from "next/link";
import Image from "next/image";

import type { Media, Project } from "@/db/schema";

export default async function PortfolioPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const projects = await getProjectsByUsername(username);

  if (!projects) {
    return notFound();
  }

  const projectsWithImages = await Promise.all(
    projects.map(async (project) => {
      const featuredImage = await getFeaturedImageByProjectId(project.id);
      const allImages = await getAllProjectImages(project.id);
      return { project, featuredImage, allImages };
    })
  );

  return (
    <Section>
      <Container>
        <MasonryGrid gap={10}>
          {projectsWithImages.length ? (
            projectsWithImages.map(({ project, featuredImage, allImages }) => (
              <Project
                key={project.id}
                project={project}
                featuredImage={featuredImage}
                allImages={allImages}
                username={username}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              Loading projects...
            </div>
          )}
        </MasonryGrid>
      </Container>
    </Section>
  );
}

function Project({
  project,
  featuredImage,
  allImages,
  username,
}: {
  project: Project;
  featuredImage: Media | null;
  allImages: Media[];
  username: string;
}) {
  // Use featured image or first available image
  const mainImage =
    featuredImage || (allImages.length > 0 ? allImages[0] : null);

  // Get additional images (excluding the main one)
  const additionalImages = featuredImage
    ? allImages.filter((img) => img.id !== featuredImage.id).slice(0, 3)
    : allImages.slice(1, 4);

  // Determine if we should show the image grid
  const showGrid = additionalImages.length > 0;

  return (
    <div className="flex flex-col gap-2 justify-end group overflow-hidden rounded-lg">
      <Link href={`/${username}/${project.slug}`} className="relative">
        {mainImage ? (
          <Image
            src={mainImage.url}
            alt={project.title}
            width={mainImage.width || 800}
            height={mainImage.height || 600}
            className="object-cover w-full transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="bg-gray-200 dark:bg-gray-800 aspect-video w-full flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">{project.title}</p>
          </div>
        )}

        {/* Overlay with project title */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-end p-4">
          <h3 className="text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {project.title}
          </h3>
        </div>
      </Link>

      {/* Show thumbnail grid for additional images */}
      {showGrid && (
        <div className="grid grid-cols-3 gap-1 mt-1">
          {additionalImages.map((image, index) => (
            <div key={image.id} className="aspect-square overflow-hidden">
              <Image
                src={image.url}
                alt={`${project.title} - Image ${index + 2}`}
                width={200}
                height={200}
                className="object-cover w-full h-full"
              />
            </div>
          ))}

          {allImages.length > 4 && (
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
              +{allImages.length - 4} more
            </div>
          )}
        </div>
      )}
    </div>
  );
}
