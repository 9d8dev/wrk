"use client";

import { motion } from "motion/react";
import { toast } from "sonner";

import { usePostHogEvents } from "@/components/analytics";
import { GitHubIcon } from "@/components/icons/github";
import { GoogleIcon } from "@/components/icons/google";
import { Button } from "@/components/ui/button";

import { authClient } from "@/lib/auth-client";

interface SocialLoginButtonsProps {
  isLoading: boolean;
}

export default function SocialLoginButtons({
  isLoading,
}: SocialLoginButtonsProps) {
  const { trackSignIn } = usePostHogEvents();

  const handleSocialLogin = async (provider: "google" | "github") => {
    try {
      // Track the sign in attempt
      trackSignIn(provider);

      await authClient.signIn.social({
        provider,
        callbackURL: "/onboarding",
      });
    } catch (error) {
      console.error(`${provider} sign in error:`, error);
      toast.error(
        `Failed to sign in with ${provider === "google" ? "Google" : "GitHub"}`
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.35 }}
      className="space-y-2"
    >
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background text-muted-foreground px-2">
            Or continue with
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => handleSocialLogin("google")}
        disabled={isLoading}
      >
        <GoogleIcon className="mr-2 h-4 w-4" />
        Continue with Google
      </Button>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => handleSocialLogin("github")}
        disabled={isLoading}
      >
        <GitHubIcon className="mr-2 h-4 w-4" />
        Continue with GitHub
      </Button>
    </motion.div>
  );
}
