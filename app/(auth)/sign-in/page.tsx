"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Container, Section } from "@/components/ds";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { signIn, signUp } from "@/lib/actions/auth";
import { useState } from "react";
import { toast } from "sonner";

export default function SignInPage() {
  return (
    <Section className="flex items-center justify-center min-h-screen">
      <Tabs defaultValue="sign-in">
        <TabsList>
          <TabsTrigger value="sign-in">Sign In</TabsTrigger>
          <TabsTrigger value="sign-up">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent className="border" value="sign-in">
          <SignInForm />
        </TabsContent>
        <TabsContent className="border" value="sign-up">
          <SignUpForm />
        </TabsContent>
      </Tabs>
    </Section>
  );
}

const SignInForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Container>
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
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          placeholder="Password"
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" disabled={isLoading}>
          Sign In
        </Button>
      </form>
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
    <Container>
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
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          placeholder="Username"
          type="text"
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Input
          placeholder="Email"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          placeholder="Password"
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" disabled={isLoading}>
          Sign Up
        </Button>
      </form>
    </Container>
  );
};
