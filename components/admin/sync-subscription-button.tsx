"use client";

import { RefreshCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function SyncSubscriptionButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSync = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/polar/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Subscription synced successfully");
        // Refresh the page to show updated status
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error(data.error || "Failed to sync subscription");
      }
    } catch (error) {
      toast.error("Failed to sync subscription");
      console.error("Sync error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSync}
      disabled={isLoading}
      variant="outline"
      className="gap-2"
    >
      <RefreshCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
      {isLoading ? "Restoring..." : "Restore Subscription"}
    </Button>
  );
}
