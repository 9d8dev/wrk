import { AlertTriangle } from "lucide-react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AdminHeader } from "@/components/admin/admin-header";
import { DangerZone } from "@/components/admin/danger-zone";
import { DomainManagement } from "@/components/admin/domain-management";
import { SubscriptionSection } from "@/components/admin/subscription-section";
import { PageWrapper } from "@/components/admin/page-wrapper";

import { getSubscriptionDetailsWithErrorHandling } from "@/lib/utils/subscription";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

function ErrorDisplay({ error }: { error: string }) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Error loading settings</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
}

export default async function SettingsPage() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      redirect("/sign-in");
    }

    const subscriptionDetails = await getSubscriptionDetailsWithErrorHandling();

    return (
      <>
        <AdminHeader pageTitle="Settings" />
        <PageWrapper className="mx-auto max-w-2xl">
          <div className="space-y-12">
            <SubscriptionSection subscriptionDetails={subscriptionDetails} />
            <DomainManagement />
            <DangerZone />
          </div>
        </PageWrapper>
      </>
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }

    console.error("Failed to load settings page:", error);

    return (
      <>
        <AdminHeader pageTitle="Settings" />
        <PageWrapper>
          <ErrorDisplay error="Failed to load settings. Please try refreshing the page." />
        </PageWrapper>
      </>
    );
  }
}
