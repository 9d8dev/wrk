import { AlertCircle, CheckCircle, RotateCcw, Upload, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Progress } from "./progress";

interface ImageUploadCardProps {
  file: File;
  previewUrl: string;
  isUploading?: boolean;
  uploadProgress?: number;
  uploadError?: string;
  isComplete?: boolean;
  onRemove: () => void;
  onRetry?: () => void;
  onSetFeatured?: () => void;
  isFeatured?: boolean;
}

export const ImageUploadCard = ({
  file,
  previewUrl,
  isUploading = false,
  uploadProgress = 0,
  uploadError,
  isComplete = false,
  onRemove,
  onRetry,
  onSetFeatured,
  isFeatured = false,
}: ImageUploadCardProps) => {
  const [imageError, setImageError] = useState(false);

  const getStatusIcon = () => {
    if (uploadError)
      return <AlertCircle className="text-destructive h-4 w-4" />;
    if (isComplete) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (isUploading)
      return <Upload className="h-4 w-4 animate-pulse text-blue-500" />;
    return null;
  };

  const getStatusText = () => {
    if (uploadError) return "Failed";
    if (isComplete) return "Complete";
    if (isUploading) return `${uploadProgress}%`;
    return "Pending";
  };

  return (
    <button
      type="button"
      className={cn(
        "group relative aspect-square w-full overflow-hidden rounded-lg border-2 transition-all",
        isFeatured
          ? "border-primary ring-primary/20 shadow-lg ring-2"
          : "border-border hover:border-primary/50",
        uploadError && "border-destructive",
        isComplete && "border-green-500"
      )}
      onClick={onSetFeatured}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSetFeatured?.();
        }
      }}
      aria-label={`${isFeatured ? "Featured" : "Set as featured"} image: ${file.name}`}
    >
      {/* Image */}
      <div className="relative h-full w-full">
        {!imageError ? (
          <Image
            src={previewUrl}
            alt={file.name}
            fill
            className={cn(
              "object-cover transition-opacity",
              isUploading && "opacity-50"
            )}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="bg-muted flex h-full w-full items-center justify-center">
            <AlertCircle className="text-muted-foreground h-8 w-8" />
          </div>
        )}

        {/* Upload Progress Overlay */}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="bg-background/90 min-w-[120px] rounded-lg p-3 backdrop-blur-sm">
              <div className="mb-2 flex items-center gap-2">
                <Upload className="h-4 w-4 animate-pulse" />
                <span className="text-sm font-medium">Uploading...</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-muted-foreground mt-1 text-center text-xs">
                {uploadProgress}%
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Status Badge */}
      {(isUploading || uploadError || isComplete) && (
        <div
          className={cn(
            "absolute top-2 left-2 flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
            uploadError && "bg-destructive text-destructive-foreground",
            isComplete && "bg-green-600 text-white",
            isUploading && "bg-blue-600 text-white"
          )}
        >
          {getStatusIcon()}
          {getStatusText()}
        </div>
      )}

      {/* Featured Badge */}
      {isFeatured && (
        <div className="bg-primary text-primary-foreground absolute top-2 right-2 rounded-md px-2 py-1 text-xs font-medium">
          Featured
        </div>
      )}

      {/* File Info */}
      <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/60 to-transparent p-2">
        <p className="truncate text-xs font-medium text-white">{file.name}</p>
        <p className="text-xs text-white/80">
          {(file.size / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>

      {/* Action Buttons */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {uploadError && onRetry && (
          <Button
            size="icon"
            variant="secondary"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onRetry();
            }}
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        )}

        <Button
          size="icon"
          variant="destructive"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Error Message */}
      {uploadError && (
        <div className="bg-destructive text-destructive-foreground absolute right-0 bottom-0 left-0 p-2 text-xs">
          <p className="truncate">{uploadError}</p>
        </div>
      )}
    </button>
  );
};
