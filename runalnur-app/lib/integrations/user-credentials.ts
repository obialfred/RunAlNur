/**
 * User Integration Credentials Management
 * 
 * Handles storing, retrieving, and managing per-user integration credentials
 * in Supabase with encryption.
 */

import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  encryptCredentials,
  decryptCredentials,
  isEncryptionConfigured,
  OAuthCredentials,
  ApiKeyCredentials,
} from "@/lib/security/crypto";

// Supported integration providers
export type IntegrationProvider =
  | "clickup"
  | "hubspot"
  | "process_street"
  | "guru"
  | "openai"
  | "anthropic"
  | "gemini"
  | "webpush";

// Integration credential types
export type IntegrationKind = "oauth" | "api_key";

// Database row shape
interface UserIntegrationRow {
  id: string;
  tenant_id: string;
  user_id: string;
  provider: IntegrationProvider;
  kind: IntegrationKind;
  secret_enc: string;
  secret_iv: string;
  secret_tag: string;
  expires_at: string | null;
  scopes: string[] | null;
  metadata: Record<string, unknown> | null;
  connected_at: string;
  revoked_at: string | null;
  updated_at: string;
}

// Connection status response
export interface IntegrationStatus {
  connected: boolean;
  provider: IntegrationProvider;
  kind?: IntegrationKind;
  expiresAt?: string | null;
  scopes?: string[] | null;
  metadata?: Record<string, unknown> | null;
  connectedAt?: string;
  error?: string;
}

// Generic credentials type
export type IntegrationCredentials = OAuthCredentials | ApiKeyCredentials;

/**
 * Get the current user's integration credentials for a provider
 * @param userId The authenticated user's ID
 * @param provider The integration provider
 * @returns Decrypted credentials or null if not connected
 */
export async function getUserCredentials<T extends IntegrationCredentials>(
  tenantId: string,
  userId: string,
  provider: IntegrationProvider
): Promise<{ credentials: T; metadata?: Record<string, unknown> } | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error("Database not configured");
  }

  if (!isEncryptionConfigured()) {
    // No encryption key = can't decrypt stored credentials.
    // In production we hard-fail so integrations never silently "look connected".
    if (process.env.NODE_ENV === "production") {
      throw new Error("Encryption not configured");
    }
    return null;
  }

  // Cast to any since user_integrations may not be in generated types
  const { data, error } = await (supabase as any)
    .from("user_integrations")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .eq("provider", provider)
    .is("revoked_at", null)
    .single();

  if (error || !data) {
    return null;
  }

  const row = data as unknown as UserIntegrationRow;

  try {
    const credentials = decryptCredentials<T>({
      secret_enc: row.secret_enc,
      secret_iv: row.secret_iv,
      secret_tag: row.secret_tag,
    });

    return {
      credentials,
      metadata: row.metadata || undefined,
    };
  } catch (decryptError) {
    console.error(`Failed to decrypt ${provider} credentials:`, decryptError);
    return null;
  }
}

/**
 * Store or update user's integration credentials
 * @param userId The authenticated user's ID
 * @param provider The integration provider
 * @param kind The credential type (oauth or api_key)
 * @param credentials The credentials to encrypt and store
 * @param options Additional options (metadata, scopes, expires_at)
 */
