-- Tenant / Org isolation (top-level boundary)
-- Migration: 2026-01-20
-- Description:
-- 1) Add tenants + tenant_memberships
-- 2) Add tenant_id to tenant-scoped tables
-- 3) Backfill to default tenant (house_al_nur)
-- 4) Update uniqueness constraints to include tenant_id where appropriate
-- 5) Add tenant-aware RLS policies (member + per-user ownership where applicable)

-- ============================================================================
-- TENANTS
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
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_memberships_user ON tenant_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_memberships_tenant ON tenant_memberships(tenant_id);

-- Seed default tenant (House Al Nur)
INSERT INTO tenants (slug, name)
VALUES ('house_al_nur', 'House Al Nur')
ON CONFLICT (slug) DO NOTHING;

-- Ensure every existing auth user is a member of the default tenant.
DO $$
DECLARE
  t_id UUID;
  owner_user UUID;
BEGIN
  SELECT id INTO t_id FROM tenants WHERE slug = 'house_al_nur';
  IF t_id IS NULL THEN
    RAISE EXCEPTION 'Default tenant house_al_nur missing';
  END IF;

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
-- TENANT COLUMN ADDITIONS (idempotent)
-- ============================================================================
-- Core app tables (defined in schema.sql)
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE IF EXISTS user_integrations ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE IF EXISTS projects ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE IF EXISTS tasks ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE IF EXISTS contacts ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE IF EXISTS activities ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE IF EXISTS notifications ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE IF EXISTS device_tokens ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE IF EXISTS approvals ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE IF EXISTS attachments ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE IF EXISTS properties ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE IF EXISTS renovation_phases ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE IF EXISTS vendors ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE IF EXISTS sops ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE IF EXISTS sop_runs ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE IF EXISTS clickup_mappings ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE IF EXISTS oauth_states ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- COO tables
ALTER TABLE IF EXISTS coo_priorities ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE IF EXISTS coo_focus_sessions ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE IF EXISTS coo_preferences ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE IF EXISTS coo_accountability_log ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Influence + Knowledge + Calendar/Quests tables
ALTER TABLE IF EXISTS influence_followups ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE IF EXISTS knowledge_base ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE IF EXISTS deadlines ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE IF EXISTS milestones ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE IF EXISTS ai_pending_actions ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE IF EXISTS focus_blocks ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE IF EXISTS employee_shifts ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE IF EXISTS standing_points ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE IF EXISTS quests ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE IF EXISTS achievements ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE IF EXISTS quest_completions ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE IF EXISTS calendar_sync_config ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- ============================================================================
-- BACKFILL tenant_id to default tenant (only where NULL)
-- ============================================================================
DO $$
DECLARE
  t_id UUID;
