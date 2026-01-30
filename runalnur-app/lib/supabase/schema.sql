-- House Al Nur Empire OS Database Schema v2
-- Production-ready schema with per-user isolation and correct types
-- Run this in your Supabase SQL editor to create/update the tables

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TENANTS (Organizations) - Top-level isolation boundary
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_memberships (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_memberships_user ON tenant_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_memberships_tenant ON tenant_memberships(tenant_id);

-- Seed default tenant (idempotent)
INSERT INTO tenants (slug, name)
VALUES ('house_al_nur', 'House Al Nur')
ON CONFLICT (slug) DO NOTHING;

-- Ensure existing users are members of the default tenant (idempotent)
DO $$
DECLARE
  t_id UUID;
  owner_user UUID;
BEGIN
  SELECT id INTO t_id FROM tenants WHERE slug = 'house_al_nur';
  SELECT id INTO owner_user FROM auth.users ORDER BY created_at ASC LIMIT 1;

  INSERT INTO tenant_memberships (tenant_id, user_id, role)
  SELECT
    t_id,
    u.id,
    CASE WHEN u.id = owner_user THEN 'owner' ELSE 'member' END
  FROM auth.users u
  ON CONFLICT (tenant_id, user_id) DO NOTHING;
END $$;

-- ============================================================================
-- ARMS (Business Units) - Static reference data
-- ============================================================================
-- Arms use TEXT slugs as IDs for simplicity (nova, janna, silk, etc.)
CREATE TABLE IF NOT EXISTS arms (
  id TEXT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  head VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default arms (idempotent)
INSERT INTO arms (id, name, slug, head, description, color) VALUES
  ('nova', 'Nova', 'nova', 'Nurullah', 'Technology & Hardware', 'sapphire'),
  ('janna', 'Janna', 'janna', 'Nurullah', 'Real Estate & Development', 'emerald'),
  ('silk', 'Silk', 'silk', 'Nurullah', 'Luxury E-Commerce', 'gold'),
  ('atw', 'ATW', 'atw', 'Nurullah', 'Media & Content', 'ruby'),
  ('obx', 'OBX Music', 'obx', 'Nurullah', 'Music & Audio', 'violet'),
  ('house', 'House', 'house', 'Nurullah', 'Holding & Operations', 'gold'),
  ('maison', 'Maison', 'maison', 'Nurullah', 'Family Office', 'slate')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PROFILES - Extended user info (linked to auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255),
  name VARCHAR(255),
  avatar_url TEXT,
  title VARCHAR(100),
  role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  arm_access TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- USER INTEGRATIONS - Per-user encrypted credentials
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL CHECK (provider IN (
    'clickup', 'hubspot', 'process_street', 'guru', 
    'openai', 'anthropic', 'gemini', 'webpush'
  )),
  kind VARCHAR(20) NOT NULL CHECK (kind IN ('oauth', 'api_key')),
  -- Encrypted JSON payload containing tokens/keys (AES-256-GCM)
  secret_enc TEXT NOT NULL,
  -- Initialization vector for encryption
  secret_iv TEXT NOT NULL,
  -- Auth tag for encryption
  secret_tag TEXT NOT NULL,
  -- Token expiration (for OAuth)
  expires_at TIMESTAMPTZ,
  -- OAuth scopes granted
  scopes TEXT[],
  -- Provider-specific metadata (workspace name, portal ID, etc.)
  metadata JSONB DEFAULT '{}',
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id, provider)
);

-- ============================================================================
-- PROJECTS - User-owned projects
-- ============================================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  arm_id TEXT REFERENCES arms(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'planning' CHECK (status IN (
    'planning', 'in_progress', 'review', 'completed', 'on_hold'
  )),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN (
    'critical', 'high', 'medium', 'low'
  )),
  clickup_id VARCHAR(100),
  due_date DATE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  tasks_total INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TASKS - User-owned tasks within projects
