/**
 * Polar Webhook Types and Utilities
 *
 * This file provides type-safe utilities for handling Polar webhooks.
 * The types are based on the actual Polar API responses and webhook payloads.
 */

// Base webhook payload structure
export interface PolarWebhookEvent {
  type: string;
  data: Record<string, unknown>;
}

// Customer-related webhook types
export interface CustomerData extends Record<string, unknown> {
  id: string;
  email: string;
  name?: string;
  external_id?: string;
  billing_address?: {
    country: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
  };
  tax_id?: string[];
  created_at: string;
  modified_at: string;
}

// Order-related webhook types
export interface OrderData extends Record<string, unknown> {
  id: string;
  customer_id: string;
  product_id: string;
  product_price_id: string;
  discount_id?: string;
  subscription_id?: string;
  checkout_id?: string;
  amount: number;
  tax_amount: number;
  currency: string;
  billing_reason: string;
  billing_address?: CustomerData["billing_address"];
  created_at: string;
}

// Subscription-related webhook types
export interface SubscriptionData extends Record<string, unknown> {
  id: string;
  customer_id: string;
  product_id: string;
  product_price_id: string;
  discount_id?: string;
  checkout_id?: string;
  status:
    | "incomplete"
    | "incomplete_expired"
    | "trialing"
    | "active"
    | "past_due"
    | "canceled"
    | "unpaid";
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  started_at?: string;
  ended_at?: string;
  created_at: string;
  modified_at: string;
}

// Checkout-related webhook types
export interface CheckoutData extends Record<string, unknown> {
  id: string;
  customer_id?: string;
  product_id: string;
  product_price_id: string;
  discount_id?: string;
  allow_discount_codes: boolean;
  success_url: string;
  embed_origin?: string;
  amount?: number;
  tax_amount?: number;
  currency: string;
  subtotal_amount?: number;
  total_amount?: number;
  product_name: string;
  product_description?: string;
  created_at: string;
  expires_at: string;
  customer_name?: string;
  customer_email?: string;
  customer_billing_address?: CustomerData["billing_address"];
}

// Specific webhook event types
export interface CustomerCreatedEvent extends PolarWebhookEvent {
  type: "customer.created";
  data: CustomerData;
}

export interface CustomerUpdatedEvent extends PolarWebhookEvent {
  type: "customer.updated";
  data: CustomerData;
}

export interface OrderPaidEvent extends PolarWebhookEvent {
  type: "order.paid";
  data: OrderData;
}

export interface OrderRefundedEvent extends PolarWebhookEvent {
  type: "order.refunded";
  data: OrderData;
}

export interface SubscriptionCreatedEvent extends PolarWebhookEvent {
  type: "subscription.created";
  data: SubscriptionData;
}

export interface SubscriptionActiveEvent extends PolarWebhookEvent {
  type: "subscription.active";
  data: SubscriptionData;
}

export interface SubscriptionCanceledEvent extends PolarWebhookEvent {
  type: "subscription.canceled";
  data: SubscriptionData;
}

export interface SubscriptionRevokedEvent extends PolarWebhookEvent {
  type: "subscription.revoked";
  data: SubscriptionData;
}

export interface CheckoutCreatedEvent extends PolarWebhookEvent {
  type: "checkout.created";
  data: CheckoutData;
}

// Union type for all webhook events
export type PolarWebhookEventType =
  | CustomerCreatedEvent
  | CustomerUpdatedEvent
  | OrderPaidEvent
  | OrderRefundedEvent
  | SubscriptionCreatedEvent
  | SubscriptionActiveEvent
  | SubscriptionCanceledEvent
  | SubscriptionRevokedEvent
  | CheckoutCreatedEvent;

// Type guards for webhook events
export function isCustomerEvent(
  event: PolarWebhookEvent
): event is CustomerCreatedEvent | CustomerUpdatedEvent {
  return event.type.startsWith("customer.");
}

export function isOrderEvent(
  event: PolarWebhookEvent
): event is OrderPaidEvent | OrderRefundedEvent {
  return event.type.startsWith("order.");
}

export function isSubscriptionEvent(
  event: PolarWebhookEvent
): event is
  | SubscriptionCreatedEvent
  | SubscriptionActiveEvent
  | SubscriptionCanceledEvent
  | SubscriptionRevokedEvent {
  return event.type.startsWith("subscription.");
}

export function isCheckoutEvent(
  event: PolarWebhookEvent
): event is CheckoutCreatedEvent {
  return event.type.startsWith("checkout.");
}

// Utility functions for webhook handling
export function handleWebhookEvent(event: PolarWebhookEvent) {
  switch (event.type) {
    case "customer.created":
      return handleCustomerCreated(event as CustomerCreatedEvent);
    case "customer.updated":
      return handleCustomerUpdated(event as CustomerUpdatedEvent);
    case "order.paid":
      return handleOrderPaid(event as OrderPaidEvent);
    case "order.refunded":
      return handleOrderRefunded(event as OrderRefundedEvent);
    case "subscription.created":
      return handleSubscriptionCreated(event as SubscriptionCreatedEvent);
    case "subscription.active":
      return handleSubscriptionActive(event as SubscriptionActiveEvent);
    case "subscription.canceled":
      return handleSubscriptionCanceled(event as SubscriptionCanceledEvent);
    case "subscription.revoked":
      return handleSubscriptionRevoked(event as SubscriptionRevokedEvent);
    case "checkout.created":
      return handleCheckoutCreated(event as CheckoutCreatedEvent);
    default:
      console.log("Unhandled webhook event:", event.type);
  }
}

// Individual event handlers (implement these based on your business logic)
async function handleCustomerCreated(event: CustomerCreatedEvent) {
  console.log("Customer created:", event.data.email);
  // Implement customer creation logic
}

async function handleCustomerUpdated(event: CustomerUpdatedEvent) {
  console.log("Customer updated:", event.data.email);
  // Implement customer update logic
}

async function handleOrderPaid(event: OrderPaidEvent) {
  console.log("Order paid:", event.data.id, "Amount:", event.data.amount);
  // Implement order paid logic - grant Pro access
}

async function handleOrderRefunded(event: OrderRefundedEvent) {
  console.log("Order refunded:", event.data.id);
  // Implement refund logic - may need to revoke Pro access
}

async function handleSubscriptionCreated(event: SubscriptionCreatedEvent) {
  console.log("Subscription created:", event.data.id);
  // Implement subscription creation logic
}

async function handleSubscriptionActive(event: SubscriptionActiveEvent) {
  console.log("Subscription activated:", event.data.id);
  // Implement subscription activation logic - grant Pro access
}

async function handleSubscriptionCanceled(event: SubscriptionCanceledEvent) {
  console.log("Subscription canceled:", event.data.id);
  // Implement subscription cancellation logic
}

async function handleSubscriptionRevoked(event: SubscriptionRevokedEvent) {
  console.log("Subscription revoked:", event.data.id);
  // Implement subscription revocation logic - immediately revoke Pro access
}

async function handleCheckoutCreated(event: CheckoutCreatedEvent) {
  console.log("Checkout created:", event.data.id);
  // Implement checkout creation logic
}
