-- ============================================================================
-- DYNASTY OS - Additional Tables for 3-Mode System
-- Run this after the main schema.sql
-- ============================================================================

-- ============================================================================
-- CROSS-MODE ALERTS - Notifications that work across all modes
-- ============================================================================
CREATE TABLE IF NOT EXISTS cross_mode_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_mode VARCHAR(20) NOT NULL CHECK (source_mode IN ('command', 'capital', 'influence')),
  alert_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  entity_type VARCHAR(50), -- 'contact', 'holding', 'project', 'commitment', etc.
  entity_id UUID,
  action_url TEXT,
  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cross_mode_alerts_user_id ON cross_mode_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_cross_mode_alerts_source_mode ON cross_mode_alerts(source_mode);
CREATE INDEX IF NOT EXISTS idx_cross_mode_alerts_unread ON cross_mode_alerts(user_id) WHERE read_at IS NULL AND dismissed_at IS NULL;

ALTER TABLE cross_mode_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own alerts" ON cross_mode_alerts;
CREATE POLICY "Users can manage own alerts" ON cross_mode_alerts 
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- INFLUENCE MODE: Extend contacts table for relationship tracking
-- ============================================================================
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS ideal_contact_frequency INTEGER DEFAULT 30;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS relationship_strength INTEGER DEFAULT 50 CHECK (relationship_strength >= 0 AND relationship_strength <= 100);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS strategic_tier VARCHAR(20) DEFAULT 'general' CHECK (strategic_tier IN ('inner_circle', 'strategic', 'general'));
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS birthday DATE;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS important_dates JSONB DEFAULT '[]';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS twitter_url TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS location VARCHAR(255);

-- ============================================================================
-- INFLUENCE MODE: Interactions log
-- ============================================================================
CREATE TABLE IF NOT EXISTS interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN (
    'call', 'meeting', 'email', 'event', 'message', 'social', 'other'
  )),
  sentiment VARCHAR(20) CHECK (sentiment IN ('great', 'good', 'neutral', 'cold')),
  notes TEXT,
  follow_up_date DATE,
  follow_up_note TEXT,
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interactions_owner_id ON interactions(owner_id);
CREATE INDEX IF NOT EXISTS idx_interactions_contact_id ON interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_interactions_occurred_at ON interactions(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_follow_up ON interactions(follow_up_date) WHERE follow_up_date IS NOT NULL;

ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own interactions" ON interactions;
CREATE POLICY "Users can manage own interactions" ON interactions 
  FOR ALL USING (auth.uid() = owner_id);

-- ============================================================================
-- INFLUENCE MODE: Relationship edges (who knows who)
-- ============================================================================
CREATE TABLE IF NOT EXISTS relationship_edges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  to_contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50), -- 'reports_to', 'influences', 'introduced_by', 'partner', 'colleague'
  introduced_by UUID REFERENCES contacts(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_id, from_contact_id, to_contact_id)
);

CREATE INDEX IF NOT EXISTS idx_relationship_edges_owner_id ON relationship_edges(owner_id);
CREATE INDEX IF NOT EXISTS idx_relationship_edges_from_contact ON relationship_edges(from_contact_id);
CREATE INDEX IF NOT EXISTS idx_relationship_edges_to_contact ON relationship_edges(to_contact_id);

ALTER TABLE relationship_edges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own relationship edges" ON relationship_edges;
CREATE POLICY "Users can manage own relationship edges" ON relationship_edges 
  FOR ALL USING (auth.uid() = owner_id);

