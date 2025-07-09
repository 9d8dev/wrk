"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { SignOutButton } from "@/components/auth/sign-out-button";

import { AdminNav } from "@/components/admin/admin-nav";
import { UpgradePlanCard } from "@/components/admin/upgrade-button";
import { Logo } from "@/components/logo";

export function AdminSidebar({
  name,
  username,
  email,
  isPro = false,
  productInfo,
}: {
  name: string;
  username: string;
  email: string;
  isPro?: boolean;
  productInfo?: {
    slug: string;
    name: string;
    description: string;
    features: string[];
    price: string;
  };
}) {
  return (
    <Sidebar className="bg-accent/30 border-dashed">
      <SidebarHeader className="bg-muted/50 flex h-12 justify-center border-b border-dashed">
        <Logo width={24} />
      </SidebarHeader>
      <SidebarContent className="flex flex-col justify-between gap-8">
        <SidebarGroup>
          <User name={name} username={username} email={email} isPro={isPro} />
          <AdminNav />
        </SidebarGroup>
        <SidebarGroup>
          {!isPro && productInfo && (
            <UpgradePlanCard productInfo={productInfo} />
          )}
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="bg-muted/50 border-t border-dashed">
        <SignOutButton size="sm" />
      </SidebarFooter>
    </Sidebar>
  );
}

const User = ({
  name,
  username,
  email,
  isPro,
}: {
  name: string;
  username: string;
  email: string;
  isPro?: boolean;
}) => {
  return (
    <div className="text-muted-foreground mb-8 text-xs">
      <p className="text-foreground mb-2">
        Welcome back, {name} {isPro && "⭐"}
      </p>
      <p>username: {username}</p>
      <p>email: {email}</p>
      <Link
        href={`/${username}`}
        className="text-foreground mt-2 flex items-center gap-1 hover:underline"
      >
        View your portfolio <ExternalLink size={12} />
      </Link>
    </div>
  );
};
