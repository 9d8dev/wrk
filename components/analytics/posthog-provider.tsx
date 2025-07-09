"use client";

import type { ReactNode } from "react";

import { PostHogProvider } from "posthog-js/react";
import posthog from "posthog-js";

// Get environment variables safely in client component
const POSTHOG_KEY =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_POSTHOG_KEY
    : undefined;
const POSTHOG_HOST =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_POSTHOG_HOST
    : undefined;

// Validation function for PostHog configuration
function validatePostHogConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!POSTHOG_KEY) {
    errors.push("NEXT_PUBLIC_POSTHOG_KEY is missing");
  } else if (!POSTHOG_KEY.startsWith("phc_")) {
    errors.push(
      "NEXT_PUBLIC_POSTHOG_KEY appears to be invalid (should start with 'phc_')"
    );
  }

  if (!POSTHOG_HOST) {
    errors.push("NEXT_PUBLIC_POSTHOG_HOST is missing");
  } else if (!POSTHOG_HOST.startsWith("http")) {
    errors.push(
      "NEXT_PUBLIC_POSTHOG_HOST should include protocol (http/https)"
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Initialize PostHog only on client side
if (typeof window !== "undefined") {
  const config = validatePostHogConfig();

  if (!config.isValid) {
    console.warn("PostHog configuration errors:", config.errors);
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "PostHog will not be initialized due to configuration errors"
      );
    }
  } else if (POSTHOG_KEY) {
    // Check if PostHog is already initialized
    try {
      posthog.get_distinct_id();
      console.log("PostHog is already initialized");
    } catch {
      // Not initialized yet, so initialize it
      console.log(
        "Initializing PostHog with key:",
        POSTHOG_KEY.slice(0, 10) + "..."
      );

      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST || `${window.location.origin}/ingest`,
        person_profiles: "identified_only", // Create profiles only for identified users
        capture_pageview: false, // We'll handle pageviews manually for better control
        capture_pageleave: true, // Track when users leave pages
        loaded: (posthog) => {
          console.log("PostHog loaded successfully");
          // Enable debug mode in development
          if (process.env.NODE_ENV === "development") {
            posthog.debug();
            console.log("PostHog debug mode enabled");
          }

          // Send a test event to verify connection
          posthog.capture("posthog_initialized", {
            environment: process.env.NODE_ENV,
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent,
          });
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
        // Error handling
        on_xhr_error: (xhr) => {
          console.error("PostHog XHR error:", xhr);
        },
        request_batching: true,
      });
    }
  }
}

interface PostHogWrapperProps {
  children: ReactNode;
}

export function PostHogWrapper({ children }: PostHogWrapperProps) {
  // Validate configuration
  const config = validatePostHogConfig();

  // Only render provider if PostHog is properly configured
  if (!config.isValid) {
    if (
      typeof window !== "undefined" &&
      process.env.NODE_ENV === "development"
    ) {
      console.warn("PostHog is not properly configured:", config.errors);
    }
    return <>{children}</>;
  }

  if (!POSTHOG_KEY) {
    return <>{children}</>;
  }

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}

// Export validation function for debugging
export { validatePostHogConfig };