-- ============================================================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN (
    'critical', 'high', 'medium', 'low'
  )),
  priority_level TEXT DEFAULT 'p3' CHECK (priority_level IN ('p1', 'p2', 'p3', 'p4')),
  assignee VARCHAR(100),
  due_date DATE,
  do_date DATE,
  committed_date DATE,
  duration_minutes INTEGER DEFAULT 30,
  auto_schedule BOOLEAN DEFAULT true,
  recurrence_rule TEXT,
  parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  clickup_id VARCHAR(100),
  context TEXT NOT NULL DEFAULT 'house',
  focus_block_id UUID REFERENCES focus_blocks(id) ON DELETE SET NULL,
  scheduled_block_id UUID REFERENCES focus_blocks(id) ON DELETE SET NULL,
  scheduling_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CONTACTS - User-owned contacts
-- ============================================================================
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  arm_id TEXT REFERENCES arms(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  role VARCHAR(100),
  hubspot_id VARCHAR(100),
  external_refs JSONB DEFAULT '{}'::jsonb,
  socials JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ACTIVITIES - Audit log of user actions
-- ============================================================================
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  arm_id TEXT REFERENCES arms(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- NOTIFICATIONS - User notifications
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) DEFAULT 'info',
  title VARCHAR(255) NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- DEVICE TOKENS - Push notification subscriptions
-- ============================================================================
CREATE TABLE IF NOT EXISTS device_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id, platform)
);

-- ============================================================================
-- APPROVALS - High-impact action queue
-- ============================================================================
CREATE TABLE IF NOT EXISTS approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requester_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- ============================================================================
-- ATTACHMENTS - Files linked to entities
-- ============================================================================
CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN (
    'project', 'contact', 'sop', 'task', 'property'
  )),
  entity_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- JANNA ARM: Properties
