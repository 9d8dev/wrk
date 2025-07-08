"use client";

import {
  Layout,
  Settings,
  SquareArrowDownLeft,
  SquareAsterisk,
  SquareUser,
} from "lucide-react";
import Link from "next/link";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const nav_links = [
  {
    href: "/admin",
    label: "Projects",
    icon: <Layout className="mr-2 h-4 w-4" />,
  },
  {
    href: "/admin/profile",
    label: "Profile",
    icon: <SquareUser className="mr-2 h-4 w-4" />,
  },
  {
    href: "/admin/theme",
    label: "Theme",
    icon: <SquareAsterisk className="mr-2 h-4 w-4" />,
  },
  {
    href: "/admin/leads",
    label: "Leads",
    icon: <SquareArrowDownLeft className="mr-2 h-4 w-4" />,
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: <Settings className="mr-2 h-4 w-4" />,
  },
];

export function AdminNav() {
  return (
    <nav className="flex flex-col gap-1">
      {nav_links.map((link) => (
        <NavLink key={link.href} {...link} />
      ))}
    </nav>
  );
}

const NavLink = ({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: ReactNode;
}) => {
  const pathname = usePathname();

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-start",
        "border-sidebar border-y border-dashed",
        "-mx-2 px-2.5 py-1",
        pathname === href
          ? "bg-accent text-foreground border-border cursor-default border-y"
          : "hover:bg-accent hover:text-foreground hover:border-border transition-all"
      )}
    >
      {icon}
      {label}
    </Link>
  );
};