BEGIN
  SELECT id INTO t_id FROM tenants WHERE slug = 'house_al_nur';

  -- Backfill tenant_id for any existing rows (guarded so this migration stays idempotent)
  IF to_regclass('public.profiles') IS NOT NULL THEN
    EXECUTE 'UPDATE profiles SET tenant_id = $1 WHERE tenant_id IS NULL' USING t_id;
  END IF;

  IF to_regclass('public.user_integrations') IS NOT NULL THEN
    EXECUTE 'UPDATE user_integrations SET tenant_id = $1 WHERE tenant_id IS NULL' USING t_id;
  END IF;
  IF to_regclass('public.projects') IS NOT NULL THEN
    EXECUTE 'UPDATE projects SET tenant_id = $1 WHERE tenant_id IS NULL' USING t_id;
  END IF;
  IF to_regclass('public.tasks') IS NOT NULL THEN
    EXECUTE 'UPDATE tasks SET tenant_id = $1 WHERE tenant_id IS NULL' USING t_id;
  END IF;
  IF to_regclass('public.contacts') IS NOT NULL THEN
    EXECUTE 'UPDATE contacts SET tenant_id = $1 WHERE tenant_id IS NULL' USING t_id;
  END IF;
  IF to_regclass('public.activities') IS NOT NULL THEN
    EXECUTE 'UPDATE activities SET tenant_id = $1 WHERE tenant_id IS NULL' USING t_id;
  END IF;
  IF to_regclass('public.notifications') IS NOT NULL THEN
    EXECUTE 'UPDATE notifications SET tenant_id = $1 WHERE tenant_id IS NULL' USING t_id;
  END IF;
  IF to_regclass('public.device_tokens') IS NOT NULL THEN
    EXECUTE 'UPDATE device_tokens SET tenant_id = $1 WHERE tenant_id IS NULL' USING t_id;
  END IF;
  IF to_regclass('public.approvals') IS NOT NULL THEN
    EXECUTE 'UPDATE approvals SET tenant_id = $1 WHERE tenant_id IS NULL' USING t_id;
  END IF;
  IF to_regclass('public.attachments') IS NOT NULL THEN
    EXECUTE 'UPDATE attachments SET tenant_id = $1 WHERE tenant_id IS NULL' USING t_id;
  END IF;
  IF to_regclass('public.properties') IS NOT NULL THEN
    EXECUTE 'UPDATE properties SET tenant_id = $1 WHERE tenant_id IS NULL' USING t_id;
  END IF;
  IF to_regclass('public.renovation_phases') IS NOT NULL THEN
    EXECUTE 'UPDATE renovation_phases SET tenant_id = $1 WHERE tenant_id IS NULL' USING t_id;
  END IF;
  IF to_regclass('public.vendors') IS NOT NULL THEN
    EXECUTE 'UPDATE vendors SET tenant_id = $1 WHERE tenant_id IS NULL' USING t_id;
  END IF;
  IF to_regclass('public.deals') IS NOT NULL THEN
    EXECUTE 'UPDATE deals SET tenant_id = $1 WHERE tenant_id IS NULL' USING t_id;
  END IF;
  IF to_regclass('public.sops') IS NOT NULL THEN
    EXECUTE 'UPDATE sops SET tenant_id = $1 WHERE tenant_id IS NULL' USING t_id;
  END IF;
  IF to_regclass('public.sop_runs') IS NOT NULL THEN
    EXECUTE 'UPDATE sop_runs SET tenant_id = $1 WHERE tenant_id IS NULL' USING t_id;
  END IF;
  IF to_regclass('public.clickup_mappings') IS NOT NULL THEN
    EXECUTE 'UPDATE clickup_mappings SET tenant_id = $1 WHERE tenant_id IS NULL' USING t_id;
  END IF;
  IF to_regclass('public.oauth_states') IS NOT NULL THEN
    EXECUTE 'UPDATE oauth_states SET tenant_id = $1 WHERE tenant_id IS NULL' USING t_id;
  END IF;

  IF to_regclass('public.coo_priorities') IS NOT NULL THEN
    EXECUTE 'UPDATE coo_priorities SET tenant_id = $1 WHERE tenant_id IS NULL' USING t_id;
  END IF;
  IF to_regclass('public.coo_focus_sessions') IS NOT NULL THEN
    EXECUTE 'UPDATE coo_focus_sessions SET tenant_id = $1 WHERE tenant_id IS NULL' USING t_id;
  END IF;
  IF to_regclass('public.coo_preferences') IS NOT NULL THEN
    EXECUTE 'UPDATE coo_preferences SET tenant_id = $1 WHERE tenant_id IS NULL' USING t_id;
  END IF;
  IF to_regclass('public.coo_accountability_log') IS NOT NULL THEN
    EXECUTE 'UPDATE coo_accountability_log SET tenant_id = $1 WHERE tenant_id IS NULL' USING t_id;
  END IF;

  IF to_regclass('public.influence_followups') IS NOT NULL THEN
    EXECUTE 'UPDATE influence_followups SET tenant_id = $1 WHERE tenant_id IS NULL' USING t_id;
  END IF;
  IF to_regclass('public.knowledge_base') IS NOT NULL THEN
    EXECUTE 'UPDATE knowledge_base SET tenant_id = $1 WHERE tenant_id IS NULL' USING t_id;
  END IF;
  IF to_regclass('public.deadlines') IS NOT NULL THEN
    EXECUTE 'UPDATE deadlines SET tenant_id = $1 WHERE tenant_id IS NULL' USING t_id;
  END IF;
  IF to_regclass('public.milestones') IS NOT NULL THEN
    EXECUTE 'UPDATE milestones SET tenant_id = $1 WHERE tenant_id IS NULL' USING t_id;
  END IF;
  IF to_regclass('public.ai_pending_actions') IS NOT NULL THEN
    EXECUTE 'UPDATE ai_pending_actions SET tenant_id = $1 WHERE tenant_id IS NULL' USING t_id;
  END IF;
  IF to_regclass('public.focus_blocks') IS NOT NULL THEN
    EXECUTE 'UPDATE focus_blocks SET tenant_id = $1 WHERE tenant_id IS NULL' USING t_id;
  END IF;
  IF to_regclass('public.employee_shifts') IS NOT NULL THEN
    EXECUTE 'UPDATE employee_shifts SET tenant_id = $1 WHERE tenant_id IS NULL' USING t_id;
  END IF;
  IF to_regclass('public.standing_points') IS NOT NULL THEN
    EXECUTE 'UPDATE standing_points SET tenant_id = $1 WHERE tenant_id IS NULL' USING t_id;
  END IF;
  IF to_regclass('public.quests') IS NOT NULL THEN
    EXECUTE 'UPDATE quests SET tenant_id = $1 WHERE tenant_id IS NULL' USING t_id;
  END IF;
  IF to_regclass('public.achievements') IS NOT NULL THEN
    EXECUTE 'UPDATE achievements SET tenant_id = $1 WHERE tenant_id IS NULL' USING t_id;
  END IF;
  IF to_regclass('public.quest_completions') IS NOT NULL THEN
    EXECUTE 'UPDATE quest_completions SET tenant_id = $1 WHERE tenant_id IS NULL' USING t_id;
  END IF;
  IF to_regclass('public.calendar_sync_config') IS NOT NULL THEN
    EXECUTE 'UPDATE calendar_sync_config SET tenant_id = $1 WHERE tenant_id IS NULL' USING t_id;
  END IF;
