import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Domain verification schema
const verifySchema = z.object({
  domain: z.string().min(3),
});

// Helper function to check DNS resolution
async function checkDNSResolution(domain: string): Promise<{
  resolves: boolean;
  pointsToVercel: boolean;
  error?: string;
}> {
  try {
    // In a real implementation, you would:
    // 1. Check if the domain resolves to your Vercel deployment
    // 2. Verify CNAME or A records point to your platform
    // 3. Check for proper SSL certificate setup
    
    // For now, we'll simulate a basic check
    // In production, you'd use DNS lookup libraries or external APIs
    
    // Basic domain format validation
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!domainRegex.test(domain)) {
      return {
        resolves: false,
        pointsToVercel: false,
        error: "Invalid domain format"
      };
    }

    // In a real implementation, you would make actual DNS queries here
    // For demonstration purposes, we'll assume verification passes
    // You could integrate with services like:
    // - Vercel Domains API
    // - Cloudflare API
    // - DNS lookup libraries
    
    return {
      resolves: true,
      pointsToVercel: true,
    };

  } catch (error) {
    return {
      resolves: false,
      pointsToVercel: false,
      error: error instanceof Error ? error.message : "DNS check failed"
    };
  }
}

// POST - Verify domain DNS configuration
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
    
    // Validate input
    const validation = verifySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: "Invalid domain"
      }, { status: 400 });
    }

    const { domain } = validation.data;

    // Get user record
    const userRecord = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!userRecord[0]) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if this domain belongs to the user
    if (userRecord[0].customDomain !== domain) {
      return NextResponse.json({ 
        error: "Domain not associated with your account" 
      }, { status: 403 });
    }

    // Check if user has active Pro subscription
    if (userRecord[0].subscriptionStatus !== 'active') {
      return NextResponse.json({ 
        error: "Custom domains require an active Pro subscription" 
      }, { status: 403 });
    }

    // Perform DNS verification
    const dnsCheck = await checkDNSResolution(domain);

    if (dnsCheck.resolves && dnsCheck.pointsToVercel) {
      // Update domain status to active
      await db
        .update(user)
        .set({
          domainStatus: 'active',
          domainVerifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(user.id, session.user.id));

      return NextResponse.json({
        success: true,
        verified: true,
        domain,
        status: 'active',
        message: 'Domain verified successfully! Your custom domain is now active.'
      });
    } else {
      // Update domain status to error
      await db
        .update(user)
        .set({
          domainStatus: 'error',
          updatedAt: new Date(),
        })
        .where(eq(user.id, session.user.id));

      return NextResponse.json({
        success: false,
        verified: false,
        domain,
        status: 'error',
        error: dnsCheck.error || 'Domain verification failed',
        message: 'Please check your DNS configuration and try again.',
        instructions: {
          cname: `Create a CNAME record pointing ${domain} to cname.vercel-dns.com`,
          a_record: `Or create an A record pointing ${domain} to 76.76.19.61`
        }
      });
    }

  } catch (error) {
    console.error("Error verifying domain:", error);
    return NextResponse.json({ 
      error: "Failed to verify domain" 
    }, { status: 500 });
  }
}