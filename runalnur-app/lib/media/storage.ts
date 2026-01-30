/**
 * Dynasty Media Storage - R2 + Supabase Storage abstraction
 * 
 * Uses Cloudflare R2 when configured, falls back to Supabase Storage.
 * Provides unified API for uploads, presigned URLs, and file management.
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { StorageProvider, PresignedUploadUrl } from "./types";

// Re-export client-safe constants for backward compatibility
export {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  MAX_FILE_SIZE,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
  isImageMime,
  isVideoMime,
  getFileTypeFromMime,
  validateFileUpload,
} from "./constants";

// ============================================================================
// CONFIGURATION
// ============================================================================

const R2_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
const R2_ACCESS_KEY = process.env.CLOUDFLARE_R2_ACCESS_KEY?.trim();
const R2_SECRET_KEY = process.env.CLOUDFLARE_R2_SECRET_KEY?.trim();
const R2_BUCKET = (process.env.CLOUDFLARE_R2_BUCKET || "runalnur-media").trim();
const R2_ENDPOINT = process.env.CLOUDFLARE_R2_ENDPOINT?.trim(); // e.g., https://<accountid>.r2.cloudflarestorage.com
const R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL?.trim(); // e.g., https://media.runalnur.com

// Check if R2 is configured
export function isR2Configured(): boolean {
  return Boolean(R2_ACCOUNT_ID && R2_ACCESS_KEY && R2_SECRET_KEY);
}

export function isR2PublicUrlConfigured(): boolean {
  return Boolean(R2_PUBLIC_URL);
}

// Get the active storage provider
export function getStorageProvider(): StorageProvider {
  return isR2Configured() ? "r2" : "supabase";
}

// ============================================================================
// R2 CLIENT
// ============================================================================

let r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (!r2Client) {
    if (!isR2Configured()) {
      throw new Error("Cloudflare R2 is not configured");
    }
    
    r2Client = new S3Client({
      region: "auto",
      endpoint: R2_ENDPOINT || `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY!,
        secretAccessKey: R2_SECRET_KEY!,
      },
    });
  }
  return r2Client;
}

// ============================================================================
// BUCKET STRUCTURE
// ============================================================================

/**
 * Generate storage path for a media file
 * Structure: {type}/{user_id}/{year}/{month}/{uuid}.{ext}
 */
export function generateStoragePath(
  userId: string,
  fileName: string,
  type: "originals" | "thumbnails" | "previews" | "processed" = "originals"
): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const uuid = crypto.randomUUID();
  const ext = fileName.split(".").pop()?.toLowerCase() || "bin";
  
  return `${type}/${userId}/${year}/${month}/${uuid}.${ext}`;
}

// ============================================================================
// PRESIGNED UPLOAD URLs
// ============================================================================

/**
 * Generate a presigned URL for direct browser upload
 */
export async function createPresignedUploadUrl(
  userId: string,
  fileName: string,
  contentType: string,
  expiresInSeconds = 3600
): Promise<PresignedUploadUrl> {
  const path = generateStoragePath(userId, fileName, "originals");
  const provider = getStorageProvider();
  
  if (provider === "r2") {
    return createR2PresignedUrl(path, contentType, expiresInSeconds);
  } else {
    return createSupabasePresignedUrl(userId, path, contentType);
  }
}

async function createR2PresignedUrl(
  path: string,
  contentType: string,
  expiresInSeconds: number
): Promise<PresignedUploadUrl> {
  const client = getR2Client();
  
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: path,
    ContentType: contentType,
  });
  
  const url = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  
  return {
    url,
    fields: {}, // S3/R2 presigned PUT doesn't use form fields
    path,
    expires_at: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
  };
}

