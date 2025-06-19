import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { promises as dns } from "dns";
import { addDomainToVercel, getDomainStatus, verifyDomainInVercel } from "@/lib/vercel-api";

// Domain verification schema
const verifySchema = z.object({
  domain: z.string().min(3),
});

// Helper function to check DNS resolution
async function checkDNSResolution(domain: string): Promise<{
  resolves: boolean;
  pointsToVercel: boolean;
  error?: string;
  details?: string;
}> {
  try {
    // Basic domain format validation
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!domainRegex.test(domain)) {
      return {
        resolves: false,
        pointsToVercel: false,
        error: "Invalid domain format"
      };
    }

    // Expected targets for Vercel deployment
    const VERCEL_CNAME_TARGET = "cname.vercel-dns.com";
    const VERCEL_A_RECORD_TARGET = "76.76.19.61";
    
    let resolves = false;
    let pointsToVercel = false;
    let details = "";

    // First, try to check CNAME records
    try {
      const cnameRecords = await dns.resolveCname(domain);
      console.log(`CNAME records for ${domain}:`, cnameRecords);
      
      if (cnameRecords && cnameRecords.length > 0) {
        resolves = true;
        // Check if any CNAME points to Vercel
        const hasVercelCname = cnameRecords.some(record => 
          record.toLowerCase().includes("vercel") || 
          record.toLowerCase() === VERCEL_CNAME_TARGET
        );
        
        if (hasVercelCname) {
          pointsToVercel = true;
          details = `CNAME record found pointing to ${cnameRecords[0]}`;
        } else {
          details = `CNAME record found but points to ${cnameRecords[0]}, not Vercel`;
        }
      }
    } catch {
      // If CNAME lookup fails, try A records
      try {
        const aRecords = await dns.resolve4(domain);
        console.log(`A records for ${domain}:`, aRecords);
        
        if (aRecords && aRecords.length > 0) {
          resolves = true;
          // Check if any A record points to Vercel IP
          const hasVercelARecord = aRecords.includes(VERCEL_A_RECORD_TARGET);
          
          if (hasVercelARecord) {
            pointsToVercel = true;
            details = `A record found pointing to ${VERCEL_A_RECORD_TARGET}`;
          } else {
            details = `A record found but points to ${aRecords[0]}, not Vercel (${VERCEL_A_RECORD_TARGET})`;
          }
        }
      } catch {
        // Neither CNAME nor A records found
        console.error(`DNS lookup failed for ${domain}`);
        return {
          resolves: false,
          pointsToVercel: false,
          error: "Domain does not resolve. Please check your DNS configuration.",
          details: "No CNAME or A records found for this domain"
        };
      }
    }

    return {
      resolves,
      pointsToVercel,
      details
    };

  } catch (error) {
    console.error(`DNS check error for ${domain}:`, error);
    return {
      resolves: false,
      pointsToVercel: false,
      error: error instanceof Error ? error.message : "DNS check failed",
      details: "An unexpected error occurred during DNS verification"
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

    // Step 1: Perform DNS verification
    const dnsCheck = await checkDNSResolution(domain);
    
    if (!dnsCheck.resolves || !dnsCheck.pointsToVercel) {
      // DNS not configured correctly yet
      const newStatus = dnsCheck.error && !dnsCheck.error.includes("does not resolve") ? 'error' : 'pending';
      
      await db
        .update(user)
        .set({
          domainStatus: newStatus,
          domainErrorMessage: dnsCheck.error || null,
          updatedAt: new Date(),
        })
        .where(eq(user.id, session.user.id));

      return NextResponse.json({
        success: false,
        verified: false,
        domain,
        status: newStatus,
        error: dnsCheck.error || 'Domain verification failed',
        message: dnsCheck.details || 'Please check your DNS configuration and try again.',
        instructions: {
          cname: `Create a CNAME record pointing ${domain} to cname.vercel-dns.com`,
          a_record: `Or create an A record pointing ${domain} to 76.76.19.61`,
          note: "DNS changes may take up to 48 hours to propagate worldwide."
        }
      });
    }

    // Step 2: DNS is configured, now handle Vercel integration
    await db
      .update(user)
      .set({
        domainStatus: 'dns_configured',
        domainErrorMessage: null,
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.user.id));

    // Step 3: Add domain to Vercel project
    const addResult = await addDomainToVercel(domain);
    if (!addResult.success) {
      await db
        .update(user)
        .set({
          domainStatus: 'error',
          domainErrorMessage: `Failed to add domain to Vercel: ${addResult.error}`,
          updatedAt: new Date(),
        })
        .where(eq(user.id, session.user.id));

      return NextResponse.json({
        success: false,
        verified: false,
        domain,
        status: 'error',
        error: `Failed to configure domain in Vercel: ${addResult.error}`,
        message: 'DNS is configured correctly, but there was an issue setting up the domain in Vercel.',
      });
    }

    // Step 4: Update status to vercel_pending while we wait for SSL
    await db
      .update(user)
      .set({
        domainStatus: 'vercel_pending',
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.user.id));

    // Step 5: Verify domain in Vercel
    const verifyResult = await verifyDomainInVercel(domain);
    if (!verifyResult.success) {
      await db
        .update(user)
        .set({
          domainStatus: 'error',
          domainErrorMessage: `Vercel verification failed: ${verifyResult.error}`,
          updatedAt: new Date(),
        })
        .where(eq(user.id, session.user.id));

      return NextResponse.json({
        success: false,
        verified: false,
        domain,
        status: 'error',
        error: `Domain verification failed: ${verifyResult.error}`,
        message: 'Domain was added to Vercel but verification failed.',
      });
    }

    // Step 6: Check domain status in Vercel
    const statusResult = await getDomainStatus(domain);
    if (statusResult.success && statusResult.data) {
      const { ssl, configured } = statusResult.data;
      
      if (configured && ssl.state === 'READY') {
        // Domain is fully active
        await db
          .update(user)
          .set({
            domainStatus: 'active',
            domainVerifiedAt: new Date(),
            domainErrorMessage: null,
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
      } else if (configured && ssl.state === 'PENDING') {
        // SSL is still being provisioned
        await db
          .update(user)
          .set({
            domainStatus: 'ssl_pending',
            updatedAt: new Date(),
          })
          .where(eq(user.id, session.user.id));

        return NextResponse.json({
          success: false,
          verified: false,
          domain,
          status: 'ssl_pending',
          message: 'Domain is configured but SSL certificate is still being provisioned. This can take a few minutes.',
          instructions: {
            note: "Please wait a few minutes and try verifying again. SSL provisioning typically takes 2-5 minutes."
          }
        });
      }
    }

    // Default fallback - mark as active if we got this far
    await db
      .update(user)
      .set({
        domainStatus: 'active',
        domainVerifiedAt: new Date(),
        domainErrorMessage: null,
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

  } catch (error) {
    console.error("Error verifying domain:", error);
    return NextResponse.json({ 
      error: "Failed to verify domain" 
    }, { status: 500 });
  }
}