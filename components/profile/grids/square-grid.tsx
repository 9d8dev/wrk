import Link from "next/link";
import { AsyncImage } from "@/components/ui/async-image";
import type { Project, Media } from "@/db/schema";

interface SquareGridProps {
	projects: Array<{
		project: Project;
		featuredImage: Media | null;
		allImages: Media[];
	}>;
	username: string;
}

export function SquareGrid({ projects, username }: SquareGridProps) {
	return (
		<div className="grid grid-cols-2 lg:grid-cols-3 gap-1">
			{projects.map((project) => (
				<Link
					key={project.project.id}
					href={`/${username}/${project.project.slug}`}
					className="group relative aspect-square overflow-hidden bg-muted"
				>
					{project.featuredImage && (
						<>
							<AsyncImage
								className="object-cover transition-all duration-300"
								src={project.featuredImage.url}
								alt={project.project.title}
								fill
								sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
								placeholder="shimmer"
							/>
							<div className="absolute inset-0 flex gap-1.5 bg-gradient-to-tr from-accent/70 to-transparent items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
								<div>
									<h3 className="font-medium">{project.project.title}</h3>
									{project.project.about && (
										<p className="text-sm line-clamp-1">
											{project.project.about}
										</p>
									)}
								</div>
							</div>
						</>
					)}
				</Link>
			))}
		</div>
	);
}
