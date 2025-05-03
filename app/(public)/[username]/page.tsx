import { getFeaturedImageByProjectId } from "@/lib/data/media";
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
      return { project, featuredImage };
    })
  );

  return (
    <Section>
      <Container>
        <MasonryGrid gap={10}>
          {projectsWithImages.length ? (
            projectsWithImages.map(({ project, featuredImage }) => (
              <Project
                key={project.id}
                project={project}
                featuredImage={featuredImage}
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
  username,
}: {
  project: Project;
  featuredImage: Media | null;
  username: string;
}) {
  return (
    <div className="flex flex-col gap-2 justify-end">
      <Link href={`/${username}/${project.slug}`}>
        <Image
          src={featuredImage?.url || ""}
          alt={project.title}
          width={featuredImage?.width || 0}
          height={featuredImage?.height || 0}
          className="object-cover w-full"
        />
      </Link>
      <Link className="sr-only" href={`/${username}/${project.slug}`}>
        <p>{project.title}</p>
      </Link>
    </div>
  );
}
