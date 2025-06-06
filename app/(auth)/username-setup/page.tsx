import { UsernameSetupForm } from "@/components/auth/username-setup-form";

import { getSession } from "@/lib/actions/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    from?: string;
  }>;
}

export default async function UsernameSetupPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const session = await getSession();

  if (!session?.user) {
    redirect("/sign-in");
  }

  // Allow users to change their username if they came from OAuth
  const isFromOAuth = resolvedSearchParams.from === "oauth";

  // If user already has a username and didn't come from OAuth flow, redirect to admin
  if (session.user.username && !isFromOAuth) {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <UsernameSetupForm
        user={session.user}
        isEdit={Boolean(session.user.username) && isFromOAuth}
      />
    </main>
  );
}
