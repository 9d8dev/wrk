import { type NextRequest, NextResponse } from "next/server";

import { isUsernameAvailable } from "@/lib/data/user";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { error: "Username parameter is required" },
        { status: 400 }
      );
    }

    // Basic validation
    if (username.length < 3) {
      return NextResponse.json({
        available: false,
        message: "Username must be at least 3 characters",
      });
    }

    if (username.length > 20) {
      return NextResponse.json({
        available: false,
        message: "Username must be at most 20 characters",
      });
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return NextResponse.json({
        available: false,
        message:
          "Username can only contain letters, numbers, underscores, and hyphens",
      });
    }

    const result = await isUsernameAvailable(username);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      available: result.data,
      message: result.data
        ? "Username is available"
        : "Username is already taken",
    });
  } catch (error) {
    console.error("Username availability check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
