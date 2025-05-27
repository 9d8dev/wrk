"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SubscriptionData } from "@/lib/polar-webhook-types";

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
      `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/api/auth/polar/checkout`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: (await headers()).get("cookie") || "",
        },
        body: JSON.stringify({ slug: productSlug }),
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
      `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/api/auth/polar/portal`,
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

export async function getCustomerState() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return null;
  }

  try {
    // Use the Better Auth API endpoint for customer state
    const response = await fetch(
      `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/api/auth/polar/customer/state`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          cookie: (await headers()).get("cookie") || "",
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching customer state:", error);
    return null;
  }
}

export async function getCustomerSubscriptions() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return null;
  }

  try {
    // Use the Better Auth API endpoint for subscriptions
    const response = await fetch(
      `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/api/auth/polar/customer/subscriptions`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          cookie: (await headers()).get("cookie") || "",
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return null;
  }
}

export async function hasActiveProSubscription(): Promise<boolean> {
  try {
    const customerState = await getCustomerState();
    if (!customerState) return false;

    // Check if user has any active subscriptions
    const hasActiveSubscription = customerState.subscriptions?.some(
      (subscription: SubscriptionData) => subscription.status === 'active'
    );

    return hasActiveSubscription || false;
  } catch (error) {
    console.error("Error checking subscription status:", error);
    return false;
  }
}
