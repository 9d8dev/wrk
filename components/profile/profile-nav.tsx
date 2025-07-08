"use client";

import type { User } from "@/db/schema";

import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export const ProfileNav = ({ user, isPro }: { user: User; isPro: boolean }) => {
  const pathname = usePathname();

  return (
    <nav className="flex gap-4 text-sm">
      <Link
        href={`/${user.username}`}
        className={cn(
          "text-muted-foreground hover:text-foreground transition-all",
          pathname === `/${user.username}` && "sr-only"
        )}
      >
        Projects
      </Link>
      <Link
        href={`/${user.username}/contact`}
        className={cn(
          "text-muted-foreground hover:text-foreground transition-all",
          pathname === `/${user.username}/contact` && "sr-only"
        )}
      >
        Contact
      </Link>
      {!isPro && (
        <>
          |
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "text-muted-foreground hover:text-foreground transition-all"
            )}
          >
            Made with Wrk.so <ArrowUpRight size={12} className="inline-block" />
          </Link>
        </>
      )}
    </nav>
  );
};
