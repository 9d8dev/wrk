import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const pathname = request.nextUrl.pathname;

  // Public routes that don't require authentication
  if (pathname.startsWith("/sign-in") || pathname === "/" || pathname.startsWith("/api")) {
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
  matcher: [
    "/admin/:path*",
    "/onboarding",
  ],
};
