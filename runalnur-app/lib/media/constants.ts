/**
 * Media Constants - Client-safe exports
 * 
 * These constants can be imported on both client and server.
 * Server-only code (AWS SDK) lives in storage.ts
 */

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
];

export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
];

export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
export const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB
export const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB

export function isImageMime(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

export function isVideoMime(mimeType: string): boolean {
  return mimeType.startsWith("video/");
}

export function getFileTypeFromMime(mimeType: string): "image" | "video" | "audio" | "document" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "document";
}

export function validateFileUpload(
  mimeType: string,
  fileSize: number
): { valid: boolean; error?: string } {
  const isImage = isImageMime(mimeType);
  const isVideo = isVideoMime(mimeType);
  
  // Check allowed types
  const allAllowed = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES, ...ALLOWED_DOCUMENT_TYPES];
  if (!allAllowed.includes(mimeType)) {
    return { valid: false, error: `File type ${mimeType} is not allowed` };
  }
  
  // Check size limits
  if (isImage && fileSize > MAX_IMAGE_SIZE) {
    return { valid: false, error: `Image must be less than ${MAX_IMAGE_SIZE / 1024 / 1024}MB` };
  }
  
  if (isVideo && fileSize > MAX_VIDEO_SIZE) {
    return { valid: false, error: `Video must be less than ${MAX_VIDEO_SIZE / 1024 / 1024}MB` };
  }
  
  if (fileSize > MAX_FILE_SIZE) {
    return { valid: false, error: `File must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB` };
  }
  
  return { valid: true };
}
