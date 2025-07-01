import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getVercelConfigStatus } from "@/lib/vercel-api";

// GET - Check system configuration for domain management
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Vercel configuration status
    const vercelConfig = getVercelConfigStatus();
    
    // Check environment variables
    const envCheck = {
      VERCEL_API_TOKEN: {
        present: !!process.env.VERCEL_API_TOKEN,
        length: process.env.VERCEL_API_TOKEN?.length || 0
      },
      VERCEL_PROJECT_ID: {
        present: !!process.env.VERCEL_PROJECT_ID,
        value: process.env.VERCEL_PROJECT_ID || null
      },
      VERCEL_TEAM_ID: {
        present: !!process.env.VERCEL_TEAM_ID,
        value: process.env.VERCEL_TEAM_ID || null
      },
      NEXT_PUBLIC_APP_URL: {
        present: !!process.env.NEXT_PUBLIC_APP_URL,
        value: process.env.NEXT_PUBLIC_APP_URL || null
      }
    };

    // Overall system status
    const systemStatus = {
      vercelConfigured: vercelConfig.isValid,
      domainManagementReady: vercelConfig.isValid,
      issues: [] as string[]
    };

    if (!vercelConfig.isValid) {
      systemStatus.issues.push(vercelConfig.error || "Vercel configuration incomplete");
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      systemStatus.issues.push("NEXT_PUBLIC_APP_URL not configured");
    }

    return NextResponse.json({
      status: systemStatus.domainManagementReady ? "ready" : "configuration_required",
      vercel: vercelConfig,
      environment: envCheck,
      issues: systemStatus.issues,
      timestamp: new Date().toISOString(),
      recommendations: systemStatus.issues.length > 0 ? [
        "Configure missing environment variables",
        "Restart the application after configuration changes",
        "Test Vercel API connection with a simple domain status check"
      ] : [
        "System is properly configured for domain management"
      ]
    });

  } catch (error) {
    console.error("Error checking system configuration:", error);
    return NextResponse.json({ 
      error: "Failed to check system configuration",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}