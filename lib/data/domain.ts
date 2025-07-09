import { unstable_cache } from "next/cache";
import { eq } from "drizzle-orm";

import { user } from "@/db/schema";
import { db } from "@/db/drizzle";

/**
 * Get username by custom domain
 * Cached for 5 minutes
 */
export const getUsernameByDomain = unstable_cache(
  async (domain: string): Promise<string | null> => {
    try {
      const result = await db
        .select({ username: user.username })
        .from(user)
        .where(eq(user.customDomain, domain))
        .limit(1);

      return result[0]?.username || null;
    } catch (error) {
      console.error("Error fetching username by domain:", error);
      return null;
    }
  },
  ["username-by-domain"],
  {
    revalidate: 3600, // 1 hour (domains rarely change)
    tags: ["domain-lookup"],
  }
);

/**
 * Pre-warm the domain cache for a specific domain
 * Call this when a domain is verified to ensure fast first access
 */
export async function prewarmDomainCache(domain: string): Promise<void> {
  try {
    await getUsernameByDomain(domain);
  } catch (error) {
    console.error("Failed to prewarm domain cache:", error);
  }
}
