"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useDebounce } from "./useDebounce";

// Types
export interface GuruCard {
  id: string;
  title: string;
  content: string;
  collection?: {
    id: string;
    name: string;
  };
  updatedAt?: string;
  createdAt?: string;
  verificationState?: string;
  owner?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  tags?: Array<{
    id: string;
    value: string;
  }>;
}

export interface GuruCollection {
  id: string;
  name: string;
  color?: string;
  description?: string;
}

interface UseGuruCardsResult {
  cards: GuruCard[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

interface UseGuruCollectionsResult {
  collections: GuruCollection[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch Guru cards with optional search and collection filtering
 */
export function useGuruCards(options?: {
  query?: string;
  collectionId?: string;
}): UseGuruCardsResult {
  const [cards, setCards] = useState<GuruCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce search query to avoid excessive API calls
  const debouncedQuery = useDebounce(options?.query || "", 300);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (debouncedQuery) params.set("query", debouncedQuery);
      if (options?.collectionId) params.set("collection", options.collectionId);

      const url = `/api/guru/cards${params.toString() ? `?${params}` : ""}`;
      const response = await fetch(url);
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to fetch cards");
      }

      setCards(json.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, options?.collectionId]);

  useEffect(() => {
    void fetchCards();
  }, [fetchCards]);

  return { cards, loading, error, refresh: fetchCards };
}

/**
 * Hook to fetch Guru collections
 */
export function useGuruCollections(): UseGuruCollectionsResult {
  const [collections, setCollections] = useState<GuruCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/guru/collections");
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to fetch collections");
      }

      setCollections(json.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setCollections([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCollections();
  }, [fetchCollections]);

  return { collections, loading, error, refresh: fetchCollections };
}

/**
 * Hook to get Guru connection status
 */
export function useGuruStatus() {
  const [data, setData] = useState<{
    connected: boolean;
    source?: "user" | "env" | "none";
    collectionsCount?: number;
    metadata?: Record<string, unknown> | null;
    connectedAt?: string | null;
    scopes?: string[] | null;
    expiresAt?: string | null;
    error?: string;
  }>({ connected: false });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/guru/status");
      const json = await response.json();
      setData({
        connected: Boolean(json.success && json.connected),
        source: json.source,
        collectionsCount: typeof json.collectionsCount === "number" ? json.collectionsCount : undefined,
        metadata: (json.metadata ?? null) as Record<string, unknown> | null,
        connectedAt: typeof json.connectedAt === "string" ? json.connectedAt : null,
        scopes: Array.isArray(json.scopes) ? (json.scopes as string[]) : null,
        expiresAt: typeof json.expiresAt === "string" ? json.expiresAt : null,
        error: json.error,
      });
    } catch {
      setData({ connected: false, error: "Failed to check status" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, refresh, connected: data.connected, error: data.error };
}

/**
 * Group cards by collection
 */
export function useGuruCardsGrouped(cards: GuruCard[]) {
  return useMemo(() => {
    const grouped: Record<string, GuruCard[]> = {};
    
    for (const card of cards) {
      const collectionName = card.collection?.name || "Uncategorized";
      if (!grouped[collectionName]) {
        grouped[collectionName] = [];
      }
      grouped[collectionName].push(card);
    }
    
    return grouped;
  }, [cards]);
}
