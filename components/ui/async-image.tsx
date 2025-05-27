"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

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
}: AsyncImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);

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
        style={{
          width: fill ? "100%" : width,
          height: fill ? "100%" : height,
          aspectRatio: aspectRatio,
          ...style,
        }}
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
      className={cn("relative overflow-hidden", className)}
      style={{
        width: fill ? "100%" : width,
        height: fill ? "100%" : height,
        aspectRatio: aspectRatio,
        ...style,
      }}
    >
      {isLoading && placeholder === "shimmer" && (
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
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
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
        placeholder={blurDataURL ? "blur" : undefined}
        blurDataURL={blurDataURL}
        style={{
          objectFit: "cover",
          ...style,
        }}
      />
    </div>
  );
}