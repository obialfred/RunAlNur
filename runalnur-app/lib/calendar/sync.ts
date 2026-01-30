/**
 * Calendar Sync Service
 * 
 * Handles bidirectional sync between Dynasty OS and Google Calendar
 */

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { 
  createCalendarClient, 
  refreshAccessToken, 
  focusBlockToGoogleEvent,
  type GoogleCalendarEvent 
} from "./google";
import { FocusBlock } from "./types";

// ============================================================================
// TYPES
// ============================================================================

interface SyncConfig {
  user_id: string;
  google_calendar_enabled: boolean;
  google_calendar_id?: string;
  google_access_token_enc?: string;
  google_refresh_token_enc?: string;
  google_token_expires_at?: string;
  sync_focus_blocks: boolean;
  context_colors: Record<string, string>;
}

interface SyncResult {
  success: boolean;
  synced: number;
  errors: string[];
}

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

async function getValidAccessToken(config: SyncConfig): Promise<string | null> {
  if (!config.google_access_token_enc || !config.google_refresh_token_enc) {
    return null;
  }

  // Check if token is expired
  if (config.google_token_expires_at) {
    const expiresAt = new Date(config.google_token_expires_at);
    const now = new Date();
    
    // Refresh if token expires in less than 5 minutes
    if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
      try {
        const newTokens = await refreshAccessToken(config.google_refresh_token_enc);
        
        // Update tokens in database
        const supabase = getSupabaseAdmin();
        if (supabase) {
          const updateData = {
            google_access_token_enc: newTokens.accessToken,
            google_token_expires_at: newTokens.expiresAt.toISOString(),
          };
          await supabase
            .from("calendar_sync_config")
            .update(updateData as never)
            .eq("user_id", config.user_id);
        }
        
        return newTokens.accessToken;
      } catch (error) {
        console.error("Failed to refresh token:", error);
        return null;
      }
    }
  }

  return config.google_access_token_enc;
}

// ============================================================================
// SYNC FUNCTIONS
// ============================================================================

/**
 * Sync a single focus block to Google Calendar
 */
export async function syncBlockToGoogle(
  block: FocusBlock,
  config: SyncConfig
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  if (!config.google_calendar_enabled || !config.sync_focus_blocks) {
    return { success: false, error: "Google Calendar sync not enabled" };
  }

  const accessToken = await getValidAccessToken(config);
  if (!accessToken) {
    return { success: false, error: "No valid access token" };
  }

  const calendarId = config.google_calendar_id || "primary";
  const client = createCalendarClient(accessToken);

  try {
    const googleEvent = focusBlockToGoogleEvent(block);

    if (block.google_event_id) {
      // Update existing event
      const updated = await client.updateEvent(calendarId, block.google_event_id, googleEvent);
      return { success: true, eventId: updated.id };
    } else {
      // Create new event
      const created = await client.createEvent(calendarId, googleEvent);
      return { success: true, eventId: created.id };
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Delete a focus block from Google Calendar
 */
export async function deleteBlockFromGoogle(
  block: FocusBlock,
  config: SyncConfig
): Promise<{ success: boolean; error?: string }> {
  if (!config.google_calendar_enabled || !block.google_event_id) {
    return { success: true }; // Nothing to delete
  }

  const accessToken = await getValidAccessToken(config);
  if (!accessToken) {
    return { success: false, error: "No valid access token" };
  }

  const calendarId = config.google_calendar_id || "primary";
  const client = createCalendarClient(accessToken);

  try {
    await client.deleteEvent(calendarId, block.google_event_id);
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Sync all pending blocks for a user
 */
export async function syncAllBlocks(userId: string): Promise<SyncResult> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { success: false, synced: 0, errors: ["Database not configured"] };
  }

  // Get user's sync config
  const { data: configData } = await supabase
    .from("calendar_sync_config")
    .select("*")
    .eq("user_id", userId)
    .single();

  const config = configData as SyncConfig | null;

  if (!config?.google_calendar_enabled) {
    return { success: false, synced: 0, errors: ["Calendar sync not enabled"] };
  }

  // Get blocks that need syncing
  const { data: blocksData } = await supabase
    .from("focus_blocks")
    .select("*")
    .eq("user_id", userId)
    .in("sync_status", ["pending", "error"]);

  const blocks = (blocksData || []) as unknown as FocusBlock[];

  if (blocks.length === 0) {
    return { success: true, synced: 0, errors: [] };
  }

  const errors: string[] = [];
  let synced = 0;

  for (const block of blocks) {
    const result = await syncBlockToGoogle(block, config as SyncConfig);
    
    if (result.success && result.eventId) {
      // Update block with Google event ID and sync status
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("focus_blocks")
        .update({
          google_event_id: result.eventId,
          sync_status: "synced",
          last_synced_at: new Date().toISOString(),
        })
        .eq("id", block.id);
      synced++;
    } else {
      // Mark as error
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("focus_blocks")
        .update({ sync_status: "error" })
        .eq("id", block.id);
      errors.push(`Block ${block.id}: ${result.error}`);
    }
  }

  // Update last sync time
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("calendar_sync_config")
    .update({ last_sync_at: new Date().toISOString() })
    .eq("user_id", userId);

  return {
    success: errors.length === 0,
    synced,
    errors,
  };
}

/**
 * Get user's sync configuration
 */
export async function getSyncConfig(userId: string): Promise<SyncConfig | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data } = await supabase
    .from("calendar_sync_config")
    .select("*")
    .eq("user_id", userId)
    .single();

  return data as SyncConfig | null;
}

/**
 * Update user's sync configuration
 */
export async function updateSyncConfig(
  userId: string,
  updates: Partial<SyncConfig>
): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("calendar_sync_config")
    .upsert({
      user_id: userId,
      ...updates,
    }, {
      onConflict: "user_id",
    });

  return !error;
}