END $$;

-- ============================================================================
-- ENFORCE NOT NULL where applicable (core isolation boundary)
-- ============================================================================
ALTER TABLE IF EXISTS projects ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE IF EXISTS tasks ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE IF EXISTS contacts ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE IF EXISTS activities ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE IF EXISTS deals ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE IF EXISTS properties ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE IF EXISTS user_integrations ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE IF EXISTS clickup_mappings ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE IF EXISTS oauth_states ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE IF EXISTS notifications ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE IF EXISTS device_tokens ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE IF EXISTS approvals ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE IF EXISTS attachments ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE IF EXISTS renovation_phases ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE IF EXISTS vendors ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE IF EXISTS sops ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE IF EXISTS sop_runs ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE IF EXISTS coo_priorities ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE IF EXISTS coo_focus_sessions ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE IF EXISTS coo_preferences ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE IF EXISTS coo_accountability_log ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE IF EXISTS influence_followups ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE IF EXISTS knowledge_base ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE IF EXISTS deadlines ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE IF EXISTS milestones ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE IF EXISTS ai_pending_actions ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE IF EXISTS focus_blocks ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE IF EXISTS employee_shifts ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE IF EXISTS standing_points ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE IF EXISTS quests ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE IF EXISTS achievements ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE IF EXISTS quest_completions ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE IF EXISTS calendar_sync_config ALTER COLUMN tenant_id SET NOT NULL;

-- ============================================================================
-- UNIQUENESS CONSTRAINTS (include tenant_id)
-- ============================================================================
-- user_integrations: allow per-tenant connections
ALTER TABLE IF EXISTS user_integrations
  DROP CONSTRAINT IF EXISTS user_integrations_user_id_provider_key;
