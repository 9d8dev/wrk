"use client";

import { Loader2, Lock, Mail, UserCircle } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Container } from "@/components/ds";

import { useSignUpForm } from "@/hooks/use-sign-up-form";

import PasswordStrengthIndicator from "./password-strength-indicator";
import SocialLoginButtons from "./social-login-buttons";
import UsernameField from "./username-field";

export default function SignUpForm() {
  const {
    name,
    setName,
    username,
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
  } = useSignUpForm();

  return (
    <Container className="space-y-4">
      <motion.h3
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="text-xl font-semibold"
      >
        Create an account
      </motion.h3>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="text-muted-foreground text-sm"
      >
        Sign up for free to get started.
      </motion.p>

      <motion.form
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="grid gap-2"
        onSubmit={handleSubmit}
      >
        <Input
          placeholder="Name"
          type="text"
          name="name"
          icon={<UserCircle size={16} />}
          value={name}
          autoComplete="name"
          onChange={(e) => setName(e.target.value)}
        />

        <UsernameField
          username={username}
          usernameError={usernameError}
          usernameAvailability={usernameAvailability}
          onChange={handleUsernameChange}
        />

        <Input
          placeholder="Email"
          type="email"
          name="email"
          icon={<Mail size={16} />}
          value={email}
          autoComplete="email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="space-y-2">
          <Input
            placeholder="Password"
            type="password"
            name="password"
            icon={<Lock size={16} />}
            value={password}
            autoComplete="new-password"
            onChange={(e) => setPassword(e.target.value)}
          />

          {password && (
            <PasswordStrengthIndicator passwordStrength={passwordStrength} />
          )}
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-destructive/10 border-destructive/20 text-destructive rounded-md border p-3 text-sm"
          >
            {error}
          </motion.div>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isLoading || !isFormValid}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </motion.form>

      <SocialLoginButtons isLoading={isLoading} />

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="text-muted-foreground text-sm"
      >
        By signing up, you agree to our{" "}
        <Link href="/terms" className="text-primary">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-primary">
          Privacy Policy
        </Link>
      </motion.p>
    </Container>
  );
}
