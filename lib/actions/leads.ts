"use server";

import crypto from "node:crypto";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { lead, type leadStatuses } from "@/db/schema";
import { db } from "@/db/drizzle";

export async function getLeadsByUserId(userId: string) {
  try {
    const userLeads = await db
      .select()
      .from(lead)
      .where(eq(lead.userId, userId))
      .orderBy(lead.createdAt);

    return userLeads;
  } catch (error) {
    console.error("Error fetching leads:", error);
    return [];
  }
}

export async function updateLeadStatus(
  leadId: string,
  status: (typeof leadStatuses)[number]
) {
  try {
    await db
      .update(lead)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(lead.id, leadId));

    revalidatePath("/admin/leads");
    return { success: true };
  } catch (error) {
    console.error("Error updating lead status:", error);
    return { success: false, error };
  }
}

export async function deleteLead(leadId: string) {
  try {
    await db.delete(lead).where(eq(lead.id, leadId));

    revalidatePath("/admin/leads");
    return { success: true };
  } catch (error) {
    console.error("Error deleting lead:", error);
    return { success: false, error };
  }
}

export async function createLead(data: {
  userId: string;
  name: string;
  email: string;
  message: string;
}) {
  try {
    const { userId, name, email, message } = data;

    const newLead = await db
      .insert(lead)
      .values({
        id: crypto.randomUUID(),
        userId,
        name,
        email,
        message,
        status: "new",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return { success: true, lead: newLead[0] };
  } catch (error) {
    console.error("Error creating lead:", error);
    return { success: false, error };
  }
}
