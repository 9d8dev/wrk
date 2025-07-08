import type { Media, Project } from "@/db/schema";

export type GridType = "masonry" | "grid" | "minimal" | "square";

export interface ProjectWithImages {
	project: Project;
	featuredImage: Media | null;
	allImages: Media[];
}

export interface PortfolioData {
	projects: ProjectWithImages[];
	gridType: GridType;
}
