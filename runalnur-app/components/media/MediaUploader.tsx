"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { 
  UploadCloud, 
  X, 
  Check, 
  AlertCircle, 
  Image as ImageIcon,
  Film,
  FileText,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion/tokens";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useMediaUpload } from "@/lib/hooks/useMediaUpload";
import type { UploadProgress, UploadOptions } from "@/lib/media/types";
import { toast } from "sonner";
import { ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES, MAX_IMAGE_SIZE, MAX_VIDEO_SIZE } from "@/lib/media/constants";

// ============================================================================
// Types
// ============================================================================

interface MediaUploaderProps {
  onUploadComplete?: () => void;
  options?: UploadOptions;
  className?: string;
  compact?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function MediaUploader({
  onUploadComplete,
  options = {},
  className,
  compact = false,
}: MediaUploaderProps) {
  const { uploads, isUploading, uploadFiles, cancelUpload, clearCompleted, clearAll } = useMediaUpload();
  const [isDragActive, setIsDragActive] = useState(false);

  // IMPORTANT:
  // We intentionally DO NOT pass `accept` to react-dropzone.
  // In some browser/library combos we’ve seen uncaught errors during accept parsing
  // (e.g. "Cannot read properties of undefined (reading 'length')"), which white-screens the app.
  // Instead we validate ourselves in `onDrop`.

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsDragActive(false);
    if (acceptedFiles.length === 0) return;

    const valid: File[] = [];
    const rejectedMessages: string[] = [];

    for (const f of acceptedFiles) {
      const isImage = f.type?.startsWith("image/");
      const isVideo = f.type?.startsWith("video/");

      if (isImage) {
        if (!ALLOWED_IMAGE_TYPES.includes(f.type)) {
          rejectedMessages.push(`${f.name}: unsupported image type (${f.type || "unknown"})`);
          continue;
        }
        if (f.size > MAX_IMAGE_SIZE) {
          rejectedMessages.push(`${f.name}: image too large (max ${Math.round(MAX_IMAGE_SIZE / 1024 / 1024)}MB)`);
          continue;
        }
      } else if (isVideo) {
        if (!ALLOWED_VIDEO_TYPES.includes(f.type)) {
          rejectedMessages.push(`${f.name}: unsupported video type (${f.type || "unknown"})`);
          continue;
        }
        if (f.size > MAX_VIDEO_SIZE) {
          rejectedMessages.push(`${f.name}: video too large (max ${Math.round(MAX_VIDEO_SIZE / 1024 / 1024)}MB)`);
          continue;
        }
      } else {
        rejectedMessages.push(`${f.name}: unsupported file type (${f.type || "unknown"})`);
        continue;
      }

      valid.push(f);
    }

    if (rejectedMessages.length > 0) {
      // Show one compact toast; details in console for now.
      toast.error(`Some files were rejected (${rejectedMessages.length}).`);
      console.warn("[MediaUploader] Rejected files:", rejectedMessages);
    }

    if (valid.length === 0) return;

    const assets = await uploadFiles(valid, options);
    if (assets.length > 0 && onUploadComplete) {
      onUploadComplete();
    }
  }, [uploadFiles, options, onUploadComplete]);

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    noClick: uploads.length > 0,
    // Allow up to MAX_VIDEO_SIZE here; we still validate per-type above.
    maxSize: MAX_VIDEO_SIZE,
  });

  const hasUploads = uploads.length > 0;
  const completedCount = uploads.filter(u => u.status === "completed").length;
  const errorCount = uploads.filter(u => u.status === "error").length;

  if (compact && !hasUploads) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={open}
        className={cn("gap-2", className)}
      >
        <UploadCloud className="w-4 h-4" />
        Upload
      </Button>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-lg transition-all cursor-pointer",
          isDragActive 
            ? "border-primary bg-primary/5" 
            : "border-border hover:border-primary/50 hover:bg-muted/50",
          hasUploads ? "p-4" : "p-8"
        )}
      >
        <input {...getInputProps()} />

        {!hasUploads ? (
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <UploadCloud className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-medium mb-1">
              {isDragActive ? "Drop files here" : "Upload media"}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Drag & drop images or videos, or click to select
            </p>
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                Images up to 20MB
              </span>
              <span className="flex items-center gap-1">
                <Film className="w-3 h-3" />
                Videos up to 500MB
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Upload summary */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">
                  {isUploading 
                    ? `Uploading ${uploads.length} files...` 
                    : `${completedCount} of ${uploads.length} uploaded`}
                </span>
                {errorCount > 0 && (
                  <span className="text-xs text-destructive">
                    {errorCount} failed
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!isUploading && (
                  <Button variant="ghost" size="sm" onClick={clearCompleted}>
                    Clear completed
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearAll}
                  className="text-destructive hover:text-destructive"
                >
                  Clear all
                </Button>
              </div>
            </div>

            {/* Upload items */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              <AnimatePresence mode="popLayout">
                {uploads.map((upload) => (
                  <UploadItem
                    key={upload.file.name}
                    upload={upload}
                    onCancel={() => cancelUpload(upload.file)}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Add more button */}
            {!isUploading && (
              <Button variant="outline" size="sm" onClick={open} className="w-full gap-2">
                <UploadCloud className="w-4 h-4" />
                Add more files
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Upload Item
// ============================================================================

function UploadItem({ 
  upload, 
  onCancel 
}: { 
  upload: UploadProgress; 
  onCancel: () => void;
}) {
  const { file, progress, status, error } = upload;
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");

  const Icon = isImage ? ImageIcon : isVideo ? Film : FileText;
  const StatusIcon = 
    status === "completed" ? Check :
    status === "error" ? AlertCircle :
    status === "uploading" || status === "processing" ? Loader2 :
    null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={spring.default}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg bg-muted/50",
        status === "error" && "bg-destructive/5"
      )}
    >
      {/* Thumbnail or icon */}
      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0 overflow-hidden">
        {isImage && status !== "pending" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={URL.createObjectURL(file)} 
            alt={file.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Icon className="w-5 h-5 text-muted-foreground" />
        )}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(file.size)}
          {status === "error" && error && (
            <span className="text-destructive ml-2">{error}</span>
          )}
          {status === "processing" && (
            <span className="text-primary ml-2">Processing...</span>
          )}
        </p>
        
        {/* Progress bar */}
        {(status === "uploading" || status === "processing") && (
          <Progress value={progress} className="h-1 mt-2" />
        )}
      </div>

      {/* Status icon / cancel */}
      <div className="shrink-0">
        {StatusIcon && (
          <StatusIcon 
            className={cn(
              "w-5 h-5",
              status === "completed" && "text-emerald-500",
              status === "error" && "text-destructive",
              (status === "uploading" || status === "processing") && "text-primary animate-spin"
            )} 
          />
        )}
        {(status === "pending" || status === "uploading") && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onCancel}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
