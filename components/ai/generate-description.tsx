"use client";

import { useState } from "react";
import { generateDescription } from "@/lib/actions/ai";
import { Button } from "@/components/ui/button";

interface GenerateDescriptionProps {
  imageUrl: string;
  field: {
    onChange: (value: string) => void;
  };
}

export const GenerateDescription = ({
  imageUrl,
  field,
}: GenerateDescriptionProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleGenerate = async () => {
    if (!imageUrl) return;

    setIsLoading(true);
    setError("");

    try {
      const result = await generateDescription(imageUrl);
      field.onChange(result); // Update the form field with generated text
    } catch (err) {
      setError("Failed to generate description. Please try again.");
      console.error("Description generation error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={handleGenerate}
        disabled={isLoading || !imageUrl}
        variant="outline"
        size="sm"
      >
        {isLoading ? "Generating..." : "Generate with AI"}
      </Button>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};