export async function saveUserCredentials<T extends IntegrationCredentials>(
  tenantId: string,
  userId: string,
  provider: IntegrationProvider,
  kind: IntegrationKind,
  credentials: T,
  options?: {
    metadata?: Record<string, unknown>;
    scopes?: string[];
    expiresAt?: Date;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { success: false, error: "Database not configured" };
  }

  if (!isEncryptionConfigured()) {
    return { success: false, error: "Encryption not configured" };
  }

  try {
    const encrypted = encryptCredentials(credentials);

    const row = {
      tenant_id: tenantId,
      user_id: userId,
      provider,
      kind,
      ...encrypted,
      expires_at: options?.expiresAt?.toISOString() || null,
      scopes: options?.scopes || null,
      metadata: options?.metadata || null,
      connected_at: new Date().toISOString(),
      revoked_at: null,
      updated_at: new Date().toISOString(),
    };

    // Upsert: insert or update existing row
    // Cast to any since user_integrations may not be in generated types
    const { error } = await (supabase as any)
      .from("user_integrations")
      .upsert(row, {
        onConflict: "tenant_id,user_id,provider",
      });

    if (error) {
      console.error(`Failed to save ${provider} credentials:`, error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error(`Error saving ${provider} credentials:`, err);
    return { success: false, error: String(err) };
  }
}

/**
 * Disconnect (revoke) user's integration
 * Soft delete: sets revoked_at timestamp
 */
export async function disconnectIntegration(
  tenantId: string,
  userId: string,
  provider: IntegrationProvider
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { success: false, error: "Database not configured" };
  }

  // Cast to any since user_integrations may not be in generated types
  const { error } = await (supabase as any)
    .from("user_integrations")
    .update({ revoked_at: new Date().toISOString() })
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .eq("provider", provider);

  if (error) {
    console.error(`Failed to disconnect ${provider}:`, error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get connection status for a provider
 */
export async function getIntegrationStatus(
  tenantId: string,
  userId: string,
  provider: IntegrationProvider
): Promise<IntegrationStatus> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { connected: false, provider, error: "Database not configured" };
  }

  // Cast to any since user_integrations may not be in generated types
  const { data, error } = await (supabase as any)
    .from("user_integrations")
    .select("kind, expires_at, scopes, metadata, connected_at")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .eq("provider", provider)
    .is("revoked_at", null)
    .single();

  if (error || !data) {
    return { connected: false, provider };
  }

  const row = data as {
    kind: IntegrationKind;
    expires_at: string | null;
    scopes: string[] | null;
    metadata: Record<string, unknown> | null;
    connected_at: string;
  };

  // Check if OAuth token is expired
  if (row.expires_at) {
    const expiresAt = new Date(row.expires_at);
    if (expiresAt < new Date()) {
      return {
        connected: false,
        provider,
        error: "Token expired - reconnect required",
      };
    }
  }

  return {
    connected: true,
    provider,
    kind: row.kind,
    expiresAt: row.expires_at,
    scopes: row.scopes,
    metadata: row.metadata,
    connectedAt: row.connected_at,
  };
}

/**
 * Get all connected integrations for a user
 */
export async function getAllUserIntegrations(
  tenantId: string,
  userId: string
): Promise<IntegrationStatus[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return [];
  }

  // Cast to any since user_integrations may not be in generated types
  const { data, error } = await (supabase as any)
    .from("user_integrations")
    .select("provider, kind, expires_at, scopes, metadata, connected_at")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .is("revoked_at", null);

  if (error || !data) {
    return [];
  }

  return (data as {
    provider: IntegrationProvider;
    kind: IntegrationKind;
    expires_at: string | null;
    scopes: string[] | null;
    metadata: Record<string, unknown> | null;
    connected_at: string;
  }[]).map((row) => ({
    connected: true,
    provider: row.provider,
    kind: row.kind,
    expiresAt: row.expires_at,
    scopes: row.scopes,
    metadata: row.metadata,
    connectedAt: row.connected_at,
  }));
}

/**
 * Helper to get OAuth access token for a provider
 * Handles token refresh if needed (returns current token if not expired)
 */
export async function getOAuthAccessToken(
  tenantId: string,
  userId: string,
  provider: IntegrationProvider
): Promise<string | null> {
  const result = await getUserCredentials<OAuthCredentials>(tenantId, userId, provider);
  
  if (!result) {
    return null;
  }

  // TODO: Add token refresh logic here for providers that support it
  // For now, just return the stored access token
  return result.credentials.access_token;
}

/**
 * Helper to get API key for a provider
 */
export async function getApiKey(
  tenantId: string,
  userId: string,
  provider: IntegrationProvider
): Promise<string | null> {
  const result = await getUserCredentials<ApiKeyCredentials>(tenantId, userId, provider);
  
  if (!result) {
    return null;
  }

  return result.credentials.api_key;
}
