import Link from "next/link";
import { AsyncImage } from "@/components/ui/async-image";
import type { Media, Project } from "@/db/schema";

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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projectColumns.map((column, columnIndex) => {
        // Generate a stable key based on the first project in the column
        const columnKey =
          column.length > 0
            ? `masonry-col-${column[0].project.id}`
            : `masonry-col-empty-${columnIndex}`;

        return (
          <div key={columnKey} className="flex flex-col gap-4">
            {column.map((project) => (
              <Link
                key={project.project.id}
                href={`/${username}/${project.project.slug}`}
                className="group relative overflow-hidden transition-all duration-300"
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

                    <div className="from-foreground/40 absolute bottom-0 left-0 flex aspect-square h-full w-full items-end bg-gradient-to-tr via-transparent to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <h3 className="font-medium text-white">
                        {project.project.title}
                      </h3>
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        );
      })}
    </div>
  );
}
