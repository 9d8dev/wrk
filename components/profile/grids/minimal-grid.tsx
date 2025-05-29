import Link from "next/link";
import { AsyncImage } from "@/components/ui/async-image";
import type { Project, Media } from "@/db/schema";

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
      {projects.map((project, index) => (
        <Link
          key={project.project.id}
          href={`/${username}/${project.project.slug}`}
          className="group mx-auto relative flex gap-6 max-w-lg"
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
          <div className="py-2 absolute top-0 -right-68 opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 w-64">
            <h3 className="line-clamp-1">{project.project.title}</h3>
            {project.project.about && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {project.project.about}
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
