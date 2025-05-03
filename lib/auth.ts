import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins";
import { db } from "@/db/drizzle";

import * as schema from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  plugins: [
    username({
      minUsernameLength: 3,
      maxUsernameLength: 50,
      usernameValidator: (username) => {
        const reservedUsernames = [
          "admin",
          "posts",
          "privacy-policy",
          "terms-of-use",
          "about",
          "contact",
          "dashboard",
          "login",
          "sign-in",
          "sign-up",
          "sign-out",
        ];
        if (reservedUsernames.includes(username)) {
          return false;
        }
        return true;
      },
    }),
    nextCookies(),
  ],
});
