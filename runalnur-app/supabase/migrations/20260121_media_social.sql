-- ============================================================================
-- DYNASTY MEDIA POOL & SOCIAL MEDIA SYSTEM
-- Centralized media storage and multi-platform social publishing
-- ============================================================================

-- ============================================================================
-- MEDIA COLLECTIONS - Folders/Albums for organizing media
-- ============================================================================
CREATE TABLE IF NOT EXISTS media_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES media_collections(id) ON DELETE SET NULL,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  entity_id TEXT REFERENCES arms(id) ON DELETE SET NULL,
  
  cover_asset_id UUID, -- Will be FK'd after media_assets created
  asset_count INTEGER DEFAULT 0,
  
  -- Smart collections based on rules
  is_smart BOOLEAN DEFAULT false,
  smart_rules JSONB, -- {"tags": ["dubai"], "entity": "janna", "date_range": {...}}
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MEDIA ASSETS - Core media storage metadata
-- ============================================================================
CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- File info
  file_name VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) NOT NULL, -- 'image', 'video', 'audio', 'document'
  mime_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL, -- bytes
  
  -- Storage paths (R2 or Supabase Storage)
  storage_provider VARCHAR(20) DEFAULT 'r2', -- 'r2', 'supabase'
  original_path TEXT NOT NULL,
  thumbnail_path TEXT,
  preview_path TEXT,
  cdn_url TEXT, -- Public CDN URL for fast delivery
  
  -- Dimensions (for images/videos)
  width INTEGER,
  height INTEGER,
  duration_seconds INTEGER, -- for video/audio
  
  -- Organization
  entity_id TEXT REFERENCES arms(id) ON DELETE SET NULL,
  collection_id UUID REFERENCES media_collections(id) ON DELETE SET NULL,
  
  -- AI-generated metadata (Gemini Vision)
  ai_description TEXT,
  ai_tags TEXT[] DEFAULT '{}',
  ai_people TEXT[] DEFAULT '{}', -- Detected people/faces
  ai_location TEXT,
  ai_mood VARCHAR(50), -- luxury, casual, professional, energetic, calm
  ai_colors TEXT[] DEFAULT '{}', -- Dominant colors (hex)
  ai_text_content TEXT, -- OCR extracted text
  ai_processed_at TIMESTAMPTZ,
  
  -- Manual metadata
  title VARCHAR(500),
  description TEXT,
  manual_tags TEXT[] DEFAULT '{}',
  location_name VARCHAR(255),
  shot_date DATE,
  photographer VARCHAR(255),
  
  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Status
  status VARCHAR(20) DEFAULT 'processing' CHECK (status IN (
    'processing', 'active', 'archived', 'deleted'
  )),
  is_favorite BOOLEAN DEFAULT false,
  is_brand_asset BOOLEAN DEFAULT false, -- Logos, brand elements
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

-- Add FK for cover_asset after media_assets exists
ALTER TABLE media_collections 
  ADD CONSTRAINT fk_cover_asset 
  FOREIGN KEY (cover_asset_id) REFERENCES media_assets(id) ON DELETE SET NULL;

-- ============================================================================
-- SOCIAL ACCOUNTS - Connected social media accounts
-- ============================================================================
CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  platform VARCHAR(20) NOT NULL CHECK (platform IN (
    'instagram', 'tiktok', 'x', 'linkedin', 'youtube', 'facebook', 'threads'
  )),
  
  -- Account info from platform
  account_id VARCHAR(255) NOT NULL, -- Platform's user ID
  username VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  profile_image_url TEXT,
  
  -- Which entity this account belongs to
  entity_id TEXT REFERENCES arms(id) ON DELETE SET NULL,
  account_type VARCHAR(50), -- 'personal', 'business', 'creator'
  
  -- OAuth tokens (encrypted via user_integrations pattern)
  -- We reference user_integrations for the actual tokens
  integration_provider VARCHAR(50), -- Maps to user_integrations.provider
  
  -- Account stats (cached for quick display)
  followers_count INTEGER,
  following_count INTEGER,
  posts_count INTEGER,
  stats_updated_at TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_post_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, platform, account_id)
);

