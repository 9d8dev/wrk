export type SubscriptionDetails = {
  subscriptionStatus: string | null;
  subscriptionId: string | null;
  subscriptionProductId: string | null;
  subscriptionCurrentPeriodEnd: Date | null;
} | null;

export type SubscriptionStatus =
  | "active"
  | "inactive"
  | "cancelled"
  | "past_due"
  | null;

export type ProductConfig = {
  productId: string;
  slug: string;
  name: string;
  description: string;
  features: string[];
  price: string;
};
