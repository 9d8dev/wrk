"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { usePostHogEvents } from "@/components/analytics";

interface UpgradeButtonProps {
	productSlug: string;
	price: string;
	className?: string;
	size?: "sm" | "default" | "lg";
	variant?:
		| "default"
		| "outline"
		| "secondary"
		| "ghost"
		| "link"
		| "destructive";
}

export function UpgradeButton({
	productSlug,
	price,
	className,
	size = "sm",
	variant = "default",
}: UpgradeButtonProps) {
	const [isLoading, setIsLoading] = useState(false);
	const { trackUpgradeClicked } = usePostHogEvents();

	const handleUpgrade = async () => {
		setIsLoading(true);
		trackUpgradeClicked();
		try {
			console.log(
				"🚀 Starting checkout with authClient for slug:",
				productSlug,
			);

			// Use the client-side checkout method as per Polar documentation
			await authClient.checkout({
				slug: productSlug,
			});

			console.log("✅ Checkout initiated successfully");
		} catch (error) {
			console.error("💥 Checkout error:", error);
			toast.error("Failed to start checkout. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Button
			onClick={handleUpgrade}
			className={className}
			size={size}
			variant={variant}
			disabled={isLoading}
		>
			{isLoading ? "Loading..." : `Upgrade - ${price}`}
		</Button>
	);
}

interface UpgradePlanCardProps {
	productInfo: {
		slug: string;
		name: string;
		description: string;
		features: string[];
		price: string;
	};
}

export function UpgradePlanCard({ productInfo }: UpgradePlanCardProps) {
	return (
		<div className="p-2.5 border rounded-md bg-background space-y-1">
			<p>Upgrade to {productInfo.name}</p>
			<p className="text-muted-foreground text-xs">{productInfo.description}</p>
			<ul className="space-y-1 text-xs mt-2 mb-4">
				{productInfo.features.slice(0, 3).map((feature, index) => (
					<li key={index}>
						<Check className="inline" size={12} /> {feature}
					</li>
				))}
			</ul>
			<UpgradeButton
				productSlug={productInfo.slug}
				price={productInfo.price}
				className="w-full"
			/>
		</div>
	);
}
