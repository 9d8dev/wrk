/**
 * Media utility functions for handling different image types and formats
 */

export type ImageType = "gif" | "webp" | "jpeg" | "png" | "svg" | "unknown";

/**
 * Detect the image type from a URL or file path
 */
export function detectImageType(src: string): ImageType {
  const url = src.toLowerCase();

  if (
    url.includes(".gif") ||
    url.includes("image/gif") ||
    url.includes("data:image/gif")
  ) {
    return "gif";
  }

  if (url.includes(".webp") || url.includes("image/webp")) {
    return "webp";
  }

  if (
    url.includes(".jpg") ||
    url.includes(".jpeg") ||
    url.includes("image/jpeg")
  ) {
    return "jpeg";
  }

  if (url.includes(".png") || url.includes("image/png")) {
    return "png";
  }

  if (url.includes(".svg") || url.includes("image/svg")) {
    return "svg";
  }

  return "unknown";
}

/**
 * Check if an image is animated (currently only detects GIFs)
 */
export function isAnimatedImage(src: string): boolean {
  return detectImageType(src) === "gif";
}

/**
 * Get optimal loading settings for different image types
 */
export function getImageLoadingSettings(src: string) {
  const imageType = detectImageType(src);
  const isAnimated = isAnimatedImage(src);

  return {
    imageType,
    isAnimated,
    shouldOptimize: !isAnimated, // Don't optimize animated images
    placeholder: isAnimated ? "empty" : "shimmer",
    objectFit: isAnimated ? "contain" : "cover",
    transitionDuration: isAnimated ? "duration-75" : "duration-300",
    priority: false, // Can be overridden
  };
}

/**
 * Get file size limits based on image type
 */
export function getFileSizeLimit(imageType: ImageType): number {
  switch (imageType) {
    case "gif":
      return 20 * 1024 * 1024; // 20MB for GIFs
    case "svg":
      return 1 * 1024 * 1024; // 1MB for SVGs
    default:
      return 10 * 1024 * 1024; // 10MB for other images
  }
}

/**
 * Validate if a file type is supported for upload
 */
export function isSupportedImageType(mimeType: string): boolean {
  const supportedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
  ];

  return supportedTypes.includes(mimeType.toLowerCase());
}

/**
 * Get appropriate image processing settings for upload
 */
export function getImageProcessingSettings(file: File) {
  const imageType = detectImageType(file.name);
  const isAnimated = isAnimatedImage(file.name);

  return {
    shouldResize: !isAnimated && imageType !== "svg",
    shouldOptimize: !isAnimated && imageType !== "svg",
    preserveFormat: isAnimated || imageType === "svg",
    maxWidth: isAnimated ? undefined : 1920,
    maxHeight: isAnimated ? undefined : 1080,
    quality: imageType === "gif" ? 100 : 85,
  };
}
