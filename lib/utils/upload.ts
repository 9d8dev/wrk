import { compressImage } from "./image-compression";

export interface UploadResult {
  success: boolean;
  url?: string;
  width?: number;
  height?: number;
  mediaId?: string;
  error?: string;
}

export interface UploadProgress {
  phase: "compressing" | "uploading" | "complete";
  current: number;
  total: number;
  percent: number;
}

// Direct upload to S3 using pre-signed URLs (bypasses Vercel limits)
export async function uploadImageDirectly(
  file: File,
  projectId?: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  try {
    // Phase 1: Compress image (less aggressive since we don't have payload limits)
    if (onProgress) {
      onProgress({ phase: "compressing", current: 0, total: 1, percent: 0 });
    }

    const compressedFile = await compressImage(file, {
      maxWidth: 2048, // Back to original size
      maxHeight: 2048,
      quality: 0.85, // Back to original quality
      maxFileSize: 15 * 1024 * 1024, // 15MB limit for direct upload
    });

    if (onProgress) {
      onProgress({ phase: "compressing", current: 1, total: 1, percent: 25 });
    }

    // Phase 2: Get pre-signed URL
    const presignedResponse = await fetch("/api/upload/presigned", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: compressedFile.name,
        fileType: compressedFile.type,
        fileSize: compressedFile.size,
      }),
    });

    if (!presignedResponse.ok) {
      const error = await presignedResponse.json();
      throw new Error(error.error || "Failed to get upload URL");
    }

    const { presignedUrl, publicUrl } = await presignedResponse.json();

    if (onProgress) {
      onProgress({ phase: "uploading", current: 0, total: 1, percent: 50 });
    }

    // Phase 3: Upload directly to S3
    const uploadResponse = await fetch(presignedUrl, {
      method: "PUT",
      body: compressedFile,
      headers: {
        "Content-Type": compressedFile.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`Direct upload failed: ${uploadResponse.status}`);
    }

    if (onProgress) {
      onProgress({ phase: "uploading", current: 1, total: 1, percent: 75 });
    }

    // Phase 4: Create media record
    const mediaResponse = await fetch("/api/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: publicUrl,
        fileName: compressedFile.name,
        fileSize: compressedFile.size,
        mimeType: compressedFile.type,
        projectId: projectId || undefined,
      }),
    });

    if (!mediaResponse.ok) {
      console.warn("Failed to create media record, but upload succeeded");
    }

    const mediaData = mediaResponse.ok ? await mediaResponse.json() : null;

    if (onProgress) {
      onProgress({ phase: "complete", current: 1, total: 1, percent: 100 });
    }

    return {
      success: true,
      url: publicUrl,
      mediaId: mediaData?.mediaId,
      width: mediaData?.width,
      height: mediaData?.height,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

// Fallback upload via API route (for smaller files or when direct upload fails)
export async function uploadImageViaAPI(
  file: File,
  projectId?: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  try {
    // Phase 1: Compress image with original settings
    if (onProgress) {
      onProgress({ phase: "compressing", current: 0, total: 1, percent: 0 });
    }

    const compressedFile = await compressImage(file, {
      maxWidth: 2048,
      maxHeight: 2048,
      quality: 0.85,
      maxFileSize: 4 * 1024 * 1024, // Keep 4MB limit for API route
    });

    if (onProgress) {
      onProgress({ phase: "compressing", current: 1, total: 1, percent: 50 });
    }

    // Phase 2: Upload
    const formData = new FormData();
    formData.append("file", compressedFile);
    if (projectId) {
      formData.append("projectId", projectId);
    }

    if (onProgress) {
      onProgress({ phase: "uploading", current: 0, total: 1, percent: 50 });
    }

    const xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable && onProgress) {
          const uploadPercent = (e.loaded / e.total) * 50; // 50% for upload phase
          onProgress({
            phase: "uploading",
            current: e.loaded,
            total: e.total,
            percent: 50 + uploadPercent,
          });
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const data = JSON.parse(xhr.responseText);
          if (onProgress) {
            onProgress({
              phase: "complete",
              current: 1,
              total: 1,
              percent: 100,
            });
          }
          resolve(data);
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.error || "Upload failed"));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Network error during upload"));
      });

      xhr.addEventListener("timeout", () => {
        reject(new Error("Upload timeout - file may be too large"));
      });

      xhr.open("POST", "/api/upload");
      xhr.timeout = 120000; // 2 minute timeout
      xhr.send(formData);
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

// Smart upload function that chooses the best method
export async function uploadImage(
  file: File,
  projectId?: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  // Use direct upload for files larger than 4MB or always for better reliability
  if (file.size > 4 * 1024 * 1024) {
    return uploadImageDirectly(file, projectId, onProgress);
  }

  // Try direct upload first, fallback to API route if it fails
  try {
    return await uploadImageDirectly(file, projectId, onProgress);
  } catch (error) {
    console.warn("Direct upload failed, falling back to API route:", error);
    return uploadImageViaAPI(file, projectId, onProgress);
  }
}

export async function uploadMultipleImages(
  files: File[],
  onProgress?: (completed: number, total: number, currentFile: string) => void
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];
  let completed = 0;

  // Upload files one by one to avoid overwhelming the server
  for (const file of files) {
    try {
      if (onProgress) {
        onProgress(completed, files.length, file.name);
      }

      const result = await uploadImage(file); // Use smart upload function
      results.push(result);
      completed++;

      if (onProgress) {
        onProgress(completed, files.length, "");
      }
    } catch (error) {
      results.push({
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      });
      completed++;
      if (onProgress) {
        onProgress(completed, files.length, "");
      }
    }
  }

  return results;
}
