"use client";

import { useSession } from "@/lib/auth-client";
import { useEffect, useState } from "react";

export function useSubscription() {
  const { data: session } = useSession();
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSubscription() {
      if (!session?.user) {
        setIsPro(false);
        setLoading(false);
        return;
      }

      try {
        // Check if user has polarCustomerId
        const hasPolarCustomer = !!(session.user as any).polarCustomerId;
        setIsPro(hasPolarCustomer);
      } catch (error) {
        console.error("Error checking subscription:", error);
        setIsPro(false);
      } finally {
        setLoading(false);
      }
    }

    checkSubscription();
  }, [session]);

  return { isPro, loading };
}