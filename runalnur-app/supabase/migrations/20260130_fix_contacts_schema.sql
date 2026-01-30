-- Migration: Fix contacts and tasks table schema
-- Date: 2026-01-30
-- Description: Add missing columns and fix constraints that the code expects

-- ============================================================================
-- CONTACTS TABLE FIXES
-- ============================================================================

-- Add socials column if missing
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS socials JSONB DEFAULT '{}'::jsonb;

-- Add external_refs column if missing  
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS external_refs JSONB DEFAULT '{}'::jsonb;

-- Add tenant_id column if missing (for multi-tenant support)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Add owner_id column if missing (for user ownership)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Backfill tenant_id to default tenant for any existing contacts
DO $$
DECLARE
  t_id UUID;
BEGIN
  SELECT id INTO t_id FROM tenants WHERE slug = 'house_al_nur';
  IF t_id IS NOT NULL THEN
    UPDATE contacts SET tenant_id = t_id WHERE tenant_id IS NULL;
  END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_contacts_tenant_owner ON contacts(tenant_id, owner_id);

-- ============================================================================
-- TASKS TABLE FIXES
-- ============================================================================

-- Make project_id nullable (for inbox tasks without a project)
ALTER TABLE tasks ALTER COLUMN project_id DROP NOT NULL;

-- Add context column if missing (stores arm_id for filtering)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS context TEXT;

-- Add tenant_id column if missing
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Add owner_id column if missing
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Backfill tenant_id for existing tasks
DO $$
DECLARE
  t_id UUID;
BEGIN
  SELECT id INTO t_id FROM tenants WHERE slug = 'house_al_nur';
  IF t_id IS NOT NULL THEN
    UPDATE tasks SET tenant_id = t_id WHERE tenant_id IS NULL;
  END IF;
END $$;

-- Create index for tasks
CREATE INDEX IF NOT EXISTS idx_tasks_tenant_owner ON tasks(tenant_id, owner_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
