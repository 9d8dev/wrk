import { type NextRequest, NextResponse } from "next/server";

import { getVercelConfigStatus } from "@/lib/vercel-api";
import { auth } from "@/lib/auth";

// GET - Debug Vercel configuration
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Vercel configuration status
    const configStatus = getVercelConfigStatus();

    // Return debug information (without exposing sensitive data)
    return NextResponse.json({
      vercelConfig: {
        hasToken: configStatus.hasToken,
        hasProjectId: configStatus.hasProjectId,
        hasTeamId: configStatus.hasTeamId,
        isValid: configStatus.isValid,
        error: configStatus.error,
      },
      projectId: process.env.VERCEL_PROJECT_ID ? "Set" : "Not set",
      teamId: process.env.VERCEL_TEAM_ID ? "Set" : "Not set",
      suggestion: !configStatus.isValid
        ? "Please ensure VERCEL_API_TOKEN and VERCEL_PROJECT_ID are properly set in your environment variables"
        : "Configuration appears valid",
    });
  } catch (error) {
    console.error("Error checking Vercel config:", error);
    return NextResponse.json(
      {
        error: "Failed to check configuration",
      },
      { status: 500 }
    );
  }
}
