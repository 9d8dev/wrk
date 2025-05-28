"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { polarConfig } from "@/lib/config/polar";

export async function createCheckoutSession(productSlug: string) {
  console.log("🚀 Starting checkout session creation for slug:", productSlug);

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    console.error("❌ User not authenticated");
    throw new Error("User not authenticated");
  }

  console.log("✅ User authenticated:", {
    userId: session.user.id,
    email: session.user.email,
    username: session.user.username,
  });

  // Validate product slug exists in config
  const product = polarConfig.products.find((p) => p.slug === productSlug);
  if (!product) {
    console.error("❌ Product not found for slug:", productSlug);
    console.log(
      "Available products:",
      polarConfig.products.map((p) => p.slug)
    );
    throw new Error(`Product not found for slug: ${productSlug}`);
  }

  console.log("✅ Product found:", {
    productId: product.productId,
    slug: product.slug,
    name: product.name,
  });

  try {
    console.log("🔄 Creating checkout session via direct API call...");

    // Create checkout session using direct API call to the auth endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const checkoutUrl = `${baseUrl}/api/auth/polar/checkout`;

    const response = await fetch(checkoutUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: (await headers()).get("cookie") || "",
      },
      body: JSON.stringify({
        slug: productSlug,
      }),
    });

    console.log("📊 Checkout response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Checkout API error:", errorText);
      throw new Error(`Checkout API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log("📊 Checkout result:", result);

    if (result?.url) {
      console.log("✅ Checkout URL created:", result.url);
      redirect(result.url);
    } else {
      console.error("❌ No URL returned from checkout");
      console.log("Full result object:", JSON.stringify(result, null, 2));
      throw new Error("Failed to create checkout session - no URL returned");
    }
  } catch (error) {
    console.error("💥 Checkout error details:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      productSlug,
      userId: session.user.id,
      timestamp: new Date().toISOString(),
    });

    // Check if it's a Polar API error
    if (error instanceof Error && error.message.includes("Polar")) {
      throw new Error(`Polar API Error: ${error.message}`);
    }

    // Check if it's an authentication error
    if (error instanceof Error && error.message.includes("401")) {
      throw new Error("Polar authentication failed - check POLAR_ACCESS_TOKEN");
    }

    // Check if it's a product configuration error
    if (error instanceof Error && error.message.includes("product")) {
      throw new Error(`Product configuration error: ${error.message}`);
    }

    throw new Error(
      `Failed to create checkout session: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function createCustomerPortalSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("User not authenticated");
  }

  try {
    console.log("🔄 Creating customer portal session via direct API call...");

    // Create portal session using direct API call to the auth endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const portalUrl = `${baseUrl}/api/auth/polar/portal`;

    const response = await fetch(portalUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: (await headers()).get("cookie") || "",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Portal API error:", errorText);
      throw new Error(`Portal API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log("📊 Portal result:", result);

    if (result?.url) {
      redirect(result.url);
    } else {
      throw new Error("Failed to create portal session - no URL returned");
    }
  } catch (error) {
    console.error("Portal error:", error);
    throw new Error("Failed to create portal session");
  }
}

export async function getCustomerState() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return null;
  }

  try {
    console.log("🔄 Getting customer state via direct API call...");

    // Get customer state using direct API call to the auth endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const stateUrl = `${baseUrl}/api/auth/polar/customer-state`;

    const response = await fetch(stateUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: (await headers()).get("cookie") || "",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Customer state API error:", errorText);
      return null;
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error fetching customer state:", error);
    return null;
  }
}

export async function hasActiveProSubscription(): Promise<boolean> {
  // Use our new subscription helper function
  const { hasActiveProSubscription: hasActiveSub } = await import(
    "@/lib/actions/subscription"
  );
  return hasActiveSub();
}