-- ============================================================================
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  arm_id TEXT DEFAULT 'janna' REFERENCES arms(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  units INTEGER,
  sqft INTEGER,
  acquisition_date DATE,
  purchase_price NUMERIC,
  renovation_budget NUMERIC,
  target_rent NUMERIC,
  status VARCHAR(50) DEFAULT 'planning',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- JANNA ARM: Renovation Phases
-- ============================================================================
CREATE TABLE IF NOT EXISTS renovation_phases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  start_date DATE,
  end_date DATE,
  budget NUMERIC,
  actual_cost NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- JANNA ARM: Vendors/Contractors
-- ============================================================================
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  arm_id TEXT DEFAULT 'janna' REFERENCES arms(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  vendor_type VARCHAR(100),
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- JANNA ARM: Deals Pipeline
-- ============================================================================
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  arm_id TEXT DEFAULT 'janna' REFERENCES arms(id) ON DELETE SET NULL,
  hubspot_id VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  stage VARCHAR(50) DEFAULT 'lead',
  score INTEGER DEFAULT 0,
  amount NUMERIC,
  status VARCHAR(50) DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SOPs - Standard Operating Procedures
-- ============================================================================
CREATE TABLE IF NOT EXISTS sops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  arm_id TEXT REFERENCES arms(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  process_street_id VARCHAR(100),
  steps JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SOP RUNS - Active SOP executions
-- ============================================================================
CREATE TABLE IF NOT EXISTS sop_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sop_id UUID NOT NULL REFERENCES sops(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN (
    'in_progress', 'completed', 'cancelled'
  )),
  current_step INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================================================
-- CLICKUP MAPPINGS - Arm to ClickUp list mappings
-- ============================================================================
CREATE TABLE IF NOT EXISTS clickup_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  arm_id TEXT REFERENCES arms(id) ON DELETE CASCADE,
  list_id VARCHAR(100) NOT NULL,
  list_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id, arm_id)
);

-- ============================================================================
-- OAUTH STATES - Temporary storage for OAuth state verification
-- ============================================================================
CREATE TABLE IF NOT EXISTS oauth_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  state TEXT NOT NULL UNIQUE,
  redirect_uri TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes')
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_integrations_user_id ON user_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_provider ON user_integrations(tenant_id, user_id, provider);
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(tenant_id, owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_arm_id ON projects(arm_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_tasks_owner_id ON tasks(tenant_id, owner_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_context ON tasks(tenant_id, owner_id, context);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(tenant_id, owner_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_do_date ON tasks(tenant_id, owner_id, do_date);
CREATE INDEX IF NOT EXISTS idx_tasks_committed_date ON tasks(tenant_id, owner_id, committed_date);
CREATE INDEX IF NOT EXISTS idx_tasks_priority_level ON tasks(tenant_id, owner_id, priority_level);
CREATE INDEX IF NOT EXISTS idx_tasks_auto_schedule ON tasks(tenant_id, owner_id, auto_schedule) WHERE auto_schedule = true;
CREATE INDEX IF NOT EXISTS idx_tasks_focus_block ON tasks(focus_block_id) WHERE focus_block_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_block ON tasks(scheduled_block_id) WHERE scheduled_block_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task ON tasks(parent_task_id) WHERE parent_task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_owner_id ON contacts(owner_id);
CREATE INDEX IF NOT EXISTS idx_contacts_arm_id ON contacts(arm_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_hubspot_id ON contacts(tenant_id, hubspot_id) WHERE hubspot_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_arm_id ON activities(arm_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);
CREATE INDEX IF NOT EXISTS idx_attachments_entity ON attachments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_arm_id ON properties(arm_id);
CREATE INDEX IF NOT EXISTS idx_deals_owner_id ON deals(owner_id);
CREATE INDEX IF NOT EXISTS idx_deals_arm_id ON deals(arm_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_deals_hubspot_id ON deals(tenant_id, hubspot_id) WHERE hubspot_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sops_owner_id ON sops(owner_id);
CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON oauth_states(state);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON oauth_states(expires_at);

-- ============================================================================
-- TRIGGERS FOR updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'profiles', 'user_integrations', 'projects', 'tasks', 'contacts', 
    'properties', 'deals', 'sops', 'device_tokens'
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
-- Cleanup expired OAuth states (can be called by cron)
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS void AS $$
BEGIN
  DELETE FROM oauth_states WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tenant-scoped tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE renovation_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE sops ENABLE ROW LEVEL SECURITY;
ALTER TABLE sop_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE clickup_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;

-- Arms are public read-only (reference data)
ALTER TABLE arms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Arms are readable by all" ON arms;
CREATE POLICY "Arms are readable by all" ON arms FOR SELECT USING (true);

-- Tenants: members can read their tenant
DROP POLICY IF EXISTS "Members can read tenants" ON tenants;
CREATE POLICY "Members can read tenants" ON tenants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tenant_memberships m
      WHERE m.tenant_id = tenants.id AND m.user_id = auth.uid()
    )
  );

-- Tenants: owners/admins can manage their tenant
DROP POLICY IF EXISTS "Owners can manage tenants" ON tenants;
CREATE POLICY "Owners can manage tenants" ON tenants
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tenant_memberships m
      WHERE m.tenant_id = tenants.id AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenant_memberships m
      WHERE m.tenant_id = tenants.id AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'admin')
    )
  );

-- Memberships: users can read their own memberships
DROP POLICY IF EXISTS "Users can read own memberships" ON tenant_memberships;
CREATE POLICY "Users can read own memberships" ON tenant_memberships
  FOR SELECT USING (auth.uid() = user_id);

-- Memberships: owners/admins can manage memberships within their tenant
DROP POLICY IF EXISTS "Owners can manage memberships" ON tenant_memberships;
CREATE POLICY "Owners can manage memberships" ON tenant_memberships
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tenant_memberships m
      WHERE m.tenant_id = tenant_memberships.tenant_id AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenant_memberships m
      WHERE m.tenant_id = tenant_memberships.tenant_id AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'admin')
    )
  );

-- Profiles: user can manage their own profile row within tenant
DROP POLICY IF EXISTS "Profiles tenant+user access" ON profiles;
CREATE POLICY "Profiles tenant+user access" ON profiles
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = profiles.tenant_id AND m.user_id = auth.uid())
    AND profiles.id = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = profiles.tenant_id AND m.user_id = auth.uid())
    AND profiles.id = auth.uid()
  );

