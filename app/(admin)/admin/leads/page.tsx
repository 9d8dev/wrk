import { LeadsList } from "@/components/admin/leads-list";
import { AdminHeader } from "@/components/admin/admin-header";
import { Suspense } from "react";

import { getLeadsByUserId } from "@/lib/actions/leads";
import { getSession } from "@/lib/actions/auth";
import { redirect } from "next/navigation";

export default async function LeadsPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/sign-in");
  }

  const leads = await getLeadsByUserId(session.user.id);

  return (
    <>
      <AdminHeader pageTitle="Leads" />
      <section className="space-y-6 p-4 max-w-3xl">
        <Suspense fallback={<div>Loading leads...</div>}>
          <LeadsList userId={session.user.id} leads={leads} />
        </Suspense>
      </section>
    </>
  );
}
