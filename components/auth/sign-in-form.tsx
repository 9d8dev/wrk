"use client";

import Link from "next/link";
import { Lock, Mail } from "lucide-react";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Container } from "@/components/ds";

import { useSignInForm } from "@/hooks/use-sign-in-form";

import SocialLoginButtons from "./social-login-buttons";

export default function SignInForm() {
  const {
    identifier,
    setIdentifier,
    password,
    setPassword,
    isLoading,
    error,
    handleSubmit,
  } = useSignInForm();

  return (
    <Container className="space-y-4">
      <motion.h3
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="text-xl font-semibold"
      >
        Login to your account
      </motion.h3>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="text-muted-foreground text-sm"
      >
        Welcome back! Sign in to your account.
      </motion.p>

      <motion.form
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="grid gap-2"
        onSubmit={handleSubmit}
      >
        <Input
          placeholder="Email or Username"
          type="text"
          name="identifier"
          value={identifier}
          icon={<Mail size={16} />}
          autoComplete="username email"
          onChange={(e) => setIdentifier(e.target.value)}
        />
        <Input
          placeholder="Password"
          type="password"
          name="password"
          value={password}
          icon={<Lock size={16} />}
          autoComplete="current-password"
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-destructive/10 border-destructive/20 text-destructive rounded-md border p-3 text-sm"
          >
            {error}
          </motion.div>
        )}
        <Button type="submit" className="mt-2" disabled={isLoading}>
          Sign In
        </Button>
      </motion.form>

      <SocialLoginButtons isLoading={isLoading} />

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="text-muted-foreground text-sm"
      >
        Forgot your password?{" "}
        <Link href="/reset-password" className="text-primary">
          Reset Password
        </Link>
      </motion.p>
    </Container>
  );
}
