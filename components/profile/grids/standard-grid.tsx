import { AsyncImage } from "@/components/ui/async-image";
import { ArrowUpRight } from "lucide-react";

import Link from "next/link";

import type { Project, Media } from "@/db/schema";

interface StandardGridProps {
  projects: Array<{
    project: Project;
    featuredImage: Media | null;
    allImages: Media[];
  }>;
  username: string;
}

export function StandardGrid({ projects, username }: StandardGridProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 border-l border-t border-border">
      {projects.map((project) => (
        <Link
          key={project.project.id}
          href={`/${username}/${project.project.slug}`}
          className="group relative p-6 hover:bg-accent/30 transition-colors border-r border-b border-border"
        >
          <div className="relative mb-3">
            <AsyncImage
              src={project.featuredImage!.url}
              alt={project.project.title}
              placeholder="shimmer"
              width={project.featuredImage!.width}
              height={project.featuredImage!.height}
            />
            <h3 className="text-sm font-medium absolute -bottom-6 line-clamp-1 left-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1 justify-between w-full">
              {project.project.title}{" "}
              <ArrowUpRight className="text-muted-foreground" size={16} />
            </h3>
          </div>
        </Link>
      ))}
    </div>
  );
}
