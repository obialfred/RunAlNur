-- Tasks Context + Focus Block linking
-- Migration: 2026-01-21
-- Description:
-- 1) Add required task context (personal/house/arm slugs)
-- 2) Allow tasks without a project_id (inbox-style tasks)
-- 3) Add optional focus_block_id link for calendar integration

-- 1) Context
ALTER TABLE IF EXISTS tasks
  ADD COLUMN IF NOT EXISTS context TEXT NOT NULL DEFAULT 'house';

CREATE INDEX IF NOT EXISTS idx_tasks_tenant_owner_context
  ON tasks (tenant_id, owner_id, context);

-- 2) Allow project_id to be NULL (so you can create personal/inbox tasks)
DO $$
BEGIN
  IF to_regclass('public.tasks') IS NOT NULL THEN
    BEGIN
      ALTER TABLE tasks ALTER COLUMN project_id DROP NOT NULL;
    EXCEPTION
      WHEN undefined_column THEN
        -- project_id doesn't exist; ignore
      WHEN others THEN
        -- If it's already nullable or cannot be altered, ignore for idempotence
        NULL;
    END;
  END IF;
END $$;

-- 3) Focus block link (nullable)
ALTER TABLE IF EXISTS tasks
  ADD COLUMN IF NOT EXISTS focus_block_id UUID;

DO $$
BEGIN
  -- Add FK only if focus_blocks exists
  IF to_regclass('public.focus_blocks') IS NOT NULL THEN
    ALTER TABLE tasks
      DROP CONSTRAINT IF EXISTS tasks_focus_block_id_fkey;
    ALTER TABLE tasks
      ADD CONSTRAINT tasks_focus_block_id_fkey
      FOREIGN KEY (focus_block_id) REFERENCES focus_blocks(id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_tasks_tenant_owner_due
  ON tasks (tenant_id, owner_id, due_date);

CREATE INDEX IF NOT EXISTS idx_tasks_focus_block
  ON tasks (focus_block_id) WHERE focus_block_id IS NOT NULL;

