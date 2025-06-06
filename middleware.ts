import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Get session using the same method as server components
  let session;
  try {
    session = await auth.api.getSession({
      headers: request.headers,
    });
  } catch (error) {
    console.error("Middleware session check failed:", error);
    session = null;
  }

  // Handle upload API route separately
  if (pathname === "/api/upload") {
    // For upload routes, just check authentication
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Redirect authenticated users from homepage to admin
  if (pathname === "/" && session?.user) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // Public routes that don't require authentication
  if (
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/username-setup") ||
    pathname === "/" ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  if (!session?.user) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // For admin routes, we'll check profile completion on the page level
  // This is because we can't easily check database from middleware

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/admin/:path*",
    "/onboarding",
    "/username-setup",
    "/api/upload",
  ],
  runtime: "nodejs",
};
