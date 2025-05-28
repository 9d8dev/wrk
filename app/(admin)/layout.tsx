import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

import { getSession } from "@/lib/actions/auth";
import { hasActiveProSubscription } from "@/lib/actions/polar";
import { polarConfig } from "@/lib/config/polar";
import { redirect } from "next/navigation";

// interface UserWithPolar {
//   id: string;
//   name?: string | null;
//   email?: string | null;
//   username?: string | null;
//   polarCustomerId?: string | null;
// }

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    return redirect("/");
  }

  // Check if user has an active Pro subscription
  const isPro = await hasActiveProSubscription();

  // Get the first product info for the upgrade plan
  const productInfo = polarConfig.products[0] ? {
    slug: polarConfig.products[0].slug,
    name: polarConfig.products[0].name,
    description: polarConfig.products[0].description,
    features: polarConfig.products[0].features,
    price: polarConfig.products[0].price,
  } : undefined;

  return (
    <SidebarProvider>
      <AdminSidebar
        name={session.user.name!}
        username={session.user.username!}
        email={session.user.email!}
        isPro={isPro}
        productInfo={productInfo}
      />
      <main id="admin-page" className="relative w-full">
        {children}
        <SidebarTrigger className="fixed bottom-2 ml-2 left-[sidebar-size] z-50" />
      </main>
    </SidebarProvider>
  );
}
