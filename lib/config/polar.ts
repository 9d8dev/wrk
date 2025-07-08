export const polarConfig = {
	products: [
		{
			productId: process.env.POLAR_PRO_PRODUCT_ID!,
			slug: "wrk-pro",
			name: "Pro Plan",
			description: "Unlock all features for your portfolio",
			features: [
				"Custom Domain",
				"Unlimited Projects",
				"Priority Support",
				"Advanced Analytics",
				"Remove Wrk.so Branding",
			],
			price: "$12/mo",
		},
	],
	successUrl: "/admin?checkout=success",
	cancelUrl: "/admin?checkout=cancelled",
};
