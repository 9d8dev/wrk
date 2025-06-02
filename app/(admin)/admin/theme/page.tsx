import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { PageWrapper } from "@/components/admin/page-wrapper";
import { ThemeForm } from "@/components/admin/theme-form";
import { Suspense } from "react";

import { getThemeByUserId } from "@/lib/actions/theme";
import { getSession } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { Theme } from "@/db/schema";

export const dynamic = "force-dynamic";

function ErrorDisplay({ error }: { error: string }) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Error loading theme</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
}

type SessionUser = {
  id: string;
  name?: string | null;
  username?: string | null;
  email: string;
  image?: string | null;
};

function ThemeFormWrapper({
  user,
  theme,
}: {
  user: SessionUser;
  theme: Theme | null;
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ThemeForm user={user} theme={theme} />
    </Suspense>
  );
}

export default async function ThemePage() {
  try {
    const session = await getSession();

    if (!session?.user) {
      redirect("/sign-in");
    }

    let theme = null;
    try {
      theme = await getThemeByUserId(session.user.id);
    } catch (error) {
      console.error("Failed to load theme:", error);
      // Continue with null theme - form will handle creation
    }

    return (
      <>
        <AdminHeader pageTitle="Theme" />
        <PageWrapper>
          <ThemeFormWrapper user={session.user} theme={theme} />
        </PageWrapper>
      </>
    );
  } catch (error) {
    // Re-throw redirect errors
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }

    console.error("Failed to load theme page:", error);

    return (
      <>
        <AdminHeader pageTitle="Theme" />
        <PageWrapper>
          <ErrorDisplay error="Failed to load theme settings. Please try refreshing the page." />
        </PageWrapper>
      </>
    );
  }
}
