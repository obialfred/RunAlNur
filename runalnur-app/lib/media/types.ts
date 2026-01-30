/**
 * Dynasty Media Pool & Social System - Type Definitions
 */

import type { ArmId } from "@/lib/constants";

// ============================================================================
// MEDIA ASSETS
// ============================================================================

export type MediaFileType = "image" | "video" | "audio" | "document";

export type MediaStatus = "processing" | "active" | "archived" | "deleted";

export type MediaMood = "luxury" | "casual" | "professional" | "energetic" | "calm";

export type StorageProvider = "r2" | "supabase";

export interface MediaAsset {
  id: string;
  tenant_id: string;
  owner_id: string;
  
  // File info
  file_name: string;
  file_type: MediaFileType;
  mime_type: string;
  file_size: number;
  
  // Storage
  storage_provider: StorageProvider;
  original_path: string;
  thumbnail_path: string | null;
  preview_path: string | null;
  cdn_url: string | null;
  
  // Dimensions
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  
  // Organization
  entity_id: ArmId | null;
  collection_id: string | null;
  
  // AI metadata (Gemini Vision)
  ai_description: string | null;
  ai_tags: string[];
  ai_people: string[];
  ai_location: string | null;
  ai_mood: MediaMood | null;
  ai_colors: string[];
  ai_text_content: string | null;
  ai_processed_at: string | null;
  
  // Manual metadata
  title: string | null;
  description: string | null;
  manual_tags: string[];
  location_name: string | null;
  shot_date: string | null;
  photographer: string | null;
  
  // Usage
  usage_count: number;
  last_used_at: string | null;
  
  // Status
  status: MediaStatus;
  is_favorite: boolean;
  is_brand_asset: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

// ============================================================================
// MEDIA COLLECTIONS
// ============================================================================

export interface SmartRules {
  tags?: string[];
  entity?: ArmId;
  date_range?: {
    start?: string;
    end?: string;
  };
  file_type?: MediaFileType[];
  mood?: MediaMood[];
}

export interface MediaCollection {
  id: string;
  tenant_id: string;
  owner_id: string;
  parent_id: string | null;
  
  name: string;
  description: string | null;
  entity_id: ArmId | null;
  
  cover_asset_id: string | null;
  asset_count: number;
  
  is_smart: boolean;
  smart_rules: SmartRules | null;
  
  created_at: string;
  updated_at: string;
  
  // Populated relations
  cover_asset?: MediaAsset;
}

// ============================================================================
// SOCIAL ACCOUNTS
// ============================================================================

export type SocialPlatform = 
  | "instagram" 
  | "tiktok" 
  | "x" 
  | "linkedin" 
  | "youtube" 
  | "facebook" 
  | "threads";

export type AccountType = "personal" | "business" | "creator";

export interface SocialAccount {
  id: string;
  tenant_id: string;
  owner_id: string;
  
  platform: SocialPlatform;
  account_id: string;
  username: string;
  display_name: string | null;
  profile_image_url: string | null;
  
  entity_id: ArmId | null;
  account_type: AccountType | null;
  
  integration_provider: string | null;
  
  // Stats
  followers_count: number | null;
  following_count: number | null;
  posts_count: number | null;
  stats_updated_at: string | null;
  
  is_active: boolean;
  last_post_at: string | null;
  last_sync_at: string | null;
  
  created_at: string;
  updated_at: string;
}

// ============================================================================
// SOCIAL POSTS
// ============================================================================

export type PostStatus = 
  | "draft" 
  | "pending_approval" 
  | "approved" 
  | "scheduled" 
  | "publishing" 
  | "published" 
  | "partially_published" 
  | "failed" 
  | "cancelled";

export interface PostPlatformStatus {
  status: "pending" | "publishing" | "published" | "failed";
  post_id?: string;
  url?: string;
  published_at?: string;
  error?: string;
}

export interface AiCaptionSuggestion {
  caption: string;
  hashtags: string[];
  estimated_engagement: "low" | "medium" | "high";
  reasoning: string;
}

export interface SocialPost {
  id: string;
  tenant_id: string;
  owner_id: string;
  
  caption: string | null;
  hashtags: string[];
  media_ids: string[];
  
  scheduled_for: string | null;
  timezone: string;
  
  account_ids: string[];
  entity_id: ArmId | null;
  
  // AI assistance
  ai_generated_captions: AiCaptionSuggestion[] | null;
  ai_best_time_suggestion: string | null;
  ai_hashtag_suggestions: string[] | null;
  
  // Status per platform
  post_status: Record<string, PostPlatformStatus>;
  
  status: PostStatus;
  
  // Approval
  submitted_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  
  // Analytics
  total_likes: number;
  total_comments: number;
  total_shares: number;
  total_views: number;
  total_reach: number;
  engagement_rate: number | null;
  analytics_updated_at: string | null;
  
  created_at: string;
  updated_at: string;
  published_at: string | null;
  
  // Populated relations
  media?: MediaAsset[];
  accounts?: SocialAccount[];
}

// ============================================================================
// POST TEMPLATES
// ============================================================================

export interface PostTemplate {
  id: string;
  tenant_id: string;
  owner_id: string;
  
  name: string;
  description: string | null;
  entity_id: ArmId | null;
  
  caption_template: string | null;
  default_hashtags: string[];
  
  suggested_collection_id: string | null;
  
  preferred_days: string[];
  preferred_times: string[];
  
  usage_count: number;
  
