"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, FileImage, FileText, File as FileIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion/tokens";

export interface AttachedFile {
  id: string;
  file: File;
  preview?: string;
  status: "pending" | "processing" | "ready" | "error";
  error?: string;
}

interface FileDropZoneProps {
  attachedFiles: AttachedFile[];
  onFilesAdded: (files: File[]) => void;
  onFileRemove: (id: string) => void;
  disabled?: boolean;
  maxFiles?: number;
  acceptedTypes?: string[];
  className?: string;
}

const DEFAULT_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
];

export function FileDropZone({
  attachedFiles,
  onFilesAdded,
  onFileRemove,
  disabled = false,
  maxFiles = 5,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  className,
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounterRef.current = 0;

      if (disabled) return;

      const droppedFiles = Array.from(e.dataTransfer.files);
      const validFiles = droppedFiles.filter(
        (file) =>
          acceptedTypes.includes(file.type) &&
          attachedFiles.length + droppedFiles.indexOf(file) < maxFiles
      );

      if (validFiles.length > 0) {
        onFilesAdded(validFiles);
      }
    },
    [disabled, acceptedTypes, attachedFiles.length, maxFiles, onFilesAdded]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;

      const selectedFiles = Array.from(e.target.files || []);
      const validFiles = selectedFiles.filter(
        (file) =>
          acceptedTypes.includes(file.type) &&
          attachedFiles.length + selectedFiles.indexOf(file) < maxFiles
      );

      if (validFiles.length > 0) {
        onFilesAdded(validFiles);
      }

      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [disabled, acceptedTypes, attachedFiles.length, maxFiles, onFilesAdded]
  );

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <FileImage className="w-4 h-4" />;
    }
    if (file.type === "application/pdf") {
      return <FileText className="w-4 h-4" />;
    }
    return <FileIcon className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          "relative border-2 border-dashed rounded-md p-4 transition-colors cursor-pointer",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-muted-foreground/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(",")}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center gap-2 text-center">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
              isDragging ? "bg-primary/10" : "bg-muted"
            )}
          >
            <Upload
              className={cn(
                "w-5 h-5 transition-colors",
                isDragging ? "text-primary" : "text-muted-foreground"
              )}
            />
          </div>
          <div>
            <p className="text-xs font-medium">
              {isDragging ? "Drop files here" : "Drag & drop files or click to browse"}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Images and PDFs up to {maxFiles} files
            </p>
          </div>
        </div>

        {/* Drag overlay */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-primary/5 rounded-md flex items-center justify-center"
            >
              <p className="text-sm font-medium text-primary">Drop to upload</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Attached Files Preview */}
      <AnimatePresence mode="popLayout">
        {attachedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1"
          >
            {attachedFiles.map((attachment) => (
              <motion.div
                key={attachment.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={spring.snappy}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-md bg-muted/50",
                  attachment.status === "error" && "bg-destructive/10"
                )}
              >
                {/* Preview or Icon */}
                {attachment.preview ? (
                  <img
                    src={attachment.preview}
                    alt={attachment.file.name}
                    className="w-8 h-8 rounded object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                    {getFileIcon(attachment.file)}
                  </div>
                )}

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">
                    {attachment.file.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatFileSize(attachment.file.size)}
                    {attachment.status === "processing" && " • Processing..."}
                    {attachment.status === "error" && ` • ${attachment.error}`}
                  </p>
                </div>

                {/* Status / Actions */}
                {attachment.status === "processing" ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFileRemove(attachment.id);
                    }}
                    className="p-1 hover:bg-muted rounded transition-colors"
                  >
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Compact version for inline use
export function FileAttachButton({
  onFilesAdded,
  disabled = false,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
}: {
  onFilesAdded: (files: File[]) => void;
  disabled?: boolean;
  acceptedTypes?: string[];
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;

    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter((file) =>
      acceptedTypes.includes(file.type)
    );

    if (validFiles.length > 0) {
      onFilesAdded(validFiles);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(",")}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className={cn(
          "p-2 rounded-md transition-colors",
          "hover:bg-muted text-muted-foreground hover:text-foreground",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        title="Attach files"
      >
        <Upload className="w-4 h-4" />
      </button>
    </>
  );
}
