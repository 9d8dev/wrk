import Link from "next/link";
import { AsyncImage } from "@/components/ui/async-image";
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <Link
          key={project.project.id}
          href={`/${username}/${project.project.slug}`}
          className="group"
        >
          <div className="space-y-2">
            <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-muted">
              {project.featuredImage ? (
                <>
                  <AsyncImage
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    src={project.featuredImage.url}
                    alt={project.project.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    placeholder="shimmer"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No image
                </div>
              )}
            </div>
            <div>
              <h3 className="font-medium group-hover:text-primary transition-colors">
                {project.project.title}
              </h3>
              {project.project.about && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {project.project.about}
                </p>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}