ALTER TABLE IF EXISTS user_integrations
  ADD CONSTRAINT user_integrations_tenant_user_provider_key UNIQUE (tenant_id, user_id, provider);

-- clickup_mappings: allow per-tenant mappings
ALTER TABLE IF EXISTS clickup_mappings
  DROP CONSTRAINT IF EXISTS clickup_mappings_user_id_arm_id_key;
ALTER TABLE IF EXISTS clickup_mappings
  ADD CONSTRAINT clickup_mappings_tenant_user_arm_key UNIQUE (tenant_id, user_id, arm_id);

-- device_tokens: per-tenant per platform per user
ALTER TABLE IF EXISTS device_tokens
  DROP CONSTRAINT IF EXISTS device_tokens_user_id_platform_key;
ALTER TABLE IF EXISTS device_tokens
  ADD CONSTRAINT device_tokens_tenant_user_platform_key UNIQUE (tenant_id, user_id, platform);

-- coo_priorities: per-tenant daily record
ALTER TABLE IF EXISTS coo_priorities
  DROP CONSTRAINT IF EXISTS coo_priorities_user_id_date_key;
ALTER TABLE IF EXISTS coo_priorities
  ADD CONSTRAINT coo_priorities_tenant_user_date_key UNIQUE (tenant_id, user_id, date);

-- coo_preferences: per-tenant preferences per user
ALTER TABLE IF EXISTS coo_preferences
  DROP CONSTRAINT IF EXISTS coo_preferences_user_id_key;
ALTER TABLE IF EXISTS coo_preferences
  ADD CONSTRAINT coo_preferences_tenant_user_key UNIQUE (tenant_id, user_id);

-- calendar_sync_config: per-tenant per user
ALTER TABLE IF EXISTS calendar_sync_config
  DROP CONSTRAINT IF EXISTS calendar_sync_config_user_id_key;
ALTER TABLE IF EXISTS calendar_sync_config
  ADD CONSTRAINT calendar_sync_config_tenant_user_key UNIQUE (tenant_id, user_id);

-- standing_points: per-tenant per domain
ALTER TABLE IF EXISTS standing_points
  DROP CONSTRAINT IF EXISTS standing_points_user_id_domain_key;
ALTER TABLE IF EXISTS standing_points
  ADD CONSTRAINT standing_points_tenant_user_domain_key UNIQUE (tenant_id, user_id, domain);

