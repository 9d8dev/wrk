// Validate required environment variables at module level
const POLAR_PRO_PRODUCT_ID = process.env.POLAR_PRO_PRODUCT_ID;
if (!POLAR_PRO_PRODUCT_ID) {
  throw new Error("POLAR_PRO_PRODUCT_ID is required");
}

export const polarConfig = {
  products: [
    {
      productId: POLAR_PRO_PRODUCT_ID,
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
