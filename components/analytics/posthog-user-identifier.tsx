"use client";

import { useEffect } from "react";
import { usePostHog } from "posthog-js/react";

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
		} else if (posthog && !user) {
			// Reset identification when user logs out
			posthog.reset();
		}
	}, [posthog, user]);

	return null;
}
