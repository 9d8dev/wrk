"use client";

import { PostHogProvider } from "posthog-js/react";
import posthog from "posthog-js";
import { ReactNode } from "react";

// Initialize PostHog on the client side
if (typeof window !== "undefined") {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (posthogKey && posthogHost) {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      person_profiles: "identified_only",
      capture_pageview: false, // We'll handle this manually
      capture_pageleave: true,
      loaded: (posthog) => {
        if (process.env.NODE_ENV === "development") {
          console.log("PostHog initialized successfully");
        }
      },
    });
  } else {
    console.warn("PostHog environment variables not found");
  }
}

interface PostHogClientProviderProps {
  children: ReactNode;
}

export function PostHogClientProvider({
  children,
}: PostHogClientProviderProps) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
