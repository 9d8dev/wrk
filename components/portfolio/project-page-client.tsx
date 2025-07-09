"use client";

import { useEffect } from "react";

import { usePostHogEvents } from "@/components/analytics";

interface ProjectPageClientProps {
  username: string;
  projectTitle: string;
}

export function ProjectPageClient({
  username,
  projectTitle,
}: ProjectPageClientProps) {
  const { trackProjectView } = usePostHogEvents();

  useEffect(() => {
    trackProjectView(username, projectTitle);
  }, [username, projectTitle, trackProjectView]);

  return null;
}
