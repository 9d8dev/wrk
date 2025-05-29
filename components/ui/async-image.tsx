"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { detectImageType, isAnimatedImage } from "@/lib/utils/media";

interface AsyncImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  sizes?: string;
  fill?: boolean;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
  placeholder?: "blur" | "empty" | "shimmer";
  blurDataURL?: string;
  fallback?: React.ReactNode;
  aspectRatio?: number;
  forceObjectFit?: "cover" | "contain" | "fill"; // Allow override for specific use cases
}

export function AsyncImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
  sizes,
  fill = false,
  style,
  onLoad,
  onError,
  placeholder = "shimmer",
  blurDataURL,
  fallback,
  aspectRatio,
  forceObjectFit,
}: AsyncImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);

  // Use improved detection from media utils
  const imageType = detectImageType(src);
  const isAnimated = isAnimatedImage(src);

  // Smart object-fit strategy for different scenarios
  const getObjectFit = (): "cover" | "contain" | "fill" => {
    // Allow manual override
    if (forceObjectFit) return forceObjectFit;

    // For animated images in constrained containers (like masonry), use cover
    // This ensures they fill the space properly even if aspect ratio is constrained
    if (isAnimated && aspectRatio) return "cover";

    // For animated images without constraints, use contain to preserve animation
    if (isAnimated) return "contain";

    // Default to cover for static images
    return "cover";
  };

  // Adaptive placeholder and transition based on image type
  const effectivePlaceholder = isAnimated ? "empty" : placeholder;
  const transitionDuration = isAnimated ? "duration-100" : "duration-300";
  const objectFit = getObjectFit();

  useEffect(() => {
    setImageSrc(src);
    setHasError(false);
    setIsLoading(true);
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  if (hasError && fallback) {
    return <>{fallback}</>;
  }

  if (hasError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground",
          className
        )}
      >
        <svg
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden group",
        fill ? "w-full h-full" : "inline-block",
        className
      )}
    >
      {/* Loading states */}
      {isLoading && effectivePlaceholder === "shimmer" && (
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      )}

      {isLoading && effectivePlaceholder === "empty" && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}

      <Image
        src={imageSrc}
        alt={alt}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        fill={fill}
        priority={priority}
        sizes={sizes}
        className={cn(
          "transition-opacity",
          transitionDuration,
          isLoading ? "opacity-0" : "opacity-100"
        )}
        onLoad={handleLoad}
        onError={handleError}
        placeholder={blurDataURL ? "blur" : undefined}
        blurDataURL={blurDataURL}
        style={{
          objectFit: objectFit,
          // Better image rendering for different types
          imageRendering: isAnimated ? "auto" : "crisp-edges",
          ...style,
        }}
        // Disable optimization for animated images
        unoptimized={isAnimated}
      />
    </div>
  );
}
