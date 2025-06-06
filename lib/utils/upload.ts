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
      // More detailed error for debugging
      const errorText = await uploadResponse
        .text()
        .catch(() => "Unknown error");
      console.error("Direct upload failed:", {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        error: errorText,
      });
      throw new Error(
        `Direct upload failed: ${uploadResponse.status} - ${uploadResponse.statusText}`
      );
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
  // Always try direct upload first for better performance
  try {
    console.log("Attempting direct upload for:", file.name);
    const result = await uploadImageDirectly(file, projectId, onProgress);
    console.log("Direct upload successful for:", file.name);
    return result;
  } catch (error) {
    console.warn("Direct upload failed, falling back to API route:", error);

    // Only try API route if file is small enough (under 4MB after compression)
    if (file.size <= 4 * 1024 * 1024) {
      console.log("Trying API route fallback for:", file.name);
      return uploadImageViaAPI(file, projectId, onProgress);
    } else {
      // For large files, we can't use API route, so return the error
      throw error;
    }
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

// New parallel upload function for better performance
export async function uploadMultipleImagesParallel(
  files: File[],
  onProgress?: (completed: number, total: number, currentFile: string) => void,
  maxConcurrent: number = 3 // Limit concurrent uploads
): Promise<UploadResult[]> {
  const results: UploadResult[] = new Array(files.length);
  let completed = 0;

  // Function to upload a single file with index tracking
  const uploadWithIndex = async (file: File, index: number): Promise<void> => {
    try {
      if (onProgress) {
        onProgress(completed, files.length, file.name);
      }

      const result = await uploadImage(file);
      results[index] = result;
    } catch (error) {
      results[index] = {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    } finally {
      completed++;
      if (onProgress) {
        onProgress(completed, files.length, "");
      }
    }
  };

  // Create chunks of files to upload concurrently
  const chunks: File[][] = [];
  for (let i = 0; i < files.length; i += maxConcurrent) {
    chunks.push(files.slice(i, i + maxConcurrent));
  }

  // Process each chunk
  for (const chunk of chunks) {
    const promises = chunk.map((file, chunkIndex) => {
      const globalIndex = chunks.indexOf(chunk) * maxConcurrent + chunkIndex;
      return uploadWithIndex(file, globalIndex);
    });

    await Promise.all(promises);
  }

  return results;
}

// Upload queue with retry logic
interface QueuedUpload {
  file: File;
  projectId?: string;
  retries: number;
  maxRetries: number;
  resolve: (result: UploadResult) => void;
  reject: (error: Error) => void;
}

class UploadQueue {
  private queue: QueuedUpload[] = [];
  private processing = false;
  private maxConcurrent = 3;
  private activeUploads = 0;

  async add(
    file: File,
    projectId?: string,
    maxRetries = 3
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        file,
        projectId,
        retries: 0,
        maxRetries,
        resolve,
        reject,
      });
      this.process();
    });
  }

  private async process() {
    if (this.processing || this.activeUploads >= this.maxConcurrent) return;

    const upload = this.queue.shift();
    if (!upload) return;

    this.processing = true;
    this.activeUploads++;

    try {
      const result = await uploadImage(upload.file, upload.projectId);

      if (result.success) {
        upload.resolve(result);
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      upload.retries++;

      if (upload.retries < upload.maxRetries) {
        // Exponential backoff: wait 2^retries seconds
        const delay = Math.pow(2, upload.retries) * 1000;
        setTimeout(() => {
          this.queue.unshift(upload); // Add back to front of queue
          this.process();
        }, delay);
      } else {
        upload.reject(
          error instanceof Error
            ? error
            : new Error("Upload failed after retries")
        );
      }
    } finally {
      this.activeUploads--;
      this.processing = false;

      // Process next item in queue
      if (this.queue.length > 0) {
        setTimeout(() => this.process(), 100);
      }
    }
  }
}

// Global upload queue instance
const uploadQueue = new UploadQueue();

// Enhanced upload function with queue and retry
export async function uploadImageWithRetry(
  file: File,
  projectId?: string,
  maxRetries = 3
): Promise<UploadResult> {
  return uploadQueue.add(file, projectId, maxRetries);
}
