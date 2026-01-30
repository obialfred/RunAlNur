-- =============================================================================
-- RUNALNUR PRODUCTION DATABASE FIX - PASTE AND RUN ONCE
-- =============================================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Update trigger function (needed by several tables)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TENANTS & MEMBERSHIPS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tenant_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

-- Seed default tenant if empty
INSERT INTO public.tenants (id, name, slug)
SELECT 'a0000000-0000-0000-0000-000000000001', 'House Al Nur', 'house-al-nur'
WHERE NOT EXISTS (SELECT 1 FROM public.tenants LIMIT 1);

-- =============================================================================
-- FOCUS BLOCKS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS focus_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  context VARCHAR(50) NOT NULL DEFAULT 'other',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  timezone VARCHAR(50) DEFAULT 'America/Chicago',
  recurrence_rule TEXT,
  recurrence_end_date DATE,
  parent_block_id UUID REFERENCES focus_blocks(id) ON DELETE CASCADE,
  color VARCHAR(7),
  google_event_id TEXT,
  google_calendar_id TEXT,
  last_synced_at TIMESTAMPTZ,
  sync_status VARCHAR(20) DEFAULT 'pending',
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Add tenant_id to focus_blocks
ALTER TABLE focus_blocks ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- =============================================================================
-- TASKS TABLE COLUMNS
-- =============================================================================
-- Core columns
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'todo';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Scheduling columns
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS context TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS do_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 30;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS scheduled_block_id UUID;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority_level TEXT DEFAULT 'p3';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS committed_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS auto_schedule BOOLEAN DEFAULT true;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_rule TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_task_id UUID;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS scheduling_metadata JSONB DEFAULT '{}';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Make project_id nullable
ALTER TABLE tasks ALTER COLUMN project_id DROP NOT NULL;

-- =============================================================================
-- CONTACTS TABLE COLUMNS
-- =============================================================================
DO $$ BEGIN
  IF to_regclass('public.contacts') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE contacts ADD COLUMN IF NOT EXISTS tenant_id UUID';
    EXECUTE 'ALTER TABLE contacts ADD COLUMN IF NOT EXISTS owner_id UUID';
    EXECUTE 'ALTER TABLE contacts ADD COLUMN IF NOT EXISTS socials JSONB DEFAULT ''{}''';
    EXECUTE 'ALTER TABLE contacts ADD COLUMN IF NOT EXISTS external_refs JSONB DEFAULT ''{}''';
  END IF;
END $$;

-- =============================================================================
-- PROJECTS TABLE
-- =============================================================================
DO $$ BEGIN
  IF to_regclass('public.projects') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE projects ADD COLUMN IF NOT EXISTS tenant_id UUID';
  END IF;
END $$;

-- =============================================================================
-- BACKFILL TENANT_ID
-- =============================================================================
UPDATE public.tasks 
SET tenant_id = 'a0000000-0000-0000-0000-000000000001' 
WHERE tenant_id IS NULL;

UPDATE public.focus_blocks 
SET tenant_id = 'a0000000-0000-0000-0000-000000000001' 
WHERE tenant_id IS NULL;

DO $$ BEGIN
  IF to_regclass('public.contacts') IS NOT NULL THEN
    EXECUTE 'UPDATE public.contacts SET tenant_id = ''a0000000-0000-0000-0000-000000000001'' WHERE tenant_id IS NULL';
  END IF;
  IF to_regclass('public.projects') IS NOT NULL THEN
    EXECUTE 'UPDATE public.projects SET tenant_id = ''a0000000-0000-0000-0000-000000000001'' WHERE tenant_id IS NULL';
  END IF;
END $$;

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_focus_blocks_user ON focus_blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_blocks_start ON focus_blocks(start_time);
CREATE INDEX IF NOT EXISTS idx_focus_blocks_tenant ON focus_blocks(tenant_id);

CREATE INDEX IF NOT EXISTS idx_tasks_tenant_owner ON tasks(tenant_id, owner_id);
CREATE INDEX IF NOT EXISTS idx_tasks_do_date ON tasks(do_date);
CREATE INDEX IF NOT EXISTS idx_tasks_committed_date ON tasks(committed_date);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_block ON tasks(scheduled_block_id) WHERE scheduled_block_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id) WHERE parent_task_id IS NOT NULL;

-- Unique index for recurring task instances
CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_parent_do_date_unique
  ON tasks (parent_task_id, do_date)
  WHERE parent_task_id IS NOT NULL AND do_date IS NOT NULL;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE focus_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own focus blocks" ON focus_blocks;
CREATE POLICY "Users can manage own focus blocks" ON focus_blocks 
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own tasks" ON tasks;
CREATE POLICY "Users can manage own tasks" ON tasks 
  FOR ALL USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "tenant_read" ON tenants;
CREATE POLICY "tenant_read" ON tenants FOR SELECT USING (true);

DROP POLICY IF EXISTS "membership_read" ON tenant_memberships;
CREATE POLICY "membership_read" ON tenant_memberships 
  FOR SELECT USING (auth.uid() = user_id);

-- =============================================================================
-- TRIGGERS
-- =============================================================================
DROP TRIGGER IF EXISTS update_focus_blocks_updated_at ON focus_blocks;
CREATE TRIGGER update_focus_blocks_updated_at
  BEFORE UPDATE ON focus_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- DONE! Run this query to verify:
-- =============================================================================
SELECT 
  'tenants' as tbl, count(*) from tenants
UNION ALL SELECT 
  'tasks cols', (SELECT count(*) FROM information_schema.columns WHERE table_name='tasks')
UNION ALL SELECT 
  'focus_blocks', (SELECT CASE WHEN to_regclass('public.focus_blocks') IS NOT NULL THEN 1 ELSE 0 END);
