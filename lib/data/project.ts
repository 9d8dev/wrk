"use server";

import { getUserByUsername } from "@/lib/data/user";
import { project } from "@/db/schema";
import { db } from "@/db/drizzle";
import { eq, and } from "drizzle-orm";

export const getProjectsByUsername = async (username: string) => {
  const userInfo = await getUserByUsername(username);

  if (!userInfo) return null;

  const user = userInfo;

  const data = await db
    .select()
    .from(project)
    .where(eq(project.userId, user.id))
    .orderBy(project.displayOrder)
    .limit(100);

  return data;
};

export const getProjectByUsernameAndSlug = async (
  username: string,
  projectSlug: string
) => {
  const userInfo = await getUserByUsername(username);

  if (!userInfo) return null;

  const user = userInfo;

  const data = await db
    .select()
    .from(project)
    .where(and(eq(project.userId, user.id), eq(project.slug, projectSlug)))
    .limit(1);

  return data[0];
};

export const getAllProjects = async (userId: string) => {
  const data = await db
    .select()
    .from(project)
    .where(eq(project.userId, userId))
    .orderBy(project.displayOrder)
    .limit(100);

  return data;
};
