/**
 * useOfflineFirst - React hook for offline-first data access
 * 
 * Provides:
 * - Automatic local caching via IndexedDB
 * - Background sync to Supabase
 * - Optimistic updates for instant UI
 * - Conflict resolution
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, generateId, now, type RunAlNurDB } from '../db/local';
import { syncEngine, type SyncStatus, type SyncableTable } from '../db/sync';
import type { Table, IndexableType } from 'dexie';

// Generic type for table records
type TableRecord = {
  id: string;
  created_at: string;
  updated_at?: string;
  _synced?: boolean;
  _deleted?: boolean;
};

// Options for the hook
interface UseOfflineFirstOptions<T> {
  // Filter function for query
  filter?: (item: T) => boolean;
  // Sort function
  sortBy?: keyof T;
  sortDesc?: boolean;
  // Limit results
  limit?: number;
  // Whether to include soft-deleted items
  includeDeleted?: boolean;
}

// Return type for the hook
interface UseOfflineFirstReturn<T> {
  // Data
  data: T[];
  // Loading state
  loading: boolean;
  // Error state
  error: Error | null;
  // Sync status
  syncStatus: SyncStatus;
  // Number of pending changes
  pendingCount: number;
  // Is currently online
  isOnline: boolean;
  // CRUD operations
  create: (item: Omit<T, 'id' | 'created_at' | 'updated_at' | '_synced' | '_deleted'>) => Promise<T>;
  update: (id: string, updates: Partial<T>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  // Manual sync
  refresh: () => Promise<void>;
  // Get single item
  getById: (id: string) => Promise<T | undefined>;
}

// Map table names to their Dexie table
function getTable(tableName: SyncableTable): Table {
  return db.table(tableName);
}

export function useOfflineFirst<T extends TableRecord>(
  tableName: SyncableTable,
  options: UseOfflineFirstOptions<T> = {}
): UseOfflineFirstReturn<T> {
  const { filter, sortBy, sortDesc = false, limit, includeDeleted = false } = options;
  
  const [error, setError] = useState<Error | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  
  const mountedRef = useRef(true);

  // Live query from IndexedDB
  const rawData = useLiveQuery(
    async () => {
      try {
        const table = getTable(tableName);
        let collection = table.toCollection();
        
        // Filter out soft-deleted items unless requested
        if (!includeDeleted) {
          collection = table.filter(item => !(item as T)._deleted);
        }
        
        let results = await collection.toArray() as T[];
        
        // Apply custom filter
        if (filter) {
          results = results.filter(filter);
        }
        
        // Sort
        if (sortBy) {
          results.sort((a, b) => {
            const aVal = a[sortBy];
            const bVal = b[sortBy];
            if (aVal < bVal) return sortDesc ? 1 : -1;
            if (aVal > bVal) return sortDesc ? -1 : 1;
            return 0;
          });
        }
        
        // Limit
        if (limit) {
          results = results.slice(0, limit);
        }
        
        return results;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to query local database'));
        return [];
      }
    },
    [tableName, includeDeleted, sortBy, sortDesc, limit],
    []
  );

  // Subscribe to sync events
  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((event) => {
      if (!mountedRef.current) return;
      
      switch (event.type) {
        case 'status_change':
          setSyncStatus(event.status);
          break;
        case 'online':
          setIsOnline(true);
          break;
        case 'offline':
          setIsOnline(false);
          break;
        case 'sync_error':
          if (event.table === tableName) {
            setError(new Error(event.error));
          }
          break;
      }
    });

    // Update pending count periodically
    const updatePendingCount = async () => {
      const count = await db.sync_queue
        .where('table')
        .equals(tableName)
        .and(item => !item.synced)
        .count();
      if (mountedRef.current) {
        setPendingCount(count);
      }
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000);

    return () => {
      mountedRef.current = false;
      unsubscribe();
      clearInterval(interval);
    };
  }, [tableName]);

  // Create a new record
  const create = useCallback(
    async (item: Omit<T, 'id' | 'created_at' | 'updated_at' | '_synced' | '_deleted'>): Promise<T> => {
      const id = generateId();
      const timestamp = now();
      
      const newRecord = {
        ...item,
        id,
        created_at: timestamp,
        updated_at: timestamp,
        _synced: false,
        _deleted: false,
      } as unknown as T;

      const table = getTable(tableName);
      await table.add(newRecord as unknown as Record<string, IndexableType>);

      // Queue for sync
      await syncEngine.queueChange(tableName, 'create', newRecord as unknown as Record<string, unknown>);

      return newRecord;
    },
    [tableName]
  );

  // Update a record
  const update = useCallback(
    async (id: string, updates: Partial<T>): Promise<void> => {
      const timestamp = now();
      
      const updateData = {
        ...updates,
        updated_at: timestamp,
        _synced: false,
      };

      const table = getTable(tableName);
      await table.update(id, updateData as unknown as Record<string, IndexableType>);

      // Get full record for sync
      const fullRecord = await table.get(id);
      if (fullRecord) {
        await syncEngine.queueChange(tableName, 'update', fullRecord as Record<string, unknown>);
      }
    },
    [tableName]
  );

  // Soft delete a record
  const remove = useCallback(
    async (id: string): Promise<void> => {
      const table = getTable(tableName);
      
      // Soft delete locally
      await table.update(id, { 
        _deleted: true, 
        _synced: false 
      } as unknown as Record<string, IndexableType>);

      // Queue actual deletion for sync
      await syncEngine.queueChange(tableName, 'delete', { id });
    },
    [tableName]
  );

  // Get single record by ID
  const getById = useCallback(
    async (id: string): Promise<T | undefined> => {
      const table = getTable(tableName);
      return await table.get(id) as T | undefined;
    },
    [tableName]
  );

  // Manual refresh - pull from remote
  const refresh = useCallback(async (): Promise<void> => {
    try {
      await syncEngine.pullFromRemote(tableName);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to refresh'));
    }
  }, [tableName]);

  return {
    data: rawData || [],
    loading: rawData === undefined,
    error,
    syncStatus,
    pendingCount,
    isOnline,
    create,
    update,
    remove,
    refresh,
    getById,
  };
}

// Hook for single record
export function useOfflineFirstRecord<T extends TableRecord>(
  tableName: SyncableTable,
  id: string | null
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  update: (updates: Partial<T>) => Promise<void>;
  remove: () => Promise<void>;
} {
  const [error, setError] = useState<Error | null>(null);

  const data = useLiveQuery(
    async () => {
      if (!id) return null;
      try {
        const table = getTable(tableName);
        const record = await table.get(id);
        if (record && (record as T)._deleted) return null;
        return record as T | null;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to get record'));
        return null;
      }
    },
    [tableName, id],
    null
  );

  const update = useCallback(
    async (updates: Partial<T>): Promise<void> => {
      if (!id) return;
      const table = getTable(tableName);
      const timestamp = now();
      
      await table.update(id, {
        ...updates,
        updated_at: timestamp,
        _synced: false,
      } as unknown as Record<string, IndexableType>);

      const fullRecord = await table.get(id);
      if (fullRecord) {
        await syncEngine.queueChange(tableName, 'update', fullRecord as Record<string, unknown>);
      }
    },
    [tableName, id]
  );

  const remove = useCallback(async (): Promise<void> => {
    if (!id) return;
    const table = getTable(tableName);
    
    await table.update(id, {
      _deleted: true,
      _synced: false,
    } as unknown as Record<string, IndexableType>);

    await syncEngine.queueChange(tableName, 'delete', { id });
  }, [tableName, id]);

  return {
    data: data ?? null,
    loading: data === undefined,
    error,
    update,
    remove,
  };
}

// Hook for sync status only
export function useSyncStatus(): {
  status: SyncStatus;
  isOnline: boolean;
  pendingCount: number;
  sync: () => Promise<void>;
} {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((event) => {
      switch (event.type) {
        case 'status_change':
          setStatus(event.status);
          break;
        case 'online':
          setIsOnline(true);
          break;
        case 'offline':
          setIsOnline(false);
          break;
      }
    });

    const updateCount = async () => {
      const count = await db.sync_queue.where('synced').equals(0).count();
      setPendingCount(count);
    };

    updateCount();
    const interval = setInterval(updateCount, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const sync = useCallback(async () => {
    await syncEngine.fullSync();
  }, []);

  return { status, isOnline, pendingCount, sync };
}
