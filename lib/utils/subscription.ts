import { getUserSubscriptionDetails } from "@/lib/actions/subscription";

import { SubscriptionDetails } from "@/types/subscription";

export function hasActiveSubscription(
  subscriptionDetails: SubscriptionDetails
): boolean {
  return (
    subscriptionDetails?.subscriptionStatus === "active" &&
    subscriptionDetails?.subscriptionCurrentPeriodEnd &&
    subscriptionDetails.subscriptionCurrentPeriodEnd > new Date()
  );
}

export async function getSubscriptionDetailsWithErrorHandling(): Promise<SubscriptionDetails> {
  try {
    return await getUserSubscriptionDetails();
  } catch (error) {
    console.error("Failed to load subscription details:", error);
    return null;
  }
}

export function formatRenewalDate(date: Date): string {
  return new Date(date).toLocaleDateString();
}
