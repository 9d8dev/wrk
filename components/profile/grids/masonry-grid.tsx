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

  // Track estimated heights for better distribution
  const columnHeights = new Array(columns).fill(0);

  projects.forEach((project) => {
    // Find the column with the least height
    const minHeightIndex = columnHeights.indexOf(Math.min(...columnHeights));
    projectColumns[minHeightIndex].push(project);

    // Estimate height based on image aspect ratio
    if (project.featuredImage) {
      const aspectRatio =
        project.featuredImage.width / project.featuredImage.height;
      // Constrain aspect ratio to prevent extreme layouts
      const constrainedRatio = Math.max(0.5, Math.min(2.5, aspectRatio));
      // Estimate height: base width of 350px divided by aspect ratio, plus padding
      const estimatedHeight = 350 / constrainedRatio + 60;
      columnHeights[minHeightIndex] += estimatedHeight;
    } else {
      // Default height for items without images
      columnHeights[minHeightIndex] += 200;
    }
  });

  // Helper function to get constrained aspect ratio
  const getAspectRatio = (width: number, height: number) => {
    const ratio = width / height;
    // Constrain between 0.5 (very tall) and 2.5 (very wide) to prevent layout issues
    return Math.max(0.5, Math.min(2.5, ratio));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projectColumns.map((column, columnIndex) => (
        <div key={columnIndex} className="flex flex-col gap-4">
          {column.map((project) => (
            <Link
              key={project.project.id}
              href={`/${username}/${project.project.slug}`}
              className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg"
            >
              {project.featuredImage && (
                <div
                  className="relative w-full"
                  style={{
                    aspectRatio: getAspectRatio(
                      project.featuredImage.width,
                      project.featuredImage.height
                    ),
                  }}
                >
                  <AsyncImage
                    className="object-cover transition-transform duration-300"
                    src={project.featuredImage.url}
                    alt={project.project.title}
                    width={project.featuredImage.width}
                    height={project.featuredImage.height}
                    fill
                    placeholder="shimmer"
                  />

                  <div className="flex items-end absolute w-full h-full bottom-0 left-0 aspect-square p-4 bg-gradient-to-tr from-foreground/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
