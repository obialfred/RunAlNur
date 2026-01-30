/**
 * AES-256-GCM encryption utilities for securely storing integration credentials
 * 
 * Usage:
 * - Set INTEGRATIONS_ENCRYPTION_KEY in environment (32-byte base64 string)
 * - Use encryptJson() to encrypt credential objects before storing in DB
 * - Use decryptJson() to decrypt credentials when reading from DB
 */

import { randomBytes, createCipheriv, createDecipheriv } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // GCM standard IV length
const AUTH_TAG_LENGTH = 16; // GCM auth tag length in bytes

/**
 * Get the encryption key from environment
 * @throws Error if key is not configured or invalid
 */
function getEncryptionKey(): Buffer {
  const keyBase64 = process.env.INTEGRATIONS_ENCRYPTION_KEY;
  
  if (!keyBase64) {
    throw new Error(
      "INTEGRATIONS_ENCRYPTION_KEY environment variable is not set. " +
      "Generate a 32-byte key: openssl rand -base64 32"
    );
  }

  const key = Buffer.from(keyBase64, "base64");
  
  if (key.length !== 32) {
    throw new Error(
      `INTEGRATIONS_ENCRYPTION_KEY must be exactly 32 bytes (got ${key.length}). ` +
      "Generate a valid key: openssl rand -base64 32"
    );
  }

  return key;
}

/**
 * Check if encryption is configured
 */
export function isEncryptionConfigured(): boolean {
  try {
    getEncryptionKey();
    return true;
  } catch {
    return false;
  }
}

/**
 * Encrypt a JSON object and return the ciphertext, IV, and auth tag
 * @param data The object to encrypt
 * @returns Object with encrypted data, IV, and auth tag (all base64)
 */
export function encryptJson<T extends object>(data: T): {
  ciphertext: string;
  iv: string;
  tag: string;
} {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const plaintext = JSON.stringify(data);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return {
    ciphertext: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

/**
 * Decrypt an encrypted JSON object
 * @param ciphertext Base64-encoded ciphertext
 * @param iv Base64-encoded initialization vector
 * @param tag Base64-encoded auth tag
 * @returns Decrypted object
 * @throws Error if decryption fails (wrong key, tampered data, etc.)
 */
export function decryptJson<T extends object>(
  ciphertext: string,
  iv: string,
  tag: string
): T {
  const key = getEncryptionKey();
  const ivBuffer = Buffer.from(iv, "base64");
  const tagBuffer = Buffer.from(tag, "base64");
  const encryptedBuffer = Buffer.from(ciphertext, "base64");

  const decipher = createDecipheriv(ALGORITHM, key, ivBuffer);
  decipher.setAuthTag(tagBuffer);

  const decrypted = Buffer.concat([
    decipher.update(encryptedBuffer),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString("utf8")) as T;
}

/**
 * Generate a new encryption key (for setup/documentation)
 * Call this once to generate INTEGRATIONS_ENCRYPTION_KEY
 */
export function generateEncryptionKey(): string {
  return randomBytes(32).toString("base64");
}

/**
 * Type for encrypted credentials stored in DB
 */
export interface EncryptedCredentials {
  ciphertext: string;
  iv: string;
  tag: string;
}

/**
 * Encrypt credentials into the format stored in user_integrations
 */
export function encryptCredentials<T extends object>(
  credentials: T
): { secret_enc: string; secret_iv: string; secret_tag: string } {
  const { ciphertext, iv, tag } = encryptJson(credentials);
  return {
    secret_enc: ciphertext,
    secret_iv: iv,
    secret_tag: tag,
  };
}

/**
 * Decrypt credentials from user_integrations row
 */
export function decryptCredentials<T extends object>(row: {
  secret_enc: string;
  secret_iv: string;
  secret_tag: string;
}): T {
  return decryptJson<T>(row.secret_enc, row.secret_iv, row.secret_tag);
}

/**
 * OAuth token credentials shape
 */
export interface OAuthCredentials {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  scope?: string;
}

/**
 * API key credentials shape
 */
export interface ApiKeyCredentials {
  api_key: string;
  api_secret?: string;
}

/**
 * Web Push subscription credentials shape
 */
export interface WebPushCredentials {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}
