import { AdminHeader } from "@/components/admin/admin-header";
import { PageWrapper } from "@/components/admin/page-wrapper";
import { LeadsList } from "@/components/admin/leads-list";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Suspense } from "react";

import { getLeadsByUserId } from "@/lib/actions/leads";
import { getSession } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { Lead } from "@/db/schema";

export const dynamic = "force-dynamic";

function ErrorDisplay({ error }: { error: string }) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Error loading leads</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
}

function LeadsListWrapper({ userId, leads }: { userId: string; leads: Lead[] }) {
  return (
    <Suspense fallback={<div>Loading leads...</div>}>
      <LeadsList userId={userId} leads={leads} />
    </Suspense>
  );
}

export default async function LeadsPage() {
  try {
    const session = await getSession();

    if (!session?.user) {
      redirect("/sign-in");
    }

    let leads: Lead[] = [];
    try {
      leads = await getLeadsByUserId(session.user.id);
    } catch (error) {
      console.error("Failed to load leads:", error);
      // Continue with empty leads array
    }

    return (
      <>
        <AdminHeader pageTitle="Leads" />
        <PageWrapper>
          <LeadsListWrapper userId={session.user.id} leads={leads} />
        </PageWrapper>
      </>
    );
  } catch (error) {
    // Re-throw redirect errors
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error;
    }

    console.error("Failed to load leads page:", error);

    return (
      <>
        <AdminHeader pageTitle="Leads" />
        <PageWrapper>
          <ErrorDisplay error="Failed to load leads. Please try refreshing the page." />
        </PageWrapper>
      </>
    );
  }
}
