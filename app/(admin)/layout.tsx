import { redirect } from "next/navigation";
import React from "react";

import { PostHogUserIdentifier } from "@/components/analytics/posthog-user-identifier";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

import { hasActiveProSubscription } from "@/lib/actions/polar";
import { polarConfig } from "@/lib/config/polar";
import { getSession } from "@/lib/actions/auth";
import { getUserById } from "@/lib/data/user";

async function getAdminData() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/sign-in");
  }

  const userResult = await getUserById(session.user.id);
  if (!userResult.success || !userResult.data) {
    redirect("/sign-in");
  }

  const userData = userResult.data;

  // Use fresh data from database instead of potentially cached session data
  if (!userData.username) {
    redirect("/onboarding");
  }

  let isPro = false;

  try {
    isPro = await hasActiveProSubscription();
  } catch (error) {
    console.error("Failed to check Pro subscription status:", error);
  }

  const productInfo = polarConfig.products[0]
    ? {
        slug: polarConfig.products[0].slug,
        name: polarConfig.products[0].name,
        description: polarConfig.products[0].description,
        features: polarConfig.products[0].features,
        price: polarConfig.products[0].price,
      }
    : undefined;

  return {
    userData,
    isPro,
    productInfo,
    userName: userData.name || session.user.name || "User",
    userEmail: userData.email || session.user.email || "",
    userUsername: userData.username || "", // Always use fresh DB data for username
  };
}

function AdminErrorFallback({ error }: { error: Error }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="border-destructive/50 bg-destructive/10 max-w-md rounded-lg border p-6">
        <h2 className="text-destructive mb-2 text-lg font-semibold">
          Something went wrong
        </h2>
        <p className="text-muted-foreground text-sm">
          {error.message ||
            "An unexpected error occurred. Please try refreshing the page."}
        </p>
      </div>
    </div>
  );
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const { userData, isPro, productInfo, userName, userEmail, userUsername } =
      await getAdminData();

    return (
      <SidebarProvider>
        <PostHogUserIdentifier user={userData} />
        <AdminSidebar
          name={userName}
          username={userUsername}
          email={userEmail}
          isPro={isPro}
          productInfo={productInfo}
        />
        <main id="admin-page" className="relative w-full">
          {children}
          <SidebarTrigger className="fixed bottom-2 left-[sidebar-size] z-50 ml-2" />
        </main>
      </SidebarProvider>
    );
  } catch (error) {
    console.error("Admin layout error:", error);

    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }

    return <AdminErrorFallback error={error as Error} />;
  }
}
