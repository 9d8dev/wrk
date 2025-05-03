import { ThemeForm } from "@/components/admin/theme-form";
import { AdminHeader } from "@/components/admin/admin-header";
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
      <section className="space-y-6 p-4 max-w-3xl">
        <Suspense fallback={<div>Loading...</div>}>
          <ThemeForm user={session.user} theme={theme} />
        </Suspense>
      </section>
    </>
  );
}
