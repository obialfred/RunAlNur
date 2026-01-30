-- Knowledge Base Table for COO AI System
-- Migration: 2026-01-20
-- Description: Local knowledge storage for AI-parsed information, notes, and learnings

-- ============================================================================
-- KNOWLEDGE BASE - Core knowledge storage
-- ============================================================================
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  arm_id TEXT REFERENCES arms(id) ON DELETE SET NULL,
  
  -- Content
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  summary TEXT, -- AI-generated summary for quick reference
  
  -- Classification
  source VARCHAR(50) DEFAULT 'manual' CHECK (source IN (
    'ai', 'manual', 'import', 'guru_sync', 'conversation', 'document'
  )),
  category VARCHAR(100),
  subcategory VARCHAR(100),
  tags TEXT[] DEFAULT '{}',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  -- Can store: original_file, extracted_from, confidence_score, etc.
  
  -- Relationships
  related_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  related_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  
  -- Search optimization
  search_vector tsvector,
  
  -- Status
  is_verified BOOLEAN DEFAULT false, -- Has a human verified this?
  is_pinned BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- DEADLINES - Standalone deadlines with reminders
-- ============================================================================
CREATE TABLE IF NOT EXISTS deadlines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  arm_id TEXT REFERENCES arms(id) ON DELETE SET NULL,
  
  -- Content
  title VARCHAR(500) NOT NULL,
  description TEXT,
  
  -- Timing
  due_date DATE NOT NULL,
  due_time TIME,
  timezone VARCHAR(50) DEFAULT 'America/Chicago',
  
  -- Reminders (array of reminder configs)
  reminders JSONB DEFAULT '[]',
  -- [{"type": "days_before", "value": 7}, {"type": "days_before", "value": 1}]
  
  -- Relationships
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'completed', 'cancelled', 'overdue'
  )),
  completed_at TIMESTAMPTZ,
  
  -- Priority
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN (
    'critical', 'high', 'medium', 'low'
  )),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MILESTONES - Project milestones
-- ============================================================================
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Content
  title VARCHAR(500) NOT NULL,
  description TEXT,
  
  -- Timing
  target_date DATE,
  completed_date DATE,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'completed', 'cancelled'
  )),
  
  -- Ordering
  sort_order INTEGER DEFAULT 0,
  
  -- Relationships
  dependent_on UUID REFERENCES milestones(id) ON DELETE SET NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AI PENDING ACTIONS - Queue for actions needing confirmation
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_pending_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Action details
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
    'create_contact', 'create_bulk_contacts', 'create_knowledge',
    'create_task', 'create_project', 'create_deadline', 'create_milestone',
    'update_contact', 'delete_contact', 'bulk_operation'
  )),
  action_data JSONB NOT NULL, -- The data to execute
  
  -- Context
  conversation_id VARCHAR(100), -- Link to chat conversation
  source_message TEXT, -- Original user message
  ai_reasoning TEXT, -- Why the AI proposed this action
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected', 'modified', 'expired'
  )),
  
  -- Resolution
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  modified_data JSONB, -- If user modified before approving
  rejection_reason TEXT,
  
  -- Expiration (pending actions expire after 24h)
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_knowledge_base_user ON knowledge_base(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_arm ON knowledge_base(arm_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_tags ON knowledge_base USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_search ON knowledge_base USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_created ON knowledge_base(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_deadlines_user ON deadlines(user_id);
CREATE INDEX IF NOT EXISTS idx_deadlines_due_date ON deadlines(due_date);
CREATE INDEX IF NOT EXISTS idx_deadlines_status ON deadlines(status);

CREATE INDEX IF NOT EXISTS idx_milestones_user ON milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_project ON milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON milestones(status);

CREATE INDEX IF NOT EXISTS idx_ai_pending_actions_user ON ai_pending_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_pending_actions_status ON ai_pending_actions(status);
CREATE INDEX IF NOT EXISTS idx_ai_pending_actions_expires ON ai_pending_actions(expires_at);

-- ============================================================================
-- FULL TEXT SEARCH TRIGGER FOR KNOWLEDGE BASE
-- ============================================================================
CREATE OR REPLACE FUNCTION knowledge_base_search_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.category, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS knowledge_base_search_update ON knowledge_base;
CREATE TRIGGER knowledge_base_search_update
  BEFORE INSERT OR UPDATE ON knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION knowledge_base_search_trigger();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_pending_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can manage own knowledge" ON knowledge_base;
CREATE POLICY "Users can manage own knowledge" ON knowledge_base 
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own deadlines" ON deadlines;
CREATE POLICY "Users can manage own deadlines" ON deadlines 
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own milestones" ON milestones;
CREATE POLICY "Users can manage own milestones" ON milestones 
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own pending actions" ON ai_pending_actions;
CREATE POLICY "Users can manage own pending actions" ON ai_pending_actions 
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS FOR updated_at
-- ============================================================================
DROP TRIGGER IF EXISTS update_knowledge_base_updated_at ON knowledge_base;
CREATE TRIGGER update_knowledge_base_updated_at
  BEFORE UPDATE ON knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_deadlines_updated_at ON deadlines;
CREATE TRIGGER update_deadlines_updated_at
  BEFORE UPDATE ON deadlines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_milestones_updated_at ON milestones;
CREATE TRIGGER update_milestones_updated_at
  BEFORE UPDATE ON milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CLEANUP FUNCTION FOR EXPIRED PENDING ACTIONS
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_expired_pending_actions()
RETURNS void AS $$
BEGIN
  UPDATE ai_pending_actions 
  SET status = 'expired' 
  WHERE status = 'pending' AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
