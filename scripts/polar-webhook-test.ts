/**
 * Polar Webhook Testing Script
 *
 * This script demonstrates how to use the Polar MCP to:
 * 1. Fetch real subscription and order data
 * 2. Test webhook payload structures
 * 3. Validate webhook integration
 *
 * To use this script with the Polar MCP:
 * 1. Ensure you have POLAR_ACCESS_TOKEN set in your environment
 * 2. Run: npx tsx scripts/polar-webhook-test.ts
 */

import {
  PolarWebhookEvent,
  CustomerData,
  OrderData,
  SubscriptionData,
  handleWebhookEvent,
  isSubscriptionEvent,
  isOrderEvent
} from '../lib/polar-webhook-types';

// Example: Using Polar MCP to fetch subscription data
async function fetchSubscriptionData() {
  try {
    // This would use the Polar MCP to list subscriptions
    // const subscriptions = await mcp_Polar_subscriptions_list({
    //   request: { limit: 10, active: true }
    // });

    console.log('Fetching subscription data via Polar MCP...');
    console.log('Use: mcp_Polar_subscriptions-list with request: { limit: 10, active: true }');

    // Mock subscription data based on Polar API structure
    const mockSubscription: SubscriptionData = {
      id: 'sub_123456789',
      customer_id: 'cus_123456789',
      product_id: 'prod_123456789',
      product_price_id: 'price_123456789',
      status: 'active',
      current_period_start: '2024-01-01T00:00:00Z',
      current_period_end: '2024-02-01T00:00:00Z',
      cancel_at_period_end: false,
      started_at: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
      modified_at: '2024-01-01T00:00:00Z'
    };

    return mockSubscription;
  } catch (error) {
    console.error('Error fetching subscription data:', error);
    return null;
  }
}

// Example: Using Polar MCP to fetch order data
async function fetchOrderData() {
  try {
    // This would use the Polar MCP to list orders
    // const orders = await mcp_Polar_orders_list({
    //   request: { limit: 10 }
    // });

    console.log('Fetching order data via Polar MCP...');
    console.log('Use: mcp_Polar_orders-list with request: { limit: 10 }');

    // Mock order data based on Polar API structure
    const mockOrder: OrderData = {
      id: 'order_123456789',
      customer_id: 'cus_123456789',
      product_id: 'prod_123456789',
      product_price_id: 'price_123456789',
      amount: 1000, // $10.00 in cents
      tax_amount: 0,
      currency: 'usd',
      billing_reason: 'purchase',
      created_at: '2024-01-01T00:00:00Z'
    };

    return mockOrder;
  } catch (error) {
    console.error('Error fetching order data:', error);
    return null;
  }
}

// Example: Using Polar MCP to fetch customer data
async function fetchCustomerData() {
  try {
    // This would use the Polar MCP to list customers
    // const customers = await mcp_Polar_customers_list({
    //   request: { limit: 10 }
    // });

    console.log('Fetching customer data via Polar MCP...');
    console.log('Use: mcp_Polar_customers-list with request: { limit: 10 }');

    // Mock customer data based on Polar API structure
    const mockCustomer: CustomerData = {
      id: 'cus_123456789',
      email: 'test@example.com',
      name: 'Test User',
      external_id: 'user_123',
      created_at: '2024-01-01T00:00:00Z',
      modified_at: '2024-01-01T00:00:00Z'
    };

    return mockCustomer;
  } catch (error) {
    console.error('Error fetching customer data:', error);
    return null;
  }
}

// Test webhook payload handling
async function testWebhookPayloads() {
  console.log('Testing webhook payload handling...\n');

  // Test subscription.active webhook
  const subscriptionActiveEvent: PolarWebhookEvent = {
    type: 'subscription.active',
    data: await fetchSubscriptionData() || {}
  };

  console.log('Testing subscription.active webhook:');
  console.log('Event type:', subscriptionActiveEvent.type);
  console.log('Is subscription event:', isSubscriptionEvent(subscriptionActiveEvent));
  await handleWebhookEvent(subscriptionActiveEvent);
  console.log('');

  // Test order.paid webhook
  const orderPaidEvent: PolarWebhookEvent = {
    type: 'order.paid',
    data: await fetchOrderData() || {}
  };

  console.log('Testing order.paid webhook:');
  console.log('Event type:', orderPaidEvent.type);
  console.log('Is order event:', isOrderEvent(orderPaidEvent));
  await handleWebhookEvent(orderPaidEvent);
  console.log('');

  // Test customer.created webhook
  const customerCreatedEvent: PolarWebhookEvent = {
    type: 'customer.created',
    data: await fetchCustomerData() || {}
  };

  console.log('Testing customer.created webhook:');
  console.log('Event type:', customerCreatedEvent.type);
  await handleWebhookEvent(customerCreatedEvent);
  console.log('');
}

// Example: Using Polar MCP to get metrics
async function fetchMetrics() {
  try {
    // This would use the Polar MCP to get metrics
    // const metrics = await mcp_Polar_metrics_get({
    //   request: {
    //     start_date: '2024-01-01',
    //     end_date: '2024-01-31',
    //     interval: 'day'
    //   }
    // });

    console.log('Fetching metrics via Polar MCP...');
    console.log('Use: mcp_Polar_metrics-get with request:');
    console.log({
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      interval: 'day'
    });

  } catch (error) {
    console.error('Error fetching metrics:', error);
  }
}

// Main function to run all tests
async function main() {
  console.log('🧪 Polar Webhook Testing Script\n');
  console.log('This script demonstrates how to use the Polar MCP for webhook testing.\n');

  // Test webhook payload handling
  await testWebhookPayloads();

  // Fetch metrics example
  await fetchMetrics();

  console.log('✅ Webhook testing complete!');
  console.log('\nTo use with real Polar MCP:');
  console.log('1. Set POLAR_ACCESS_TOKEN in your environment');
  console.log('2. Replace mock data with actual MCP calls');
  console.log('3. Use the MCP functions shown in the console logs');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

export { fetchSubscriptionData, fetchOrderData, fetchCustomerData, testWebhookPayloads };