-- ============================================================================
-- SOCIAL POSTS - Scheduled and published posts
-- ============================================================================
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Content
  caption TEXT,
  hashtags TEXT[] DEFAULT '{}',
  
  -- Media attachments (ordered array of media_asset IDs)
  media_ids UUID[] DEFAULT '{}',
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  timezone VARCHAR(50) DEFAULT 'America/Chicago',
  
  -- Target accounts (can post to multiple at once)
  account_ids UUID[] NOT NULL DEFAULT '{}',
  
  -- Entity association
  entity_id TEXT REFERENCES arms(id) ON DELETE SET NULL,
  
  -- AI assistance
  ai_generated_captions JSONB, -- Array of AI suggestions
  ai_best_time_suggestion TIMESTAMPTZ,
  ai_hashtag_suggestions TEXT[],
  
  -- Status tracking per platform
  post_status JSONB DEFAULT '{}', 
  -- {"account_uuid": {"status": "published", "post_id": "xxx", "url": "xxx", "published_at": "xxx"}}
  
  -- Overall status
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN (
    'draft', 'pending_approval', 'approved', 'scheduled', 
    'publishing', 'published', 'partially_published', 'failed', 'cancelled'
  )),
  
  -- Approval workflow
  submitted_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Analytics (aggregated across platforms)
  total_likes INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  total_reach INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2),
  analytics_updated_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- ============================================================================
-- POST TEMPLATES - Reusable post templates
-- ============================================================================
CREATE TABLE IF NOT EXISTS post_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  entity_id TEXT REFERENCES arms(id) ON DELETE SET NULL,
  
  -- Template content
  caption_template TEXT, -- With placeholders like {{product_name}}
  default_hashtags TEXT[] DEFAULT '{}',
  
  -- Suggested media collection
  suggested_collection_id UUID REFERENCES media_collections(id) ON DELETE SET NULL,
  
  -- Scheduling preferences
  preferred_days TEXT[] DEFAULT '{}', -- ['monday', 'wednesday', 'friday']
  preferred_times TIME[] DEFAULT '{}', -- ['09:00', '18:00']
  
  usage_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CONTENT CALENDAR - High-level planning
-- ============================================================================
CREATE TABLE IF NOT EXISTS content_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Planning
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  entity_id TEXT REFERENCES arms(id) ON DELETE SET NULL,
  
  -- Content type
  content_type VARCHAR(50), -- 'photo', 'video', 'carousel', 'story', 'reel'
  theme VARCHAR(100), -- 'product launch', 'behind the scenes', 'educational'
  
  -- Linked post (if created)
  post_id UUID REFERENCES social_posts(id) ON DELETE SET NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'idea' CHECK (status IN (
    'idea', 'planned', 'in_production', 'ready', 'posted'
  )),
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SOCIAL ANALYTICS SNAPSHOTS - Historical performance data
-- ============================================================================
CREATE TABLE IF NOT EXISTS social_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  
  date DATE NOT NULL,
  
  -- Account metrics
  followers INTEGER,
  followers_change INTEGER,
  
  -- Content metrics (for the day)
  posts_count INTEGER DEFAULT 0,
  total_likes INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  total_reach INTEGER DEFAULT 0,
  total_impressions INTEGER DEFAULT 0,
  
  -- Engagement
  engagement_rate DECIMAL(5,2),
  
  -- Best performing post of the day
  top_post_id UUID REFERENCES social_posts(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(account_id, date)
);

