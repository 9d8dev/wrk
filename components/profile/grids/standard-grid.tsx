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
          className="group block"
        >
          <div className="space-y-3">
            <div className="relative aspect-[4/3] overflow-hidden bg-muted transition-all duration-300 group-hover:shadow-lg">
              {project.featuredImage ? (
                <>
                  <AsyncImage
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.01]"
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
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-2 bg-muted-foreground/10 flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-sm">No preview</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <h3 className="font-medium text-lg group-hover:text-primary transition-colors line-clamp-1">
                {project.project.title}
              </h3>
              {project.project.about && (
                <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
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