-- ============================================================================
-- INDEXES (tenant_id first)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_projects_tenant_owner ON projects(tenant_id, owner_id);
CREATE INDEX IF NOT EXISTS idx_tasks_tenant_owner ON tasks(tenant_id, owner_id);
CREATE INDEX IF NOT EXISTS idx_contacts_tenant_owner ON contacts(tenant_id, owner_id);
CREATE INDEX IF NOT EXISTS idx_activities_tenant_user ON activities(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_tenant_user ON user_integrations(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_clickup_mappings_tenant_user_arm ON clickup_mappings(tenant_id, user_id, arm_id);
CREATE INDEX IF NOT EXISTS idx_influence_followups_tenant_user_due ON influence_followups(tenant_id, user_id, due_at);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_tenant_user ON knowledge_base(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_config_tenant_user ON calendar_sync_config(tenant_id, user_id);

-- ============================================================================
-- RLS: tenant-aware helper views (implemented via policies)
-- ============================================================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_memberships ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DROP LEGACY (non-tenant) POLICIES (idempotent)
-- ============================================================================
-- From schema.sql
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can manage own integrations" ON user_integrations;
DROP POLICY IF EXISTS "Users can manage own projects" ON projects;
DROP POLICY IF EXISTS "Users can manage own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can manage own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can read own activities" ON activities;
DROP POLICY IF EXISTS "Users can create activities" ON activities;
DROP POLICY IF EXISTS "Users can manage own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can manage own device tokens" ON device_tokens;
DROP POLICY IF EXISTS "Users can read relevant approvals" ON approvals;
DROP POLICY IF EXISTS "Users can create approval requests" ON approvals;
DROP POLICY IF EXISTS "Users can manage own attachments" ON attachments;
DROP POLICY IF EXISTS "Users can manage own properties" ON properties;
DROP POLICY IF EXISTS "Users can manage phases of own properties" ON renovation_phases;
DROP POLICY IF EXISTS "Users can manage own vendors" ON vendors;
DROP POLICY IF EXISTS "Users can manage own deals" ON deals;
DROP POLICY IF EXISTS "Users can manage own sops" ON sops;
DROP POLICY IF EXISTS "Users can manage runs of own sops" ON sop_runs;
DROP POLICY IF EXISTS "Users can manage own clickup mappings" ON clickup_mappings;
DROP POLICY IF EXISTS "Users can manage own oauth states" ON oauth_states;
DROP POLICY IF EXISTS "Users can manage own coo priorities" ON coo_priorities;
DROP POLICY IF EXISTS "Users can manage own coo focus sessions" ON coo_focus_sessions;
DROP POLICY IF EXISTS "Users can manage own coo preferences" ON coo_preferences;
DROP POLICY IF EXISTS "Users can manage own coo accountability" ON coo_accountability_log;

-- From existing migrations
DROP POLICY IF EXISTS "Users can manage own influence followups" ON influence_followups;
DROP POLICY IF EXISTS "Users can manage own focus blocks" ON focus_blocks;
DROP POLICY IF EXISTS "Users can manage own shifts" ON employee_shifts;
DROP POLICY IF EXISTS "Users can manage own standing" ON standing_points;
DROP POLICY IF EXISTS "Users can manage own quests" ON quests;
DROP POLICY IF EXISTS "Users can manage own achievements" ON achievements;
DROP POLICY IF EXISTS "Users can view own completions" ON quest_completions;
DROP POLICY IF EXISTS "Users can manage own calendar config" ON calendar_sync_config;
DROP POLICY IF EXISTS "Users can manage own knowledge base" ON knowledge_base;
DROP POLICY IF EXISTS "Users can manage own deadlines" ON deadlines;
DROP POLICY IF EXISTS "Users can manage own milestones" ON milestones;
DROP POLICY IF EXISTS "Users can manage own ai pending actions" ON ai_pending_actions;

-- Tenants: members can read their tenant
DROP POLICY IF EXISTS "Members can read tenants" ON tenants;
CREATE POLICY "Members can read tenants" ON tenants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM tenant_memberships m
      WHERE m.tenant_id = tenants.id
        AND m.user_id = auth.uid()
    )
  );

-- Tenants: only owners/admins can modify (bootstrap handled by server)
DROP POLICY IF EXISTS "Owners can manage tenants" ON tenants;
CREATE POLICY "Owners can manage tenants" ON tenants
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM tenant_memberships m
      WHERE m.tenant_id = tenants.id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM tenant_memberships m
      WHERE m.tenant_id = tenants.id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'admin')
    )
  );

-- Memberships: user can read their memberships
DROP POLICY IF EXISTS "Users can read own memberships" ON tenant_memberships;
CREATE POLICY "Users can read own memberships" ON tenant_memberships
  FOR SELECT
  USING (auth.uid() = user_id);

-- Memberships: owners/admins can manage memberships within their tenant
DROP POLICY IF EXISTS "Owners can manage memberships" ON tenant_memberships;
CREATE POLICY "Owners can manage memberships" ON tenant_memberships
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM tenant_memberships m
      WHERE m.tenant_id = tenant_memberships.tenant_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM tenant_memberships m
      WHERE m.tenant_id = tenant_memberships.tenant_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- RLS: tenant-scoped tables (owner/user scoped within tenant)
-- ============================================================================
-- Profiles (tenant-scoped; user can manage their own profile row)
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
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

