"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function createCheckoutSession(productSlug: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("User not authenticated");
  }

  try {
    // Use the Better Auth API endpoint for Polar checkout
    const response = await fetch(
      `${
        process.env.BETTER_AUTH_URL || "http://localhost:3000"
      }/api/auth/polar/checkout`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: (await headers()).get("cookie") || "",
        },
        body: JSON.stringify({ productSlug }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to create checkout session");
    }

    const data = await response.json();
    if (data.url) {
      redirect(data.url);
    }
  } catch (error) {
    console.error("Checkout error:", error);
    throw new Error("Failed to create checkout session");
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
    // Use the Better Auth API endpoint for Polar portal
    const response = await fetch(
      `${
        process.env.BETTER_AUTH_URL || "http://localhost:3000"
      }/api/auth/polar/portal`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: (await headers()).get("cookie") || "",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to create portal session");
    }

    const data = await response.json();
    if (data.url) {
      redirect(data.url);
    }
  } catch (error) {
    console.error("Portal session error:", error);
    throw new Error("Failed to create portal session");
  }
}

interface UserWithPolar {
  id: string;
  name?: string | null;
  email?: string | null;
  username?: string | null;
  polarCustomerId?: string | null;
}

export async function getUserSubscription() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return null;
  }

  // Check if user has Polar customer ID
  const user = session.user as UserWithPolar;
  return user.polarCustomerId || null;
}