async function createSupabasePresignedUrl(
  userId: string,
  path: string,
  contentType: string
): Promise<PresignedUploadUrl> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error("Supabase not configured");
  }
  
  const { data, error } = await supabase.storage
    .from("media")
    .createSignedUploadUrl(path);
  
  if (error) {
    throw new Error(`Failed to create upload URL: ${error.message}`);
  }
  
  return {
    url: data.signedUrl,
    fields: {},
    path: data.path,
    expires_at: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour default
  };
}

// ============================================================================
// FILE OPERATIONS
// ============================================================================

/**
 * Delete a file from storage
 */
export async function deleteFile(path: string): Promise<void> {
  const provider = getStorageProvider();
  
  if (provider === "r2") {
    const client = getR2Client();
    await client.send(new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: path,
    }));
  } else {
    const supabase = getSupabaseAdmin();
    if (!supabase) throw new Error("Supabase not configured");
    
    const { error } = await supabase.storage.from("media").remove([path]);
    if (error) throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Get public URL for a file
 */
export function getPublicUrl(path: string): string {
  const provider = getStorageProvider();
  
  if (provider === "r2") {
    if (!R2_PUBLIC_URL) {
      // R2 bucket may be private; use createSignedReadUrl() instead for client access.
      // This function is synchronous; callers needing a client-usable URL should not use it for private R2.
      return path;
    }
    return `${R2_PUBLIC_URL}/${path}`;
  } else {
    // Supabase public URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return `${supabaseUrl}/storage/v1/object/public/media/${path}`;
  }
}

/**
 * Get a client-usable URL for reading an object.
 * - R2: public URL if configured, otherwise a short-lived signed URL
 * - Supabase: public URL
 */
export async function getClientReadUrl(path: string, expiresInSeconds = 3600): Promise<string> {
  const provider = getStorageProvider();
  if (provider === "r2") {
    if (R2_PUBLIC_URL) return `${R2_PUBLIC_URL}/${path}`;
    return await createSignedReadUrl(path, expiresInSeconds);
  }
  return getPublicUrl(path);
}

/**
 * Generate a signed URL for private file access
 */
export async function createSignedReadUrl(
  path: string,
  expiresInSeconds = 3600
): Promise<string> {
  const provider = getStorageProvider();
  
  if (provider === "r2") {
    const client = getR2Client();
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: path,
    });
    return await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  } else {
    const supabase = getSupabaseAdmin();
    if (!supabase) throw new Error("Supabase not configured");
    
    const { data, error } = await supabase.storage
      .from("media")
      .createSignedUrl(path, expiresInSeconds);
    
    if (error) throw new Error(`Failed to create signed URL: ${error.message}`);
    return data.signedUrl;
  }
}

// ============================================================================
// UPLOAD HELPERS
// ============================================================================

/**
 * Upload a buffer directly to storage (for server-side processing)
 */
export async function uploadBuffer(
  buffer: Buffer,
  path: string,
  contentType: string
): Promise<string> {
  const provider = getStorageProvider();
  
  if (provider === "r2") {
    const client = getR2Client();
    await client.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: path,
      Body: buffer,
      ContentType: contentType,
    }));
    return getPublicUrl(path);
  } else {
    const supabase = getSupabaseAdmin();
    if (!supabase) throw new Error("Supabase not configured");
    
    const { error } = await supabase.storage
      .from("media")
      .upload(path, buffer, { contentType, upsert: true });
    
    if (error) throw new Error(`Failed to upload: ${error.message}`);
    return getPublicUrl(path);
  }
}

// ============================================================================
// IMAGE PROCESSING PATHS
// ============================================================================

/**
 * Get derived paths for thumbnails and previews
 */
export function getDerivedPaths(originalPath: string): {
  thumbnail: string;
  preview: string;
} {
  // Replace "originals" with derived folder
  const thumbnail = originalPath.replace("/originals/", "/thumbnails/");
  const preview = originalPath.replace("/originals/", "/previews/");
  
  return { thumbnail, preview };
}

// MIME TYPE HELPERS are now in ./constants.ts and re-exported above
