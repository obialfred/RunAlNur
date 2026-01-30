/**
 * Media Library Hooks
 * 
 * Provides data fetching and mutations for media assets and collections.
 */

import { useMemo, useState, useCallback } from "react";
import { useApi } from "@/lib/hooks/useApi";
import type { 
  MediaAsset, 
  MediaCollection, 
  MediaFilters,
  MediaListResponse 
} from "@/lib/media/types";

// ============================================================================
// useMedia - Fetch media assets with filters
// ============================================================================

interface UseMediaOptions extends MediaFilters {
  page?: number;
  perPage?: number;
}

export function useMedia(options: UseMediaOptions = {}) {
  const params = new URLSearchParams();
  
  if (options.entity_id) params.set("entity_id", options.entity_id);
  if (options.collection_id) params.set("collection_id", options.collection_id);
  if (options.file_type) params.set("file_type", options.file_type);
  if (options.status) params.set("status", options.status);
  if (options.is_favorite !== undefined) params.set("is_favorite", String(options.is_favorite));
  if (options.is_brand_asset !== undefined) params.set("is_brand_asset", String(options.is_brand_asset));
  if (options.search) params.set("search", options.search);
  if (options.date_from) params.set("date_from", options.date_from);
  if (options.date_to) params.set("date_to", options.date_to);
  if (options.tags && options.tags.length > 0) params.set("tags", options.tags.join(","));
  if (options.page) params.set("page", String(options.page));
  if (options.perPage) params.set("per_page", String(options.perPage));

  const url = useMemo(() => {
    const query = params.toString();
    return query ? `/api/media?${query}` : "/api/media";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    options.entity_id,
    options.collection_id,
    options.file_type,
    options.status,
    options.is_favorite,
    options.is_brand_asset,
    options.search,
    options.date_from,
    options.date_to,
    options.tags?.join(","),
    options.page,
    options.perPage,
  ]);

  const { data, loading, error, refresh } = useApi<MediaListResponse>(
    url,
    { data: [], total: 0, page: 1, per_page: 50, has_more: false }
  );

  return {
    assets: data.data,
    total: data.total,
    page: data.page,
    perPage: data.per_page,
    hasMore: data.has_more,
    loading,
    error,
    refresh,
  };
}

// ============================================================================
// useSingleMedia - Fetch single media asset
// ============================================================================

export function useSingleMedia(id: string | null) {
  const url = id ? `/api/media/${id}` : null;
  return useApi<MediaAsset | null>(url, null);
}

// ============================================================================
// useMediaCollections - Fetch collections
// ============================================================================

interface UseCollectionsOptions {
  entityId?: string;
  parentId?: string | null;
}

export function useMediaCollections(options: UseCollectionsOptions = {}) {
  const params = new URLSearchParams();
  if (options.entityId) params.set("entity_id", options.entityId);
  if (options.parentId) params.set("parent_id", options.parentId);

  const url = useMemo(() => {
    const query = params.toString();
    return query ? `/api/media/collections?${query}` : "/api/media/collections";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.entityId, options.parentId]);

  return useApi<MediaCollection[]>(url, []);
}

// ============================================================================
// useMediaMutations - Create, update, delete operations
// ============================================================================

export function useMediaMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAsset = useCallback(async (data: {
    file_name: string;
    mime_type: string;
    file_size: number;
    original_path: string;
    width?: number;
    height?: number;
    duration_seconds?: number;
    entity_id?: string;
    collection_id?: string;
    title?: string;
    description?: string;
    manual_tags?: string[];
    auto_tag?: boolean;
  }): Promise<MediaAsset | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to create asset");
      }
      return result.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAsset = useCallback(async (
    id: string,
    data: Partial<Pick<MediaAsset, 
      | "title" 
      | "description" 
      | "manual_tags" 
      | "entity_id" 
      | "collection_id"
      | "location_name"
      | "shot_date"
      | "photographer"
      | "is_favorite"
      | "is_brand_asset"
      | "status"
    >>
  ): Promise<MediaAsset | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/media/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to update asset");
      }
      return result.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAsset = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/media/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to delete asset");
      }
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleFavorite = useCallback(async (asset: MediaAsset): Promise<MediaAsset | null> => {
    return updateAsset(asset.id, { is_favorite: !asset.is_favorite });
  }, [updateAsset]);

  const createCollection = useCallback(async (data: {
    name: string;
    description?: string;
    entity_id?: string;
    parent_id?: string;
    is_smart?: boolean;
    smart_rules?: Record<string, unknown>;
  }): Promise<MediaCollection | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/media/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to create collection");
      }
      return result.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createAsset,
    updateAsset,
    deleteAsset,
    toggleFavorite,
    createCollection,
  };
}
