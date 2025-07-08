import type { Media, Project } from "@/db/schema";

import Link from "next/link";

import { AsyncImage } from "@/components/ui/async-image";

interface SquareGridProps {
  projects: Array<{
    project: Project;
    featuredImage: Media | null;
    allImages: Media[];
  }>;
  username: string;
}

export function SquareGrid({ projects, username }: SquareGridProps) {
  return (
    <div className="grid grid-cols-2 gap-1 lg:grid-cols-3">
      {projects.map((project) => (
        <Link
          key={project.project.id}
          href={`/${username}/${project.project.slug}`}
          className="group bg-muted relative aspect-square overflow-hidden"
        >
          {project.featuredImage && (
            <>
              <AsyncImage
                className="object-cover transition-all duration-300"
                src={project.featuredImage.url}
                alt={project.project.title}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                placeholder="shimmer"
              />
              <div className="from-accent/70 absolute inset-0 flex items-end gap-1.5 bg-gradient-to-tr to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div>
                  <h3 className="font-medium">{project.project.title}</h3>
                  {project.project.about && (
                    <p className="line-clamp-1 text-sm">
                      {project.project.about}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </Link>
      ))}
    </div>
  );
}
