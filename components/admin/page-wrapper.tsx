import { cn } from "@/lib/utils";

export const PageWrapper = ({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) => {
	return (
		<section className={cn("space-y-6 px-4 pt-4 pb-12", className)}>
			{children}
		</section>
	);
};
