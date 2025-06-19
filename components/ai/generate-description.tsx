"use client";

import { useState } from "react";
import { generateDescription } from "@/lib/actions/ai";
import { Button } from "@/components/ui/button";

interface GenerateDescriptionProps {
  imageUrl?: string;
  file?: File;
  field: {
    onChange: (value: string) => void;
  };
}

export const GenerateDescription = ({
  imageUrl,
  file,
  field,
}: GenerateDescriptionProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleGenerate = async () => {
    if (!imageUrl && !file) return;

    setIsLoading(true);
    setError("");

    try {
      let finalImageUrl = imageUrl;

      // If we have a file but no URL, convert file to compressed data URL
      if (file && !imageUrl) {
        finalImageUrl = await compressImageToDataUrl(file);
      }

      if (!finalImageUrl) throw new Error("No image available");

      const result = await generateDescription(finalImageUrl);
      field.onChange(result);
    } catch (err) {
      setError("Failed to generate description. Please try again.");
      console.error("Description generation error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const hasImage = imageUrl || file;

  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={handleGenerate}
        disabled={isLoading || !hasImage}
        variant="outline"
        size="sm"
      >
        {isLoading ? "Generating..." : "Generate with AI"}
      </Button>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};

// Compress image to reduce payload size for AI processing
const compressImageToDataUrl = (
  file: File,
  maxWidth = 800,
  quality = 0.8
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      // Calculate new dimensions
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      const width = img.width * ratio;
      const height = img.height * ratio;

      // Set canvas size
      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);

      // Convert to data URL with compression
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve(dataUrl);
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

// Legacy export for backward compatibility
export const GenerateDescriptionFromFile = GenerateDescription;