-- User Integrations: tenant member + owning user
DROP POLICY IF EXISTS "User integrations tenant+user access" ON user_integrations;
CREATE POLICY "User integrations tenant+user access" ON user_integrations
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = user_integrations.tenant_id AND m.user_id = auth.uid())
    AND user_integrations.user_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = user_integrations.tenant_id AND m.user_id = auth.uid())
    AND user_integrations.user_id = auth.uid()
  );

-- Projects: tenant member + owning user
DROP POLICY IF EXISTS "Projects tenant+owner access" ON projects;
CREATE POLICY "Projects tenant+owner access" ON projects
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = projects.tenant_id AND m.user_id = auth.uid())
    AND projects.owner_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = projects.tenant_id AND m.user_id = auth.uid())
    AND projects.owner_id = auth.uid()
  );

-- Tasks: tenant member + owning user
DROP POLICY IF EXISTS "Tasks tenant+owner access" ON tasks;
CREATE POLICY "Tasks tenant+owner access" ON tasks
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = tasks.tenant_id AND m.user_id = auth.uid())
    AND tasks.owner_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = tasks.tenant_id AND m.user_id = auth.uid())
    AND tasks.owner_id = auth.uid()
  );

-- Contacts: tenant member + owning user
DROP POLICY IF EXISTS "Contacts tenant+owner access" ON contacts;
CREATE POLICY "Contacts tenant+owner access" ON contacts
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = contacts.tenant_id AND m.user_id = auth.uid())
    AND contacts.owner_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = contacts.tenant_id AND m.user_id = auth.uid())
    AND contacts.owner_id = auth.uid()
  );

-- Activities: tenant member + creating user
DROP POLICY IF EXISTS "Activities tenant+user access" ON activities;
CREATE POLICY "Activities tenant+user access" ON activities
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = activities.tenant_id AND m.user_id = auth.uid())
    AND activities.user_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = activities.tenant_id AND m.user_id = auth.uid())
    AND activities.user_id = auth.uid()
  );

-- Notifications: tenant member + owning user
DROP POLICY IF EXISTS "Notifications tenant+user access" ON notifications;
CREATE POLICY "Notifications tenant+user access" ON notifications
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = notifications.tenant_id AND m.user_id = auth.uid())
    AND notifications.user_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = notifications.tenant_id AND m.user_id = auth.uid())
    AND notifications.user_id = auth.uid()
  );

-- Device tokens: tenant member + owning user
DROP POLICY IF EXISTS "Device tokens tenant+user access" ON device_tokens;
CREATE POLICY "Device tokens tenant+user access" ON device_tokens
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = device_tokens.tenant_id AND m.user_id = auth.uid())
    AND device_tokens.user_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = device_tokens.tenant_id AND m.user_id = auth.uid())
    AND device_tokens.user_id = auth.uid()
  );

-- Approvals: tenant member + requester or approver
DROP POLICY IF EXISTS "Approvals tenant access" ON approvals;
CREATE POLICY "Approvals tenant access" ON approvals
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = approvals.tenant_id AND m.user_id = auth.uid())
    AND (approvals.requester_id = auth.uid() OR approvals.approver_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = approvals.tenant_id AND m.user_id = auth.uid())
    AND (approvals.requester_id = auth.uid() OR approvals.approver_id = auth.uid())
  );

-- Attachments: tenant member + owning user
DROP POLICY IF EXISTS "Attachments tenant+owner access" ON attachments;
CREATE POLICY "Attachments tenant+owner access" ON attachments
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = attachments.tenant_id AND m.user_id = auth.uid())
    AND attachments.owner_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = attachments.tenant_id AND m.user_id = auth.uid())
    AND attachments.owner_id = auth.uid()
  );

-- Properties: tenant member + owning user
DROP POLICY IF EXISTS "Properties tenant+owner access" ON properties;
CREATE POLICY "Properties tenant+owner access" ON properties
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = properties.tenant_id AND m.user_id = auth.uid())
    AND properties.owner_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = properties.tenant_id AND m.user_id = auth.uid())
    AND properties.owner_id = auth.uid()
  );

