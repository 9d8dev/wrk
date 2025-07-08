import { type NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { removeDomainFromVercel } from "@/lib/vercel-api";
import { auth } from "@/lib/auth";

import { user } from "@/db/schema";
import { db } from "@/db/drizzle";

// Domain validation schema
const domainSchema = z.object({
  domain: z
    .string()
    .min(3, "Domain must be at least 3 characters")
    .max(253, "Domain is too long")
    .regex(
      /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
      "Invalid domain format"
    )
    .refine((domain) => {
      // Prevent using wrk.so or its subdomains
      const mainDomain =
        process.env.NEXT_PUBLIC_APP_URL?.replace(/https?:\/\//, "") || "wrk.so";
      return domain !== mainDomain && !domain.endsWith(`.${mainDomain}`);
    }, "Cannot use the main domain or its subdomains"),
});

// Helper function to check if user has active Pro subscription
function hasActivePro(userRecord: {
  subscriptionStatus: string | null;
}): boolean {
  return userRecord.subscriptionStatus === "active";
}

// POST - Add custom domain
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get request body
    const body = await request.json();

    // Validate domain
    const validation = domainSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: validation.error.errors[0]?.message || "Invalid domain",
        },
        { status: 400 }
      );
    }

    const { domain } = validation.data;

    // Get user record to check subscription
    const userRecord = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!userRecord[0]) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has active Pro subscription
    if (!hasActivePro(userRecord[0])) {
      return NextResponse.json(
        {
          error: "Custom domains require an active Pro subscription",
        },
        { status: 403 }
      );
    }

    // Check if domain is already taken
    const existingDomain = await db
      .select()
      .from(user)
      .where(eq(user.customDomain, domain))
      .limit(1);

    if (existingDomain.length > 0) {
      return NextResponse.json(
        {
          error: "This domain is already in use",
        },
        { status: 409 }
      );
    }

    // Update user with custom domain
    await db
      .update(user)
      .set({
        customDomain: domain,
        domainStatus: "pending",
        domainVerifiedAt: null,
        domainErrorMessage: null,
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.user.id));

    return NextResponse.json({
      success: true,
      domain,
      status: "pending",
      message:
        "Domain added successfully. Please configure your DNS settings to complete verification.",
    });
  } catch (error) {
    console.error("Error adding custom domain:", error);
    return NextResponse.json(
      {
        error: "Failed to add custom domain",
      },
      { status: 500 }
    );
  }
}

// GET - Get current domain status
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user record
    const userRecord = await db
      .select({
        customDomain: user.customDomain,
        domainStatus: user.domainStatus,
        domainVerifiedAt: user.domainVerifiedAt,
        domainErrorMessage: user.domainErrorMessage,
        subscriptionStatus: user.subscriptionStatus,
      })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!userRecord[0]) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userRecord[0];

    return NextResponse.json({
      domain: userData.customDomain,
      status: userData.domainStatus,
      verifiedAt: userData.domainVerifiedAt,
      hasActivePro: hasActivePro(userData),
      errorMessage: userData.domainErrorMessage,
    });
  } catch (error) {
    console.error("Error getting domain status:", error);
    return NextResponse.json(
      {
        error: "Failed to get domain status",
      },
      { status: 500 }
    );
  }
}

// DELETE - Remove custom domain
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current domain before removing it
    const userRecord = await db
      .select({ customDomain: user.customDomain })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    const currentDomain = userRecord[0]?.customDomain;

    // Remove custom domain from user
    await db
      .update(user)
      .set({
        customDomain: null,
        domainStatus: null,
        domainVerifiedAt: null,
        domainErrorMessage: null,
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.user.id));

    // Remove domain from Vercel if it exists
    if (currentDomain) {
      const removeResult = await removeDomainFromVercel(currentDomain);
      if (!removeResult.success) {
        console.error(
          `Failed to remove domain ${currentDomain} from Vercel:`,
          removeResult.error
        );
        // Don't fail the entire operation if Vercel removal fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Custom domain removed successfully",
    });
  } catch (error) {
    console.error("Error removing custom domain:", error);
    return NextResponse.json(
      {
        error: "Failed to remove custom domain",
      },
      { status: 500 }
    );
  }
}
