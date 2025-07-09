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
    revalidate: 300, // 5 minutes
    tags: ["domain-lookup"],
  }
);