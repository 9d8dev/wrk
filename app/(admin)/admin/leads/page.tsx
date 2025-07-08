import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { LeadsList } from "@/components/admin/leads-list";
import { PageWrapper } from "@/components/admin/page-wrapper";
import { getSession } from "@/lib/actions/auth";
import { getLeadsByUserId } from "@/lib/actions/leads";

export const dynamic = "force-dynamic";

async function getLeadsData(userId: string) {
	try {
		const leads = await getLeadsByUserId(userId);
		return leads;
	} catch (error) {
		console.error("Error fetching leads:", error);
		return [];
	}
}

export default async function LeadsPage() {
	const session = await getSession();

	if (!session?.user) {
		redirect("/sign-in");
	}

	const leads = await getLeadsData(session.user.id);

	return (
		<>
			<AdminHeader pageTitle="Leads" />
			<PageWrapper>
				<LeadsList userId={session.user.id} leads={leads} />
			</PageWrapper>
		</>
	);
}
