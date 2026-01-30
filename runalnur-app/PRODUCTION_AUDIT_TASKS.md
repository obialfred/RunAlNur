# Task System QA Checklist

## Preconditions
- Supabase migrations applied:
  - `20260122_tasks_v2_scheduling.sql`
  - `20260129_fix_focus_blocks_tenant_id.sql`
  - `20260129_recurring_task_instances.sql`
- Environment:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (required for AI task creation)
  - AI provider key(s): `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` or `GOOGLE_AI_API_KEY`

## Core Task Flows
- [ ] Create task in Tasks UI (Quick Add)
  - [ ] Appears in Backlog
  - [ ] Shows context, priority level, duration
- [ ] Commit task to Today
  - [ ] Moves from Backlog to Today
  - [ ] `do_date` set to today
- [ ] Defer task (Later)
  - [ ] `do_date` updates to tomorrow
  - [ ] Task appears in Upcoming
- [ ] Reschedule task (date + time)
  - [ ] `do_date` updates to target date
  - [ ] If scheduled block exists, block updates to new time

## Auto-Schedule + Focus Blocks
- [ ] Click **Auto-Schedule** on Tasks page
  - [ ] Response toast shows scheduled/unscheduled/at-risk counts
- [ ] Calendar (Week view)
  - [ ] Focus Blocks appear
  - [ ] Weekly hours reflect scheduled blocks
- [ ] Calendar (Month view)
  - [ ] Day cells show blocks and hours
  - [ ] Clicking a day opens Week view for that date
- [ ] Drag/resize Focus Block
  - [ ] Block moves in UI
  - [ ] Persists after refresh
  - [ ] Linked task `do_date` and `duration_minutes` update

## Recurring Tasks
- [ ] Create recurring task in Task Modal using Recurrence Builder
- [ ] Recurring view shows series
- [ ] Generate instances (manual)
  - [ ] Instances appear for next 30 days
- [ ] Pause/Resume series
  - [ ] Paused series does not generate new instances
- [ ] Cron generation (daily)
  - [ ] Instances generated automatically for next 30 days

## AI Task Creation
- [ ] `/api/ai/status` shows provider + service role configured
- [ ] AI Chat: create task request
  - [ ] Task appears in Tasks list
  - [ ] UI shows any missing configuration clearly

## Regression Checks
- [ ] Dashboard Today Panel renders without errors
- [ ] Tasks page tabs work: Today, Backlog, Upcoming, All, Recurring
- [ ] Calendar loads without errors
