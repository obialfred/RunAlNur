/**
 * Intelligence API Route
 * 
 * GET /api/intelligence
 *   - regions: comma-separated list of regions (gulf,mena,america,global,china,russia)
 *   - sources: comma-separated list of sources (x,news,rss)
 *   - limit: max number of items to return
 *   - refresh: if "true", bypasses cache
 */

import { NextRequest, NextResponse } from 'next/server';
import { getIntelligenceAggregator } from '@/lib/integrations/intelligence';
import type { IntelligenceItem, IntelRegion, IntelSource } from '@/lib/types';

// In-memory cache with TTL
interface CacheEntry {
  data: IntelligenceItem[];
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(regions: string[], sources: string[], limit: number): string {
  return `intel:${regions.sort().join(',')}:${sources.sort().join(',')}:${limit}`;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse parameters
    const regionsParam = searchParams.get('regions');
    const sourcesParam = searchParams.get('sources');
    const limitParam = searchParams.get('limit');
    const refreshParam = searchParams.get('refresh');

    const regions: IntelRegion[] = regionsParam
      ? (regionsParam.split(',').filter(r => 
          ['gulf', 'mena', 'america', 'global', 'china', 'russia'].includes(r)
        ) as IntelRegion[])
      : ['gulf', 'mena', 'america', 'global', 'china', 'russia'];

    const sources: IntelSource[] = sourcesParam
      ? (sourcesParam.split(',').filter(s => 
          ['x', 'news', 'rss'].includes(s)
        ) as IntelSource[])
      : ['x', 'news', 'rss'];

    const limit = Math.min(Math.max(parseInt(limitParam || '30', 10), 1), 100);
    const forceRefresh = refreshParam === 'true';

    // Check cache
    const cacheKey = getCacheKey(regions, sources, limit);
    const cached = cache.get(cacheKey);
    
    if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        data: cached.data,
        meta: {
          cached: true,
          cached_at: new Date(cached.timestamp).toISOString(),
          regions,
          sources,
          count: cached.data.length,
        },
      });
    }

    // Fetch fresh data
    const aggregator = getIntelligenceAggregator();
    const availableSources = aggregator.getAvailableSources();

    const items = await aggregator.fetchAll({
      regions,
      limit,
      includeX: sources.includes('x') && availableSources.x,
      includeNews: sources.includes('news') && (availableSources.newsapi || availableSources.gnews),
      includeRSS: sources.includes('rss'),
    });

    // Update cache
    cache.set(cacheKey, {
      data: items,
      timestamp: Date.now(),
    });

    // Clean old cache entries
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > CACHE_TTL * 2) {
        cache.delete(key);
      }
    }

    return NextResponse.json({
      success: true,
      data: items,
      meta: {
        cached: false,
        fetched_at: new Date().toISOString(),
        regions,
        sources,
        available_sources: availableSources,
        count: items.length,
      },
    });
  } catch (error) {
    console.error('Intelligence API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: [],
      },
      { status: 500 }
    );
  }
}

// Endpoint to check status and available sources
export async function HEAD() {
  const aggregator = getIntelligenceAggregator();
  const sources = aggregator.getAvailableSources();
  
  const headers = new Headers();
  headers.set('X-Intel-X-Available', sources.x ? 'true' : 'false');
  headers.set('X-Intel-NewsAPI-Available', sources.newsapi ? 'true' : 'false');
  headers.set('X-Intel-GNews-Available', sources.gnews ? 'true' : 'false');
  headers.set('X-Intel-RSS-Available', 'true');
  
  return new NextResponse(null, { status: 200, headers });
}