-- Renovation phases: tenant member + parent property owner
DROP POLICY IF EXISTS "Renovation phases tenant via property" ON renovation_phases;
CREATE POLICY "Renovation phases tenant via property" ON renovation_phases
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = renovation_phases.tenant_id AND m.user_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = renovation_phases.property_id
        AND p.tenant_id = renovation_phases.tenant_id
        AND p.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = renovation_phases.tenant_id AND m.user_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = renovation_phases.property_id
        AND p.tenant_id = renovation_phases.tenant_id
        AND p.owner_id = auth.uid()
    )
  );

-- Vendors: tenant member + owning user
DROP POLICY IF EXISTS "Vendors tenant+owner access" ON vendors;
CREATE POLICY "Vendors tenant+owner access" ON vendors
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = vendors.tenant_id AND m.user_id = auth.uid())
    AND vendors.owner_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = vendors.tenant_id AND m.user_id = auth.uid())
    AND vendors.owner_id = auth.uid()
  );

-- Deals: tenant member + owning user
DROP POLICY IF EXISTS "Deals tenant+owner access" ON deals;
CREATE POLICY "Deals tenant+owner access" ON deals
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = deals.tenant_id AND m.user_id = auth.uid())
    AND deals.owner_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = deals.tenant_id AND m.user_id = auth.uid())
    AND deals.owner_id = auth.uid()
  );

-- SOPs: tenant member + owning user
DROP POLICY IF EXISTS "SOPs tenant+owner access" ON sops;
CREATE POLICY "SOPs tenant+owner access" ON sops
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = sops.tenant_id AND m.user_id = auth.uid())
    AND sops.owner_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = sops.tenant_id AND m.user_id = auth.uid())
    AND sops.owner_id = auth.uid()
  );

-- SOP runs: tenant member + parent SOP owner
DROP POLICY IF EXISTS "SOP runs tenant via sop" ON sop_runs;
CREATE POLICY "SOP runs tenant via sop" ON sop_runs
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = sop_runs.tenant_id AND m.user_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM sops s
      WHERE s.id = sop_runs.sop_id
        AND s.tenant_id = sop_runs.tenant_id
        AND s.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = sop_runs.tenant_id AND m.user_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM sops s
      WHERE s.id = sop_runs.sop_id
        AND s.tenant_id = sop_runs.tenant_id
        AND s.owner_id = auth.uid()
    )
  );

-- ClickUp mappings: tenant member + owning user
DROP POLICY IF EXISTS "ClickUp mappings tenant+user access" ON clickup_mappings;
CREATE POLICY "ClickUp mappings tenant+user access" ON clickup_mappings
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = clickup_mappings.tenant_id AND m.user_id = auth.uid())
    AND clickup_mappings.user_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = clickup_mappings.tenant_id AND m.user_id = auth.uid())
    AND clickup_mappings.user_id = auth.uid()
  );

-- OAuth states: tenant member + owning user
DROP POLICY IF EXISTS "OAuth states tenant+user access" ON oauth_states;
CREATE POLICY "OAuth states tenant+user access" ON oauth_states
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = oauth_states.tenant_id AND m.user_id = auth.uid())
    AND oauth_states.user_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = oauth_states.tenant_id AND m.user_id = auth.uid())
    AND oauth_states.user_id = auth.uid()
  );

-- ============================================================================
-- COO (Chief Operating Officer) - Priority Engine Tables
-- ============================================================================

-- COO Priorities - Daily priorities generated by the COO AI
CREATE TABLE IF NOT EXISTS coo_priorities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  priorities JSONB NOT NULL DEFAULT '[]',
  -- Each priority: {rank, taskId, source, title, reasoning, effort, status, guruContext}
  model_used VARCHAR(50), -- 'opus' or 'gemini'
  knowledge_context JSONB, -- Guru knowledge used for this generation
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  modified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id, date)
);

