"use client";

import { createAuthClient } from "better-auth/client";
import { usernameClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [usernameClient()],
});

export const { signIn, signUp, useSession } = authClient;
