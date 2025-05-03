import { SignOutButton } from "@/components/auth/sign-out-button";
import { AdminNav } from "./admin-nav";
import { Button } from "@/components/ui/button";
import { Logo } from "../logo";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Check, ExternalLink } from "lucide-react";
import Link from "next/link";

export function AdminSidebar({
  name,
  username,
  email,
}: {
  name: string;
  username: string;
  email: string;
}) {
  return (
    <Sidebar className="border-dashed bg-accent/30">
      <SidebarHeader className="h-12 flex justify-center border-b border-dashed bg-muted/50">
        <Logo />
      </SidebarHeader>
      <SidebarContent className="flex flex-col gap-8 justify-between">
        <SidebarGroup>
          <User name={name} username={username} email={email} />
          <AdminNav />
        </SidebarGroup>
        <SidebarGroup>
          <UpgradePlan />
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
}: {
  name: string;
  username: string;
  email: string;
}) => {
  return (
    <div className="mb-8 text-muted-foreground text-xs">
      <p className="text-foreground mb-2">Welcome back, {name}</p>
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

const UpgradePlan = () => {
  return (
    <div className="p-2.5 border rounded-md bg-background space-y-1">
      <p>Upgrade Account</p>
      <p className="text-muted-foreground text-xs">
        Upgrade to a paid plan to unlock additional features.
      </p>
      <ul className="space-y-1 text-xs mt-2 mb-4">
        <li>
          <Check className="inline" size={12} /> Custom Domain
        </li>
        <li>
          <Check className="inline" size={12} /> Unlimited Projects
        </li>
        <li>
          <Check className="inline" size={12} /> Support the Community
        </li>
      </ul>
      <Button className="w-full" size="sm">
        Only $10/mo
      </Button>
    </div>
  );
};
