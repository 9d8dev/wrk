import { AlertTriangle } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { DeleteAccountButton } from "@/components/admin/delete-account-button";
import { DomainManagement } from "@/components/admin/domain-management";
import { ManageSubscriptionButton } from "@/components/admin/manage-subscription-button";
import { PageWrapper } from "@/components/admin/page-wrapper";
import { SyncSubscriptionButton } from "@/components/admin/sync-subscription-button";
import { UpgradeButton } from "@/components/admin/upgrade-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getUserSubscriptionDetails } from "@/lib/actions/subscription";
import { auth } from "@/lib/auth";
import { polarConfig } from "@/lib/config/polar";

export const dynamic = "force-dynamic";

function ErrorDisplay({ error }: { error: string }) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Error loading settings</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
}

type SubscriptionDetails = {
  subscriptionStatus: string | null;
  subscriptionId: string | null;
  subscriptionProductId: string | null;
  subscriptionCurrentPeriodEnd: Date | null;
} | null;

function SubscriptionSection({
  subscriptionDetails,
}: {
  subscriptionDetails: SubscriptionDetails;
}) {
  const hasActiveSubscription =
    subscriptionDetails?.subscriptionStatus === "active" &&
    subscriptionDetails?.subscriptionCurrentPeriodEnd &&
    subscriptionDetails.subscriptionCurrentPeriodEnd > new Date();

  const proProduct = polarConfig.products.find((p) => p.slug === "wrk-pro");

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
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
          <div className="bg-primary/5 rounded-lg border p-4">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h3 className="font-medium">Wrk.so Pro</h3>
                <p className="text-muted-foreground text-sm">
                  Active subscription
                </p>
              </div>
              <span className="bg-primary/10 text-primary rounded px-2 py-1 text-xs">
                ⭐ PRO
              </span>
            </div>

            {subscriptionDetails.subscriptionCurrentPeriodEnd && (
              <p className="text-muted-foreground mt-2 text-sm">
                Renews on{" "}
                {new Date(
                  subscriptionDetails.subscriptionCurrentPeriodEnd
                ).toLocaleDateString()}
              </p>
            )}

            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-medium">Pro Benefits:</h4>
              <ul className="text-muted-foreground space-y-1 text-sm">
                {proProduct?.features.map((feature) => (
                  <li key={feature}>✓ {feature}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <h3 className="mb-2 font-medium">Free Plan</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Upgrade to Pro to unlock all features and support Wrk.so
            </p>

            {proProduct && (
              <div className="space-y-4">
                <div className="bg-muted/30 rounded-lg border p-4">
                  <h4 className="mb-2 font-medium">{proProduct.name}</h4>
                  <p className="text-muted-foreground mb-3 text-sm">
                    {proProduct.description}
                  </p>
                  <ul className="mb-4 space-y-1 text-sm">
                    {proProduct.features.map((feature) => (
                      <li key={feature}>✓ {feature}</li>
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
    </>
  );
}

export default async function SettingsPage() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      redirect("/sign-in");
    }

    // Get subscription details with error handling
    let subscriptionDetails = null;
    try {
      subscriptionDetails = await getUserSubscriptionDetails();
    } catch (error) {
      console.error("Failed to load subscription details:", error);
      // Continue without subscription details
    }

    return (
      <>
        <AdminHeader pageTitle="Settings" />
        <PageWrapper>
          <SubscriptionSection subscriptionDetails={subscriptionDetails} />

          {/* Domain Management Section */}
          <div className="mt-8">
            <DomainManagement />
          </div>

          {/* Account Deletion Section */}
          <div className="border-destructive/20 mt-12 border-t pt-8">
            <div className="space-y-4">
              <div>
                <h2 className="text-destructive text-lg font-semibold">
                  Danger Zone
                </h2>
                <p className="text-muted-foreground text-sm">
                  Once you delete your account, there is no going back. Please
                  be certain.
                </p>
              </div>
              <DeleteAccountButton />
            </div>
          </div>
        </PageWrapper>
      </>
    );
  } catch (error) {
    // Re-throw redirect errors
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }

    console.error("Failed to load settings page:", error);

    return (
      <>
        <AdminHeader pageTitle="Settings" />
        <PageWrapper>
          <ErrorDisplay error="Failed to load settings. Please try refreshing the page." />
        </PageWrapper>
      </>
    );
  }
}
