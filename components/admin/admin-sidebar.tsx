import { SignOutButton } from "@/components/auth/sign-out-button";
import { AdminNav } from "./admin-nav";
import { Button } from "@/components/ui/button";
import { Logo } from "../logo";
import { createCheckoutSession } from "@/lib/actions/polar";
import { polarConfig } from "@/lib/config/polar";

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
  isPro = false,
}: {
  name: string;
  username: string;
  email: string;
  isPro?: boolean;
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
          {!isPro && <UpgradePlan />}
          {isPro && <ProPlan />}
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

const UpgradePlan = () => {
  const proProduct = polarConfig.products[0];

  return (
    <div className="p-2.5 border rounded-md bg-background space-y-1">
      <p>Upgrade to {proProduct.name}</p>
      <p className="text-muted-foreground text-xs">
        {proProduct.description}
      </p>
      <ul className="space-y-1 text-xs mt-2 mb-4">
        {proProduct.features.slice(0, 3).map((feature, index) => (
          <li key={index}>
            <Check className="inline" size={12} /> {feature}
          </li>
        ))}
      </ul>
      <form
        action={async () => {
          "use server";
          await createCheckoutSession(proProduct.slug);
        }}
      >
        <Button type="submit" className="w-full" size="sm">
          Upgrade - {proProduct.price}
        </Button>
      </form>
    </div>
  );
};

const ProPlan = () => {
  return (
    <div className="p-2.5 border rounded-md bg-background space-y-1">
      <p className="flex items-center gap-2">
        Pro Account <span className="text-xs">⭐</span>
      </p>
      <p className="text-muted-foreground text-xs">
        Thank you for supporting Wrk.so!
      </p>
      <form
        action={async () => {
          "use server";
          const { createCustomerPortalSession } = await import("@/lib/actions/polar");
          await createCustomerPortalSession();
        }}
      >
        <Button type="submit" variant="outline" className="w-full mt-2" size="sm">
          Manage Subscription
        </Button>
      </form>
    </div>
  );
};
