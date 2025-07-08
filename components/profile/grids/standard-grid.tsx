import { AsyncImage } from "@/components/ui/async-image";
import { ArrowUpRight } from "lucide-react";

import Link from "next/link";

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
		<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 border-l border-t border-border">
			{projects.map((project) => (
				<Link
					key={project.project.id}
					href={`/${username}/${project.project.slug}`}
					className="group p-4 hover:bg-accent/30 transition-colors border-r border-b border-border space-y-2"
				>
					<AsyncImage
						src={project.featuredImage!.url}
						alt={project.project.title}
						placeholder="shimmer"
						width={project.featuredImage!.width}
						height={project.featuredImage!.height}
					/>
					<h3 className="text-sm line-clamp-1 leading-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 justify-between">
						{project.project.title}{" "}
						<ArrowUpRight className="text-muted-foreground" size={16} />
					</h3>
				</Link>
			))}
		</div>
	);
}
