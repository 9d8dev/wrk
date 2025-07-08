import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

export function useSignInForm() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Check if identifier is email or username
      const isEmail = identifier.includes("@");

      if (isEmail) {
        const { error } = await authClient.signIn.email({
          email: identifier,
          password: password,
        });

        if (error) {
          throw new Error(error.message || "Failed to sign in");
        }
      } else {
        const { error } = await authClient.signIn.username({
          username: identifier,
          password: password,
        });

        if (error) {
          throw new Error(error.message || "Failed to sign in");
        }
      }

      // Successful login - redirect to admin
      router.push("/admin");
    } catch (error: unknown) {
      console.error("Sign in error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to sign in. Please check your credentials.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    identifier,
    setIdentifier,
    password,
    setPassword,
    isLoading,
    error,
    handleSubmit,
  };
}
