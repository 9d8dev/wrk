"use server";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Buffer } from "buffer";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { createMedia } from "@/lib/data/media";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export const uploadImage = async (formData: FormData, projectId?: string) => {
  const file = formData.get("file") as File;

  if (!file || file.size === 0) {
    throw new Error("Missing file");
  }

  // Validate file size (15MB max)
  const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds 15MB limit. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed');
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
      Bucket: process.env.R2_BUCKET!,
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