-- ============================================================================
-- INFLUENCE MODE: Intelligence items (news, alerts, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS intel_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source VARCHAR(100), -- 'news_api', 'manual', 'rss', etc.
  source_url TEXT,
  title TEXT NOT NULL,
  summary TEXT,
  full_content TEXT,
  related_contacts UUID[] DEFAULT '{}',
  related_holdings UUID[] DEFAULT '{}',
  sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  relevance_score INTEGER DEFAULT 50 CHECK (relevance_score >= 0 AND relevance_score <= 100),
  tags TEXT[] DEFAULT '{}',
  published_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intel_items_owner_id ON intel_items(owner_id);
CREATE INDEX IF NOT EXISTS idx_intel_items_relevance ON intel_items(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_intel_items_published ON intel_items(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_intel_items_unread ON intel_items(owner_id) WHERE read_at IS NULL AND archived_at IS NULL;

ALTER TABLE intel_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own intel items" ON intel_items;
CREATE POLICY "Users can manage own intel items" ON intel_items 
  FOR ALL USING (auth.uid() = owner_id);

-- ============================================================================
-- INFLUENCE MODE: Legitimacy metrics
-- ============================================================================
CREATE TABLE IF NOT EXISTS legitimacy_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN (
    'media_mention', 'award', 'board_seat', 'publication', 'speaking', 'recognition'
  )),
  entity VARCHAR(100), -- which arm or 'house'
  title VARCHAR(255) NOT NULL,
  source VARCHAR(255),
  sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  reach_estimate INTEGER, -- estimated audience/impact
  url TEXT,
  date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_legitimacy_metrics_owner_id ON legitimacy_metrics(owner_id);
CREATE INDEX IF NOT EXISTS idx_legitimacy_metrics_date ON legitimacy_metrics(date DESC);
CREATE INDEX IF NOT EXISTS idx_legitimacy_metrics_type ON legitimacy_metrics(metric_type);

ALTER TABLE legitimacy_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own legitimacy metrics" ON legitimacy_metrics;
CREATE POLICY "Users can manage own legitimacy metrics" ON legitimacy_metrics 
  FOR ALL USING (auth.uid() = owner_id);

-- ============================================================================
-- CAPITAL MODE: Entities (legal structures)
-- ============================================================================
CREATE TABLE IF NOT EXISTS entities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN (
    'llc', 'corp', 'trust', 'foundation', 'individual', 'partnership', 'spv', 'other'
  )),
  jurisdiction VARCHAR(100),
  formation_date DATE,
  parent_id UUID REFERENCES entities(id) ON DELETE SET NULL,
  tax_id VARCHAR(50),
  purpose TEXT,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'dissolved')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entities_owner_id ON entities(owner_id);
CREATE INDEX IF NOT EXISTS idx_entities_parent_id ON entities(parent_id);
CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(entity_type);

ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own entities" ON entities;
CREATE POLICY "Users can manage own entities" ON entities 
  FOR ALL USING (auth.uid() = owner_id);

-- ============================================================================
-- CAPITAL MODE: Holdings (assets)
-- ============================================================================
CREATE TABLE IF NOT EXISTS holdings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_id UUID REFERENCES entities(id) ON DELETE SET NULL,
  asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN (
    'public_equity', 'private_equity', 'real_estate', 'crypto', 'cash', 
    'fixed_income', 'commodities', 'alternatives', 'other'
  )),
  symbol VARCHAR(20), -- for public equities/crypto
  name VARCHAR(255) NOT NULL,
  quantity NUMERIC,
  cost_basis NUMERIC,
  cost_basis_date DATE,
  current_value NUMERIC,
  last_priced_at TIMESTAMPTZ,
  currency VARCHAR(3) DEFAULT 'USD',
  custodian VARCHAR(100), -- broker/bank name
  account_number VARCHAR(50),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_holdings_owner_id ON holdings(owner_id);
CREATE INDEX IF NOT EXISTS idx_holdings_entity_id ON holdings(entity_id);
CREATE INDEX IF NOT EXISTS idx_holdings_asset_type ON holdings(asset_type);
CREATE INDEX IF NOT EXISTS idx_holdings_symbol ON holdings(symbol) WHERE symbol IS NOT NULL;

ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own holdings" ON holdings;
CREATE POLICY "Users can manage own holdings" ON holdings 
  FOR ALL USING (auth.uid() = owner_id);

-- ============================================================================
-- CAPITAL MODE: Accounts (bank/brokerage)
-- ============================================================================
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_id UUID REFERENCES entities(id) ON DELETE SET NULL,
  institution VARCHAR(255) NOT NULL,
  account_type VARCHAR(50) NOT NULL CHECK (account_type IN (
    'checking', 'savings', 'brokerage', 'credit', 'retirement', 'other'
  )),
  account_name VARCHAR(255),
  account_number_last4 VARCHAR(4),
  balance NUMERIC DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  last_synced_at TIMESTAMPTZ,
  plaid_item_id VARCHAR(100), -- for Plaid integration
  plaid_account_id VARCHAR(100),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accounts_owner_id ON accounts(owner_id);
CREATE INDEX IF NOT EXISTS idx_accounts_entity_id ON accounts(entity_id);
CREATE INDEX IF NOT EXISTS idx_accounts_institution ON accounts(institution);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own accounts" ON accounts;
CREATE POLICY "Users can manage own accounts" ON accounts 
  FOR ALL USING (auth.uid() = owner_id);

