import { Skeleton } from "@/components/ui/skeleton";

export function PortfolioLoading() {
	const skeletonItems = Array.from({ length: 6 }, (_, i) => ({
		id: `portfolio-skeleton-${Date.now()}-${i}`,
	}));

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{skeletonItems.map((item) => (
					<div key={item.id} className="space-y-2">
						<Skeleton className="aspect-[4/3] w-full" />
						<Skeleton className="h-4 w-3/4" />
					</div>
				))}
			</div>
		</div>
	);
}
