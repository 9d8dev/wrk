"use client";

import { usePostHog } from "posthog-js/react";
import { useCallback } from "react";

export function usePostHogEvents() {
	const posthog = usePostHog();

	const trackEvent = useCallback(
		(
			event: string,
			properties?: Record<string, string | number | boolean | Date>,
		) => {
			if (posthog) {
				posthog.capture(event, properties);
			}
		},
		[posthog],
	);

	// Portfolio-specific events
	const trackPortfolioView = useCallback(
		(username: string, domainType: "main" | "subdomain" | "custom") => {
			trackEvent("portfolio_viewed", {
				portfolio_owner: username,
				domain_type: domainType,
				timestamp: new Date().toISOString(),
			});
		},
		[trackEvent],
	);

	const trackProjectView = useCallback(
		(projectSlug: string, portfolioOwner: string) => {
			trackEvent("project_viewed", {
				project_slug: projectSlug,
				portfolio_owner: portfolioOwner,
				timestamp: new Date().toISOString(),
			});
		},
		[trackEvent],
	);

	const trackContactFormSubmission = useCallback(
		(portfolioOwner: string, success: boolean) => {
			trackEvent("contact_form_submitted", {
				portfolio_owner: portfolioOwner,
				success,
				timestamp: new Date().toISOString(),
			});
		},
		[trackEvent],
	);

	// Admin/Pro events
	const trackProjectCreated = useCallback(() => {
		trackEvent("project_created", {
			timestamp: new Date().toISOString(),
		});
	}, [trackEvent]);

	const trackProjectUpdated = useCallback(
		(projectId: string) => {
			trackEvent("project_updated", {
				project_id: projectId,
				timestamp: new Date().toISOString(),
			});
		},
		[trackEvent],
	);

	const trackProjectDeleted = useCallback(() => {
		trackEvent("project_deleted", {
			timestamp: new Date().toISOString(),
		});
	}, [trackEvent]);

	const trackThemeChanged = useCallback(
		(newTheme: string) => {
			trackEvent("theme_changed", {
				new_theme: newTheme,
				timestamp: new Date().toISOString(),
			});
		},
		[trackEvent],
	);

	const trackProfileUpdated = useCallback(() => {
		trackEvent("profile_updated", {
			timestamp: new Date().toISOString(),
		});
	}, [trackEvent]);

	// Pro/Subscription events
	const trackUpgradeClicked = useCallback(() => {
		trackEvent("upgrade_clicked", {
			timestamp: new Date().toISOString(),
		});
	}, [trackEvent]);

	const trackCustomDomainAdded = useCallback(
		(domain: string) => {
			trackEvent("custom_domain_added", {
				domain,
				timestamp: new Date().toISOString(),
			});
		},
		[trackEvent],
	);

	const trackCustomDomainVerified = useCallback(
		(domain: string) => {
			trackEvent("custom_domain_verified", {
				domain,
				timestamp: new Date().toISOString(),
			});
		},
		[trackEvent],
	);

	const trackCustomDomainRemoved = useCallback(
		(domain: string) => {
			trackEvent("custom_domain_removed", {
				domain,
				timestamp: new Date().toISOString(),
			});
		},
		[trackEvent],
	);

	// User journey events
	const trackOnboardingCompleted = useCallback(() => {
		trackEvent("onboarding_completed", {
			timestamp: new Date().toISOString(),
		});
	}, [trackEvent]);

	const trackSignUp = useCallback(
		(method: "email" | "google" | "github") => {
			trackEvent("user_signed_up", {
				method,
				timestamp: new Date().toISOString(),
			});
		},
		[trackEvent],
	);

	const trackSignIn = useCallback(
		(method: "email" | "google" | "github") => {
			trackEvent("user_signed_in", {
				method,
				timestamp: new Date().toISOString(),
			});
		},
		[trackEvent],
	);

	return {
		trackEvent,
		trackPortfolioView,
		trackProjectView,
		trackContactFormSubmission,
		trackProjectCreated,
		trackProjectUpdated,
		trackProjectDeleted,
		trackThemeChanged,
		trackProfileUpdated,
		trackUpgradeClicked,
		trackCustomDomainAdded,
		trackCustomDomainVerified,
		trackCustomDomainRemoved,
		trackOnboardingCompleted,
		trackSignUp,
		trackSignIn,
	};
}