-- ============================================================================
-- MEDIA PROCESSING QUEUE - Background processing jobs
-- ============================================================================
CREATE TABLE IF NOT EXISTS media_processing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_asset_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  
  job_type VARCHAR(50) NOT NULL, -- 'thumbnail', 'preview', 'ai_tag', 'transcode'
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'completed', 'failed'
  )),
  
  priority INTEGER DEFAULT 5, -- 1-10, lower = higher priority
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  
  error_message TEXT,
  result JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_media_assets_tenant ON media_assets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_owner ON media_assets(owner_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_entity ON media_assets(entity_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_status ON media_assets(status);
CREATE INDEX IF NOT EXISTS idx_media_assets_collection ON media_assets(collection_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_ai_tags ON media_assets USING GIN(ai_tags);
CREATE INDEX IF NOT EXISTS idx_media_assets_manual_tags ON media_assets USING GIN(manual_tags);
CREATE INDEX IF NOT EXISTS idx_media_assets_created ON media_assets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_assets_file_type ON media_assets(file_type);
CREATE INDEX IF NOT EXISTS idx_media_assets_favorite ON media_assets(is_favorite) WHERE is_favorite = true;

CREATE INDEX IF NOT EXISTS idx_media_collections_tenant ON media_collections(tenant_id);
CREATE INDEX IF NOT EXISTS idx_media_collections_owner ON media_collections(owner_id);
CREATE INDEX IF NOT EXISTS idx_media_collections_parent ON media_collections(parent_id);
CREATE INDEX IF NOT EXISTS idx_media_collections_entity ON media_collections(entity_id);

CREATE INDEX IF NOT EXISTS idx_social_posts_tenant ON social_posts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_owner ON social_posts(owner_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled ON social_posts(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_social_posts_published ON social_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_entity ON social_posts(entity_id);

CREATE INDEX IF NOT EXISTS idx_social_accounts_tenant ON social_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_owner ON social_accounts(owner_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_platform ON social_accounts(platform);
CREATE INDEX IF NOT EXISTS idx_social_accounts_entity ON social_accounts(entity_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_active ON social_accounts(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_content_calendar_date ON content_calendar(date);
CREATE INDEX IF NOT EXISTS idx_content_calendar_entity ON content_calendar(entity_id);
CREATE INDEX IF NOT EXISTS idx_content_calendar_tenant ON content_calendar(tenant_id);

CREATE INDEX IF NOT EXISTS idx_post_templates_tenant ON post_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_post_templates_entity ON post_templates(entity_id);

CREATE INDEX IF NOT EXISTS idx_media_processing_queue_status ON media_processing_queue(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_media_processing_queue_asset ON media_processing_queue(media_asset_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_processing_queue ENABLE ROW LEVEL SECURITY;

-- Policies: tenant-scoped access
CREATE POLICY "Users can manage media in their tenant" ON media_assets 
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage collections in their tenant" ON media_collections 
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage social accounts in their tenant" ON social_accounts 
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage posts in their tenant" ON social_posts 
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage templates in their tenant" ON post_templates 
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage calendar in their tenant" ON content_calendar 
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can view analytics for their tenant accounts" ON social_analytics 
  FOR SELECT USING (
    account_id IN (
      SELECT id FROM social_accounts 
      WHERE tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage processing queue for their media" ON media_processing_queue
  FOR ALL USING (
    media_asset_id IN (
      SELECT id FROM media_assets 
      WHERE tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid())
    )
  );

-- ============================================================================
-- TRIGGERS for updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ BEGIN
  CREATE TRIGGER update_media_assets_updated_at BEFORE UPDATE ON media_assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_media_collections_updated_at BEFORE UPDATE ON media_collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_social_accounts_updated_at BEFORE UPDATE ON social_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_social_posts_updated_at BEFORE UPDATE ON social_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_post_templates_updated_at BEFORE UPDATE ON post_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_content_calendar_updated_at BEFORE UPDATE ON content_calendar
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- HELPER FUNCTION: Update collection asset count
-- ============================================================================
CREATE OR REPLACE FUNCTION update_collection_asset_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update old collection count if changed
  IF TG_OP = 'UPDATE' AND OLD.collection_id IS DISTINCT FROM NEW.collection_id THEN
    IF OLD.collection_id IS NOT NULL THEN
      UPDATE media_collections 
      SET asset_count = (SELECT COUNT(*) FROM media_assets WHERE collection_id = OLD.collection_id AND status = 'active')
      WHERE id = OLD.collection_id;
    END IF;
  END IF;
  
  -- Update new/current collection count
  IF NEW.collection_id IS NOT NULL THEN
    UPDATE media_collections 
    SET asset_count = (SELECT COUNT(*) FROM media_assets WHERE collection_id = NEW.collection_id AND status = 'active')
    WHERE id = NEW.collection_id;
  END IF;
  
  -- Handle deletes
  IF TG_OP = 'DELETE' AND OLD.collection_id IS NOT NULL THEN
    UPDATE media_collections 
    SET asset_count = (SELECT COUNT(*) FROM media_assets WHERE collection_id = OLD.collection_id AND status = 'active')
    WHERE id = OLD.collection_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER update_collection_count_on_asset_change
    AFTER INSERT OR UPDATE OR DELETE ON media_assets
    FOR EACH ROW EXECUTE FUNCTION update_collection_asset_count();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
