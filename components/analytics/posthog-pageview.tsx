"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";

export function PostHogPageView() {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const posthog = usePostHog();

	useEffect(() => {
		// Track pageview only if PostHog is initialized and we have a pathname
		if (!pathname || !posthog) {
			return;
		}

		try {
			// Safely construct URL
			const origin =
				typeof window !== "undefined"
					? window.location.origin ||
						`${window.location.protocol}//${window.location.host}`
					: "";
			let url = origin + pathname;
			if (searchParams.toString()) {
				url = `${url}?${searchParams.toString()}`;
			}

			// Determine the domain type for multi-tenant analytics
			const host = typeof window !== "undefined" ? window.location.host : "";
			const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
			const mainDomain = appUrl.replace(/https?:\/\//, "");

			let domainType = "main";
			let portfolioOwner = null;

			if (host === mainDomain || host === `www.${mainDomain}`) {
				domainType = "main";
				// Check if it's a username route like /username
				const usernameMatch = pathname.match(/^\/([^/]+)$/);
				if (
					usernameMatch &&
					!["privacy", "terms", "sign-in", "admin", "api"].includes(
						usernameMatch[1],
					)
				) {
					portfolioOwner = usernameMatch[1];
				}
			} else if (host.endsWith(`.${mainDomain}`)) {
				domainType = "username_subdomain";
				portfolioOwner = host.replace(`.${mainDomain}`, "");
			} else {
				domainType = "custom_domain";
				// For custom domains, we don't know the owner from the URL alone
				// This could be enhanced by making an API call or storing in context
			}

			// Track the pageview with additional context
			posthog.capture("$pageview", {
				$current_url: url,
				domain_type: domainType,
				portfolio_owner: portfolioOwner,
				pathname: pathname,
				host: host,
			});
		} catch (error) {
			console.error("PostHog pageview tracking error:", error);
		}
	}, [pathname, searchParams, posthog]);

	return null;
}
