-- Recurring task instances - ensure idempotent generation
-- Migration: 2026-01-29

CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_parent_do_date_unique
  ON tasks (parent_task_id, do_date)
  WHERE parent_task_id IS NOT NULL AND do_date IS NOT NULL;
