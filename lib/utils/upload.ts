export interface UploadResult {
  success: boolean;
  url?: string;
  width?: number;
  height?: number;
  mediaId?: string;
  error?: string;
}

export async function uploadImageViaAPI(
  file: File,
  projectId?: string
): Promise<UploadResult> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    if (projectId) {
      formData.append("projectId", projectId);
    }

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Upload failed");
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

export async function uploadMultipleImages(
  files: File[],
  onProgress?: (completed: number, total: number) => void
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];
  let completed = 0;

  // Upload files one by one to avoid overwhelming the server
  for (const file of files) {
    try {
      const result = await uploadImageViaAPI(file);
      results.push(result);
      completed++;
      if (onProgress) {
        onProgress(completed, files.length);
      }
    } catch (error) {
      results.push({
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      });
      completed++;
      if (onProgress) {
        onProgress(completed, files.length);
      }
    }
  }

  return results;
}