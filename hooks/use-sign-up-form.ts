import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useUsernameAvailability } from "@/hooks/use-username-availability";
import { usePasswordStrength } from "@/hooks/use-password-strength";

import { handlePostSignup } from "@/lib/actions/auth";
import { authClient } from "@/lib/auth-client";

export function useSignUpForm() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const router = useRouter();

  // Username availability checking
  const usernameAvailability = useUsernameAvailability(username);

  // Password strength checking
  const passwordStrength = usePasswordStrength(password);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow letters, numbers, underscores, and hyphens
    const filteredValue = value.replace(/[^a-zA-Z0-9_-]/g, "");

    setUsername(filteredValue);

    // Show error if invalid characters were removed
    if (value !== filteredValue) {
      setUsernameError(
        "Username can only contain letters, numbers, underscores (_), and hyphens (-)"
      );
    } else {
      setUsernameError("");
    }
  };

  // Determine if form is valid for submission
  const isFormValid =
    username.length >= 3 &&
    email.length > 0 &&
    passwordStrength.score >= 3 && // Require at least "fair" password
    usernameAvailability.isAvailable === true &&
    !usernameError;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { error } = await authClient.signUp.email({
        name: name,
        username: username,
        email: email,
        password: password,
      });

      if (error) {
        throw new Error(error.message || "Failed to sign up");
      }

      // Send Discord notification
      await handlePostSignup({ name, email, username });

      // Successful signup - redirect to onboarding
      router.push("/onboarding");
    } catch (error: unknown) {
      console.error("Sign up error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to sign up. Please check your details.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    name,
    setName,
    username,
    setUsername,
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    error,
    usernameError,
    usernameAvailability,
    passwordStrength,
    isFormValid,
    handleUsernameChange,
    handleSubmit,
  };
}
