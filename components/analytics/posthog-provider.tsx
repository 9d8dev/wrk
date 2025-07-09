"use client";

import type { ReactNode } from "react";

import { PostHogProvider } from "posthog-js/react";
import posthog from "posthog-js";

// Get environment variables safely in client component
const POSTHOG_KEY = typeof window !== "undefined" ? process.env.NEXT_PUBLIC_POSTHOG_KEY : undefined;
const POSTHOG_HOST = typeof window !== "undefined" ? process.env.NEXT_PUBLIC_POSTHOG_HOST : undefined;

// Initialize PostHog only on client side
if (typeof window !== "undefined" && POSTHOG_KEY) {
  // Check if PostHog is already initialized
  try {
    posthog.get_distinct_id();
  } catch {
    // Not initialized yet, so initialize it
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST || `${window.location.origin}/ingest`,
      person_profiles: "identified_only", // Create profiles only for identified users
      capture_pageview: false, // We'll handle pageviews manually for better control
      capture_pageleave: true, // Track when users leave pages
      loaded: (posthog) => {
        // Enable debug mode in development
        if (process.env.NODE_ENV === "development") {
          posthog.debug();
          console.log("PostHog initialized successfully with key:", POSTHOG_KEY?.slice(0, 10) + "...");
        }
      },
      autocapture: {
        // Capture form submissions and clicks
        dom_event_allowlist: ["click", "submit", "change"],
        // Don't capture sensitive elements
        css_selector_allowlist: [
          "[data-ph-capture]", // Only capture elements explicitly marked
          "button",
          "a",
          "[role='button']",
        ],
      },
      session_recording: {
        // Enable session recordings for better UX analysis
        maskAllInputs: true, // Mask all input fields for privacy
        maskTextSelector: "[data-ph-no-capture]", // Mask elements with this attribute
        recordCrossOriginIframes: false,
      },
      disable_session_recording: process.env.NODE_ENV === "development", // Disable in development
      // Improve tracking
      secure_cookie: true,
      persistence: "localStorage+cookie",
      bootstrap: {
        // Enable feature flags
        featureFlags: {},
      },
    });
  }
} else if (typeof window !== "undefined") {
  console.warn("PostHog not initialized: NEXT_PUBLIC_POSTHOG_KEY environment variable is missing");
}

interface PostHogWrapperProps {
  children: ReactNode;
}

export function PostHogWrapper({ children }: PostHogWrapperProps) {
  // Only render provider if PostHog is configured
  if (!POSTHOG_KEY) {
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      console.warn("PostHog is not configured. Add NEXT_PUBLIC_POSTHOG_KEY to your environment variables.");
    }
    return <>{children}</>;
  }

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
