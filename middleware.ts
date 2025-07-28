// middleware.ts  (Node runtime)

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUsernameByDomain } from "@/lib/data/domain";

/* ------------------------------------------------------------------ */
/* Configuration                                                      */
/* ------------------------------------------------------------------ */

const CONFIG = {
  runtime: "nodejs",

  mainDomain:
    process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, "") || "wrk.so",

  reservedUsernames: [
    "admin",
    "posts",
    "privacy-policy",
    "terms-of-use",
    "about",
    "contact",
    "dashboard",
    "featured",
    "network",
    "login",
    "sign-in",
    "sign-up",
    "sign-out",
    "api",
    "onboarding",
    "_next",
    "_sites",
    "privacy",
    "terms",
  ] as const,

  publicRoutes: ["/", "/sign-in", "/privacy", "/terms"] as const,
  protectedRoutes: ["/admin", "/onboarding"] as const,
} as const;

type RouteType = "public" | "protected" | "username" | "api" | "api-upload";

/* ------------------------------------------------------------------ */
/* Helper utilities                                                   */
/* ------------------------------------------------------------------ */

const getMainDomain = () => CONFIG.mainDomain;

function isMainDomain(host: string): boolean {
  const main = getMainDomain();
  return (
    host === main ||
    host === `www.${main}` ||
    host.startsWith("localhost") || // dev
    host.endsWith(".vercel.app") // preview
  );
}

function getSubdomain(host: string): string | null {
  const main = getMainDomain();
  if (host === main || host === `www.${main}`) return null;
  return host.endsWith(`.${main}`) ? host.slice(0, -`.${main}`.length) : null;
}

function isCustomDomain(host: string): boolean {
  const main = getMainDomain();
  return (
    !host.endsWith(`.${main}`) &&
    host !== main &&
    host !== `www.${main}` &&
    !host.startsWith("localhost") &&
    !host.endsWith(".vercel.app")
  );
}

const isValidUsername = (u: string) => /^[a-zA-Z0-9_-]{3,20}$/.test(u);
const isValidProjectSlug = (s: string) => /^[a-zA-Z0-9_-]+$/.test(s);

function classifyRoute(pathname: string): RouteType {
  if (pathname === "/") return "public";
  if (pathname.startsWith("/api"))
    return pathname === "/api/upload" ? "api-upload" : "api";

  if (
    CONFIG.publicRoutes.includes(pathname as any) ||
    CONFIG.publicRoutes.some((r) => pathname.startsWith(`${r}/`))
  )
    return "public";

  if (CONFIG.protectedRoutes.some((r) => pathname.startsWith(r)))
    return "protected";

  const [first, second] = pathname.split("/").filter(Boolean);
  if (
    first &&
    !CONFIG.reservedUsernames.includes(first as any) &&
    isValidUsername(first) &&
    (!second || isValidProjectSlug(second))
  )
    return "username";

  return "public";
}

async function getSession(request: NextRequest) {
  try {
    return await auth.api.getSession({ headers: request.headers });
  } catch (e) {
    console.error("[middleware] session error", e);
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Main middleware function                                           */
/* ------------------------------------------------------------------ */

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.nextUrl.hostname; // Node & Edge safe

  /* ---------- Sub-domain / custom-domain routing ---------- */

  if (!isMainDomain(host)) {
    const sub = getSubdomain(host);
    if (sub) {
      // username.wrk.so  →  /username
      if (!pathname.startsWith(`/${sub}`)) {
        const url = request.nextUrl.clone();
        url.pathname = `/${sub}${pathname}`;
        return NextResponse.rewrite(url);
      }
      return NextResponse.next();
    }

    if (isCustomDomain(host)) {
      // Skip database lookup for static assets
      if (
        pathname.startsWith("/_next/") ||
        pathname.startsWith("/favicon") ||
        pathname.includes(".")
      ) {
        return new NextResponse("Not found", { status: 404 });
      }

      // Look up the username associated with this custom domain
      const username = await getUsernameByDomain(host);

      if (username) {
        // Rewrite to the user's portfolio page
        const url = request.nextUrl.clone();
        url.pathname = `/${username}${pathname}`;
        return NextResponse.rewrite(url);
      }

      // If domain not found, return 404
      return new NextResponse("Domain not found", { status: 404 });
    }

    return NextResponse.next();
  }

  /* ---------- Main-domain routing ---------- */

  const routeType = classifyRoute(pathname);

  let session: Awaited<ReturnType<typeof getSession>> | null = null;
  if (
    routeType === "protected" ||
    routeType === "api-upload" ||
    pathname === "/sign-in" ||
    pathname === "/"
  ) {
    session = await getSession(request);
  }

  switch (routeType) {
    case "api-upload":
      if (!session?.user)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      return NextResponse.next();

    case "api":
    case "public":
      // Redirect authenticated users away from sign-in page and homepage
      if ((pathname === "/sign-in" || pathname === "/") && session?.user) {
        // If user doesn't have a username, redirect to onboarding
        if (!session.user.username) {
          return NextResponse.redirect(new URL("/onboarding", request.url));
        }
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.next();

    case "username":
      return NextResponse.next();

    case "protected":
      if (!session?.user)
        return NextResponse.redirect(new URL("/sign-in", request.url));

      if (pathname.startsWith("/admin") && !session.user.username) {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }
      return NextResponse.next();
  }
}

/* ------------------------------------------------------------------ */
/* Config: Node runtime + matcher                                     */
/* ------------------------------------------------------------------ */

export const config = {
  matcher: [
    // Skip static assets & HMR
    "/((?!_next/static|_next/image|_next/webpack-hmr|favicon.ico|ingest).*)",
  ],
  runtime: "nodejs",
};
