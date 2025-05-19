"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

import Link from "next/link";

import type { User } from "@/db/schema";

export const ProfileNav = ({ user }: { user: User }) => {
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
    </nav>
  );
};
