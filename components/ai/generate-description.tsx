"use client";

import { useState } from "react";
import { generateDescription } from "@/lib/actions/ai";
import { Button } from "@/components/ui/button";

export const GenerateDescription = ({ imageUrl }: { imageUrl: string }) => {
  const [generatedText, setGeneratedText] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleGenerate = async () => {
    if (!imageUrl) return;

    setIsLoading(true);
    setError("");

    try {
      const result = await generateDescription(imageUrl);
      setGeneratedText(result);
    } catch (err) {
      setError("Failed to generate description. Please try again.");
      console.error("Description generation error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={handleGenerate}
        disabled={isLoading || !imageUrl}
        variant="outline"
        size="sm"
      >
        {isLoading ? "Generating..." : "Generate Description"}
      </Button>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {generatedText && (
        <div className="text-sm text-muted-foreground">{generatedText}</div>
      )}
    </div>
  );
};
