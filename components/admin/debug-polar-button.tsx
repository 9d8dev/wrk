"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bug, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export function DebugPolarButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);

  const handleDebug = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/polar/debug", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        setDebugData(data);
        toast.success("Debug data retrieved successfully");
        console.log("🐛 Polar Debug Data:", data);
      } else {
        toast.error(data.error || "Failed to fetch debug data");
        console.error("❌ Debug error:", data);
        setDebugData(data);
      }
    } catch (error) {
      toast.error("Failed to fetch debug data");
      console.error("Debug error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleDebug}
        disabled={isLoading}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Bug className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        {isLoading ? "Testing..." : "Debug Polar Connection"}
      </Button>

      {debugData && (
        <div className="mt-4 p-4 border rounded-lg bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <ExternalLink className="h-4 w-4" />
            <span className="font-medium text-sm">Debug Results:</span>
          </div>
          <pre className="text-xs overflow-auto max-h-64 bg-background p-2 rounded border">
            {JSON.stringify(debugData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
