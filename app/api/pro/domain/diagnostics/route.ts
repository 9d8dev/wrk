import { promises as dns } from "node:dns";

import { type NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDomainStatus } from "@/lib/vercel-api";
import { auth } from "@/lib/auth";

import { user } from "@/db/schema";
import { db } from "@/db/drizzle";

// Diagnostics schema
const diagnosticsSchema = z.object({
  domain: z.string().min(3),
});

interface DiagnosticResult {
  step: string;
  status: "success" | "warning" | "error";
  message: string;
  details?: string[] | Record<string, unknown> | string | null;
}

// Helper function to check DNS resolution with detailed diagnostics
async function checkDNSDiagnostics(
  domain: string
): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];

  try {
    // Check if domain resolves at all
    try {
      await dns.lookup(domain);
      results.push({
        step: "Domain Resolution",
        status: "success",
        message: `Domain ${domain} resolves successfully`,
      });
    } catch {
      results.push({
        step: "Domain Resolution",
        status: "error",
        message: `Domain ${domain} does not resolve`,
      });
      return results; // Can't continue if domain doesn't resolve
    }

    // Check CNAME records
    try {
      const cnameRecords = await dns.resolveCname(domain);
      const hasVercelCname = cnameRecords.some(
        (record) =>
          record.toLowerCase().includes("vercel") ||
          record.toLowerCase() === "cname.vercel-dns.com"
      );

      if (hasVercelCname) {
        results.push({
          step: "CNAME Records",
          status: "success",
          message: "CNAME points to Vercel",
          details: cnameRecords,
        });
      } else {
        results.push({
          step: "CNAME Records",
          status: "warning",
          message: `CNAME found but doesn't point to Vercel`,
          details: cnameRecords,
        });
      }
    } catch {
      // Check A records if no CNAME
      try {
        const aRecords = await dns.resolve4(domain);
        const hasVercelA = aRecords.includes("76.76.19.61");

        if (hasVercelA) {
          results.push({
            step: "A Records",
            status: "success",
            message: "A record points to Vercel IP",
            details: aRecords,
          });
        } else {
          results.push({
            step: "A Records",
            status: "error",
            message: "A record doesn't point to Vercel IP (76.76.19.61)",
            details: aRecords,
          });
        }
      } catch {
        results.push({
          step: "DNS Records",
          status: "error",
          message: "No CNAME or A records found",
        });
      }
    }

    // Check TXT records for verification
    try {
      const txtRecords = await dns.resolveTxt(domain);
      results.push({
        step: "TXT Records",
        status: "success",
        message: "TXT records found",
        details: txtRecords.flat().join(", "),
      });
    } catch {
      results.push({
        step: "TXT Records",
        status: "warning",
        message: "No TXT records found (not required)",
      });
    }
  } catch (error) {
    results.push({
      step: "DNS Check",
      status: "error",
      message: "DNS diagnostic failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }

  return results;
}

// Helper function to check Vercel status
async function checkVercelDiagnostics(
  domain: string
): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];

  try {
    const statusResult = await getDomainStatus(domain);

    if (!statusResult.success) {
      results.push({
        step: "Vercel Domain Status",
        status: "error",
        message: statusResult.error || "Failed to get Vercel status",
      });
      return results;
    }

    const vercelStatus = statusResult.data;
    if (!vercelStatus) {
      results.push({
        step: "Vercel Domain Status",
        status: "error",
        message: "Domain not found in Vercel project",
      });
      return results;
    }

    // Check domain configuration
    if (vercelStatus.configured) {
      results.push({
        step: "Vercel Configuration",
        status: "success",
        message: "Domain is properly configured in Vercel",
      });
    } else {
      results.push({
        step: "Vercel Configuration",
        status: "error",
        message: "Domain is not properly configured in Vercel",
      });
    }

    // Check domain verification
    if (vercelStatus.verified) {
      results.push({
        step: "Vercel Verification",
        status: "success",
        message: "Domain is verified in Vercel",
      });
    } else {
      results.push({
        step: "Vercel Verification",
        status: "warning",
        message: "Domain is not yet verified in Vercel",
      });
    }

    // Check SSL status
    switch (vercelStatus.ssl.state) {
      case "READY":
        results.push({
          step: "SSL Certificate",
          status: "success",
          message: "SSL certificate is active",
        });
        break;
      case "PENDING":
        results.push({
          step: "SSL Certificate",
          status: "warning",
          message: "SSL certificate is being provisioned",
        });
        break;
      case "ERROR":
        results.push({
          step: "SSL Certificate",
          status: "error",
          message: "SSL certificate provisioning failed",
          details: vercelStatus.ssl.error,
        });
        break;
    }
  } catch (error) {
    results.push({
      step: "Vercel Check",
      status: "error",
      message: "Vercel diagnostic failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }

  return results;
}

// Helper function to check HTTP/HTTPS accessibility
async function checkHTTPDiagnostics(
  domain: string
): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];

  try {
    // Check HTTP
    try {
      const httpResponse = await fetch(`http://${domain}`, {
        method: "HEAD",
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (httpResponse.ok) {
        results.push({
          step: "HTTP Access",
          status: "success",
          message: "Domain is accessible via HTTP",
        });
      } else {
        results.push({
          step: "HTTP Access",
          status: "warning",
          message: `HTTP returned status ${httpResponse.status}`,
        });
      }
    } catch {
      results.push({
        step: "HTTP Access",
        status: "error",
        message: "Domain is not accessible via HTTP",
      });
    }

    // Check HTTPS
    try {
      const httpsResponse = await fetch(`https://${domain}`, {
        method: "HEAD",
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (httpsResponse.ok) {
        results.push({
          step: "HTTPS Access",
          status: "success",
          message: "Domain is accessible via HTTPS",
        });
      } else {
        results.push({
          step: "HTTPS Access",
          status: "warning",
          message: `HTTPS returned status ${httpsResponse.status}`,
        });
      }
    } catch {
      results.push({
        step: "HTTPS Access",
        status: "error",
        message: "Domain is not accessible via HTTPS (SSL may not be ready)",
      });
    }
  } catch (error) {
    results.push({
      step: "HTTP Check",
      status: "error",
      message: "HTTP diagnostic failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }

  return results;
}

// POST - Run comprehensive domain diagnostics
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
    const validation = diagnosticsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid domain",
        },
        { status: 400 }
      );
    }

    const { domain } = validation.data;

    // Check if this domain belongs to the user
    const userRecord = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!userRecord[0] || userRecord[0].customDomain !== domain) {
      return NextResponse.json(
        {
          error: "Domain not associated with your account",
        },
        { status: 403 }
      );
    }

    // Run all diagnostics
    const [dnsResults, vercelResults, httpResults] = await Promise.all([
      checkDNSDiagnostics(domain),
      checkVercelDiagnostics(domain),
      checkHTTPDiagnostics(domain),
    ]);

    const allResults = [...dnsResults, ...vercelResults, ...httpResults];

    // Calculate overall status
    const hasErrors = allResults.some((r) => r.status === "error");
    const hasWarnings = allResults.some((r) => r.status === "warning");

    let overallStatus: "success" | "warning" | "error";
    if (hasErrors) {
      overallStatus = "error";
    } else if (hasWarnings) {
      overallStatus = "warning";
    } else {
      overallStatus = "success";
    }

    return NextResponse.json({
      domain,
      overallStatus,
      timestamp: new Date().toISOString(),
      results: allResults,
      summary: {
        total: allResults.length,
        success: allResults.filter((r) => r.status === "success").length,
        warnings: allResults.filter((r) => r.status === "warning").length,
        errors: allResults.filter((r) => r.status === "error").length,
      },
    });
  } catch (error) {
    console.error("Error running domain diagnostics:", error);
    return NextResponse.json(
      {
        error: "Failed to run domain diagnostics",
      },
      { status: 500 }
    );
  }
}
