"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Lock, UserCircle, Hash } from "lucide-react";
import { Container, Section } from "@/components/ds";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { signIn, signUp } from "@/lib/actions/auth";
import { useState } from "react";
import { toast } from "sonner";

import Water from "@/public/water.webp";
import Image from "next/image";
import Link from "next/link";

export default function SignInPage() {
  return (
    <Section className="flex items-center justify-center min-h-screen relative">
      <Tabs defaultValue="sign-in" className="w-md">
        <TabsList className="w-full">
          <TabsTrigger value="sign-in">Login</TabsTrigger>
          <TabsTrigger value="sign-up">Create Account</TabsTrigger>
        </TabsList>
        <TabsContent className="bg-background rounded mt-2" value="sign-in">
          <SignInForm />
        </TabsContent>
        <TabsContent className="bg-background rounded mt-2" value="sign-up">
          <SignUpForm />
        </TabsContent>
      </Tabs>

      <Image
        src={Water}
        alt="Water"
        className="absolute inset-0 object-cover h-full w-full -z-10"
        placeholder="blur"
      />
    </Section>
  );
}

const SignInForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Container className="space-y-4">
      <h3 className="text-xl font-semibold">Login to your account</h3>

      <form
        className="grid gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setIsLoading(true);
          const formData = new FormData(e.currentTarget);
          const email = formData.get("email");
          const password = formData.get("password");

          try {
            await signIn({
              email: email as string,
              password: password as string,
            });
          } catch (error) {
            console.error("Sign in error:", error);
            toast.error("Failed to sign in. Please check your credentials.");
          } finally {
            setIsLoading(false);
          }
        }}
      >
        <Input
          placeholder="Email"
          type="email"
          name="email"
          value={email}
          icon={<Mail size={16} />}
          autoComplete="email"
          onChange={(e) => setEmail(e.target.value)}
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
        <Button type="submit" className="mt-2" disabled={isLoading}>
          Sign In
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        Welcome back! Sign in to your account.
      </p>
    </Container>
  );
};

const SignUpForm = () => {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Container className="space-y-4">
      <h3 className="text-xl font-semibold">Create an account</h3>

      <p className="text-sm text-muted-foreground">
        Sign up for free to get started.
      </p>

      <form
        className="grid gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setIsLoading(true);
          const formData = new FormData(e.currentTarget);
          const name = formData.get("name");
          const username = formData.get("username");
          const email = formData.get("email");
          const password = formData.get("password");

          try {
            await signUp({
              name: name as string,
              username: username as string,
              email: email as string,
              password: password as string,
            });
          } catch (error) {
            console.error("Sign up error:", error);
            toast.error("Failed to sign up. Please check your details.");
          } finally {
            setIsLoading(false);
          }
        }}
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
        <Input
          placeholder="Username"
          type="text"
          name="username"
          icon={<Hash size={16} />}
          value={username}
          autoComplete="username"
          onChange={(e) => setUsername(e.target.value)}
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
        <Input
          placeholder="Password"
          type="password"
          name="password"
          icon={<Lock size={16} />}
          value={password}
          autoComplete="new-password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" className="mt-2" disabled={isLoading}>
          Sign Up
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        By signing up, you agree to our{" "}
        <Link href="/terms" className="text-primary">
          Terms of Service
        </Link>
        and{" "}
        <Link href="/privacy" className="text-primary">
          Privacy Policy
        </Link>
      </p>
    </Container>
  );
};
