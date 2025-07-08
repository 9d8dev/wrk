"use server";

import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import sharp from "sharp";
import {
  createMedia,
  deleteMedia,
  deleteMediaBatch,
  getMediaById,
  getMediaByIds,
} from "@/lib/data/media";

// Validate required environment variables at module level
const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET;

if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
  throw new Error(
    "Missing required R2 environment variables: R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, or R2_BUCKET"
  );
}

const s3 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Extracts the R2 key from a media URL
 */
function extractKeyFromUrl(url: string): string | null {
  try {
    // Handle URLs like "https://images.wrk.so/uploads/abc123-image.jpg"
    const urlObj = new URL(url);
    // Remove leading slash and return the path
    return urlObj.pathname.substring(1);
  } catch {
    // If URL parsing fails, try regex approach
    const match = url.match(/uploads\/[^/]+$/);
    return match ? match[0] : null;
  }
}

/**
 * Deletes a file from R2 storage
 */
async function deleteFromR2(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    })
  );
}

/**
 * Deletes multiple files from R2 storage
 */
async function deleteMultipleFromR2(keys: string[]): Promise<void> {
  // Delete files in parallel for better performance
  const deletePromises = keys.map((key) => deleteFromR2(key));
  await Promise.allSettled(deletePromises); // Use allSettled to continue even if some deletions fail
}

/**
 * Deletes a media entry and its associated R2 file
 */
export async function deleteMediaWithCleanup(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // First, get the media record to extract the file key
    const mediaResult = await getMediaById(id);

    if (!mediaResult.success || !mediaResult.data) {
      return { success: false, error: "Media not found" };
    }

    const media = mediaResult.data;

    // Extract the R2 key from the URL
    const key = extractKeyFromUrl(media.url);

    // Delete from database first
    const deleteResult = await deleteMedia(id);

    if (!deleteResult.success) {
      return { success: false, error: deleteResult.error };
    }

    // Then delete from R2 storage (if key was found)
    if (key) {
      try {
        await deleteFromR2(key);
      } catch (error) {
        console.warn(`Failed to delete file from R2: ${key}`, error);
        // Don't fail the entire operation if R2 deletion fails
        // The database record is already deleted, which is the primary concern
      }
    } else {
      console.warn(`Could not extract R2 key from URL: ${media.url}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting media with cleanup:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete media",
    };
  }
}

/**
 * Deletes multiple media entries and their associated R2 files
 */
export async function deleteMediaBatchWithCleanup(
  ids: string[]
): Promise<{ success: boolean; error?: string; deletedCount?: number }> {
  try {
    if (ids.length === 0) {
      return { success: true, deletedCount: 0 };
    }

    // First, get all media records to extract file keys
    const mediaResult = await getMediaByIds(ids);

    if (!mediaResult.success) {
      return { success: false, error: mediaResult.error };
    }

    const mediaItems = mediaResult.data;
    const keys = mediaItems
      .map((media) => extractKeyFromUrl(media.url))
      .filter((key): key is string => key !== null);

    // Delete from database first
    const deleteResult = await deleteMediaBatch(ids);

    if (!deleteResult.success) {
      return { success: false, error: deleteResult.error };
    }

    // Then delete from R2 storage (in parallel)
    if (keys.length > 0) {
      try {
        await deleteMultipleFromR2(keys);
      } catch (error) {
        console.warn(`Failed to delete some files from R2:`, error);
        // Don't fail the entire operation if R2 deletion fails
      }
    }

    return { success: true, deletedCount: deleteResult.data };
  } catch (error) {
    console.error("Error deleting media batch with cleanup:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete media batch",
    };
  }
}

export const uploadImage = async (formData: FormData, projectId?: string) => {
  const file = formData.get("file") as File;

  if (!file || file.size === 0) {
    throw new Error("Missing file");
  }

  // Validate file size (15MB max)
  const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File size exceeds 15MB limit. Your file is ${(
        file.size /
        1024 /
        1024
      ).toFixed(2)}MB`
    );
  }

  // Validate file type
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];
  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      "Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed"
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = `uploads/${randomUUID()}-${file.name}`;

  // Check if the file is a GIF
  const isGif = file.type === "image/gif";

  // Process the image based on its type
  let finalBuffer: Buffer;
  let contentType: string;
  let width: number;
  let height: number;

  if (isGif) {
    // For GIFs, preserve the original format
    finalBuffer = buffer;
    contentType = "image/gif";

    // Still need to get dimensions
    const metadata = await sharp(buffer, { animated: true }).metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error("Could not get image dimensions");
    }

    width = metadata.width;
    height = metadata.height;
  } else {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error("Could not get image dimensions");
    }

    width = metadata.width;
    height = metadata.height;

    finalBuffer = await image.toBuffer();

    contentType = "image/webp";
  }

  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: finalBuffer,
      ContentType: contentType,
      ACL: "public-read",
    })
  );

  const url = `https://images.wrk.so/${key}`;

  // Store image metadata in the media table
  const mediaResult = await createMedia({
    url,
    width,
    height,
    alt: file.name,
    size: finalBuffer.length,
    mimeType: contentType,
    projectId: projectId || undefined,
  });

  if (!mediaResult.success) {
    console.error("Failed to save media metadata:", mediaResult.error);
  }

  const mediaId =
    mediaResult.success && mediaResult.data ? mediaResult.data.id : undefined;

  return {
    success: true,
    url,
    width,
    height,
    mediaId,
  };
};
