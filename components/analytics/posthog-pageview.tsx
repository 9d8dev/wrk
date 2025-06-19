'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { usePostHog } from 'posthog-js/react';

export function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthog = usePostHog();

  useEffect(() => {
    // Track pageview only if PostHog is initialized
    if (pathname && posthog) {
      let url = window.origin + pathname;
      if (searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }

      // Determine the domain type for multi-tenant analytics
      const host = window.location.host;
      const mainDomain = process.env.NEXT_PUBLIC_APP_URL?.replace(/https?:\/\//, '') || 'wrk.so';
      
      let domainType = 'main';
      let portfolioOwner = null;
      
      if (host === mainDomain || host === `www.${mainDomain}`) {
        domainType = 'main';
        // Check if it's a username route like /username
        const usernameMatch = pathname.match(/^\/([^\/]+)$/);
        if (usernameMatch && !['privacy', 'terms', 'sign-in'].includes(usernameMatch[1])) {
          portfolioOwner = usernameMatch[1];
        }
      } else if (host.endsWith(`.${mainDomain}`)) {
        domainType = 'username_subdomain';
        portfolioOwner = host.replace(`.${mainDomain}`, '');
      } else {
        domainType = 'custom_domain';
        // For custom domains, we don't know the owner from the URL alone
        // This could be enhanced by making an API call or storing in context
      }

      // Track the pageview with additional context
      posthog.capture('$pageview', {
        $current_url: url,
        domain_type: domainType,
        portfolio_owner: portfolioOwner,
        pathname: pathname,
        host: host,
      });
    }
  }, [pathname, searchParams, posthog]);

  return null;
}