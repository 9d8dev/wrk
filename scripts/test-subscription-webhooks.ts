import { db } from "@/db/drizzle";
import { user, subscriptionHistory } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  getUserByEmail,
  updateUserPolarCustomerId,
  updateUserSubscription,
  logSubscriptionEvent,
  hasActiveProSubscription,
} from "@/lib/actions/subscription";

async function testSubscriptionFlow() {
  console.log("🧪 Testing Subscription Webhook Flow\n");

  // Test user email
  const testEmail = "test@example.com";
  
  try {
    // 1. Find test user
    console.log("1️⃣  Finding test user...");
    const testUser = await getUserByEmail(testEmail);
    
    if (!testUser) {
      console.log("❌ No test user found with email:", testEmail);
      console.log("Please create a user with this email first");
      return;
    }
    
    console.log("✅ Found test user:", testUser.username);
    
    // 2. Simulate customer creation webhook
    console.log("\n2️⃣  Simulating Polar customer creation...");
    const polarCustomerId = "cus_test_" + Date.now();
    
    await updateUserPolarCustomerId({
      userId: testUser.id,
      polarCustomerId: polarCustomerId,
    });
    
    console.log("✅ Updated Polar customer ID:", polarCustomerId);
    
    // 3. Simulate subscription creation
    console.log("\n3️⃣  Simulating subscription creation...");
    const subscriptionId = "sub_test_" + Date.now();
    
    await updateUserSubscription({
      userId: testUser.id,
      subscriptionId: subscriptionId,
      subscriptionStatus: "pending",
      subscriptionProductId: process.env.POLAR_PRO_PRODUCT_ID,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    });
    
    await logSubscriptionEvent({
      userId: testUser.id,
      subscriptionId: subscriptionId,
      eventType: "created",
      eventData: { test: true },
    });
    
    console.log("✅ Created subscription:", subscriptionId);
    
    // 4. Simulate subscription activation
    console.log("\n4️⃣  Simulating subscription activation...");
    
    await updateUserSubscription({
      userId: testUser.id,
      subscriptionStatus: "active",
    });
    
    await logSubscriptionEvent({
      userId: testUser.id,
      subscriptionId: subscriptionId,
      eventType: "activated",
      eventData: { test: true },
    });
    
    console.log("✅ Activated subscription");
    
    // 5. Check subscription status
    console.log("\n5️⃣  Checking subscription status...");
    
    const updatedUser = await db
      .select()
      .from(user)
      .where(eq(user.id, testUser.id))
      .limit(1);
    
    if (updatedUser[0]) {
      console.log("📊 User subscription details:");
      console.log("   - Status:", updatedUser[0].subscriptionStatus);
      console.log("   - Subscription ID:", updatedUser[0].subscriptionId);
      console.log("   - Product ID:", updatedUser[0].subscriptionProductId);
      console.log("   - Period End:", updatedUser[0].subscriptionCurrentPeriodEnd);
    }
    
    // 6. Check subscription history
    console.log("\n6️⃣  Checking subscription history...");
    
    const history = await db
      .select()
      .from(subscriptionHistory)
      .where(eq(subscriptionHistory.userId, testUser.id))
      .orderBy(subscriptionHistory.createdAt);
    
    console.log(`📜 Found ${history.length} subscription events:`);
    history.forEach(event => {
      console.log(`   - ${event.eventType} at ${event.createdAt.toISOString()}`);
    });
    
    // 7. Test hasActiveProSubscription
    console.log("\n7️⃣  Testing hasActiveProSubscription function...");
    
    // This would need to be tested in the context of an authenticated session
    console.log("⚠️  Note: hasActiveProSubscription requires an authenticated session");
    console.log("   Test this function through the UI when logged in as the test user");
    
    console.log("\n✅ Subscription webhook flow test completed!");
    
  } catch (error) {
    console.error("❌ Error during test:", error);
  } finally {
    // Cleanup - optional
    console.log("\n🧹 Test complete. Database changes have been preserved for inspection.");
  }
}

// Run the test
testSubscriptionFlow()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });