"use client";

import { polarClient } from "@polar-sh/better-auth";
import { createAuthClient } from "better-auth/client";
import { usernameClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL,
  plugins: [usernameClient(), polarClient()],
});

export const { signIn, signUp, useSession } = authClient;
