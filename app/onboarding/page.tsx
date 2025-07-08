import { redirect } from "next/navigation";
import { SimpleOnboarding } from "@/components/onboarding/simple-onboarding";
import { getSession } from "@/lib/actions/auth";
import { getProfileByUserId } from "@/lib/data/profile";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
	const session = await getSession();

	if (!session?.user) {
		redirect("/sign-in");
	}

	// Check if user already has a profile
	const profileResult = await getProfileByUserId(session.user.id);
	if (profileResult.success && profileResult.data) {
		redirect("/admin");
	}

	return (
		<main className="min-h-screen bg-gradient-to-br from-background to-muted/50">
			<div className="container max-w-4xl mx-auto py-12 px-4">
				<SimpleOnboarding user={session.user} />
			</div>
		</main>
	);
}
