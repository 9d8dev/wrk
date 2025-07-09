"use client";

import { useEffect } from "react";

import { usePostHogEvents } from "@/components/analytics";

interface PortfolioPageClientProps {
  username: string;
}

export function PortfolioPageClient({ username }: PortfolioPageClientProps) {
  const { trackPortfolioView } = usePostHogEvents();

  useEffect(() => {
    trackPortfolioView(username);
  }, [username, trackPortfolioView]);

  return null;
}
