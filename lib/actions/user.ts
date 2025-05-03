"use server";

import { user } from "@/db/schema";
import { db } from "@/db/drizzle";
import { eq } from "drizzle-orm";

export const getUserById = async (userId: string) => {
  const userInfo = await db
    .select()
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return userInfo;
};

export const getUserByUsername = async (username: string) => {
  const userInfo = await db
    .select()
    .from(user)
    .where(eq(user.username, username))
    .limit(1);

  return userInfo;
};
