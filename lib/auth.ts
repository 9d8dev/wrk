import {
	checkout,
	polar,
	portal,
	usage,
	webhooks,
} from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import { nanoid } from "nanoid";
import { db } from "@/db/drizzle";
import * as schema from "@/db/schema";
import {
	getUserByEmail,
	getUserByPolarCustomerId,
	logSubscriptionEvent,
	updateUserPolarCustomerId,
	updateUserSubscription,
} from "@/lib/actions/subscription";
import { polarConfig } from "@/lib/config/polar";
import {
	generateUniqueUsername,
	generateUsernameFromEmail,
	generateUsernameFromName,
} from "@/lib/utils/username";

// Validate required environment variables at module level
const POLAR_ACCESS_TOKEN = process.env.POLAR_ACCESS_TOKEN;
if (!POLAR_ACCESS_TOKEN) {
	throw new Error("POLAR_ACCESS_TOKEN is required");
}

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
if (!GITHUB_CLIENT_ID) {
	throw new Error("GITHUB_CLIENT_ID is required");
}

const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
if (!GITHUB_CLIENT_SECRET) {
	throw new Error("GITHUB_CLIENT_SECRET is required");
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
if (!GOOGLE_CLIENT_ID) {
	throw new Error("GOOGLE_CLIENT_ID is required");
}

const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
if (!GOOGLE_CLIENT_SECRET) {
	throw new Error("GOOGLE_CLIENT_SECRET is required");
}

const POLAR_WEBHOOK_SECRET = process.env.POLAR_WEBHOOK_SECRET;
if (!POLAR_WEBHOOK_SECRET) {
	throw new Error("POLAR_WEBHOOK_SECRET is required");
}

const polarClient = new Polar({
	accessToken: POLAR_ACCESS_TOKEN,
	server: "production", // Use 'sandbox' for testing
});

export const auth = betterAuth({
	baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL,
	trustedOrigins: [
		"http://localhost:3000",
		"https://wrk.so",
		"https://www.wrk.so",
		"https://*.vercel.app",
		"https://*.vercel.app",
	],
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: schema,
	}),
	emailAndPassword: {
		enabled: true,
	},
	socialProviders: {
		github: {
			clientId: GITHUB_CLIENT_ID,
			clientSecret: GITHUB_CLIENT_SECRET,
			mapProfileToUser: async (profile) => {
				// GitHub provides a login field which is their username
				// Generate a default username that they can change during onboarding
				const baseUsername = profile.login;
				const uniqueUsername = await generateUniqueUsername(baseUsername);

				return {
					username: uniqueUsername,
					name: profile.name || profile.login,
				};
			},
		},
		google: {
			clientId: GOOGLE_CLIENT_ID,
			clientSecret: GOOGLE_CLIENT_SECRET,
			mapProfileToUser: async (profile) => {
				// Google doesn't have usernames, so we generate from email and name
				// Generate a default username that they can change during onboarding
				const emailUsername = generateUsernameFromEmail(profile.email);
				const nameUsername = profile.name
					? generateUsernameFromName(profile.name)
					: null;

				// Try email-based username first, then name-based as fallback
				let baseUsername = emailUsername;
				if (nameUsername && nameUsername.length >= 3) {
					// Use name-based if it's valid and different from email-based
					baseUsername = nameUsername;
				}

				const uniqueUsername = await generateUniqueUsername(baseUsername);

				return {
					username: uniqueUsername,
					name: profile.name || profile.given_name || uniqueUsername,
				};
			},
		},
	},
	advanced: {
		cookiePrefix: "better-auth",
		database: {
			generateId: () => {
				// Generate a unique ID for database records
				return nanoid();
			},
		},
	},
	session: {
		expiresIn: 60 * 60 * 24 * 30, // 30 days
		updateAge: 60 * 60 * 24, // Update session if older than 1 day
		cookieCache: {
			enabled: true,
			maxAge: 60 * 5, // Cache for 5 minutes
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
					"network",
					"onboarding",
					"privacy",
					"terms",
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
					products: polarConfig.products.map((p) => ({
						productId: p.productId,
						slug: p.slug,
					})),
					successUrl: polarConfig.successUrl,
					authenticatedUsersOnly: true,
				}),
				portal(),
				usage(),
				webhooks({
					secret: POLAR_WEBHOOK_SECRET,
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
					onSubscriptionCreated: async (payload) => {
						console.log("Subscription created:", payload);

						// Find user by Polar customer ID - safely access properties
						const customerId =
							payload.data.customerId ||
							((payload.data as Record<string, unknown>).customer_id as string);
						const existingUser = customerId
							? await getUserByPolarCustomerId(customerId)
							: null;
						if (existingUser) {
							const productId =
								payload.data.productId ||
								((payload.data as Record<string, unknown>)
									.product_id as string);
							const currentPeriodEnd =
								payload.data.currentPeriodEnd ||
								(payload.data as Record<string, unknown>).current_period_end;

							await updateUserSubscription({
								userId: existingUser.id,
								subscriptionId: payload.data.id,
								subscriptionStatus: payload.data.status,
								subscriptionProductId: productId,
								currentPeriodEnd: currentPeriodEnd
									? new Date(currentPeriodEnd as string | Date)
									: undefined,
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

						// Update user's subscription to active status - safely access properties
						const customerId =
							payload.data.customerId ||
							((payload.data as Record<string, unknown>).customer_id as string);
						const existingUser = customerId
							? await getUserByPolarCustomerId(customerId)
							: null;
						if (existingUser) {
							const productId =
								payload.data.productId ||
								((payload.data as Record<string, unknown>)
									.product_id as string);
							const currentPeriodEnd =
								payload.data.currentPeriodEnd ||
								(payload.data as Record<string, unknown>).current_period_end;

							await updateUserSubscription({
								userId: existingUser.id,
								subscriptionId: payload.data.id,
								subscriptionStatus: "active",
								subscriptionProductId: productId,
								currentPeriodEnd: currentPeriodEnd
									? new Date(currentPeriodEnd as string | Date)
									: undefined,
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

						// Update subscription status to canceled - safely access properties
						const customerId =
							payload.data.customerId ||
							((payload.data as Record<string, unknown>).customer_id as string);
						const existingUser = customerId
							? await getUserByPolarCustomerId(customerId)
							: null;
						if (existingUser) {
							const currentPeriodEnd =
								payload.data.currentPeriodEnd ||
								(payload.data as Record<string, unknown>).current_period_end;

							await updateUserSubscription({
								userId: existingUser.id,
								subscriptionStatus: "canceled",
								currentPeriodEnd: currentPeriodEnd
									? new Date(currentPeriodEnd as string | Date)
									: undefined,
							});

							await logSubscriptionEvent({
								userId: existingUser.id,
								subscriptionId: payload.data.id,
								eventType: "canceled",
								eventData: payload.data,
							});
						}
					},
					onOrderPaid: async (payload) => {
						console.log("Order paid:", payload);
						// Log successful payment - safely access properties
						const customerId =
							payload.data.customerId ||
							((payload.data as Record<string, unknown>).customer_id as string);
						const subscriptionId =
							payload.data.subscriptionId ||
							((payload.data as Record<string, unknown>)
								.subscription_id as string);
						const existingUser = customerId
							? await getUserByPolarCustomerId(customerId)
							: null;
						if (existingUser && subscriptionId) {
							await logSubscriptionEvent({
								userId: existingUser.id,
								subscriptionId: subscriptionId,
								eventType: "payment_succeeded",
								eventData: payload.data,
							});
						}
					},
				}),
			],
		}),
		nextCookies(),
	],
});
