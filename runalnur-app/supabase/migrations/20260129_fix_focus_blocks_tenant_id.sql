-- Fix focus_blocks tenant isolation + backfill
-- Migration: 2026-01-29

-- Ensure tenant_id exists
ALTER TABLE IF EXISTS focus_blocks
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Backfill tenant_id from memberships, fallback to default tenant
DO $$
DECLARE
  default_tenant UUID;
BEGIN
  SELECT id INTO default_tenant FROM tenants WHERE slug = 'house_al_nur';

  IF to_regclass('public.focus_blocks') IS NOT NULL THEN
    WITH memberships AS (
      SELECT DISTINCT ON (user_id) user_id, tenant_id
      FROM tenant_memberships
      ORDER BY user_id, created_at ASC
    )
    UPDATE focus_blocks fb
    SET tenant_id = m.tenant_id
    FROM memberships m
    WHERE fb.tenant_id IS NULL AND fb.user_id = m.user_id;

    IF default_tenant IS NOT NULL THEN
      UPDATE focus_blocks
      SET tenant_id = default_tenant
      WHERE tenant_id IS NULL;
    END IF;
  END IF;
END $$;

-- Enforce NOT NULL if fully backfilled
DO $$
BEGIN
  IF to_regclass('public.focus_blocks') IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM focus_blocks WHERE tenant_id IS NULL) THEN
      RAISE NOTICE 'focus_blocks.tenant_id still NULL; not setting NOT NULL';
    ELSE
      ALTER TABLE focus_blocks ALTER COLUMN tenant_id SET NOT NULL;
    END IF;
  END IF;
END $$;

-- Index for tenant/user queries
CREATE INDEX IF NOT EXISTS idx_focus_blocks_tenant_user
  ON focus_blocks(tenant_id, user_id);

-- Ensure tenant-scoped RLS
ALTER TABLE focus_blocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own focus blocks" ON focus_blocks;
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
