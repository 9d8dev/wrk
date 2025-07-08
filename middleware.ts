import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Cache the main domain to avoid recalculating
const getMainDomain = (() => {
	let cachedDomain: string | null = null;
	return () => {
		if (cachedDomain === null) {
			cachedDomain =
				process.env.NEXT_PUBLIC_APP_URL?.replace(/https?:\/\//, "") || "wrk.so";
		}
		return cachedDomain;
	};
})();

// Reserved usernames that should not be treated as user routes
const RESERVED_USERNAMES = [
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
];

// Helper function to determine if this is the main domain
function isMainDomain(host: string): boolean {
	const mainDomain = getMainDomain();
	return host === mainDomain || host === `www.${mainDomain}`;
}

// Helper function to extract subdomain
function getSubdomain(host: string): string | null {
	const mainDomain = getMainDomain();

	if (host === mainDomain || host === `www.${mainDomain}`) {
		return null;
	}

	// Check if it's a subdomain of the main domain
	if (host.endsWith(`.${mainDomain}`)) {
		return host.replace(`.${mainDomain}`, "");
	}

	// Otherwise, it's a custom domain
	return null;
}

// Helper function to check if it's a custom domain
function isCustomDomain(host: string): boolean {
	const mainDomain = getMainDomain();
	return (
		!host.endsWith(`.${mainDomain}`) &&
		host !== mainDomain &&
		host !== `www.${mainDomain}`
	);
}

// Helper function to check if a path is a username-based route
function isUsernameRoute(pathname: string): boolean {
	const segments = pathname.split("/").filter(Boolean);

	if (segments.length === 0) return false;

	const firstSegment = segments[0];

	// Skip reserved routes
	if (RESERVED_USERNAMES.includes(firstSegment)) {
		return false;
	}

	// Valid username patterns:
	// /username -> portfolio page
	// /username/contact -> contact page
	// /username/project-slug -> project page
	if (segments.length === 1) {
		// Just username: /brijr
		return /^[a-zA-Z0-9_-]{3,20}$/.test(firstSegment);
	} else if (segments.length === 2) {
		// Username with subpage: /brijr/contact or /brijr/project-name
		return (
			/^[a-zA-Z0-9_-]{3,20}$/.test(firstSegment) &&
			/^[a-zA-Z0-9_-]+$/.test(segments[1])
		);
	}

	return false;
}

export async function middleware(request: NextRequest) {
	const pathname = request.nextUrl.pathname;
	const host = request.headers.get("host") || "";

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

	// Handle main domain routing (app functionality)
	if (isMainDomain(host)) {
		// Handle upload API route separately - requires authentication
		if (pathname === "/api/upload") {
			if (!session?.user) {
				return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
			}
			return NextResponse.next();
		}

		// Redirect authenticated users from homepage to admin dashboard
		if (pathname === "/" && session?.user) {
			return NextResponse.redirect(new URL("/admin", request.url));
		}

		// Always public routes (no authentication required)
		const alwaysPublicRoutes = ["/sign-in", "/", "/privacy", "/terms"];

		// Check for always public routes
		if (
			alwaysPublicRoutes.some(
				(route) => pathname === route || pathname.startsWith(route + "/"),
			)
		) {
			return NextResponse.next();
		}

		// API routes (except upload which is handled above)
		if (pathname.startsWith("/api")) {
			return NextResponse.next();
		}

		// Username-based portfolio routes - these are public
		if (isUsernameRoute(pathname)) {
			return NextResponse.next();
		}

		// Protect admin routes and onboarding - require authentication
		if (pathname.startsWith("/admin") || pathname.startsWith("/onboarding")) {
			if (!session?.user) {
				return NextResponse.redirect(new URL("/sign-in", request.url));
			}
		}

		return NextResponse.next();
	}

	// Handle subdomain routing (username.wrk.so -> portfolio)
	const subdomain = getSubdomain(host);
	if (subdomain) {
		const url = request.nextUrl.clone();
		url.pathname = `/${subdomain}${pathname}`;
		return NextResponse.rewrite(url);
	}

	// Handle custom domain routing (Pro feature)
	if (isCustomDomain(host)) {
		// Rewrite to special route for database lookup and Pro subscription validation
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
		 * - ingest (PostHog analytics)
		 */
		"/((?!_next/static|_next/image|favicon.ico|ingest).*)",
	],
	runtime: "nodejs",
};
