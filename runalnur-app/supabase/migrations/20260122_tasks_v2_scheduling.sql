-- Tasks V2: Enhanced Scheduling (Motion/Sunsama/Reclaim inspired)
-- Migration: 2026-01-22
-- Description:
-- 1) Add do_date (when to work on it) vs due_date (deadline)
-- 2) Add duration_minutes for time estimates
-- 3) Add scheduled_block_id for auto-scheduled Focus Blocks
-- 4) Add P1-P4 priority system (Reclaim-style)
-- 5) Add committed_date for Sunsama-style daily commitment
-- 6) Add auto_schedule flag
-- 7) Add recurrence support for habits

-- 1) Do Date - When to work on the task (AI-calculated)
ALTER TABLE IF EXISTS tasks
  ADD COLUMN IF NOT EXISTS do_date DATE;

-- 2) Duration in minutes (30, 60, 90, 120, etc.)
ALTER TABLE IF EXISTS tasks
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 30;

-- 3) Scheduled block ID - links to auto-created Focus Block
ALTER TABLE IF EXISTS tasks
  ADD COLUMN IF NOT EXISTS scheduled_block_id UUID;

-- Add FK constraint for scheduled_block_id
DO $$
BEGIN
  IF to_regclass('public.focus_blocks') IS NOT NULL THEN
    ALTER TABLE tasks
      DROP CONSTRAINT IF EXISTS tasks_scheduled_block_id_fkey;
    ALTER TABLE tasks
      ADD CONSTRAINT tasks_scheduled_block_id_fkey
      FOREIGN KEY (scheduled_block_id) REFERENCES focus_blocks(id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END $$;

-- 4) Priority level (p1=critical, p2=high, p3=medium, p4=low)
-- We'll keep the existing priority column but add a new one for Reclaim-style
ALTER TABLE IF EXISTS tasks
  ADD COLUMN IF NOT EXISTS priority_level TEXT DEFAULT 'p3'
  CHECK (priority_level IN ('p1', 'p2', 'p3', 'p4'));

-- 5) Committed date - when user committed to do this task (Sunsama backlog concept)
ALTER TABLE IF EXISTS tasks
  ADD COLUMN IF NOT EXISTS committed_date DATE;

-- 6) Auto-schedule flag - let AI schedule this task?
ALTER TABLE IF EXISTS tasks
  ADD COLUMN IF NOT EXISTS auto_schedule BOOLEAN DEFAULT true;

-- 7) Recurrence support for habits
ALTER TABLE IF EXISTS tasks
  ADD COLUMN IF NOT EXISTS recurrence_rule TEXT; -- RRULE format

ALTER TABLE IF EXISTS tasks
  ADD COLUMN IF NOT EXISTS parent_task_id UUID;

-- Add FK for parent_task_id (recurring task instances)
DO $$
BEGIN
  ALTER TABLE tasks
    DROP CONSTRAINT IF EXISTS tasks_parent_task_id_fkey;
  ALTER TABLE tasks
    ADD CONSTRAINT tasks_parent_task_id_fkey
    FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE CASCADE;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END $$;

-- 8) Additional scheduling metadata
ALTER TABLE IF EXISTS tasks
  ADD COLUMN IF NOT EXISTS scheduling_metadata JSONB DEFAULT '{}';

-- Indexes for efficient queries

-- Tasks by do_date (for daily planning)
CREATE INDEX IF NOT EXISTS idx_tasks_tenant_owner_do_date
  ON tasks (tenant_id, owner_id, do_date);

-- Tasks by committed_date (for backlog vs today)
CREATE INDEX IF NOT EXISTS idx_tasks_tenant_owner_committed
  ON tasks (tenant_id, owner_id, committed_date);

-- Tasks by priority level (for sorting)
CREATE INDEX IF NOT EXISTS idx_tasks_tenant_owner_priority
  ON tasks (tenant_id, owner_id, priority_level);

-- Scheduled blocks lookup
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_block
  ON tasks (scheduled_block_id) WHERE scheduled_block_id IS NOT NULL;

-- Recurring tasks
CREATE INDEX IF NOT EXISTS idx_tasks_parent
  ON tasks (parent_task_id) WHERE parent_task_id IS NOT NULL;

-- Auto-schedulable tasks
CREATE INDEX IF NOT EXISTS idx_tasks_auto_schedule
  ON tasks (tenant_id, owner_id, auto_schedule) WHERE auto_schedule = true;

