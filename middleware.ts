import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request, {
    cookiePrefix: "better-auth", // Match the prefix in auth.ts
  });
  const pathname = request.nextUrl.pathname;

  // Handle upload API route separately
  if (pathname === "/api/upload") {
    // For upload routes, just check authentication
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Redirect authenticated users from homepage to admin
  if (pathname === "/" && sessionCookie) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // Public routes that don't require authentication
  if (
    pathname.startsWith("/sign-in") ||
    pathname === "/" ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // For admin routes, we'll check profile completion on the page level
  // This is because we can't easily check database from middleware

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*", "/onboarding", "/api/upload"],
};
