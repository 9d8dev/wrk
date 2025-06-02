"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { notifyNewUserSignup } from "@/lib/utils/discord";
import { ActionResponse } from "./utils";

/**
 * Get the current user session
 * @returns The session object or null if not authenticated
 */
export const getSession = async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    return session;
  } catch (error) {
    console.error("Failed to get session:", error);
    return null;
  }
};

// These auth actions are kept for server-side use only
// For client-side auth, use authClient from lib/auth-client.ts

/**
 * Handle post-signup actions like sending Discord notifications
 * @param userData User data from signup
 * @returns Success or error response
 */
export const handlePostSignup = async (userData: {
  name: string;
  email: string;
  username: string;
}): Promise<ActionResponse<void>> => {
  try {
    // Send Discord notification for new signup
    await notifyNewUserSignup({
      ...userData,
      createdAt: new Date(),
    });
    
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Failed to handle post-signup:", error);
    // Don't fail the signup if Discord notification fails
    return { success: true, data: undefined };
  }
};

/**
 * Sign out the current user
 * @returns Never returns, redirects to home page
 */
export const signOut = async (): Promise<never> => {
  try {
    await auth.api.signOut({
      headers: await headers(),
    });
  } catch (error) {
    console.error("Failed to sign out:", error);
  } finally {
    redirect("/");
  }
};