-- Projects
ALTER TABLE IF EXISTS projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Projects tenant+owner access" ON projects;
CREATE POLICY "Projects tenant+owner access" ON projects
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tenant_memberships m
      WHERE m.tenant_id = projects.tenant_id AND m.user_id = auth.uid()
    )
    AND projects.owner_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenant_memberships m
      WHERE m.tenant_id = projects.tenant_id AND m.user_id = auth.uid()
    )
    AND projects.owner_id = auth.uid()
  );

-- Tasks
ALTER TABLE IF EXISTS tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tasks tenant+owner access" ON tasks;
CREATE POLICY "Tasks tenant+owner access" ON tasks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tenant_memberships m
      WHERE m.tenant_id = tasks.tenant_id AND m.user_id = auth.uid()
    )
    AND tasks.owner_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenant_memberships m
      WHERE m.tenant_id = tasks.tenant_id AND m.user_id = auth.uid()
    )
    AND tasks.owner_id = auth.uid()
  );

-- Contacts
ALTER TABLE IF EXISTS contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Contacts tenant+owner access" ON contacts;
CREATE POLICY "Contacts tenant+owner access" ON contacts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tenant_memberships m
      WHERE m.tenant_id = contacts.tenant_id AND m.user_id = auth.uid()
    )
    AND contacts.owner_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenant_memberships m
      WHERE m.tenant_id = contacts.tenant_id AND m.user_id = auth.uid()
    )
    AND contacts.owner_id = auth.uid()
  );

-- Activities (user-scoped within tenant)
ALTER TABLE IF EXISTS activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Activities tenant+user access" ON activities;
CREATE POLICY "Activities tenant+user access" ON activities
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tenant_memberships m
      WHERE m.tenant_id = activities.tenant_id AND m.user_id = auth.uid()
    )
    AND activities.user_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenant_memberships m
      WHERE m.tenant_id = activities.tenant_id AND m.user_id = auth.uid()
    )
    AND activities.user_id = auth.uid()
  );

-- Deals (owner-scoped within tenant)
ALTER TABLE IF EXISTS deals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Deals tenant+owner access" ON deals;
CREATE POLICY "Deals tenant+owner access" ON deals
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tenant_memberships m
      WHERE m.tenant_id = deals.tenant_id AND m.user_id = auth.uid()
    )
    AND deals.owner_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenant_memberships m
      WHERE m.tenant_id = deals.tenant_id AND m.user_id = auth.uid()
    )
    AND deals.owner_id = auth.uid()
  );

-- Properties (owner-scoped within tenant)
ALTER TABLE IF EXISTS properties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Properties tenant+owner access" ON properties;
CREATE POLICY "Properties tenant+owner access" ON properties
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tenant_memberships m
      WHERE m.tenant_id = properties.tenant_id AND m.user_id = auth.uid()
    )
    AND properties.owner_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenant_memberships m
      WHERE m.tenant_id = properties.tenant_id AND m.user_id = auth.uid()
    )
    AND properties.owner_id = auth.uid()
  );

-- User integrations (user-scoped within tenant)
ALTER TABLE IF EXISTS user_integrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User integrations tenant+user access" ON user_integrations;
CREATE POLICY "User integrations tenant+user access" ON user_integrations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tenant_memberships m
      WHERE m.tenant_id = user_integrations.tenant_id AND m.user_id = auth.uid()
    )
    AND user_integrations.user_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenant_memberships m
      WHERE m.tenant_id = user_integrations.tenant_id AND m.user_id = auth.uid()
    )
    AND user_integrations.user_id = auth.uid()
  );

-- ClickUp mappings (user-scoped within tenant)
ALTER TABLE IF EXISTS clickup_mappings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ClickUp mappings tenant+user access" ON clickup_mappings;
CREATE POLICY "ClickUp mappings tenant+user access" ON clickup_mappings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tenant_memberships m
      WHERE m.tenant_id = clickup_mappings.tenant_id AND m.user_id = auth.uid()
    )
    AND clickup_mappings.user_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenant_memberships m
      WHERE m.tenant_id = clickup_mappings.tenant_id AND m.user_id = auth.uid()
    )
    AND clickup_mappings.user_id = auth.uid()
  );

