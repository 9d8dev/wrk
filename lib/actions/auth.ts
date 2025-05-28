"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { notifyNewUserSignup } from "@/lib/utils/discord";

export const getSession = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
};

// These auth actions are kept for server-side use only
// For client-side auth, use authClient from lib/auth-client.ts

export const handlePostSignup = async (userData: {
  name: string;
  email: string;
  username: string;
}) => {
  // Send Discord notification for new signup
  await notifyNewUserSignup({
    ...userData,
    createdAt: new Date(),
  });
};

export const signOut = async () => {
  await auth.api.signOut({
    headers: await headers(),
  });
  redirect("/");
};
