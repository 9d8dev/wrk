import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { revalidateUserProfile } from "@/lib/utils/revalidation";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    // Verify authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id || !session?.user?.username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Force revalidation for the authenticated user's profile
    await revalidateUserProfile(session.user.username, session.user.id);

    return NextResponse.json({
      success: true,
      message: "Revalidation triggered successfully",
      username: session.user.username,
      revalidatedPaths: [
        `/${session.user.username}`,
        "/admin",
        "/admin/profile",
        "/admin/projects",
        "/admin/theme",
      ],
      revalidatedTags: [
        `user:${session.user.id}`,
        `projects:${session.user.id}`,
      ],
    });
  } catch (error) {
    console.error("Test revalidation error:", error);
    return NextResponse.json(
      { error: "Failed to test revalidation" },
      { status: 500 }
    );
  }
}
