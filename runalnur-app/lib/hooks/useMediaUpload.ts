/**
 * Media Upload Hook
 * 
 * Handles file uploads with progress tracking and automatic asset creation.
 */

import { useState, useCallback, useRef } from "react";
import type { MediaAsset, UploadProgress, UploadOptions } from "@/lib/media/types";

interface UseMediaUploadReturn {
  uploads: UploadProgress[];
  isUploading: boolean;
  uploadFiles: (files: File[], options?: UploadOptions) => Promise<MediaAsset[]>;
  cancelUpload: (file: File) => void;
  clearCompleted: () => void;
  clearAll: () => void;
}

export function useMediaUpload(): UseMediaUploadReturn {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  const isUploading = uploads.some(u => u.status === "uploading" || u.status === "processing");

  const updateUpload = useCallback((file: File, update: Partial<UploadProgress>) => {
    setUploads(prev => prev.map(u => 
      u.file === file ? { ...u, ...update } : u
    ));
  }, []);

  const uploadSingleFile = useCallback(async (
    file: File,
    options: UploadOptions = {}
  ): Promise<MediaAsset | null> => {
    const controller = new AbortController();
    abortControllers.current.set(file.name, controller);

    try {
      // Step 1: Get presigned URL
      updateUpload(file, { status: "uploading", progress: 5 });

      const urlResponse = await fetch("/api/media/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_name: file.name,
          content_type: file.type,
          file_size: file.size,
        }),
        signal: controller.signal,
      });

      if (!urlResponse.ok) {
        const error = await urlResponse.json();
        throw new Error(error.error || "Failed to get upload URL");
      }

      const { data: uploadData } = await urlResponse.json();
      updateUpload(file, { progress: 15 });

      // Step 2: Upload to storage (R2 or Supabase)
      let uploadResponse: Response;
      try {
        uploadResponse = await fetch(uploadData.url, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
          },
          body: file,
          signal: controller.signal,
        });
      } catch (e) {
        // Capture the actual error for debugging
        const errName = e instanceof Error ? e.name : "UnknownError";
        const errMsg = e instanceof Error ? e.message : String(e);
        console.error("[useMediaUpload] PUT failed:", { errName, errMsg, url: uploadData.url?.slice(0, 100) });
        
        // TypeError: Failed to fetch usually means network/CORS
        if (errName === "TypeError" && errMsg.includes("Failed to fetch")) {
          throw new Error(
            "Upload failed (network error). Possible causes: CORS not configured, network timeout, or connection issue."
          );
        }
        // Re-throw with actual error details
        throw new Error(`Upload failed: ${errMsg}`);
      }

      if (!uploadResponse.ok) {
        const text = await uploadResponse.text().catch(() => "");
        throw new Error(
          `Failed to upload file to storage (HTTP ${uploadResponse.status}). ${text ? `Response: ${text.slice(0, 300)}` : ""}`.trim()
        );
      }

      updateUpload(file, { status: "processing", progress: 70 });

      // Step 3: Get image dimensions (for images)
      let dimensions: { width?: number; height?: number } = {};
      if (file.type.startsWith("image/")) {
        dimensions = await getImageDimensions(file);
      }

      // Step 4: Create media asset record
      const assetResponse = await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_name: file.name,
          mime_type: file.type,
          file_size: file.size,
          original_path: uploadData.path,
          ...dimensions,
          entity_id: options.entity_id,
          collection_id: options.collection_id,
          manual_tags: options.tags,
          auto_tag: options.auto_tag ?? true,
        }),
        signal: controller.signal,
      });

      if (!assetResponse.ok) {
        const error = await assetResponse.json();
        throw new Error(error.error || "Failed to create asset record");
      }

      const { data: asset } = await assetResponse.json();

      updateUpload(file, { 
        status: "completed", 
        progress: 100, 
        asset 
      });

      return asset;
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        updateUpload(file, { status: "error", error: "Upload cancelled" });
        return null;
      }
      
      const message = err instanceof Error ? err.message : "Upload failed";
      updateUpload(file, { status: "error", error: message });
      return null;
    } finally {
      abortControllers.current.delete(file.name);
    }
  }, [updateUpload]);

  const uploadFiles = useCallback(async (
    files: File[],
    options: UploadOptions = {}
  ): Promise<MediaAsset[]> => {
    // Add files to uploads list
    const newUploads: UploadProgress[] = files.map(file => ({
      file,
      progress: 0,
      status: "pending",
    }));

    setUploads(prev => [...prev, ...newUploads]);

    // Upload all files concurrently (with limit)
    const results = await Promise.all(
      files.map(file => uploadSingleFile(file, options))
    );

    // Return successful uploads
    return results.filter((asset): asset is MediaAsset => asset !== null);
  }, [uploadSingleFile]);

  const cancelUpload = useCallback((file: File) => {
    const controller = abortControllers.current.get(file.name);
    if (controller) {
      controller.abort();
    }
    updateUpload(file, { status: "error", error: "Cancelled" });
  }, [updateUpload]);

  const clearCompleted = useCallback(() => {
    setUploads(prev => prev.filter(u => 
      u.status !== "completed" && u.status !== "error"
    ));
  }, []);

  const clearAll = useCallback(() => {
    // Cancel any in-progress uploads
    abortControllers.current.forEach(controller => controller.abort());
    abortControllers.current.clear();
    setUploads([]);
  }, []);

  return {
    uploads,
    isUploading,
    uploadFiles,
    cancelUpload,
    clearCompleted,
    clearAll,
  };
}

// ============================================================================
// Helpers
// ============================================================================

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
}
