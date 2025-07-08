import Link from "next/link";
import { AsyncImage } from "@/components/ui/async-image";
import type { Project, Media } from "@/db/schema";
import { ArrowUpRight } from "lucide-react";

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
			{projects.map((project) => (
				<Link
					key={project.project.id}
					href={`/${username}/${project.project.slug}`}
					className="group mx-auto relative flex gap-6 max-w-3xl"
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
					<div className="absolute opacity-0 group-hover:opacity-100 transition-opacity top-4 right-4">
						<ArrowUpRight size={16} />
					</div>
				</Link>
			))}
		</div>
	);
}
