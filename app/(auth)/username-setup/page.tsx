import { UsernameSetupForm } from "@/components/auth/username-setup-form";

import { getSession } from "@/lib/actions/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function UsernameSetupPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/sign-in");
  }

  // If user already has a profile, redirect to admin
  if (session.user.username) {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <UsernameSetupForm user={session.user} />
    </main>
  );
}
