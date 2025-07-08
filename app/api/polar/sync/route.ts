import { Polar } from "@polar-sh/sdk";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { user } from "@/db/schema";
import {
	logSubscriptionEvent,
	updateUserPolarCustomerId,
	updateUserSubscription,
} from "@/lib/actions/subscription";
import { auth } from "@/lib/auth";

export async function POST() {
	try {
		// Get the current user session
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		console.log("🔄 Starting manual sync for user:", session.user.id);

		// Initialize Polar client
		const polarClient = new Polar({
			accessToken: process.env.POLAR_ACCESS_TOKEN!,
			server: "production",
		});

		// Get user data from database
		const userData = await db
			.select()
			.from(user)
			.where(eq(user.id, session.user.id))
			.limit(1);

		if (!userData[0]) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		const currentUser = userData[0];
		console.log("👤 Current user data:", {
			id: currentUser.id,
			email: currentUser.email,
			polarCustomerId: currentUser.polarCustomerId,
			subscriptionStatus: currentUser.subscriptionStatus,
		});

		let polarCustomerId = currentUser.polarCustomerId;

		// If no Polar customer ID, try to find or create customer
		if (!polarCustomerId) {
			try {
				console.log("🔍 No Polar customer ID found, searching by email...");

				// Try to find customer by email
				const customers = await polarClient.customers.list({
					email: currentUser.email,
					limit: 1,
				});

				if (customers.result.items.length > 0) {
					polarCustomerId = customers.result.items[0].id;
					await updateUserPolarCustomerId({
						userId: session.user.id,
						polarCustomerId,
					});
					console.log("✅ Found existing Polar customer:", polarCustomerId);
				} else {
					// Create new customer
					const newCustomer = await polarClient.customers.create({
						email: currentUser.email,
						name: currentUser.name || undefined,
					});
					polarCustomerId = newCustomer.id;
					await updateUserPolarCustomerId({
						userId: session.user.id,
						polarCustomerId,
					});
					console.log("✅ Created new Polar customer:", polarCustomerId);
				}
			} catch (error) {
				console.error("❌ Error managing Polar customer:", error);
				return NextResponse.json(
					{
						error: "Failed to manage Polar customer",
						details: error instanceof Error ? error.message : "Unknown error",
					},
					{ status: 500 },
				);
			}
		}

		// Get customer subscriptions
		try {
			console.log("📋 Fetching subscriptions for customer:", polarCustomerId);

			const subscriptions = await polarClient.subscriptions.list({
				customerId: [polarCustomerId],
				active: true,
				limit: 10,
			});

			console.log("📊 Found subscriptions:", subscriptions.result.items.length);

			if (subscriptions.result.items.length > 0) {
				// Find the active subscription
				const activeSubscription = subscriptions.result.items.find(
					(sub) => sub.status === "active",
				);

				if (activeSubscription) {
					await updateUserSubscription({
						userId: session.user.id,
						subscriptionId: activeSubscription.id,
						subscriptionStatus: activeSubscription.status,
						subscriptionProductId: activeSubscription.productId,
						currentPeriodEnd: activeSubscription.currentPeriodEnd
							? new Date(activeSubscription.currentPeriodEnd)
							: undefined,
					});

					await logSubscriptionEvent({
						userId: session.user.id,
						subscriptionId: activeSubscription.id,
						// @ts-expect-error - eventType is not typed
						eventType: "manual_sync",
						eventData: activeSubscription,
					});

					console.log("✅ Updated subscription status to active");

					return NextResponse.json({
						success: true,
						message: "Subscription synced successfully",
						subscription: {
							id: activeSubscription.id,
							status: activeSubscription.status,
							productId: activeSubscription.productId,
							currentPeriodEnd: activeSubscription.currentPeriodEnd,
						},
						customer: {
							id: polarCustomerId,
							email: currentUser.email,
						},
					});
				}
			}

			// Check for all subscriptions (including inactive ones) for better debugging
			const allSubscriptions = await polarClient.subscriptions.list({
				customerId: [polarCustomerId],
				limit: 10,
			});

			console.log("📊 All subscriptions for customer:", {
				count: allSubscriptions.result.items.length,
				subscriptions: allSubscriptions.result.items.map((sub) => ({
					id: sub.id,
					status: sub.status,
					productId: sub.productId,
					currentPeriodEnd: sub.currentPeriodEnd,
				})),
			});

			// If no active subscription found, clear old subscription if exists
			if (currentUser.subscriptionStatus === "active") {
				await updateUserSubscription({
					userId: session.user.id,
					subscriptionStatus: "canceled",
				});
				console.log("✅ Cleared expired subscription");
			}

			return NextResponse.json({
				success: true,
				message: "No active subscription found",
				customer: {
					id: polarCustomerId,
					email: currentUser.email,
				},
				allSubscriptions: allSubscriptions.result.items.map((sub) => ({
					id: sub.id,
					status: sub.status,
					productId: sub.productId,
					currentPeriodEnd: sub.currentPeriodEnd,
				})),
			});
		} catch (error) {
			console.error("❌ Error fetching subscriptions:", error);
			return NextResponse.json(
				{
					error: "Failed to fetch subscriptions",
					details: error instanceof Error ? error.message : "Unknown error",
				},
				{ status: 500 },
			);
		}
	} catch (error) {
		console.error("💥 Manual sync error:", error);
		return NextResponse.json(
			{
				error: "Sync failed",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
