import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

import { getSession } from "@/lib/actions/auth";
import { hasActiveProSubscription } from "@/lib/actions/polar";
import { polarConfig } from "@/lib/config/polar";
import { redirect } from "next/navigation";

/**
 * Error Boundary Component for Admin Layout
 */
function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Alert variant="destructive" className="max-w-md">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription>
          {error.message || "An unexpected error occurred. Please try refreshing the page."}
        </AlertDescription>
      </Alert>
    </div>
  );
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const session = await getSession();

    if (!session?.user) {
      redirect("/sign-in");
    }

    // Ensure user has required fields
    if (!session.user.username) {
      redirect("/onboarding");
    }

    // Check if user has an active Pro subscription
    let isPro = false;
    try {
      isPro = await hasActiveProSubscription();
    } catch (error) {
      console.error("Failed to check Pro subscription status:", error);
      // Continue with free tier if subscription check fails
    }

    // Get the first product info for the upgrade plan
    const productInfo = polarConfig.products[0] ? {
      slug: polarConfig.products[0].slug,
      name: polarConfig.products[0].name,
      description: polarConfig.products[0].description,
      features: polarConfig.products[0].features,
      price: polarConfig.products[0].price,
    } : undefined;

    // Validate required user fields
    const userName = session.user.name || "User";
    const userEmail = session.user.email || "";
    const userUsername = session.user.username || "";

    return (
      <SidebarProvider>
        <AdminSidebar
          name={userName}
          username={userUsername}
          email={userEmail}
          isPro={isPro}
          productInfo={productInfo}
        />
        <main id="admin-page" className="relative w-full">
          {children}
          <SidebarTrigger className="fixed bottom-2 ml-2 left-[sidebar-size] z-50" />
        </main>
      </SidebarProvider>
    );
  } catch (error) {
    console.error("Admin layout error:", error);
    
    // If it's a redirect error, re-throw it
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }
    
    // Otherwise show error fallback
    return <ErrorFallback error={error as Error} />;
  }
}