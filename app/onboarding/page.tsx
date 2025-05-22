import { getSession } from "@/lib/actions/auth";
import { getProfileByUserId } from "@/lib/data/profile";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { Logo } from "@/components/logo";

export default async function OnboardingPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/sign-in");
  }

  // Check if user already has a profile
  const existingProfile = await getProfileByUserId(session.user.id);
  if (existingProfile) {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container max-w-2xl mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <Logo className="mb-6" />
          <h1 className="text-3xl font-bold mb-2">Welcome to Wrk.so!</h1>
          <p className="text-muted-foreground">
            Let&apos;s set up your profile to get started
          </p>
        </div>

        <OnboardingForm user={session.user} />
      </div>
    </main>
  );
}