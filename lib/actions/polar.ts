"use server";

import { authClient } from "@/lib/auth-client";
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
    // Use the Better Auth client method for checkout
    await authClient.checkout({
      slug: productSlug,
    });
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
    // Use the Better Auth client method for portal
    await authClient.customer.portal();
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
    const { data: customerState } = await authClient.customer.state();
    return customerState;
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
    const { data: subscriptions } = await authClient.customer.subscriptions.list({
      query: {
        page: 1,
        limit: 10,
        active: true,
      },
    });
    return subscriptions;
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
      (subscription: any) => subscription.status === 'active'
    );

    return hasActiveSubscription || false;
  } catch (error) {
    console.error("Error checking subscription status:", error);
    return false;
  }
}