-- OAuth states (user-scoped within tenant)
ALTER TABLE IF EXISTS oauth_states ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "OAuth states tenant+user access" ON oauth_states;
CREATE POLICY "OAuth states tenant+user access" ON oauth_states
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tenant_memberships m
      WHERE m.tenant_id = oauth_states.tenant_id AND m.user_id = auth.uid()
    )
    AND oauth_states.user_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenant_memberships m
      WHERE m.tenant_id = oauth_states.tenant_id AND m.user_id = auth.uid()
    )
    AND oauth_states.user_id = auth.uid()
  );

-- COO tables (user-scoped within tenant)
ALTER TABLE IF EXISTS coo_priorities ENABLE ROW LEVEL SECURITY;
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

ALTER TABLE IF EXISTS coo_focus_sessions ENABLE ROW LEVEL SECURITY;
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

ALTER TABLE IF EXISTS coo_preferences ENABLE ROW LEVEL SECURITY;
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

ALTER TABLE IF EXISTS coo_accountability_log ENABLE ROW LEVEL SECURITY;
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

-- Influence followups (user-scoped within tenant)
ALTER TABLE IF EXISTS influence_followups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Influence followups tenant+user access" ON influence_followups;
CREATE POLICY "Influence followups tenant+user access" ON influence_followups
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = influence_followups.tenant_id AND m.user_id = auth.uid())
    AND influence_followups.user_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = influence_followups.tenant_id AND m.user_id = auth.uid())
    AND influence_followups.user_id = auth.uid()
  );

-- Knowledge base (user-scoped within tenant)
ALTER TABLE IF EXISTS knowledge_base ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Knowledge base tenant+user access" ON knowledge_base;
CREATE POLICY "Knowledge base tenant+user access" ON knowledge_base
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = knowledge_base.tenant_id AND m.user_id = auth.uid())
    AND knowledge_base.user_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = knowledge_base.tenant_id AND m.user_id = auth.uid())
    AND knowledge_base.user_id = auth.uid()
  );

-- Calendar sync config (user-scoped within tenant)
ALTER TABLE IF EXISTS calendar_sync_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Calendar config tenant+user access" ON calendar_sync_config;
CREATE POLICY "Calendar config tenant+user access" ON calendar_sync_config
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = calendar_sync_config.tenant_id AND m.user_id = auth.uid())
    AND calendar_sync_config.user_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = calendar_sync_config.tenant_id AND m.user_id = auth.uid())
    AND calendar_sync_config.user_id = auth.uid()
  );

-- Notifications (user-scoped within tenant)
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;
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

-- Device tokens (user-scoped within tenant)
ALTER TABLE IF EXISTS device_tokens ENABLE ROW LEVEL SECURITY;
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

-- Approvals (visible to requester or approver within tenant)
ALTER TABLE IF EXISTS approvals ENABLE ROW LEVEL SECURITY;
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

-- Attachments (owner-scoped within tenant)
ALTER TABLE IF EXISTS attachments ENABLE ROW LEVEL SECURITY;
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

-- Renovation phases (scoped via parent property ownership + tenant)
ALTER TABLE IF EXISTS renovation_phases ENABLE ROW LEVEL SECURITY;
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

-- Vendors (owner-scoped within tenant)
ALTER TABLE IF EXISTS vendors ENABLE ROW LEVEL SECURITY;
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

-- SOPs (owner-scoped within tenant)
ALTER TABLE IF EXISTS sops ENABLE ROW LEVEL SECURITY;
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

-- SOP runs (scoped via parent SOP ownership + tenant)
ALTER TABLE IF EXISTS sop_runs ENABLE ROW LEVEL SECURITY;
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

