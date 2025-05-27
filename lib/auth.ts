import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins";
import { polar, checkout, portal } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { db } from "@/db/drizzle";
import { polarConfig } from "@/lib/config/polar";

import * as schema from "@/db/schema";

const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
});

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
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: polarConfig.products.map(p => ({
            productId: p.productId,
            slug: p.slug,
          })),
          successUrl: polarConfig.successUrl,
          authenticatedUsersOnly: true,
        }),
        portal(),
      ],
    }),
    nextCookies(),
  ],
});
