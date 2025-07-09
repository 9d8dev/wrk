"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { improveWriting } from "@/lib/actions/ai";

interface ImproveWritingProps {
  value: string;
  field: {
    onChange: (value: string) => void;
  };
}

export const ImproveWriting = ({ value, field }: ImproveWritingProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleImprove = async () => {
    if (!value || value.trim().length === 0) return;
    setIsLoading(true);
    setError("");
    try {
      const improved = await improveWriting(value);
      field.onChange(improved);
    } catch (err) {
      setError("Failed to improve writing. Please try again.");
      console.error("Improve writing error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={handleImprove}
        disabled={isLoading || !value || value.trim().length === 0}
        variant="outline"
        size="sm"
      >
        {isLoading ? "Improving..." : "Improve Writing"}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default ImproveWriting;
