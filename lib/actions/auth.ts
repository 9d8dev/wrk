"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export const getSession = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
};

export const signIn = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  await auth.api.signInEmail({
    body: {
      email,
      password,
    },
  });
  redirect("/admin");
};

export const signUp = async ({
  name,
  username,
  email,
  password,
}: {
  name: string;
  username: string;
  email: string;
  password: string;
}) => {
  await auth.api.signUpEmail({
    body: {
      name,
      username,
      email,
      password,
    },
  });
  redirect("/admin");
};

export const signOut = async () => {
  await auth.api.signOut({
    headers: await headers(),
  });
  redirect("/");
};
