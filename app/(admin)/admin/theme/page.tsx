import { AdminHeader } from "@/components/admin/admin-header";
import { PageWrapper } from "@/components/admin/page-wrapper";
import { ThemeForm } from "@/components/admin/theme-form";
import { Suspense } from "react";

import { getThemeByUserId } from "@/lib/actions/theme";
import { getSession } from "@/lib/actions/auth";
import { redirect } from "next/navigation";

export default async function ThemePage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/sign-in");
  }

  const theme = await getThemeByUserId(session.user.id);

  return (
    <>
      <AdminHeader pageTitle="Theme" />
      <PageWrapper>
        <Suspense fallback={<div>Loading...</div>}>
          <ThemeForm user={session.user} theme={theme} />
        </Suspense>
      </PageWrapper>
    </>
  );
}
