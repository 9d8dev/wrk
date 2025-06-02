import { getProjectsByUsername } from "@/lib/data/project";
import { getAllUsers } from "@/lib/data/user";

import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrls = [
    {
      url: "https://wrk.so",
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 1,
    },
    {
      url: "https://wrk.so/sign-in",
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
  ];

  const usersResult = await getAllUsers();
  const allUrls: MetadataRoute.Sitemap = [...baseUrls];

  if (usersResult.success) {
    for (const user of usersResult.data.items) {
      allUrls.push({
        url: `https://wrk.so/${user.username}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.9,
      });

      allUrls.push({
        url: `https://wrk.so/${user.username}/contact`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      });

      const projectsResult = await getProjectsByUsername(user.username);

      if (projectsResult.success) {
        for (const project of projectsResult.data.items) {
          allUrls.push({
            url: `https://wrk.so/${user.username}/${project.slug}`,
            lastModified: new Date(),
            changeFrequency: "weekly" as const,
            priority: 0.8,
          });
        }
      }
    }
  }

  return allUrls;
}
