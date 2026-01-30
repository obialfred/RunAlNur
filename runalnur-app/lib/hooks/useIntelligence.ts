/**
 * useIntelligence Hook
 * 
 * Fetches intelligence data with polling support
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { IntelligenceItem, IntelRegion, IntelSource } from '@/lib/types';

interface UseIntelligenceOptions {
  regions?: IntelRegion[];
  sources?: IntelSource[];
  limit?: number;
  pollInterval?: number; // in milliseconds, 0 to disable
  enabled?: boolean;
}

interface UseIntelligenceResult {
  data: IntelligenceItem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
  availableSources: {
    x: boolean;
    newsapi: boolean;
    gnews: boolean;
    rss: boolean;
  } | null;
}

const DEFAULT_POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useIntelligence(options: UseIntelligenceOptions = {}): UseIntelligenceResult {
  const {
    regions,
    sources,
    limit = 30,
    pollInterval = DEFAULT_POLL_INTERVAL,
    enabled = true,
  } = options;

  const [data, setData] = useState<IntelligenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [availableSources, setAvailableSources] = useState<UseIntelligenceResult['availableSources']>(null);

  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (regions?.length) params.set('regions', regions.join(','));
      if (sources?.length) params.set('sources', sources.join(','));
      params.set('limit', limit.toString());
      if (forceRefresh) params.set('refresh', 'true');

      const response = await fetch(`/api/intelligence?${params.toString()}`);
      const json = await response.json();

      if (!isMountedRef.current) return;

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to fetch intelligence');
      }

      setData(json.data || []);
      setLastUpdated(new Date());
      
      if (json.meta?.available_sources) {
        setAvailableSources(json.meta.available_sources);
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [enabled, regions, sources, limit]);

  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  // Initial fetch and polling
  useEffect(() => {
    isMountedRef.current = true;
    fetchData();

    // Set up polling
    if (pollInterval > 0 && enabled) {
      const poll = () => {
        pollTimeoutRef.current = setTimeout(async () => {
          await fetchData();
          if (isMountedRef.current) {
            poll();
          }
        }, pollInterval);
      };
      poll();
    }

    return () => {
      isMountedRef.current = false;
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, [fetchData, pollInterval, enabled]);

  return {
    data,
    loading,
    error,
    refresh,
    lastUpdated,
    availableSources,
  };
}

// Helper hook for filtering intelligence by region
export function useIntelligenceByRegion(
  items: IntelligenceItem[],
  region: IntelRegion | 'all'
): IntelligenceItem[] {
  if (region === 'all') return items;
  return items.filter(item => item.region === region);
}

// Helper hook for getting breaking news
export function useBreakingNews(items: IntelligenceItem[]): IntelligenceItem[] {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  return items.filter(item => {
    const publishedAt = new Date(item.published_at).getTime();
    return publishedAt > oneHourAgo || item.is_breaking;
  });
}
