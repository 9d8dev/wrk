import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
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
    <div className="space-y-16">
      {projects.map((project, index) => (
        <Link
          key={project.project.id}
          href={`/${username}/${project.project.slug}`}
          className="block group"
        >
          <div className={cn(
            "grid gap-8 items-center",
            index % 2 === 0 ? "lg:grid-cols-2" : "lg:grid-cols-2"
          )}>
            <div className={cn(
              "space-y-4",
              index % 2 === 0 ? "lg:order-1" : "lg:order-2"
            )}>
              <h2 className="text-2xl md:text-3xl font-light tracking-tight group-hover:text-primary transition-colors">
                {project.project.title}
              </h2>
              {project.project.about && (
                <p className="text-muted-foreground leading-relaxed">
                  {project.project.about}
                </p>
              )}
              {project.project.externalLink && (
                <p className="text-sm text-primary">
                  View Project →
                </p>
              )}
            </div>
            
            <div className={cn(
              "relative aspect-[16/10] overflow-hidden bg-muted",
              index % 2 === 0 ? "lg:order-2" : "lg:order-1"
            )}>
              {project.featuredImage ? (
                <Image
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  src={project.featuredImage.url}
                  alt={project.project.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No image
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}