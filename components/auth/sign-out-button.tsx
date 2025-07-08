"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { signOut } from "@/lib/actions/auth";

interface SignOutButtonProps {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function SignOutButton({
  variant = "outline",
  size = "default",
  className,
}: SignOutButtonProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      const result = await signOut();
      // @ts-expect-error FIX THIS LATER
      if (result.success) {
        toast.success("Signed out successfully");
        router.push("/");
      }
    } catch (error) {
      console.error("Failed to sign out:", error);
      toast.error("Failed to sign out");
    }
  };

  return (
    <Button
      onClick={handleSignOut}
      variant={variant}
      size={size}
      className={className}
    >
      <LogOut className="h-4 w-4" />
      {size === "icon" ? null : "Sign out"}
    </Button>
  );
}