-- COO Focus Sessions - Track time spent on priorities
CREATE TABLE IF NOT EXISTS coo_focus_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  priority_id UUID REFERENCES coo_priorities(id) ON DELETE SET NULL,
  priority_rank INTEGER, -- Which priority (1, 2, 3)
  task_id VARCHAR(255), -- ClickUp task ID or internal task ID
  task_title VARCHAR(500) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paused_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  total_duration_minutes INTEGER DEFAULT 0,
  outcome VARCHAR(20) CHECK (outcome IN ('completed', 'paused', 'deferred', 'abandoned')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- COO Preferences - User settings for the COO
CREATE TABLE IF NOT EXISTS coo_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  morning_briefing_time TIME DEFAULT '08:00',
  evening_summary_time TIME DEFAULT '18:00',
  max_priorities INTEGER DEFAULT 3 CHECK (max_priorities >= 1 AND max_priorities <= 10),
  push_intensity VARCHAR(20) DEFAULT 'medium' CHECK (push_intensity IN ('gentle', 'medium', 'aggressive')),
  preferred_model VARCHAR(20) DEFAULT 'opus' CHECK (preferred_model IN ('opus', 'gemini', 'both')),
  timezone VARCHAR(50) DEFAULT 'America/Chicago',
  briefing_enabled BOOLEAN DEFAULT true,
  accountability_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

-- COO Accountability Log - Track deferrals and completion patterns
CREATE TABLE IF NOT EXISTS coo_accountability_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
    'priority_accepted', 'priority_modified', 'priority_completed',
    'priority_deferred', 'focus_started', 'focus_paused', 
    'focus_completed', 'checkin_sent', 'checkin_acknowledged'
  )),
  priority_id UUID REFERENCES coo_priorities(id) ON DELETE SET NULL,
  session_id UUID REFERENCES coo_focus_sessions(id) ON DELETE SET NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for COO tables
CREATE INDEX IF NOT EXISTS idx_coo_priorities_user_date ON coo_priorities(tenant_id, user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_coo_priorities_date ON coo_priorities(tenant_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_coo_focus_sessions_user ON coo_focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_coo_focus_sessions_priority ON coo_focus_sessions(priority_id);
CREATE INDEX IF NOT EXISTS idx_coo_focus_sessions_started ON coo_focus_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_coo_accountability_user ON coo_accountability_log(user_id);
CREATE INDEX IF NOT EXISTS idx_coo_accountability_created ON coo_accountability_log(created_at DESC);

-- Enable RLS on COO tables
ALTER TABLE coo_priorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE coo_focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coo_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE coo_accountability_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for COO tables
DROP POLICY IF EXISTS "COO priorities tenant+user access" ON coo_priorities;
CREATE POLICY "COO priorities tenant+user access" ON coo_priorities
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = coo_priorities.tenant_id AND m.user_id = auth.uid())
    AND coo_priorities.user_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = coo_priorities.tenant_id AND m.user_id = auth.uid())
    AND coo_priorities.user_id = auth.uid()
  );

DROP POLICY IF EXISTS "COO focus tenant+user access" ON coo_focus_sessions;
CREATE POLICY "COO focus tenant+user access" ON coo_focus_sessions
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = coo_focus_sessions.tenant_id AND m.user_id = auth.uid())
    AND coo_focus_sessions.user_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = coo_focus_sessions.tenant_id AND m.user_id = auth.uid())
    AND coo_focus_sessions.user_id = auth.uid()
  );

DROP POLICY IF EXISTS "COO preferences tenant+user access" ON coo_preferences;
CREATE POLICY "COO preferences tenant+user access" ON coo_preferences
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = coo_preferences.tenant_id AND m.user_id = auth.uid())
    AND coo_preferences.user_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = coo_preferences.tenant_id AND m.user_id = auth.uid())
    AND coo_preferences.user_id = auth.uid()
  );

DROP POLICY IF EXISTS "COO accountability tenant+user access" ON coo_accountability_log;
CREATE POLICY "COO accountability tenant+user access" ON coo_accountability_log
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = coo_accountability_log.tenant_id AND m.user_id = auth.uid())
    AND coo_accountability_log.user_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = coo_accountability_log.tenant_id AND m.user_id = auth.uid())
    AND coo_accountability_log.user_id = auth.uid()
  );

-- Triggers for updated_at on COO tables
DROP TRIGGER IF EXISTS update_coo_preferences_updated_at ON coo_preferences;
CREATE TRIGGER update_coo_preferences_updated_at
  BEFORE UPDATE ON coo_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