-- ============================================================================
-- CAPITAL MODE: Commitments (PE/VC fund investments)
-- ============================================================================
CREATE TABLE IF NOT EXISTS commitments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_id UUID REFERENCES entities(id) ON DELETE SET NULL,
  fund_name VARCHAR(255) NOT NULL,
  manager VARCHAR(255),
  commitment_amount NUMERIC NOT NULL,
  called_amount NUMERIC DEFAULT 0,
  distributed_amount NUMERIC DEFAULT 0,
  nav NUMERIC DEFAULT 0,
  vintage_year INTEGER,
  asset_class VARCHAR(50) CHECK (asset_class IN (
    'venture', 'growth', 'buyout', 'real_estate', 'credit', 'infrastructure', 'other'
  )),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'harvesting', 'closed')),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commitments_owner_id ON commitments(owner_id);
CREATE INDEX IF NOT EXISTS idx_commitments_entity_id ON commitments(entity_id);
CREATE INDEX IF NOT EXISTS idx_commitments_status ON commitments(status);
CREATE INDEX IF NOT EXISTS idx_commitments_vintage ON commitments(vintage_year);

ALTER TABLE commitments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own commitments" ON commitments;
CREATE POLICY "Users can manage own commitments" ON commitments 
  FOR ALL USING (auth.uid() = owner_id);

-- ============================================================================
-- CAPITAL MODE: Capital calls
-- ============================================================================
CREATE TABLE IF NOT EXISTS capital_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  commitment_id UUID NOT NULL REFERENCES commitments(id) ON DELETE CASCADE,
  call_date DATE NOT NULL,
  due_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  paid_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_capital_calls_owner_id ON capital_calls(owner_id);
CREATE INDEX IF NOT EXISTS idx_capital_calls_commitment_id ON capital_calls(commitment_id);
CREATE INDEX IF NOT EXISTS idx_capital_calls_due_date ON capital_calls(due_date);
CREATE INDEX IF NOT EXISTS idx_capital_calls_pending ON capital_calls(owner_id) WHERE status = 'pending';

ALTER TABLE capital_calls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own capital calls" ON capital_calls;
CREATE POLICY "Users can manage own capital calls" ON capital_calls 
  FOR ALL USING (auth.uid() = owner_id);

