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
          className="block group max-w-lg mx-auto"
        >
          {project.featuredImage && (
            <AsyncImage
              src={project.featuredImage.url}
              alt={project.project.title}
              width={project.featuredImage.width}
              height={project.featuredImage.height}
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAAXNSR0IArs4c6QAAAIhJREFUKFNj/Pr1638GPIARWcGPHz/ASjk4OOBa4Aq+f/vGcPz4cQZ+fn4GI2NjBkZGRrAiuIJnz54xLJg3l0FRUZEhMDgEbgpcwbdv3xi2btnMwMLCwuDp5Y2p4P///wx379xhePHiOYOevgEDHx8fqhUg3u/fvxl+/fzJwM7BATYJxQ24fAoAALlC+XDzTI8AAAAASUVORK5CYII="
              className="max-w-full h-auto"
            />
          )}
        </Link>
      ))}
    </div>
  );
}
