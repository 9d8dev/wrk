"use client";

import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";

interface PostHogUserIdentifierProps {
  user: {
    id: string;
    name: string;
    email: string;
    username: string;
    subscriptionStatus?: string | null;
    customDomain?: string | null;
    createdAt: Date;
  } | null;
}

export function PostHogUserIdentifier({ user }: PostHogUserIdentifierProps) {
  const posthog = usePostHog();

  useEffect(() => {
    if (posthog && user) {
      console.log("Identifying user in PostHog:", user.id);

      // Identify the user in PostHog
      posthog.identify(user.id, {
        email: user.email,
        name: user.name,
        username: user.username,
        subscription_status: user.subscriptionStatus,
        has_custom_domain: !!user.customDomain,
        custom_domain: user.customDomain,
        user_created_at: user.createdAt.toISOString(),
        is_pro: user.subscriptionStatus === "active",
        identified_at: new Date().toISOString(),
      });

      // Set user properties for group-level analytics
      posthog.group("subscription", user.subscriptionStatus || "free", {
        subscription_status: user.subscriptionStatus || "free",
        is_pro: user.subscriptionStatus === "active",
      });

      if (user.customDomain) {
        posthog.group("domain", user.customDomain, {
          domain_type: "custom",
          portfolio_owner: user.username,
        });
      }

      // Track user identification event
      posthog.capture("user_identified", {
        user_id: user.id,
        username: user.username,
        is_pro: user.subscriptionStatus === "active",
        has_custom_domain: !!user.customDomain,
        timestamp: new Date().toISOString(),
      });
    } else if (posthog && !user) {
      console.log("Resetting PostHog identification");
      // Reset identification when user logs out
      posthog.reset();
    }
  }, [posthog, user]);

  return null;
}
