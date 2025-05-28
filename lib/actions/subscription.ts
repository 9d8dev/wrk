"use server";

import { db } from "@/db/drizzle";
import { user, subscriptionHistory } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Helper function to get user by polarCustomerId
export async function getUserByPolarCustomerId(polarCustomerId: string) {
  const users = await db
    .select()
    .from(user)
    .where(eq(user.polarCustomerId, polarCustomerId))
    .limit(1);

  return users[0] || null;
}

// Helper function to get user by email
export async function getUserByEmail(email: string) {
  const users = await db
    .select()
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  return users[0] || null;
}

// Update user's subscription status
export async function updateUserSubscription({
  userId,
  subscriptionId,
  subscriptionStatus,
  subscriptionProductId,
  currentPeriodEnd,
}: {
  userId: string;
  subscriptionId?: string;
  subscriptionStatus?: string;
  subscriptionProductId?: string;
  currentPeriodEnd?: Date;
}) {
  await db
    .update(user)
    .set({
      subscriptionId,
      subscriptionStatus,
      subscriptionProductId,
      subscriptionCurrentPeriodEnd: currentPeriodEnd,
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId));
}

// Update user's Polar customer ID
export async function updateUserPolarCustomerId({
  userId,
  polarCustomerId,
}: {
  userId: string;
  polarCustomerId: string;
}) {
  await db
    .update(user)
    .set({
      polarCustomerId,
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId));
}

// Log subscription event
export async function logSubscriptionEvent({
  userId,
  subscriptionId,
  eventType,
  eventData,
}: {
  userId: string;
  subscriptionId: string;
  eventType: (typeof subscriptionHistory.$inferSelect)["eventType"];
  eventData: unknown;
}) {
  await db.insert(subscriptionHistory).values({
    id: nanoid(),
    userId,
    subscriptionId,
    eventType,
    eventData,
    createdAt: new Date(),
  });
}

// Check if current user has active Pro subscription
export async function hasActiveProSubscription(): Promise<boolean> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return false;
    }

    const userData = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!userData[0]) {
      return false;
    }

    // Check if subscription is active and not expired
    const isActive = userData[0].subscriptionStatus === "active";
    const notExpired = userData[0].subscriptionCurrentPeriodEnd
      ? userData[0].subscriptionCurrentPeriodEnd > new Date()
      : false;

    return isActive && notExpired;
  } catch (error) {
    console.error("Error checking subscription status:", error);
    return false;
  }
}

// Get user's subscription details
export async function getUserSubscriptionDetails() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return null;
  }

  const userData = await db
    .select({
      subscriptionStatus: user.subscriptionStatus,
      subscriptionId: user.subscriptionId,
      subscriptionProductId: user.subscriptionProductId,
      subscriptionCurrentPeriodEnd: user.subscriptionCurrentPeriodEnd,
    })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  return userData[0] || null;
}
