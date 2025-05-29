import Link from "next/link";
import { AsyncImage } from "@/components/ui/async-image";
import type { Project, Media } from "@/db/schema";

interface MasonryGridProps {
  projects: Array<{
    project: Project;
    featuredImage: Media | null;
    allImages: Media[];
  }>;
  username: string;
}

export function MasonryGrid({ projects, username }: MasonryGridProps) {
  // Split projects into columns for masonry layout
  const columns = 3;
  const projectColumns: (typeof projects)[] = Array.from(
    { length: columns },
    () => []
  );

  projects.forEach((project, index) => {
    projectColumns[index % columns].push(project);
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projectColumns.map((column, columnIndex) => (
        <div key={columnIndex} className="flex flex-col gap-4">
          {column.map((project) => (
            <Link
              key={project.project.id}
              href={`/${username}/${project.project.slug}`}
              className="group relative overflow-hidden"
            >
              {project.featuredImage && (
                <div
                  className="relative w-full"
                  style={{
                    aspectRatio: `${project.featuredImage.width} / ${project.featuredImage.height}`,
                  }}
                >
                  <AsyncImage
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    src={project.featuredImage.url}
                    alt={project.project.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    placeholder="shimmer"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <h3 className="text-white font-medium">
                      {project.project.title}
                    </h3>
                  </div>
                </div>
              )}
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}