-- ============================================================================
-- CAPITAL MODE: Distributions
-- ============================================================================
CREATE TABLE IF NOT EXISTS distributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  commitment_id UUID NOT NULL REFERENCES commitments(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  distribution_type VARCHAR(50) CHECK (distribution_type IN (
    'return_of_capital', 'gain', 'dividend', 'interest', 'other'
  )),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_distributions_owner_id ON distributions(owner_id);
CREATE INDEX IF NOT EXISTS idx_distributions_commitment_id ON distributions(commitment_id);
CREATE INDEX IF NOT EXISTS idx_distributions_date ON distributions(date DESC);

ALTER TABLE distributions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own distributions" ON distributions;
CREATE POLICY "Users can manage own distributions" ON distributions 
  FOR ALL USING (auth.uid() = owner_id);

-- ============================================================================
-- CONTINUITY: Decisions log
-- ============================================================================
CREATE TABLE IF NOT EXISTS decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  decision_type VARCHAR(50) CHECK (decision_type IN (
    'investment', 'strategic', 'operational', 'personnel', 'other'
  )),
  context TEXT, -- what led to this decision
  options_considered JSONB DEFAULT '[]', -- [{option, pros, cons}]
  decision_made TEXT NOT NULL,
  reasoning TEXT, -- why this choice
  principles_applied UUID[] DEFAULT '{}', -- links to principles
  outcome TEXT,
  outcome_rating INTEGER CHECK (outcome_rating >= 1 AND outcome_rating <= 10),
  decided_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_decisions_owner_id ON decisions(owner_id);
CREATE INDEX IF NOT EXISTS idx_decisions_type ON decisions(decision_type);
CREATE INDEX IF NOT EXISTS idx_decisions_decided_at ON decisions(decided_at DESC);

ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own decisions" ON decisions;
CREATE POLICY "Users can manage own decisions" ON decisions 
  FOR ALL USING (auth.uid() = owner_id);

-- ============================================================================
-- CONTINUITY: Principles
-- ============================================================================
CREATE TABLE IF NOT EXISTS principles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category VARCHAR(50) CHECK (category IN (
    'investment', 'operational', 'cultural', 'governance', 'personal', 'other'
  )),
  title VARCHAR(255) NOT NULL,
  statement TEXT NOT NULL, -- the principle itself
  rationale TEXT, -- why this principle exists
  examples TEXT, -- examples of application
  exceptions TEXT, -- when this principle doesn't apply
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_principles_owner_id ON principles(owner_id);
CREATE INDEX IF NOT EXISTS idx_principles_category ON principles(category);

ALTER TABLE principles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own principles" ON principles;
CREATE POLICY "Users can manage own principles" ON principles 
  FOR ALL USING (auth.uid() = owner_id);

-- ============================================================================
-- CONTINUITY: Milestones (timeline)
-- ============================================================================
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  milestone_type VARCHAR(50) CHECK (milestone_type IN (
    'founding', 'acquisition', 'expansion', 'partnership', 'achievement', 'goal', 'other'
  )),
  date DATE,
  horizon VARCHAR(20) NOT NULL CHECK (horizon IN ('past', 'present', '10_year', '50_year', '100_year')),
  status VARCHAR(50) DEFAULT 'planned' CHECK (status IN ('completed', 'in_progress', 'planned', 'aspirational')),
  related_arm TEXT REFERENCES arms(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_milestones_owner_id ON milestones(owner_id);
CREATE INDEX IF NOT EXISTS idx_milestones_horizon ON milestones(horizon);
CREATE INDEX IF NOT EXISTS idx_milestones_date ON milestones(date);

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own milestones" ON milestones;
CREATE POLICY "Users can manage own milestones" ON milestones 
  FOR ALL USING (auth.uid() = owner_id);

-- ============================================================================
-- Apply updated_at triggers to new tables
-- ============================================================================
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'entities', 'holdings', 'accounts', 'commitments', 'decisions', 'principles', 'milestones'
  ]) LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_%s_updated_at ON %s;
      CREATE TRIGGER update_%s_updated_at
        BEFORE UPDATE ON %s
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    ', t, t, t, t);
  END LOOP;
END $$;

-- ============================================================================
-- Function to calculate relationship strength decay
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_relationship_strength(
  base_strength INTEGER,
  last_contacted TIMESTAMPTZ,
  ideal_frequency INTEGER
) RETURNS INTEGER AS $$
DECLARE
  days_since INTEGER;
  decay_factor NUMERIC;
  new_strength INTEGER;
BEGIN
  IF last_contacted IS NULL THEN
    RETURN base_strength;
  END IF;
  
  days_since := EXTRACT(DAY FROM NOW() - last_contacted);
  
  -- Decay formula: strength decreases as time passes beyond ideal frequency
  -- At ideal_frequency days: no decay
  -- At 2x ideal_frequency days: 50% decay
  decay_factor := 1.0 - (days_since::NUMERIC / (ideal_frequency * 2.0));
  decay_factor := GREATEST(decay_factor, 0.1); -- Minimum 10% of original strength
  
  new_strength := ROUND(base_strength * decay_factor);
  new_strength := LEAST(GREATEST(new_strength, 0), 100); -- Clamp between 0-100
  
  RETURN new_strength;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function to get contacts needing attention
-- ============================================================================
CREATE OR REPLACE FUNCTION get_contacts_needing_attention(user_uuid UUID, threshold INTEGER DEFAULT 70)
RETURNS TABLE(
  contact_id UUID,
  contact_name VARCHAR,
  strategic_tier VARCHAR,
  days_since_contact INTEGER,
  current_strength INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.strategic_tier,
    COALESCE(EXTRACT(DAY FROM NOW() - c.last_contacted_at)::INTEGER, 9999) as days_since,
    calculate_relationship_strength(
      c.relationship_strength,
      c.last_contacted_at,
      c.ideal_contact_frequency
    ) as strength
  FROM contacts c
  WHERE c.owner_id = user_uuid
    AND calculate_relationship_strength(
      c.relationship_strength,
      c.last_contacted_at,
      c.ideal_contact_frequency
    ) < threshold
  ORDER BY 
    CASE c.strategic_tier
      WHEN 'inner_circle' THEN 1
      WHEN 'strategic' THEN 2
      ELSE 3
    END,
    days_since DESC;
END;
$$ LANGUAGE plpgsql;
