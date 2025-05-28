import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins";
import { polar, checkout, portal, webhooks, usage } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { db } from "@/db/drizzle";
import { polarConfig } from "@/lib/config/polar";
import {
  getUserByPolarCustomerId,
  getUserByEmail,
  updateUserSubscription,
  updateUserPolarCustomerId,
  logSubscriptionEvent,
} from "@/lib/actions/subscription";

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
          onCustomerCreated: async (payload) => {
            console.log("Customer created:", payload);
            
            // Find user by email and update their Polar customer ID
            if (payload.data.email) {
              const existingUser = await getUserByEmail(payload.data.email);
              if (existingUser && payload.data.id) {
                await updateUserPolarCustomerId({
                  userId: existingUser.id,
                  polarCustomerId: payload.data.id,
                });
              }
            }
          },
          onCustomerUpdated: async (payload) => {
            console.log("Customer updated:", payload);
            // Log the update event if needed
          },
          onSubscriptionCreated: async (payload) => {
            console.log("Subscription created:", payload);
            
            // Find user by Polar customer ID
            const existingUser = await getUserByPolarCustomerId(payload.data.customer_id);
            if (existingUser) {
              await updateUserSubscription({
                userId: existingUser.id,
                subscriptionId: payload.data.id,
                subscriptionStatus: payload.data.status,
                subscriptionProductId: payload.data.product_id,
                currentPeriodEnd: payload.data.current_period_end ? new Date(payload.data.current_period_end) : undefined,
              });
              
              await logSubscriptionEvent({
                userId: existingUser.id,
                subscriptionId: payload.data.id,
                eventType: "created",
                eventData: payload.data,
              });
            }
          },
          onSubscriptionActive: async (payload) => {
            console.log("Subscription activated:", payload);
            
            // Update user's subscription to active status
            const existingUser = await getUserByPolarCustomerId(payload.data.customer_id);
            if (existingUser) {
              await updateUserSubscription({
                userId: existingUser.id,
                subscriptionId: payload.data.id,
                subscriptionStatus: "active",
                subscriptionProductId: payload.data.product_id,
                currentPeriodEnd: payload.data.current_period_end ? new Date(payload.data.current_period_end) : undefined,
              });
              
              await logSubscriptionEvent({
                userId: existingUser.id,
                subscriptionId: payload.data.id,
                eventType: "activated",
                eventData: payload.data,
              });
            }
          },
          onSubscriptionCanceled: async (payload) => {
            console.log("Subscription canceled:", payload);
            
            // Update subscription status to canceled (but still active until period end)
            const existingUser = await getUserByPolarCustomerId(payload.data.customer_id);
            if (existingUser) {
              await updateUserSubscription({
                userId: existingUser.id,
                subscriptionStatus: "canceled",
                // Keep the current period end date as they have access until then
                currentPeriodEnd: payload.data.current_period_end ? new Date(payload.data.current_period_end) : undefined,
              });
              
              await logSubscriptionEvent({
                userId: existingUser.id,
                subscriptionId: payload.data.id,
                eventType: "canceled",
                eventData: payload.data,
              });
            }
          },
          onSubscriptionRevoked: async (payload) => {
            console.log("Subscription revoked:", payload);
            
            // Immediately revoke access
            const existingUser = await getUserByPolarCustomerId(payload.data.customer_id);
            if (existingUser) {
              await updateUserSubscription({
                userId: existingUser.id,
                subscriptionStatus: "revoked",
                currentPeriodEnd: new Date(), // Set to now to immediately revoke access
              });
              
              await logSubscriptionEvent({
                userId: existingUser.id,
                subscriptionId: payload.data.id,
                eventType: "revoked",
                eventData: payload.data,
              });
            }
          },
          onSubscriptionUncanceled: async (payload) => {
            console.log("Subscription uncanceled:", payload);
            
            // Reactivate the subscription
            const existingUser = await getUserByPolarCustomerId(payload.data.customer_id);
            if (existingUser) {
              await updateUserSubscription({
                userId: existingUser.id,
                subscriptionStatus: "active",
                currentPeriodEnd: payload.data.current_period_end ? new Date(payload.data.current_period_end) : undefined,
              });
              
              await logSubscriptionEvent({
                userId: existingUser.id,
                subscriptionId: payload.data.id,
                eventType: "uncanceled",
                eventData: payload.data,
              });
            }
          },
          onOrderPaid: async (payload) => {
            console.log("Order paid:", payload);
            
            // Log successful payment
            const existingUser = await getUserByPolarCustomerId(payload.data.customer_id);
            if (existingUser && payload.data.subscription_id) {
              await logSubscriptionEvent({
                userId: existingUser.id,
                subscriptionId: payload.data.subscription_id,
                eventType: "payment_succeeded",
                eventData: payload.data,
              });
            }
          },
          onOrderRefunded: async (payload) => {
            console.log("Order refunded:", payload);
            
            // Handle refund - subscription status will be updated via subscription webhooks
            const existingUser = await getUserByPolarCustomerId(payload.data.customer_id);
            if (existingUser && payload.data.subscription_id) {
              await logSubscriptionEvent({
                userId: existingUser.id,
                subscriptionId: payload.data.subscription_id,
                eventType: "payment_failed",
                eventData: payload.data,
              });
            }
          },
          onCheckoutCreated: async (payload) => {
            console.log("Checkout created:", payload);
            // Optionally log checkout creation
          },
          onCustomerStateChanged: async (payload) => {
            console.log("Customer state changed:", payload);
            // Handle any additional customer state changes if needed
          },
        }),
      ],
    }),
    nextCookies(),
  ],
});
