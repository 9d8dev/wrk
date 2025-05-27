import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

import { getSession } from "@/lib/actions/auth";
import { redirect } from "next/navigation";

interface UserWithPolar {
  id: string;
  name?: string | null;
  email?: string | null;
  username?: string | null;
  polarCustomerId?: string | null;
}

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    return redirect("/");
  }

  const user = session.user as UserWithPolar;
  const isPro = !!user.polarCustomerId;

  return (
    <SidebarProvider>
      <AdminSidebar
        name={session.user.name!}
        username={session.user.username!}
        email={session.user.email!}
        isPro={isPro}
      />
      <main id="admin-page" className="relative w-full">
        {children}
        <SidebarTrigger className="fixed bottom-2 ml-2 left-[sidebar-size] z-50" />
      </main>
    </SidebarProvider>
  );
}