-- Deadlines (user-scoped within tenant)
ALTER TABLE IF EXISTS deadlines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Deadlines tenant+user access" ON deadlines;
CREATE POLICY "Deadlines tenant+user access" ON deadlines
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = deadlines.tenant_id AND m.user_id = auth.uid())
    AND deadlines.user_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = deadlines.tenant_id AND m.user_id = auth.uid())
    AND deadlines.user_id = auth.uid()
  );

-- Milestones (user-scoped within tenant)
ALTER TABLE IF EXISTS milestones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Milestones tenant+user access" ON milestones;
CREATE POLICY "Milestones tenant+user access" ON milestones
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = milestones.tenant_id AND m.user_id = auth.uid())
    AND milestones.user_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = milestones.tenant_id AND m.user_id = auth.uid())
    AND milestones.user_id = auth.uid()
  );

-- AI pending actions (user-scoped within tenant)
ALTER TABLE IF EXISTS ai_pending_actions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "AI pending actions tenant+user access" ON ai_pending_actions;
CREATE POLICY "AI pending actions tenant+user access" ON ai_pending_actions
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = ai_pending_actions.tenant_id AND m.user_id = auth.uid())
    AND ai_pending_actions.user_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = ai_pending_actions.tenant_id AND m.user_id = auth.uid())
    AND ai_pending_actions.user_id = auth.uid()
  );

-- Focus blocks (user-scoped within tenant)
ALTER TABLE IF EXISTS focus_blocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Focus blocks tenant+user access" ON focus_blocks;
CREATE POLICY "Focus blocks tenant+user access" ON focus_blocks
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = focus_blocks.tenant_id AND m.user_id = auth.uid())
    AND focus_blocks.user_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = focus_blocks.tenant_id AND m.user_id = auth.uid())
    AND focus_blocks.user_id = auth.uid()
  );

-- Employee shifts (employee-scoped within tenant)
ALTER TABLE IF EXISTS employee_shifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Employee shifts tenant+employee access" ON employee_shifts;
CREATE POLICY "Employee shifts tenant+employee access" ON employee_shifts
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = employee_shifts.tenant_id AND m.user_id = auth.uid())
    AND employee_shifts.employee_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = employee_shifts.tenant_id AND m.user_id = auth.uid())
    AND employee_shifts.employee_id = auth.uid()
  );

-- Standing points (user-scoped within tenant)
ALTER TABLE IF EXISTS standing_points ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Standing points tenant+user access" ON standing_points;
CREATE POLICY "Standing points tenant+user access" ON standing_points
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = standing_points.tenant_id AND m.user_id = auth.uid())
    AND standing_points.user_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = standing_points.tenant_id AND m.user_id = auth.uid())
    AND standing_points.user_id = auth.uid()
  );

-- Quests (user-scoped within tenant)
ALTER TABLE IF EXISTS quests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Quests tenant+user access" ON quests;
CREATE POLICY "Quests tenant+user access" ON quests
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = quests.tenant_id AND m.user_id = auth.uid())
    AND quests.user_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = quests.tenant_id AND m.user_id = auth.uid())
    AND quests.user_id = auth.uid()
  );

-- Achievements (user-scoped within tenant)
ALTER TABLE IF EXISTS achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Achievements tenant+user access" ON achievements;
CREATE POLICY "Achievements tenant+user access" ON achievements
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = achievements.tenant_id AND m.user_id = auth.uid())
    AND achievements.user_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = achievements.tenant_id AND m.user_id = auth.uid())
    AND achievements.user_id = auth.uid()
  );

-- Quest completions (user-scoped within tenant)
ALTER TABLE IF EXISTS quest_completions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Quest completions tenant+user access" ON quest_completions;
CREATE POLICY "Quest completions tenant+user access" ON quest_completions
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = quest_completions.tenant_id AND m.user_id = auth.uid())
    AND quest_completions.user_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = quest_completions.tenant_id AND m.user_id = auth.uid())
    AND quest_completions.user_id = auth.uid()
  );

