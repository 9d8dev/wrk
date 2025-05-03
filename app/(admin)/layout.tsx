import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

import { getSession } from "@/lib/actions/auth";
import { redirect } from "next/navigation";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    return redirect("/");
  }

  return (
    <SidebarProvider>
      <AdminSidebar
        name={session.user.name!}
        username={session.user.username!}
        email={session.user.email!}
      />
      <main id="admin-page" className="relative w-full">
        {children}
        <SidebarTrigger className="absolute bottom-2 left-2" />
      </main>
    </SidebarProvider>
  );
}
