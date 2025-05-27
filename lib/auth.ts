import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins";
import { polar, checkout, portal, webhooks, usage } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { db } from "@/db/drizzle";
import { polarConfig } from "@/lib/config/polar";

import * as schema from "@/db/schema";

const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: 'production', // Use 'sandbox' for testing
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
        usage(),
        webhooks({
          secret: process.env.POLAR_WEBHOOK_SECRET!,
          onCustomerStateChanged: async (payload) => {
            console.log("Customer state changed:", payload);
            // Handle customer state changes here
          },
          onOrderPaid: async (payload) => {
            console.log("Order paid:", payload);
            // Handle successful payments here - grant Pro access
          },
          onOrderRefunded: async (payload) => {
            console.log("Order refunded:", payload);
            // Handle refunds - may need to revoke Pro access
          },
          onSubscriptionCreated: async (payload) => {
            console.log("Subscription created:", payload);
            // Handle new subscriptions
          },
          onSubscriptionActive: async (payload) => {
            console.log("Subscription activated:", payload);
            // Handle when subscription becomes active - grant Pro access
          },
          onSubscriptionCanceled: async (payload) => {
            console.log("Subscription canceled:", payload);
            // Handle subscription cancellations
          },
          onSubscriptionRevoked: async (payload) => {
            console.log("Subscription revoked:", payload);
            // Handle immediate subscription revocation
          },
          onSubscriptionUncanceled: async (payload) => {
            console.log("Subscription uncanceled:", payload);
            // Handle when a cancellation is reversed
          },
          onCheckoutCreated: async (payload) => {
            console.log("Checkout created:", payload);
            // Handle checkout session creation
          },
          onCustomerCreated: async (payload) => {
            console.log("Customer created:", payload);
            // Handle new customer creation
          },
          onCustomerUpdated: async (payload) => {
            console.log("Customer updated:", payload);
            // Handle customer updates
          },
        }),
      ],
    }),
    nextCookies(),
  ],
});
