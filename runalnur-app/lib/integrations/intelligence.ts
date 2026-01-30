/**
 * Intelligence Integration Service
 * 
 * Aggregates news and social media from multiple sources:
 * - X (Twitter) API v2
 * - NewsAPI.org
 * - GNews.io
 * - RSS feeds (fallback)
 */

import type { IntelligenceItem, IntelRegion, IntelSource } from '@/lib/types';
import { INTEL_SOURCES } from '@/lib/constants';

// ============================================================================
// Types
// ============================================================================

interface XTweet {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  public_metrics?: {
    like_count: number;
    retweet_count: number;
    reply_count: number;
  };
}

interface XUser {
  id: string;
  username: string;
  name: string;
  profile_image_url?: string;
}

interface NewsAPIArticle {
  source: { id: string | null; name: string };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

interface GNewsArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  image: string | null;
  publishedAt: string;
  source: { name: string; url: string };
}

interface RSSItem {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  content?: string;
}

// ============================================================================
// X (Twitter) Client
// ============================================================================

class XClient {
  private bearerToken: string;
  private baseUrl = 'https://api.twitter.com/2';

  constructor(bearerToken: string) {
    this.bearerToken = bearerToken;
  }

  private async request<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.bearerToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`X API Error: ${response.status} - ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  async getTweetsByUsernames(usernames: string[], maxResults = 10): Promise<IntelligenceItem[]> {
    const items: IntelligenceItem[] = [];

    for (const username of usernames) {
      try {
        // First get user ID
        const userResponse = await this.request<{ data?: XUser }>(`/users/by/username/${username}`);
        if (!userResponse.data) continue;

        const userId = userResponse.data.id;
        const displayName = userResponse.data.name;

        // Then get recent tweets
        const tweetsResponse = await this.request<{ data?: XTweet[] }>(`/users/${userId}/tweets`, {
          max_results: maxResults.toString(),
          'tweet.fields': 'created_at,public_metrics',
          exclude: 'retweets,replies',
        });

        if (!tweetsResponse.data) continue;

        for (const tweet of tweetsResponse.data) {
          items.push({
            id: `x_${tweet.id}`,
            source: 'x',
            source_name: `@${username}`,
            source_url: `https://x.com/${username}/status/${tweet.id}`,
            title: tweet.text.slice(0, 100) + (tweet.text.length > 100 ? '...' : ''),
            summary: tweet.text,
            region: 'global', // Will be set by caller
            tags: extractHashtags(tweet.text),
            published_at: tweet.created_at,
            fetched_at: new Date().toISOString(),
            metadata: {
              likes: tweet.public_metrics?.like_count,
              retweets: tweet.public_metrics?.retweet_count,
              author_name: displayName,
            },
          });
        }
      } catch (error) {
        console.error(`Error fetching tweets for @${username}:`, error);
      }
    }

    return items;
  }

  async searchRecent(query: string, maxResults = 10): Promise<IntelligenceItem[]> {
    try {
      const response = await this.request<{ data?: XTweet[]; includes?: { users?: XUser[] } }>(
        '/tweets/search/recent',
        {
          query: `${query} -is:retweet lang:en`,
          max_results: Math.min(maxResults, 100).toString(),
          'tweet.fields': 'created_at,public_metrics,author_id',
          'expansions': 'author_id',
          'user.fields': 'username,name',
        }
      );

      if (!response.data) return [];

      const users = new Map(response.includes?.users?.map(u => [u.id, u]) || []);

      return response.data.map(tweet => {
        const author = users.get(tweet.author_id);
        return {
          id: `x_${tweet.id}`,
          source: 'x' as IntelSource,
          source_name: author ? `@${author.username}` : 'X',
          source_url: author ? `https://x.com/${author.username}/status/${tweet.id}` : undefined,
          title: tweet.text.slice(0, 100) + (tweet.text.length > 100 ? '...' : ''),
          summary: tweet.text,
          region: 'global' as IntelRegion,
          tags: extractHashtags(tweet.text),
          published_at: tweet.created_at,
          fetched_at: new Date().toISOString(),
          metadata: {
            likes: tweet.public_metrics?.like_count,
            retweets: tweet.public_metrics?.retweet_count,
          },
        };
      });
    } catch (error) {
      console.error('Error searching X:', error);
      return [];
    }
  }
}

// ============================================================================
// NewsAPI Client
// ============================================================================

class NewsAPIClient {
  private apiKey: string;
  private baseUrl = 'https://newsapi.org/v2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(endpoint: string, params: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
    url.searchParams.append('apiKey', this.apiKey);

