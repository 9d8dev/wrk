// Vercel API integration using direct REST API calls
// This avoids build issues with the @vercel/client package

const projectId = process.env.VERCEL_PROJECT_ID || "";
const teamId = process.env.VERCEL_TEAM_ID;
const apiToken = process.env.VERCEL_API_TOKEN;

// Validate required environment variables
function validateVercelConfig(): { isValid: boolean; error?: string } {
  if (!apiToken) {
    return {
      isValid: false,
      error: "VERCEL_API_TOKEN environment variable is required but not set",
    };
  }

  if (!projectId) {
    return {
      isValid: false,
      error: "VERCEL_PROJECT_ID environment variable is required but not set",
    };
  }

  return { isValid: true };
}

export interface VercelDomainStatus {
  configured: boolean;
  verified: boolean;
  ssl: {
    state: "PENDING" | "READY" | "ERROR";
    error?: string;
  };
  cnames?: string[];
  aRecords?: string[];
}

/**
 * Add a domain to the Vercel project
 */
export async function addDomainToVercel(
  domain: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check configuration first
    const configCheck = validateVercelConfig();
    if (!configCheck.isValid) {
      return {
        success: false,
        error: `Vercel API configuration error: ${configCheck.error}`,
      };
    }

    const response = await fetch(
      `https://api.vercel.com/v10/projects/${projectId}/domains${teamId ? `?teamId=${teamId}` : ""}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: domain,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      // Domain might already exist, which is okay
      if (error.error?.code === "domain_already_exists") {
        return { success: true };
      }

      // Provide more specific error messages
      if (response.status === 401) {
        return {
          success: false,
          error:
            "Vercel API authentication failed. Please check VERCEL_API_TOKEN.",
        };
      }

      if (response.status === 403) {
        return {
          success: false,
          error: "Vercel API access denied. Please check project permissions.",
        };
      }

      return {
        success: false,
        error:
          error.error?.message ||
          `Failed to add domain: ${response.statusText}`,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error adding domain to Vercel:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add domain",
    };
  }
}

/**
 * Remove a domain from the Vercel project
 */
export async function removeDomainFromVercel(
  domain: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check configuration first
    const configCheck = validateVercelConfig();
    if (!configCheck.isValid) {
      return {
        success: false,
        error: `Vercel API configuration error: ${configCheck.error}`,
      };
    }

    const response = await fetch(
      `https://api.vercel.com/v9/projects/${projectId}/domains/${domain}${teamId ? `?teamId=${teamId}` : ""}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      // Domain might not exist, which is okay if we're removing it
      if (error.error?.code === "not_found") {
        return { success: true };
      }
      return {
        success: false,
        error:
          error.error?.message ||
          `Failed to remove domain: ${response.statusText}`,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error removing domain from Vercel:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove domain",
    };
  }
}

/**
 * Get domain configuration status from Vercel
 */
export async function getDomainStatus(
  domain: string
): Promise<{ success: boolean; data?: VercelDomainStatus; error?: string }> {
  try {
    // Check configuration first
    const configCheck = validateVercelConfig();
    if (!configCheck.isValid) {
      return {
        success: false,
        error: `Vercel API configuration error: ${configCheck.error}`,
      };
    }

    const response = await fetch(
      `https://api.vercel.com/v6/domains/${domain}/config${teamId ? `?teamId=${teamId}` : ""}`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();

      if (response.status === 401) {
        return {
          success: false,
          error:
            "Vercel API authentication failed. Please check VERCEL_API_TOKEN.",
        };
      }

      return {
        success: false,
        error:
          error.error?.message ||
          `Failed to get domain status: ${response.statusText}`,
      };
    }

    const data = await response.json();

    // Extract relevant status information
    const status: VercelDomainStatus = {
      configured: data.misconfigured === false,
      verified: data.verified === true,
      ssl: {
        state: data.certs?.length > 0 ? "READY" : "PENDING",
      },
      cnames: data.configuredBy === "CNAME" ? data.cnames : undefined,
      aRecords: data.configuredBy === "A" ? data.aRecords : undefined,
    };

    return { success: true, data: status };
  } catch (error) {
    console.error("Error getting domain status from Vercel:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get domain status",
    };
  }
}

/**
 * Verify domain configuration in Vercel
 */
export async function verifyDomainInVercel(
  domain: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check configuration first
    const configCheck = validateVercelConfig();
    if (!configCheck.isValid) {
      return {
        success: false,
        error: `Vercel API configuration error: ${configCheck.error}`,
      };
    }

    const response = await fetch(
      `https://api.vercel.com/v9/projects/${projectId}/domains/${domain}/verify${teamId ? `?teamId=${teamId}` : ""}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();

      if (response.status === 401) {
        return {
          success: false,
          error:
            "Vercel API authentication failed. Please check VERCEL_API_TOKEN.",
        };
      }

      return {
        success: false,
        error:
          error.error?.message ||
          `Failed to verify domain: ${response.statusText}`,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error verifying domain in Vercel:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to verify domain",
    };
  }
}

/**
 * Check if Vercel API is properly configured
 */
export function isVercelConfigured(): boolean {
  return validateVercelConfig().isValid;
}

/**
 * Get Vercel configuration status for debugging
 */
export function getVercelConfigStatus(): {
  hasToken: boolean;
  hasProjectId: boolean;
  hasTeamId: boolean;
  isValid: boolean;
  error?: string;
} {
  const validation = validateVercelConfig();
  return {
    hasToken: !!apiToken,
    hasProjectId: !!projectId,
    hasTeamId: !!teamId,
    isValid: validation.isValid,
    error: validation.error,
  };
}
