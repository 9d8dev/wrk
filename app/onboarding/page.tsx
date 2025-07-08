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
    <main className="from-background to-muted/50 min-h-screen bg-gradient-to-br">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <SimpleOnboarding user={session.user} />
      </div>
    </main>
  );
}
