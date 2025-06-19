import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Helper function to determine if this is the main domain
function isMainDomain(host: string): boolean {
  const mainDomain = process.env.NEXT_PUBLIC_APP_URL?.replace(/https?:\/\//, '') || 'wrk.so';
  return host === mainDomain || host === `www.${mainDomain}`;
}

// Helper function to extract subdomain
function getSubdomain(host: string): string | null {
  const mainDomain = process.env.NEXT_PUBLIC_APP_URL?.replace(/https?:\/\//, '') || 'wrk.so';
  
  if (host === mainDomain || host === `www.${mainDomain}`) {
    return null;
  }
  
  // Check if it's a subdomain of the main domain
  if (host.endsWith(`.${mainDomain}`)) {
    return host.replace(`.${mainDomain}`, '');
  }
  
  // Otherwise, it's a custom domain
  return null;
}

// Helper function to check if it's a custom domain
function isCustomDomain(host: string): boolean {
  const mainDomain = process.env.NEXT_PUBLIC_APP_URL?.replace(/https?:\/\//, '') || 'wrk.so';
  return !host.endsWith(`.${mainDomain}`) && host !== mainDomain && host !== `www.${mainDomain}`;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const host = request.headers.get('host') || '';

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

  // Handle main domain routing (existing behavior)
  if (isMainDomain(host)) {
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
      pathname === "/" ||
      pathname.startsWith("/api")
    ) {
      return NextResponse.next();
    }

    // Check if user is authenticated for admin routes
    if (!session?.user) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    return NextResponse.next();
  }

  // Handle subdomain routing (username.wrk.so)
  const subdomain = getSubdomain(host);
  if (subdomain) {
    // Rewrite to the existing username-based routing
    const url = request.nextUrl.clone();
    url.pathname = `/${subdomain}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // Handle custom domain routing (Pro feature)
  if (isCustomDomain(host)) {
    // For custom domains, we need to look up the user in the database
    // Since we can't easily do database queries in middleware, we'll rewrite to a special route
    // that will handle the domain lookup and Pro subscription validation
    const url = request.nextUrl.clone();
    url.pathname = `/_sites/${host}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // Default fallback
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
  runtime: "nodejs",
};
