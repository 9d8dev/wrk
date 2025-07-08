import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import {
	getUserByEmail,
	getUserByPolarCustomerId,
	logSubscriptionEvent,
	updateUserPolarCustomerId,
	updateUserSubscription,
} from "@/lib/actions/subscription";
import type { PolarWebhookEventType } from "@/lib/types/polar-webhook-types";

// Verify webhook signature
async function verifyWebhookSignature(
	payload: string,
	signature: string,
	secret: string,
): Promise<boolean> {
	const hmac = createHmac("sha256", secret);
	hmac.update(payload);
	const expectedSignature = hmac.digest("hex");
	return signature === expectedSignature;
}

export async function POST(req: NextRequest) {
	try {
		const body = await req.text();
		const headersList = await headers();
		const signature = headersList.get("webhook-signature");

		if (!signature) {
			console.error("❌ No webhook signature provided");
			return NextResponse.json(
				{ error: "No signature provided" },
				{ status: 401 },
			);
		}

		const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
		if (!webhookSecret) {
			console.error("❌ POLAR_WEBHOOK_SECRET not configured");
			return NextResponse.json(
				{ error: "Webhook secret not configured" },
				{ status: 500 },
			);
		}

		// Verify the webhook signature
		const isValid = await verifyWebhookSignature(
			body,
			signature,
			webhookSecret,
		);
		if (!isValid) {
			console.error("❌ Invalid webhook signature");
			return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
		}

		const event = JSON.parse(body) as PolarWebhookEventType;
		console.log("📥 Webhook event received:", event.type);

		switch (event.type) {
			case "customer.created":
			case "customer.updated": {
				const customer = event.data;
				console.log("👤 Processing customer event:", {
					type: event.type,
					customerId: customer.id,
					email: customer.email,
				});

				// Find user by email
				const userRecord = await getUserByEmail(customer.email);
				if (userRecord) {
					// Update user with Polar customer ID
					await updateUserPolarCustomerId({
						userId: userRecord.id,
						polarCustomerId: customer.id,
					});
					console.log("✅ Updated user with Polar customer ID");
				} else {
					console.warn("⚠️ User not found for email:", customer.email);
				}
				break;
			}

			case "subscription.created":
			case "subscription.active": {
				const subscription = event.data;
				console.log("💳 Processing subscription event:", {
					type: event.type,
					subscriptionId: subscription.id,
					status: subscription.status,
					customerId: subscription.customer_id,
				});

				// Find user by Polar customer ID
				const userRecord = await getUserByPolarCustomerId(
					subscription.customer_id,
				);
				if (userRecord) {
					// Update user subscription data
					await updateUserSubscription({
						userId: userRecord.id,
						subscriptionId: subscription.id,
						subscriptionStatus: subscription.status,
						subscriptionProductId: subscription.product_id,
						currentPeriodEnd: subscription.current_period_end
							? new Date(subscription.current_period_end)
							: undefined,
					});

					// Log the event
					await logSubscriptionEvent({
						userId: userRecord.id,
						subscriptionId: subscription.id,
						eventType:
							event.type === "subscription.created" ? "created" : "updated",
						eventData: subscription,
					});

					console.log("✅ Updated user subscription:", {
						userId: userRecord.id,
						status: subscription.status,
					});
				} else {
					console.error(
						"❌ User not found for customer ID:",
						subscription.customer_id,
					);
				}
				break;
			}

			case "subscription.canceled":
			case "subscription.revoked": {
				const subscription = event.data;
				console.log("🚫 Processing subscription cancellation:", {
					subscriptionId: subscription.id,
					customerId: subscription.customer_id,
				});

				const userRecord = await getUserByPolarCustomerId(
					subscription.customer_id,
				);
				if (userRecord) {
					await updateUserSubscription({
						userId: userRecord.id,
						subscriptionId: subscription.id,
						subscriptionStatus: "canceled",
						subscriptionProductId: subscription.product_id,
						currentPeriodEnd: subscription.current_period_end
							? new Date(subscription.current_period_end)
							: undefined,
					});

					await logSubscriptionEvent({
						userId: userRecord.id,
						subscriptionId: subscription.id,
						eventType: "canceled",
						eventData: subscription,
					});

					console.log("✅ Subscription canceled for user:", userRecord.id);
				}
				break;
			}

			case "order.paid": {
				const order = event.data;
				console.log("🛒 Order paid:", {
					orderId: order.id,
					customerId: order.customer_id,
					amount: order.amount,
				});

				const userRecord = await getUserByPolarCustomerId(order.customer_id);
				if (userRecord && order.subscription_id) {
					await logSubscriptionEvent({
						userId: userRecord.id,
						subscriptionId: order.subscription_id,
						eventType: "payment_succeeded",
						eventData: order,
					});
				}
				break;
			}

			case "checkout.created": {
				console.log("🛍️ Checkout created:", event.data.id);
				// We don't need to do anything for checkout creation
				break;
			}

			default: {
				console.log("⚠️ Unhandled webhook event type:", event.type);
			}
		}

		return NextResponse.json({ received: true });
	} catch (error) {
		console.error("💥 Webhook error:", error);
		return NextResponse.json(
			{ error: "Webhook processing failed" },
			{ status: 500 },
		);
	}
}
