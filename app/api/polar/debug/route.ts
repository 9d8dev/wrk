import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Polar } from "@polar-sh/sdk";

export async function GET(req: NextRequest) {
  try {
    // Get the current user session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Initialize Polar client
    const polarClient = new Polar({
      accessToken: process.env.POLAR_ACCESS_TOKEN!,
      server: 'production',
    });

    console.log("🔍 Debug: Testing Polar connection for user:", session.user.email);

    // Test basic API access with products
    try {
      const products = await polarClient.products.list({
        limit: 10,
      });

      console.log("✅ Products fetched successfully:", products.result.items.length);

      // Try to find customers by email
      let customers;
      try {
        customers = await polarClient.customers.list({
          email: session.user.email,
          limit: 5,
        });
        console.log("✅ Customer search successful:", customers.result.items.length);
      } catch (customerError) {
        console.log("⚠️ Customer search failed:", customerError);
        customers = { result: { items: [] } };
      }

      // Try to get all subscriptions
      let allSubscriptions;
      try {
        allSubscriptions = await polarClient.subscriptions.list({
          limit: 10,
        });
        console.log("✅ Subscription fetch successful:", allSubscriptions.result.items.length);
      } catch (subscriptionError) {
        console.log("⚠️ Subscription fetch failed:", subscriptionError);
        allSubscriptions = { result: { items: [] } };
      }

      return NextResponse.json({
        success: true,
        debug: {
          user: {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
          },
          polar: {
            connected: true,
            products: {
              count: products.result.items.length,
              items: products.result.items.map(p => ({
                id: p.id,
                name: p.name,
                isRecurring: p.isRecurring,
                isArchived: p.isArchived,
              })),
            },
            customers: {
              count: customers.result.items.length,
              items: customers.result.items.map(c => ({
                id: c.id,
                email: c.email,
                name: c.name,
                createdAt: c.createdAt,
              })),
            },
            subscriptions: {
              count: allSubscriptions.result.items.length,
              items: allSubscriptions.result.items.map(s => ({
                id: s.id,
                status: s.status,
                productId: s.productId,
                customerId: s.customerId,
                currentPeriodEnd: s.currentPeriodEnd,
              })),
            },
          },
          environment: {
            hasAccessToken: !!process.env.POLAR_ACCESS_TOKEN,
            tokenPrefix: process.env.POLAR_ACCESS_TOKEN?.slice(0, 20) + "...",
          },
        },
      });

    } catch (error) {
      console.error("❌ Polar API error:", error);
      return NextResponse.json({
        success: false,
        error: "Polar API connection failed",
        details: error instanceof Error ? error.message : "Unknown error",
        debug: {
          user: {
            id: session.user.id,
            email: session.user.email,
          },
          environment: {
            hasAccessToken: !!process.env.POLAR_ACCESS_TOKEN,
            tokenPrefix: process.env.POLAR_ACCESS_TOKEN?.slice(0, 20) + "...",
          },
        },
      }, { status: 500 });
    }

  } catch (error) {
    console.error("💥 Debug endpoint error:", error);
    return NextResponse.json(
      { error: "Debug failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
