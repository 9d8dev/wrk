import type { Media, Project } from "@/db/schema";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { AsyncImage } from "@/components/ui/async-image";

interface MinimalGridProps {
  projects: Array<{
    project: Project;
    featuredImage: Media | null;
    allImages: Media[];
  }>;
  username: string;
}

export function MinimalGrid({ projects, username }: MinimalGridProps) {
  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <Link
          key={project.project.id}
          href={`/${username}/${project.project.slug}`}
          className="group relative mx-auto flex max-w-3xl gap-6"
        >
          {project.featuredImage && (
            <AsyncImage
              src={project.featuredImage.url}
              alt={project.project.title}
              width={project.featuredImage.width}
              height={project.featuredImage.height}
              placeholder="shimmer"
            />
          )}
          <div className="absolute top-4 right-4 opacity-0 transition-opacity group-hover:opacity-100">
            <ArrowUpRight size={16} />
          </div>
        </Link>
      ))}
    </div>
  );
}