  created_at: string;
  updated_at: string;
}

// ============================================================================
// CONTENT CALENDAR
// ============================================================================

export type ContentType = "photo" | "video" | "carousel" | "story" | "reel";

export type CalendarStatus = "idea" | "planned" | "in_production" | "ready" | "posted";

export interface ContentCalendarItem {
  id: string;
  tenant_id: string;
  owner_id: string;
  
  title: string;
  description: string | null;
  date: string;
  entity_id: ArmId | null;
  
  content_type: ContentType | null;
  theme: string | null;
  
  post_id: string | null;
  status: CalendarStatus;
  notes: string | null;
  
  created_at: string;
  updated_at: string;
  
  // Populated relations
  post?: SocialPost;
}

// ============================================================================
// SOCIAL ANALYTICS
// ============================================================================

export interface SocialAnalyticsSnapshot {
  id: string;
  account_id: string;
  date: string;
  
  followers: number | null;
  followers_change: number | null;
  
  posts_count: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  total_reach: number;
  total_impressions: number;
  
  engagement_rate: number | null;
  top_post_id: string | null;
  
  created_at: string;
}

// ============================================================================
// MEDIA UPLOAD
// ============================================================================

export interface UploadProgress {
  file: File;
  progress: number; // 0-100
  status: "pending" | "uploading" | "processing" | "completed" | "error";
  error?: string;
  asset?: MediaAsset;
}

export interface UploadOptions {
  entity_id?: ArmId;
  collection_id?: string;
  tags?: string[];
  auto_tag?: boolean; // Run AI tagging
}

export interface PresignedUploadUrl {
  url: string;
  fields: Record<string, string>;
  path: string;
  expires_at: string;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface MediaListResponse {
  data: MediaAsset[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

export interface SocialPostListResponse {
  data: SocialPost[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

// ============================================================================
// FILTERS
// ============================================================================

export interface MediaFilters {
  entity_id?: ArmId;
  collection_id?: string;
  file_type?: MediaFileType;
  status?: MediaStatus;
  tags?: string[];
  is_favorite?: boolean;
  is_brand_asset?: boolean;
  search?: string;
  date_from?: string;
  date_to?: string;
}

export interface PostFilters {
  entity_id?: ArmId;
  status?: PostStatus;
  account_id?: string;
  platform?: SocialPlatform;
  date_from?: string;
  date_to?: string;
  search?: string;
}

// ============================================================================
// PLATFORM CONFIGS
// ============================================================================

export const PLATFORM_CONFIGS: Record<SocialPlatform, {
  name: string;
  icon: string;
  color: string;
  maxCaptionLength: number;
  maxHashtags: number;
  maxImages: number;
  maxVideoLengthSeconds: number;
  supportsCarousel: boolean;
  supportsStories: boolean;
  supportsReels: boolean;
}> = {
  instagram: {
    name: "Instagram",
    icon: "Instagram",
    color: "#E4405F",
    maxCaptionLength: 2200,
    maxHashtags: 30,
    maxImages: 10,
    maxVideoLengthSeconds: 90,
    supportsCarousel: true,
    supportsStories: true,
    supportsReels: true,
  },
  tiktok: {
    name: "TikTok",
    icon: "Music",
    color: "#000000",
    maxCaptionLength: 150,
    maxHashtags: 100, // TikTok is more lenient
    maxImages: 1,
    maxVideoLengthSeconds: 180,
    supportsCarousel: false,
    supportsStories: false,
    supportsReels: false,
  },
  x: {
    name: "X",
    icon: "Twitter",
    color: "#000000",
    maxCaptionLength: 280,
    maxHashtags: 5,
    maxImages: 4,
    maxVideoLengthSeconds: 140,
    supportsCarousel: false,
    supportsStories: false,
    supportsReels: false,
  },
  linkedin: {
    name: "LinkedIn",
    icon: "Linkedin",
    color: "#0A66C2",
    maxCaptionLength: 3000,
    maxHashtags: 5,
    maxImages: 9,
    maxVideoLengthSeconds: 600,
    supportsCarousel: true,
    supportsStories: false,
    supportsReels: false,
  },
  youtube: {
    name: "YouTube",
    icon: "Youtube",
    color: "#FF0000",
    maxCaptionLength: 5000,
    maxHashtags: 15,
    maxImages: 1,
    maxVideoLengthSeconds: 43200, // 12 hours
    supportsCarousel: false,
    supportsStories: true,
    supportsReels: true, // Shorts
  },
  facebook: {
    name: "Facebook",
    icon: "Facebook",
    color: "#1877F2",
    maxCaptionLength: 63206,
    maxHashtags: 30,
    maxImages: 10,
    maxVideoLengthSeconds: 14400, // 4 hours
    supportsCarousel: true,
    supportsStories: true,
    supportsReels: true,
  },
  threads: {
    name: "Threads",
    icon: "AtSign",
    color: "#000000",
    maxCaptionLength: 500,
    maxHashtags: 10,
    maxImages: 10,
    maxVideoLengthSeconds: 300,
    supportsCarousel: true,
    supportsStories: false,
    supportsReels: false,
  },
};

// ============================================================================
// ENTITY COLOR MAP (for UI consistency)
// ============================================================================

export const ENTITY_COLORS: Record<string, string> = {
  nova: "#3B82F6",      // Blue
  janna: "#10B981",     // Green
  silk: "#F59E0B",      // Amber
  atw: "#F43F5E",       // Rose
  obx: "#8B5CF6",       // Violet
  house: "#EAB308",     // Yellow
  maison: "#64748B",    // Slate
  personal: "#EC4899",  // Pink (for Nurullah personal)
};
