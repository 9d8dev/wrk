"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UsernameSelection } from "./username-selection";
import { updateUsername } from "@/lib/actions/profile";

interface User {
  id: string;
  name?: string | null;
  email: string;
  username?: string | null;
}

interface UsernameSetupFormProps {
  user: User;
}

export function UsernameSetupForm({ user }: UsernameSetupFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Generate initial username from user data
  const generateInitialUsername = () => {
    if (user.name) {
      return user.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, "_");
    }
    return user.email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "_");
  };

  const handleUsernameSelected = async (username: string) => {
    setIsLoading(true);
    try {
      const result = await updateUsername(username);

      if (result.success) {
        toast.success("Username updated successfully!");
        router.push("/onboarding");
      } else {
        toast.error(result.error || "Failed to update username");
      }
    } catch (error) {
      console.error("Username update error:", error);
      toast.error("Failed to update username");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    // Redirect to onboarding with current username
    router.push("/onboarding");
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Welcome, {user.name || "there"}!</h1>
        <p className="text-muted-foreground">
          Let&apos;s set up your username for your portfolio URL
        </p>
      </div>

      <UsernameSelection
        initialUsername={generateInitialUsername()}
        onUsernameSelected={handleUsernameSelected}
        onSkip={handleSkip}
        isLoading={isLoading}
      />
    </div>
  );
}
