import {
	MasonryGrid,
	MinimalGrid,
	SquareGrid,
	StandardGrid,
} from "@/components/profile/grids";
import type { GridType, ProjectWithImages } from "@/types/portfolio";

interface PortfolioGridProps {
	projects: ProjectWithImages[];
	username: string;
	gridType: GridType;
}

export function PortfolioGrid({
	projects,
	username,
	gridType,
}: PortfolioGridProps) {
	if (!projects.length) {
		return <h2 className="text-muted-foreground">Portfolio coming soon</h2>;
	}

	switch (gridType) {
		case "masonry":
			return <MasonryGrid projects={projects} username={username} />;
		case "grid":
			return <StandardGrid projects={projects} username={username} />;
		case "minimal":
			return <MinimalGrid projects={projects} username={username} />;
		case "square":
			return <SquareGrid projects={projects} username={username} />;
		default:
			return <MasonryGrid projects={projects} username={username} />;
	}
}
