"use server";

import { user } from "@/db/schema";
import { db } from "@/db/drizzle";
import { eq } from "drizzle-orm";

export const getAllUsers = async () => {
  const data = await db.select().from(user);

  return data;
};

export const getUserById = async (userId: string) => {
  const data = await db.select().from(user).where(eq(user.id, userId)).limit(1);

  return data[0];
};

export const getUserByUsername = async (username: string) => {
  const data = await db
    .select()
    .from(user)
    .where(eq(user.username, username))
    .limit(1);

  return data[0];
};