    const response = await fetch(url.toString());

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`NewsAPI Error: ${response.status} - ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  async getTopHeadlines(params: {
    q?: string;
    country?: string;
    category?: string;
    pageSize?: number;
  }): Promise<IntelligenceItem[]> {
    try {
      const response = await this.request<{ articles: NewsAPIArticle[] }>('/top-headlines', {
        q: params.q || '',
        country: params.country || '',
        category: params.category || '',
        pageSize: (params.pageSize || 10).toString(),
      });

      return response.articles.map(article => ({
        id: `news_${hashString(article.url)}`,
        source: 'news' as IntelSource,
        source_name: article.source.name,
        source_url: article.url,
        title: article.title,
        summary: article.description || undefined,
        content: article.content || undefined,
        image_url: article.urlToImage || undefined,
        region: 'global' as IntelRegion,
        tags: [],
        published_at: article.publishedAt,
        fetched_at: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('NewsAPI error:', error);
      return [];
    }
  }

  async searchEverything(params: {
    q: string;
    from?: string;
    sortBy?: 'relevancy' | 'popularity' | 'publishedAt';
    pageSize?: number;
  }): Promise<IntelligenceItem[]> {
    try {
      const response = await this.request<{ articles: NewsAPIArticle[] }>('/everything', {
        q: params.q,
        from: params.from || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        sortBy: params.sortBy || 'publishedAt',
        pageSize: (params.pageSize || 10).toString(),
        language: 'en',
      });

      return response.articles.map(article => ({
        id: `news_${hashString(article.url)}`,
        source: 'news' as IntelSource,
        source_name: article.source.name,
        source_url: article.url,
        title: article.title,
        summary: article.description || undefined,
        content: article.content || undefined,
        image_url: article.urlToImage || undefined,
        region: 'global' as IntelRegion,
        tags: [],
        published_at: article.publishedAt,
        fetched_at: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('NewsAPI search error:', error);
      return [];
    }
  }
}

// ============================================================================
// GNews Client
// ============================================================================

class GNewsClient {
  private apiKey: string;
  private baseUrl = 'https://gnews.io/api/v4';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(endpoint: string, params: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
    url.searchParams.append('token', this.apiKey);

    const response = await fetch(url.toString());

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`GNews Error: ${response.status} - ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  async search(params: {
    q: string;
    lang?: string;
    country?: string;
    max?: number;
  }): Promise<IntelligenceItem[]> {
    try {
      const response = await this.request<{ articles: GNewsArticle[] }>('/search', {
        q: params.q,
        lang: params.lang || 'en',
        country: params.country || '',
        max: (params.max || 10).toString(),
      });

      return response.articles.map(article => ({
        id: `gnews_${hashString(article.url)}`,
        source: 'news' as IntelSource,
        source_name: article.source.name,
        source_url: article.url,
        title: article.title,
        summary: article.description,
        content: article.content,
        image_url: article.image || undefined,
        region: 'global' as IntelRegion,
        tags: [],
        published_at: article.publishedAt,
        fetched_at: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('GNews error:', error);
      return [];
    }
  }

  async getTopHeadlines(params: {
    topic?: string;
    country?: string;
    max?: number;
  }): Promise<IntelligenceItem[]> {
    try {
      const response = await this.request<{ articles: GNewsArticle[] }>('/top-headlines', {
        topic: params.topic || 'world',
        country: params.country || '',
        max: (params.max || 10).toString(),
      });

      return response.articles.map(article => ({
        id: `gnews_${hashString(article.url)}`,
        source: 'news' as IntelSource,
        source_name: article.source.name,
        source_url: article.url,
        title: article.title,
        summary: article.description,
        content: article.content,
        image_url: article.image || undefined,
        region: 'global' as IntelRegion,
        tags: [],
        published_at: article.publishedAt,
        fetched_at: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('GNews headlines error:', error);
      return [];
    }
  }
}

// ============================================================================
// RSS Parser
// ============================================================================

async function parseRSSFeed(feedUrl: string): Promise<RSSItem[]> {
  try {
    const response = await fetch(feedUrl);
    const text = await response.text();
    
    // Simple XML parsing (for server-side use)
    const items: RSSItem[] = [];
    const itemMatches = text.matchAll(/<item>([\s\S]*?)<\/item>/g);
    
    for (const match of itemMatches) {
      const itemXml = match[1];
      const title = itemXml.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1]?.trim();
      const link = itemXml.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/)?.[1]?.trim();
      const description = itemXml.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/)?.[1]?.trim();
      const pubDate = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim();
      
      if (title && link) {
        items.push({
          title: stripHtml(title),
          link,
          description: description ? stripHtml(description) : undefined,
          pubDate,
        });
      }
    }
    
    return items;
  } catch (error) {
    console.error(`RSS parse error for ${feedUrl}:`, error);
    return [];
  }
}

function rssToIntelligence(item: RSSItem, sourceName: string, region: IntelRegion): IntelligenceItem {
  return {
    id: `rss_${hashString(item.link)}`,
    source: 'rss',
    source_name: sourceName,
    source_url: item.link,
    title: item.title,
    summary: item.description,
    region,
    tags: [],
    published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
    fetched_at: new Date().toISOString(),
  };
}

// ============================================================================
// Intelligence Aggregator
// ============================================================================

export interface IntelligenceOptions {
  regions?: IntelRegion[];
  sources?: IntelSource[];
  limit?: number;
  includeX?: boolean;
  includeNews?: boolean;
  includeRSS?: boolean;
}

export class IntelligenceAggregator {
  private xClient: XClient | null = null;
  private newsAPIClient: NewsAPIClient | null = null;
  private gNewsClient: GNewsClient | null = null;

  constructor() {
    // Initialize clients if API keys are available
    if (process.env.X_BEARER_TOKEN) {
      this.xClient = new XClient(process.env.X_BEARER_TOKEN);
    }
    if (process.env.NEWSAPI_KEY) {
      this.newsAPIClient = new NewsAPIClient(process.env.NEWSAPI_KEY);
    }
    if (process.env.GNEWS_API_KEY) {
      this.gNewsClient = new GNewsClient(process.env.GNEWS_API_KEY);
    }
  }

  async fetchByRegion(region: IntelRegion, options: IntelligenceOptions = {}): Promise<IntelligenceItem[]> {
    const items: IntelligenceItem[] = [];
    const limit = options.limit || 10;

    // Fetch from X
    if (options.includeX !== false && this.xClient) {
      const accounts = INTEL_SOURCES.x_accounts[region] || [];
      if (accounts.length > 0) {
        const xItems = await this.xClient.getTweetsByUsernames(accounts.slice(0, 3), 5);
        items.push(...xItems.map(item => ({ ...item, region })));
      }
    }

    // Fetch from News APIs
    if (options.includeNews !== false) {
      const keywords = INTEL_SOURCES.news_keywords[region] || [];
      const query = keywords.slice(0, 3).join(' OR ');

      if (this.newsAPIClient && query) {
        const newsItems = await this.newsAPIClient.searchEverything({ q: query, pageSize: 5 });
        items.push(...newsItems.map(item => ({ ...item, region })));
      }

      if (this.gNewsClient && query) {
        const gNewsItems = await this.gNewsClient.search({ q: query, max: 5 });
        items.push(...gNewsItems.map(item => ({ ...item, region })));
      }
    }

    // Fetch from RSS feeds as fallback
    if (options.includeRSS !== false) {
      const feeds = INTEL_SOURCES.rss_feeds[region] || [];
      for (const feedUrl of feeds.slice(0, 2)) {
        const rssItems = await parseRSSFeed(feedUrl);
        const sourceName = extractDomainName(feedUrl);
        items.push(...rssItems.slice(0, 3).map(item => rssToIntelligence(item, sourceName, region)));
      }
    }

    // Deduplicate and sort by date
    const deduped = deduplicateItems(items);
    return deduped
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
      .slice(0, limit);
  }

  async fetchAll(options: IntelligenceOptions = {}): Promise<IntelligenceItem[]> {
    const regions = options.regions || (['gulf', 'mena', 'america', 'global', 'china', 'russia'] as IntelRegion[]);
    const limitPerRegion = Math.ceil((options.limit || 30) / regions.length);

    const allItems: IntelligenceItem[] = [];

    // Fetch all regions in parallel
    const regionResults = await Promise.all(
      regions.map(region => this.fetchByRegion(region, { ...options, limit: limitPerRegion }))
    );

    for (const items of regionResults) {
      allItems.push(...items);
    }

    // Final sort and limit
    return allItems
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
      .slice(0, options.limit || 30);
  }

  getAvailableSources(): { x: boolean; newsapi: boolean; gnews: boolean; rss: boolean } {
    return {
      x: this.xClient !== null,
      newsapi: this.newsAPIClient !== null,
      gnews: this.gNewsClient !== null,
      rss: true, // RSS is always available
    };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

function extractHashtags(text: string): string[] {
  const matches = text.match(/#\w+/g);
  return matches ? matches.map(tag => tag.slice(1).toLowerCase()) : [];
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
}

function extractDomainName(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace('www.', '').split('.')[0];
  } catch {
    return 'RSS';
  }
}

function deduplicateItems(items: IntelligenceItem[]): IntelligenceItem[] {
  const seen = new Set<string>();
  return items.filter(item => {
    // Create a key from title (normalized)
    const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ============================================================================
// Singleton Export
// ============================================================================

let aggregator: IntelligenceAggregator | null = null;

export function getIntelligenceAggregator(): IntelligenceAggregator {
  if (!aggregator) {
    aggregator = new IntelligenceAggregator();
  }
  return aggregator;
}

export { XClient, NewsAPIClient, GNewsClient };
