import { ManageSubscriptionButton } from "@/components/admin/manage-subscription-button";
import { SyncSubscriptionButton } from "@/components/admin/sync-subscription-button";
import { UpgradeButton } from "@/components/admin/upgrade-button";

import {
  hasActiveSubscription,
  formatRenewalDate,
} from "@/lib/utils/subscription";
import { polarConfig } from "@/lib/config/polar";

import { SubscriptionDetails, ProductConfig } from "@/types/subscription";

interface SubscriptionSectionProps {
  subscriptionDetails: SubscriptionDetails;
}

export function SubscriptionSection({
  subscriptionDetails,
}: SubscriptionSectionProps) {
  const isActiveSubscription = hasActiveSubscription(subscriptionDetails);
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

      {isActiveSubscription ? (
        <ActiveSubscriptionDisplay
          subscriptionDetails={subscriptionDetails}
          proProduct={proProduct}
        />
      ) : (
        <FreeSubscriptionDisplay proProduct={proProduct} />
      )}
    </>
  );
}

function ActiveSubscriptionDisplay({
  subscriptionDetails,
  proProduct,
}: {
  subscriptionDetails: SubscriptionDetails;
  proProduct: ProductConfig | undefined;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-primary/5 rounded border p-4">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h3 className="font-medium">Wrk.so Pro</h3>
            <p className="text-muted-foreground text-sm">Active subscription</p>
          </div>
          <span className="bg-primary/10 text-primary rounded px-2 py-1 text-xs">
            ⭐ PRO
          </span>
        </div>

        {subscriptionDetails?.subscriptionCurrentPeriodEnd && (
          <p className="text-muted-foreground mt-2 text-sm">
            Renews on{" "}
            {formatRenewalDate(
              subscriptionDetails.subscriptionCurrentPeriodEnd
            )}
          </p>
        )}

        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium">Pro Benefits:</h4>
          <ul className="text-muted-foreground space-y-1 text-sm">
            {proProduct?.features.map((feature: string) => (
              <li key={feature}>✓ {feature}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function FreeSubscriptionDisplay({
  proProduct,
}: {
  proProduct: ProductConfig | undefined;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded border p-4">
        <h3 className="mb-2 font-medium">Free Plan</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          Upgrade to Pro to unlock all features and support Wrk.so
        </p>

        {proProduct && (
          <div className="space-y-4">
            <div className="bg-muted/30 rounded border p-4">
              <h4 className="mb-2 font-medium">{proProduct.name}</h4>
              <p className="text-muted-foreground mb-3 text-sm">
                {proProduct.description}
              </p>
              <ul className="mb-4 space-y-1 text-sm">
                {proProduct.features.map((feature: string) => (
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
  );
}
