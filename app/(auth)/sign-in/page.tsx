"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Lock, UserCircle, Hash } from "lucide-react";
import { GoogleIcon } from "@/components/icons/google";
import { Container } from "@/components/ds";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/logo";

import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, Suspense } from "react";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { handlePostSignup } from "@/lib/actions/auth";

import Water from "@/public/water.webp";
import Image from "next/image";
import Link from "next/link";

function SignInPageContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    tab === "signup" ? "sign-up" : "sign-in"
  );

  useEffect(() => {
    if (tab === "signup") {
      setActiveTab("sign-up");
    } else if (tab === "login") {
      setActiveTab("sign-in");
    }
  }, [tab]);

  return (
    <main className="h-screen w-screen relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md mx-auto sm:mt-[6rem] xl:mt-[12rem] p-4 sm:p-0"
      >
        <Logo className="text-background mb-8" />

        <Tabs
          value={activeTab}
          defaultValue="sign-in"
          className="w-full"
          onValueChange={(value) => setActiveTab(value)}
        >
          <TabsList className="w-full">
            <TabsTrigger value="sign-in">Login</TabsTrigger>
            <TabsTrigger value="sign-up">Create Account</TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait" initial={false}>
            {activeTab === "sign-in" ? (
              <motion.div
                key="sign-in"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-background rounded mt-2"
              >
                <TabsContent value="sign-in" forceMount>
                  <SignInForm />
                </TabsContent>
              </motion.div>
            ) : (
              <motion.div
                key="sign-up"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-background rounded mt-2"
              >
                <TabsContent value="sign-up" forceMount>
                  <SignUpForm />
                </TabsContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Tabs>
      </motion.div>

      <Image
        src={Water}
        alt="Water"
        className="absolute inset-0 object-cover h-full w-full -z-10"
        placeholder="blur"
      />
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <main className="h-screen w-screen relative overflow-hidden">
          <div className="w-full max-w-md mx-auto sm:mt-[6rem] xl:mt-[12rem] p-4 sm:p-0">
            <Logo className="text-background mb-8" />
          </div>
          <Image
            src={Water}
            alt="Water"
            className="absolute inset-0 object-cover h-full w-full -z-10"
            placeholder="blur"
          />
        </main>
      }
    >
      <SignInPageContent />
    </Suspense>
  );
}

const SignInForm = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

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
        className="text-sm text-muted-foreground"
      >
        Welcome back! Sign in to your account.
      </motion.p>

      <motion.form
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="grid gap-2"
        onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          setIsLoading(true);
          setError("");
          const formData = new FormData(e.currentTarget);
          const identifier = formData.get("identifier") as string;
          const password = formData.get("password") as string;

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
        }}
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
            className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-md"
          >
            {error}
          </motion.div>
        )}
        <Button type="submit" className="mt-2" disabled={isLoading}>
          Sign In
        </Button>
      </motion.form>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.35 }}
        className="space-y-4"
      >
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={async () => {
            try {
              await authClient.signIn.social({
                provider: "google",
                callbackURL: "/admin",
              });
            } catch (error) {
              console.error("Google sign in error:", error);
              toast.error("Failed to sign in with Google");
            }
          }}
          disabled={isLoading}
        >
          <GoogleIcon className="mr-2 h-4 w-4" />
          Continue with Google
        </Button>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="text-sm text-muted-foreground"
      >
        Forgot your password?{" "}
        <Link href="/reset-password" className="text-primary">
          Reset Password
        </Link>
      </motion.p>
    </Container>
  );
};

const SignUpForm = () => {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

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
        className="text-sm text-muted-foreground"
      >
        Sign up for free to get started.
      </motion.p>

      <motion.form
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="grid gap-2"
        onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          setIsLoading(true);
          setError("");
          const formData = new FormData(e.currentTarget);
          const name = formData.get("name") as string;
          const username = formData.get("username") as string;
          const email = formData.get("email") as string;
          const password = formData.get("password") as string;

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
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-md"
          >
            {error}
          </motion.div>
        )}
        <Button type="submit" className="mt-2" disabled={isLoading}>
          Sign Up
        </Button>
      </motion.form>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.35 }}
        className="space-y-4"
      >
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={async () => {
            try {
              await authClient.signIn.social({
                provider: "google",
                callbackURL: "/onboarding",
              });
            } catch (error) {
              console.error("Google sign up error:", error);
              toast.error("Failed to sign up with Google");
            }
          }}
          disabled={isLoading}
        >
          <GoogleIcon className="mr-2 h-4 w-4" />
          Continue with Google
        </Button>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="text-sm text-muted-foreground"
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
};
