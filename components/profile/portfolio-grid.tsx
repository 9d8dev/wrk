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
		return (
			<div className="flex items-center justify-center py-24">
				<h2 className="text-lg text-muted-foreground">Portfolio coming soon</h2>
			</div>
		);
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
