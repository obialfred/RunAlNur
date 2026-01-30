/**
 * Sync Engine - Handles bidirectional synchronization between
 * local IndexedDB and remote Supabase
 */

import { db, generateId, now, type SyncMeta } from './local';
import { supabase } from '../supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Sync status types
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

// Sync event types
export type SyncEvent = 
  | { type: 'status_change'; status: SyncStatus }
  | { type: 'sync_complete'; table: string; count: number }
  | { type: 'sync_error'; table: string; error: string }
  | { type: 'conflict'; table: string; localData: unknown; remoteData: unknown }
  | { type: 'online' }
  | { type: 'offline' };

type SyncEventListener = (event: SyncEvent) => void;

// Tables that can be synced
export const SYNCABLE_TABLES = [
  'arms',
  'projects',
  'contacts',
  'tasks',
  'activities',
  'notifications',
  'sops',
  'sop_runs',
  'properties',
  'deals',
  'vendors',
] as const;

export type SyncableTable = typeof SYNCABLE_TABLES[number];

class SyncEngine {
  private status: SyncStatus = 'idle';
  private listeners: Set<SyncEventListener> = new Set();
  private realtimeChannels: Map<string, RealtimeChannel> = new Map();
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private lastSyncTimestamps: Map<string, string> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  // Subscribe to sync events
  subscribe(listener: SyncEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: SyncEvent): void {
    this.listeners.forEach(listener => listener(event));
  }

  private setStatus(status: SyncStatus): void {
    this.status = status;
    this.emit({ type: 'status_change', status });
  }

  getStatus(): SyncStatus {
    return this.status;
  }

  isConnected(): boolean {
    return this.isOnline;
  }

  private handleOnline = async (): Promise<void> => {
    this.isOnline = true;
    this.emit({ type: 'online' });
    // Sync pending changes when coming back online
    await this.syncPendingChanges();
  };

  private handleOffline = (): void => {
    this.isOnline = false;
    this.emit({ type: 'offline' });
    this.setStatus('offline');
  };

