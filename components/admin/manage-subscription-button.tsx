"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { authClient } from "@/lib/auth-client";

interface ManageSubscriptionButtonProps {
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?:
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "destructive";
}

export function ManageSubscriptionButton({
  className,
  size = "sm",
  variant = "outline",
}: ManageSubscriptionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      console.log("🚀 Opening customer portal with authClient");

      // Use the client-side customer portal method
      await authClient.customer.portal();

      console.log("✅ Customer portal opened successfully");
    } catch (error) {
      console.error("💥 Portal error:", error);
      toast.error("Failed to open customer portal. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleManageSubscription}
      variant={variant}
      className={className}
      size={size}
      disabled={isLoading}
    >
      {isLoading ? "Loading..." : "Manage Subscription"}
    </Button>
  );
}
