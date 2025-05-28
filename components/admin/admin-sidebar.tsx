"use client";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { AdminNav } from "./admin-nav";
import { Logo } from "../logo";
import { UpgradePlanCard } from "./upgrade-button";
import { ProPlanCard } from "./manage-subscription-button";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

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
    <Sidebar className="border-dashed bg-accent/30">
      <SidebarHeader className="h-12 flex justify-center border-b border-dashed bg-muted/50">
        <Logo className="text-2xl" />
      </SidebarHeader>
      <SidebarContent className="flex flex-col gap-8 justify-between">
        <SidebarGroup>
          <User name={name} username={username} email={email} isPro={isPro} />
          <AdminNav />
        </SidebarGroup>
        <SidebarGroup>
          {!isPro && productInfo && <UpgradePlanCard productInfo={productInfo} />}
          {isPro && <ProPlanCard />}
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-dashed bg-muted/50">
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
    <div className="mb-8 text-muted-foreground text-xs">
      <p className="text-foreground mb-2">
        Welcome back, {name} {isPro && "⭐"}
      </p>
      <p>username: {username}</p>
      <p>email: {email}</p>
      <Link
        href={`/${username}`}
        className="flex items-center gap-1 text-foreground mt-2 hover:underline"
      >
        View your portfolio <ExternalLink size={12} />
      </Link>
    </div>
  );
};
