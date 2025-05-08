import { getFeaturedImageByProjectId, getAllProjectImages } from "@/lib/data/media";
import { getProjectByUsernameAndSlug } from "@/lib/data/project";
import { notFound } from "next/navigation";

import Image from "next/image";

import { Container, Section } from "@/components/ds";

import type { Project } from "@/db/schema";

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
  const mainImage = featuredImage || (allImages.length > 0 ? allImages[0] : null);
  
  // Get all other images (excluding the main one)
  const additionalImages = featuredImage
    ? allImages.filter(img => img.id !== featuredImage.id)
    : allImages.slice(1);

  return (
    <Section>
      <Container className="max-w-5xl mx-auto">
        <div className="space-y-8">
          {/* Project Title */}
          <h1 className="text-3xl font-bold">{project.title}</h1>
          
          {/* Main Image */}
          {mainImage && (
            <div className="rounded-lg overflow-hidden">
              <Image
                src={mainImage.url}
                alt={mainImage.alt || project.title}
                width={mainImage.width || 1200}
                height={mainImage.height || 800}
                className="w-full object-cover"
                priority
              />
            </div>
          )}
          
          {/* Image Gallery */}
          {additionalImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              {additionalImages.map((image) => (
                <div key={image.id} className="aspect-square rounded-lg overflow-hidden">
                  <Image
                    src={image.url}
                    alt={image.alt || `${project.title} image`}
                    width={400}
                    height={400}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
          
          {/* Project Content */}
          <div className="mt-8 prose prose-lg dark:prose-invert max-w-none">
            {project.about && (
              <div className="whitespace-pre-wrap">{project.about}</div>
            )}
          </div>
          
          {/* External Link */}
          {project.externalLink && (
            <div className="mt-6">
              <a 
                href={project.externalLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
              >
                Visit Project
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </a>
            </div>
          )}
        </div>
      </Container>
    </Section>
  );
}


