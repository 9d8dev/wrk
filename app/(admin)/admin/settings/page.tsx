import { PageWrapper } from "@/components/admin/page-wrapper";
import { AdminHeader } from "@/components/admin/admin-header";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getUserSubscriptionDetails } from "@/lib/actions/subscription";
import { ManageSubscriptionButton } from "@/components/admin/manage-subscription-button";
import { UpgradeButton } from "@/components/admin/upgrade-button";
import { polarConfig } from "@/lib/config/polar";
import { SyncSubscriptionButton } from "@/components/admin/sync-subscription-button";

export default async function SettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  // Get subscription details
  const subscriptionDetails = await getUserSubscriptionDetails();

  const hasActiveSubscription =
    subscriptionDetails?.subscriptionStatus === "active" &&
    subscriptionDetails?.subscriptionCurrentPeriodEnd &&
    subscriptionDetails.subscriptionCurrentPeriodEnd > new Date();

  const proProduct = polarConfig.products.find((p) => p.slug === "wrk-pro");

  return (
    <>
      <AdminHeader pageTitle="Settings" />
      <PageWrapper>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Subscription</h2>
          <div className="flex gap-2">
            <SyncSubscriptionButton />
            <ManageSubscriptionButton
              variant="outline"
              size="default"
              className="w-full sm:w-auto"
            />
          </div>
        </div>

        {hasActiveSubscription ? (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-primary/5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-medium">Wrk.so Pro</h3>
                  <p className="text-sm text-muted-foreground">
                    Active subscription
                  </p>
                </div>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                  ⭐ PRO
                </span>
              </div>

              {subscriptionDetails.subscriptionCurrentPeriodEnd && (
                <p className="text-sm text-muted-foreground mt-2">
                  Renews on{" "}
                  {new Date(
                    subscriptionDetails.subscriptionCurrentPeriodEnd
                  ).toLocaleDateString()}
                </p>
              )}

              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium">Pro Benefits:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {proProduct?.features.map((feature, i) => (
                    <li key={i}>✓ {feature}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Free Plan</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upgrade to Pro to unlock all features and support Wrk.so
              </p>

              {proProduct && (
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <h4 className="font-medium mb-2">{proProduct.name}</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      {proProduct.description}
                    </p>
                    <ul className="space-y-1 text-sm mb-4">
                      {proProduct.features.map((feature, i) => (
                        <li key={i}>✓ {feature}</li>
                      ))}
                    </ul>
                    <UpgradeButton
                      productSlug={proProduct.slug}
                      price={proProduct.price}
                      variant="default"
                      size="default"
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </PageWrapper>
    </>
  );
}
