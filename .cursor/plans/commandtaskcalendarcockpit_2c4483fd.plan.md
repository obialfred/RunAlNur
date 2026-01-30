---
name: CommandTaskCalendarCockpit
overview: Make Command the daily cockpit by adding a Today panel that combines tasks and calendar, with a required Context tag (Personal/House/Arms) and light gamification overlay from Quests.
todos:
  - id: schema-context
    content: Add required task Context + optional focus_block_id schema changes
    status: pending
  - id: today-api
    content: Add APIs/hooks to fetch Today tasks + today focus blocks
    status: pending
    dependencies:
      - schema-context
  - id: today-ui
    content: Build TodayPanel on Command page with filters + quick complete
    status: pending
    dependencies:
      - today-api
  - id: quick-add
    content: Add quick task capture with default context + due shortcuts
    status: pending
    dependencies:
      - today-api
  - id: block-task-link
    content: Allow linking tasks to focus blocks and display inside BlockEditor
    status: pending
    dependencies:
      - schema-context
  - id: quest-overlay
    content: Award points/streaks on task completion and show subtle standing in Today
    status: pending
    dependencies:
      - today-ui
  - id: mobile-polish
    content: Mobile-first layout pass for TodayPanel + quick add + filters
    status: pending
    dependencies:
      - today-ui
---

# Command Task + Calendar Daily Cockpit

## Goal

Make Command feel like the daily “Chairman cockpit” by surfacing **Today’s tasks + schedule** in one place, with a clear **Context** system (Personal vs House vs Arms) and Quests as an optional gamification overlay.

## Decisions locked

- **Tasks are primary; Quests are an overlay** (derived rewards/challenges).
- **Single inbox with required Context tag**, Chairman default shows a combined Today view (no account switching).

## Implementation

### 1) Data model: Context + Today queries

- Add a `context` field to tasks (and ensure it’s required in create/edit flows).
- Provide a stable list of contexts: `personal`, `house`, plus existing arms (e.g. `nova`, `janna`, `obx`, etc.).
- Add API helpers to fetch:
- **Today tasks** (due today/overdue + not completed)
- **Upcoming focus blocks** (today)
- Files:
- [`/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/supabase/migrations/`](file:///Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/supabase/migrations/) (new migration)
- [`/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/lib/types.ts`](file:///Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/lib/types.ts)
- [`/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/app/api/tasks/route.ts`](file:///Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/app/api/tasks/route.ts)
- [`/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/app/api/calendar/`](file:///Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/app/api/calendar/)

### 2) Command page: “Today” panel (tasks + schedule)

- Add a **Today** section at the top of Command (`/`) with:
- **Top 5 tasks** (checkbox to complete, quick add)
- **Next focus blocks** (read-only list; tap to open calendar)
- **Context filters** (chips: All, Personal, House, Nova, Janna…)
- Keep it fast: no heavy tables; mobile-first cards.
- Files:
- [`/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/app/page.tsx`](file:///Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/app/page.tsx)
- (new) `runalnur-app/components/dashboard/TodayPanel.tsx`

### 3) Quick-capture: add task from anywhere

- Add a compact “Add task” entry in the Today panel:
- Title
- Context (default = last used)
- Optional due: Today/Tomorrow/Date
- Ensure it uses the same API route and immediately updates Today.
- Files:
- (new) `runalnur-app/components/tasks/QuickAddTask.tsx`
- [`/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/lib/hooks/useTasks.ts`](file:///Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/lib/hooks/useTasks.ts)

### 4) Calendar ↔ Tasks integration (light but real)

- When a Focus Block exists, allow attaching tasks to it (soft link):
- Minimal: store `focus_block_id` on tasks (nullable)
- Show “Tasks in this block” inside the block editor
- Files:
- [`/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/components/calendar/BlockEditor.tsx`](file:///Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/components/calendar/BlockEditor.tsx)
- (migration) add `focus_block_id` to tasks

### 5) Quests overlay (non-cringe)

- Auto-award points/streak updates when completing tasks (based on domain/context).
- Command Today panel shows a subtle “Standing” line (no big gamified UI unless opened).
- Files:
- [`/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/lib/gamification/`](file:///Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/lib/gamification/)
- [`/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/app/api/tasks/[id]/route.ts`](file:///Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/app/api/tasks/[id]/route.ts) (on complete)

### 6) Mobile-first polish

- Ensure Today panel + filters + quick add fit perfectly on iPhone.
- Ensure all touch targets are 44px+.

## Validation

- On iPhone:
- Add a Personal task and a House task; both show in Today with correct context chips.
- Complete a task from Today.
- See today’s Focus Blocks; tap opens calendar.
- Optional: attach tasks to a Focus Block in block editor.