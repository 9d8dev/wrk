"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, AlertTriangle, CheckCircle, Clock, Globe, Settings, Shield } from "lucide-react";
import { toast } from "sonner";
import { usePostHogEvents } from "@/components/analytics";

interface DomainStatus {
  domain: string | null;
  status: string | null;
  verifiedAt: string | null;
  hasActivePro: boolean;
  errorMessage?: string | null;
}

export function DomainManagement() {
  const [domainStatus, setDomainStatus] = useState<DomainStatus | null>(null);
  const [newDomain, setNewDomain] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const { trackCustomDomainAdded, trackCustomDomainVerified, trackCustomDomainRemoved } = usePostHogEvents();

  // Load current domain status
  useEffect(() => {
    fetchDomainStatus();
  }, []);

  const fetchDomainStatus = async () => {
    try {
      setIsLoadingStatus(true);
      const response = await fetch("/api/pro/domain");
      const data = await response.json();
      
      if (response.ok) {
        setDomainStatus(data);
      } else {
        console.error("Failed to fetch domain status:", data.error);
      }
    } catch (error) {
      console.error("Error fetching domain status:", error);
      toast.error("Failed to load domain status");
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const addDomain = async () => {
    if (!newDomain.trim()) {
      toast.error("Please enter a domain");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/pro/domain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ domain: newDomain.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        trackCustomDomainAdded(newDomain.trim());
        setNewDomain("");
        await fetchDomainStatus();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      console.error("Error adding domain:", error);
      toast.error("Failed to add domain");
    } finally {
      setIsLoading(false);
    }
  };

  const removeDomain = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/pro/domain", {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        if (domainStatus?.domain) {
          trackCustomDomainRemoved(domainStatus.domain);
        }
        await fetchDomainStatus();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      console.error("Error removing domain:", error);
      toast.error("Failed to remove domain");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyDomain = async () => {
    if (!domainStatus?.domain) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/pro/domain/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ domain: domainStatus.domain }),
      });

      const data = await response.json();

      if (data.verified) {
        toast.success(data.message);
        if (domainStatus?.domain) {
          trackCustomDomainVerified(domainStatus.domain);
        }
        await fetchDomainStatus();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error verifying domain:", error);
      toast.error("Failed to verify domain");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending DNS Setup</Badge>;
      case "dns_configured":
        return <Badge className="bg-blue-100 text-blue-800"><Settings className="w-3 h-3 mr-1" />DNS Configured</Badge>;
      case "vercel_pending":
        return <Badge className="bg-blue-100 text-blue-800"><Settings className="w-3 h-3 mr-1" />Setting up Vercel</Badge>;
      case "ssl_pending":
        return <Badge className="bg-orange-100 text-orange-800"><Shield className="w-3 h-3 mr-1" />SSL Pending</Badge>;
      case "error":
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" />Error</Badge>;
      default:
        return null;
    }
  };

  if (isLoadingStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Custom Domain
          </CardTitle>
          <CardDescription>Loading domain settings...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!domainStatus?.hasActivePro) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Custom Domain
          </CardTitle>
          <CardDescription>
            Use your own domain for your portfolio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Custom domains are a Pro feature. Upgrade to Pro to use your own domain.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Custom Domain
        </CardTitle>
        <CardDescription>
          Use your own domain for your portfolio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {domainStatus.domain ? (
          <div className="space-y-4">
            {/* Current Domain Display */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{domainStatus.domain}</span>
                  {getStatusBadge(domainStatus.status)}
                </div>
                {domainStatus.verifiedAt && (
                  <p className="text-sm text-muted-foreground">
                    Verified on {new Date(domainStatus.verifiedAt).toLocaleDateString()}
                  </p>
                )}
                {domainStatus.errorMessage && (
                  <p className="text-sm text-red-600">
                    {domainStatus.errorMessage}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {domainStatus.status === "active" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://${domainStatus.domain}`, "_blank")}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={removeDomain}
                  disabled={isLoading}
                >
                  Remove
                </Button>
              </div>
            </div>

            {/* Status-specific Instructions */}
            {domainStatus.status !== "active" && (
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {domainStatus.status === "pending" && "To activate your custom domain, please configure your DNS settings:"}
                    {domainStatus.status === "dns_configured" && "DNS is configured! Setting up your domain with Vercel..."}
                    {domainStatus.status === "vercel_pending" && "Domain added to Vercel. Configuring SSL certificate..."}
                    {domainStatus.status === "ssl_pending" && "SSL certificate is being provisioned. This may take a few minutes."}
                    {domainStatus.status === "error" && "There was an error configuring your domain. Please check the error message above and try again."}
                  </AlertDescription>
                </Alert>

                {(domainStatus.status === "pending" || domainStatus.status === "error") && (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">CNAME Record (Recommended)</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 p-2 bg-muted rounded text-sm">
                          {domainStatus.domain} → cname.vercel-dns.com
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(`${domainStatus.domain} CNAME cname.vercel-dns.com`)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">A Record (Alternative)</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 p-2 bg-muted rounded text-sm">
                          {domainStatus.domain} → 76.76.19.61
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(`${domainStatus.domain} A 76.76.19.61`)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={verifyDomain} 
                  disabled={isLoading || (domainStatus.status !== "pending" && domainStatus.status !== "error" && domainStatus.status !== "ssl_pending")}
                  className="w-full"
                >
                  {isLoading ? "Checking..." : 
                   domainStatus.status === "ssl_pending" ? "Check SSL Status" :
                   domainStatus.status === "dns_configured" ? "Configuring..." :
                   domainStatus.status === "vercel_pending" ? "Setting up..." :
                   "Verify Domain"}
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* Add New Domain Form */
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <div className="flex gap-2">
                <Input
                  id="domain"
                  type="text"
                  placeholder="yourdomain.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      addDomain();
                    }
                  }}
                />
                <Button onClick={addDomain} disabled={isLoading}>
                  {isLoading ? "Adding..." : "Add Domain"}
                </Button>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Make sure you own this domain and have access to its DNS settings.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
}