  // Queue a change for syncing
  async queueChange(
    table: SyncableTable,
    operation: 'create' | 'update' | 'delete',
    data: Record<string, unknown>
  ): Promise<void> {
    const syncMeta: SyncMeta = {
      id: generateId(),
      table,
      operation,
      data,
      timestamp: Date.now(),
      synced: false,
      retries: 0,
    };

    await db.sync_queue.add(syncMeta);

    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncPendingChanges();
    }
  }

  // Sync all pending changes to Supabase
  async syncPendingChanges(): Promise<void> {
    if (!this.isOnline || this.status === 'syncing') return;

    this.setStatus('syncing');

    try {
      const pendingChanges = await db.sync_queue
        .where('synced')
        .equals(0)
        .sortBy('timestamp');

      for (const change of pendingChanges) {
        await this.syncSingleChange(change);
      }

      // Clean up synced items
      await db.sync_queue.where('synced').equals(1).delete();

      this.setStatus('idle');
    } catch (error) {
      console.error('Sync failed:', error);
      this.setStatus('error');
    }
  }

  private async syncSingleChange(change: SyncMeta): Promise<void> {
    const { table, operation, data, id } = change;

    try {
      let result;

      switch (operation) {
        case 'create':
          result = await supabase.from(table).insert(this.cleanSyncFields(data));
          break;
        case 'update':
          result = await supabase
            .from(table)
            .update(this.cleanSyncFields(data))
            .eq('id', data.id);
          break;
        case 'delete':
          result = await supabase.from(table).delete().eq('id', data.id);
          break;
      }

      if (result?.error) {
        throw result.error;
      }

      // Mark as synced
      await db.sync_queue.update(id, { synced: true });
      
      // Update local record as synced
      const localTable = db.table(table);
      if (operation !== 'delete' && data.id) {
        await localTable.update(data.id as string, { _synced: true });
      }

      this.emit({ type: 'sync_complete', table, count: 1 });
    } catch (error) {
      console.error(`Failed to sync ${operation} on ${table}:`, error);
      
      // Increment retry count
      await db.sync_queue.update(id, { 
        retries: change.retries + 1,
        synced: change.retries >= 3 // Give up after 3 retries
      });

      this.emit({ 
        type: 'sync_error', 
        table, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  // Remove sync metadata fields before sending to Supabase
  private cleanSyncFields(data: Record<string, unknown>): Record<string, unknown> {
    const cleaned = { ...data };
    delete cleaned._synced;
    delete cleaned._deleted;
    return cleaned;
  }

  // Pull latest data from Supabase for a table
  async pullFromRemote(table: SyncableTable): Promise<void> {
    if (!this.isOnline) return;

    try {
      const lastSync = this.lastSyncTimestamps.get(table);
      let query = supabase.from(table).select('*');

      // Only get records updated since last sync
      if (lastSync) {
        query = query.gte('updated_at', lastSync);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data && data.length > 0) {
        const localTable = db.table(table);
        
        for (const record of data) {
          const existing = await localTable.get(record.id);
          
          if (existing) {
            // Check for conflicts
            if (!existing._synced && existing.updated_at !== record.updated_at) {
              this.emit({
                type: 'conflict',
                table,
                localData: existing,
                remoteData: record,
              });
              // For now, remote wins (last-write-wins)
            }
            await localTable.update(record.id, { ...record, _synced: true });
          } else {
            await localTable.add({ ...record, _synced: true });
          }
        }

        this.lastSyncTimestamps.set(table, now());
      }
    } catch (error) {
      console.error(`Failed to pull ${table}:`, error);
      this.emit({
        type: 'sync_error',
        table,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Full sync - pull all tables
  async fullSync(): Promise<void> {
    if (!this.isOnline) return;

    this.setStatus('syncing');

    try {
      // First, push pending changes
      await this.syncPendingChanges();

      // Then pull latest from all tables
      for (const table of SYNCABLE_TABLES) {
        await this.pullFromRemote(table);
      }

      this.setStatus('idle');
    } catch (error) {
      console.error('Full sync failed:', error);
      this.setStatus('error');
    }
  }

  // Set up real-time subscriptions
  setupRealtimeSync(): void {
    // If Supabase isn't configured (or realtime isn't available), skip realtime setup.
    // This prevents runtime crashes in "no Supabase" demo mode.
    if (typeof (supabase as any)?.channel !== "function") {
      return;
    }

    // Subscribe to changes on all syncable tables
    for (const table of SYNCABLE_TABLES) {
      const channel = supabase
        .channel(`${table}_changes`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
          },
          async (payload) => {
            await this.handleRealtimeChange(table, payload);
          }
        )
        .subscribe();

      this.realtimeChannels.set(table, channel);
    }
  }

  private async handleRealtimeChange(
    table: string,
    payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }
  ): Promise<void> {
    const localTable = db.table(table);

    switch (payload.eventType) {
      case 'INSERT':
        const existing = await localTable.get(payload.new.id as string);
        if (!existing) {
          await localTable.add({ ...payload.new, _synced: true });
        }
        break;

      case 'UPDATE':
        await localTable.update(payload.new.id as string, { 
          ...payload.new, 
          _synced: true 
        });
        break;

      case 'DELETE':
        await localTable.delete(payload.old.id as string);
        break;
    }
  }

  // Clean up subscriptions
  cleanup(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }

    if (typeof (supabase as any)?.removeChannel === "function") {
      for (const channel of this.realtimeChannels.values()) {
        supabase.removeChannel(channel);
      }
    }
    this.realtimeChannels.clear();

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Start periodic sync (every 30 seconds)
  startPeriodicSync(intervalMs: number = 30000): void {
    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.status === 'idle') {
        this.syncPendingChanges();
      }
    }, intervalMs);
  }

  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

// Singleton instance
export const syncEngine = new SyncEngine();

// Initialize sync on module load (client-side only)
if (typeof window !== 'undefined') {
  // This engine is noisy (and opens a Supabase realtime websocket). Keep it OFF by default
  // unless explicitly enabled via env flag.
  const enableOfflineSync = process.env.NEXT_PUBLIC_ENABLE_OFFLINE_SYNC === "true";
  if (enableOfflineSync) {
    // Set up realtime subscriptions after a short delay to ensure DB is ready
    setTimeout(() => {
      syncEngine.setupRealtimeSync();
      syncEngine.startPeriodicSync();
    }, 1000);
  }
}
