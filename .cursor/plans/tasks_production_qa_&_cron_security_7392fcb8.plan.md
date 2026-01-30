---
name: Tasks production QA & cron security
overview: "Confirm the task system is not just implemented but truly production-complete by running the end-to-end QA flow on the production Vercel app and fixing the remaining production blocker: the recurring cron route must accept Vercel’s GET invocation and be protected by CRON_SECRET."
todos:
  - id: prod-db-verify-migrations
    content: Verify production Supabase has required task/focus-block/recurrence migrations applied (columns, RLS, and indexes).
    status: in_progress
  - id: secure-cron-and-fix-method
    content: "Update `/app/api/cron/recurring` to support GET and require `Authorization: Bearer ${process.env.CRON_SECRET}`; add CRON_SECRET to Vercel env; validate Vercel cron invocation works."
    status: in_progress
  - id: prod-e2e-task-qa
    content: Run the full production QA flow from `PRODUCTION_AUDIT_TASKS.md` and record any failures with exact reproduction steps.
    status: pending
  - id: fix-any-qa-failures
    content: If QA finds failures (timezone parsing, RLS filtering, focus block/task sync), fix them and re-run the failing QA section until it passes.
    status: pending
isProject: false
---

## Current status (what the model said vs what’s true now)

- The transcript line you’re referencing (“recurring tasks have no UI”) is **outdated**. The repo now includes a Recurring tab + series UI + recurrence builder + instance generation routes.
  - Evidence in code:
    - Recurring view exists in `[runalnur-app/app/tasks/page.tsx](runalnur-app/app/tasks/page.tsx)`.
    - Recurring UI exists in `[runalnur-app/components/tasks/RecurringSeriesItem.tsx](runalnur-app/components/tasks/RecurringSeriesItem.tsx)`.
    - Recurrence builder exists in `[runalnur-app/components/tasks/RecurrenceBuilder.tsx](runalnur-app/components/tasks/RecurrenceBuilder.tsx)`.

## What is “done” vs “not proven yet”

- **Implemented in code** (present now):
  - Create/commit/defer/reschedule flows (`/api/tasks/*` + Tasks UI)
  - Auto-scheduler creates Focus Blocks (`/api/tasks/schedule`) and Calendar Week/Month views exist
  - Recurring series + manual expansion exist (`/api/tasks/recurring/*`) and Vercel cron is configured (`[runalnur-app/vercel.json](runalnur-app/vercel.json)`)
  - AI status endpoint exists (`/api/ai/status`)
- **Not yet “fully done” until verified on production**:
  - Supabase migrations must be applied in the production database (especially focus_blocks tenant_id + recurring unique index)
  - End-to-end QA must pass in production (create → schedule → calendar → drag/resize → recurring → AI create)
  - Cron endpoint must be **secured** and must handle Vercel’s cron invocation method

## Critical production blocker to fix (cron)

Vercel Cron Jobs invoke endpoints with an **HTTP GET** request and (when configured) include `Authorization: Bearer ${CRON_SECRET}`.

- Current file `[runalnur-app/app/api/cron/recurring/route.ts](runalnur-app/app/api/cron/recurring/route.ts)` only exports **POST** and has **no CRON_SECRET check**, so:
  - The cron may not be running at all (method mismatch)
  - The endpoint is not protected (anyone could trigger it)

## Production QA run (what we will execute next)

We’ll run the checklist in `[runalnur-app/PRODUCTION_AUDIT_TASKS.md](runalnur-app/PRODUCTION_AUDIT_TASKS.md)` against the production deployment:

- Tasks:
  - Quick Add task → appears in Backlog
  - Commit to Today → do_date/committed_date set
  - Defer + Reschedule → task updates; if scheduled block exists it moves
- Scheduler + Calendar:
  - Auto-Schedule → creates focus blocks; toast summary shows scheduled/unscheduled/at-risk
  - Calendar Week view shows blocks
  - Drag/move and resize blocks → persists after refresh; linked task do_date/duration updates
  - Calendar Month view shows daily block indicators; clicking a day returns to Week
- Recurring:
  - Create series with Recurrence Builder
  - Generate instances (manual) → next 30 days
  - Pause/Resume prevents generation
  - Cron generation (after cron security fix) produces instances
- AI:
  - `/api/ai/status` reflects configured provider + service role
  - AI chat creates a task that appears in Tasks list

## Database verification (production Supabase)

Before QA, verify these are applied in production:

- `[runalnur-app/supabase/migrations/20260129_fix_focus_blocks_tenant_id.sql](runalnur-app/supabase/migrations/20260129_fix_focus_blocks_tenant_id.sql)`
- `[runalnur-app/supabase/migrations/20260129_recurring_task_instances.sql](runalnur-app/supabase/migrations/20260129_recurring_task_instances.sql)`
- (and the earlier tasks scheduling migration referenced by the checklist) `20260122_tasks_v2_scheduling.sql`

If any are missing, scheduling/blocks/recurrence can silently fail due to missing columns/indexes or RLS.

## Assumptions

- Production is on Vercel, likely `https://runalnur-app.vercel.app` (repo references this), but we’ll use the exact production URL you want when we start execution.

