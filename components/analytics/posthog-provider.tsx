"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import type { ReactNode } from "react";

// Initialize PostHog only on client side
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
	// Check if PostHog is already initialized
	try {
		posthog.get_distinct_id();
	} catch {
		// Not initialized yet, so initialize it
		posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
			api_host: window.location.origin + "/ingest",
			person_profiles: "identified_only", // Create profiles only for identified users
			capture_pageview: false, // We'll handle pageviews manually for better control
			capture_pageleave: true, // Track when users leave pages
			loaded: (posthog) => {
				// Enable debug mode in development
				if (process.env.NODE_ENV === "development") {
					posthog.debug();
					console.log("PostHog initialized successfully");
				}
			},
			autocapture: {
				// Capture form submissions and clicks
				dom_event_allowlist: ["click", "submit"],
				// Don't capture sensitive elements
				css_selector_allowlist: [
					"[data-ph-capture]", // Only capture elements explicitly marked
				],
			},
			session_recording: {
				// Enable session recordings for better UX analysis
				maskAllInputs: true, // Mask all input fields for privacy
				maskTextSelector: "[data-ph-no-capture]", // Mask elements with this attribute
			},
			disable_session_recording: process.env.NODE_ENV === "development", // Disable in development
		});
	}
}

interface PostHogWrapperProps {
	children: ReactNode;
}

export function PostHogWrapper({ children }: PostHogWrapperProps) {
	// Only render provider if PostHog is configured
	if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
		return <>{children}</>;
	}

	return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
