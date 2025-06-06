import { compressImage } from './image-compression';

export interface UploadResult {
  success: boolean;
  url?: string;
  width?: number;
  height?: number;
  mediaId?: string;
  error?: string;
}

export interface UploadProgress {
  phase: 'compressing' | 'uploading' | 'complete';
  current: number;
  total: number;
  percent: number;
}

export async function uploadImageViaAPI(
  file: File,
  projectId?: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  try {
    // Phase 1: Compress image
    if (onProgress) {
      onProgress({ phase: 'compressing', current: 0, total: 1, percent: 0 });
    }
    
    const compressedFile = await compressImage(file, {
      maxWidth: 2048,
      maxHeight: 2048,
      quality: 0.85,
    });
    
    if (onProgress) {
      onProgress({ phase: 'compressing', current: 1, total: 1, percent: 50 });
    }

    // Phase 2: Upload
    const formData = new FormData();
    formData.append("file", compressedFile);
    if (projectId) {
      formData.append("projectId", projectId);
    }

    if (onProgress) {
      onProgress({ phase: 'uploading', current: 0, total: 1, percent: 50 });
    }

    const xhr = new XMLHttpRequest();
    
    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const uploadPercent = (e.loaded / e.total) * 50; // 50% for upload phase
          onProgress({
            phase: 'uploading',
            current: e.loaded,
            total: e.total,
            percent: 50 + uploadPercent
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const data = JSON.parse(xhr.responseText);
          if (onProgress) {
            onProgress({ phase: 'complete', current: 1, total: 1, percent: 100 });
          }
          resolve(data);
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.error || 'Upload failed'));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timeout - file may be too large'));
      });

      xhr.open('POST', '/api/upload');
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
      
      const result = await uploadImageViaAPI(file);
      results.push(result);
      completed++;
      
      if (onProgress) {
        onProgress(completed, files.length, '');
      }
    } catch (error) {
      results.push({
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      });
      completed++;
      if (onProgress) {
        onProgress(completed, files.length, '');
      }
    }
  }

  return results;
}