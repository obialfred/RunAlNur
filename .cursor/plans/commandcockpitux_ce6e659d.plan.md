---
name: CommandCockpitUX
overview: "Implement a beautiful, mobile-first Today cockpit on Command: tasks + schedule integrated with Context chips (Personal/House/Arms), quick capture, and subtle non-cringe gamification overlay, with explicit UX quality gates."
todos:
  - id: schema-context
    content: Add required task Context + optional focus_block_id schema changes
    status: completed
  - id: today-api
    content: Add Today cockpit hooks/APIs (today tasks + today focus blocks)
    status: completed
    dependencies:
      - schema-context
  - id: today-ui
    content: Build TodayPanel on Command with context chips + task list + next schedule
    status: completed
    dependencies:
      - today-api
  - id: quick-add
    content: Add QuickAddTask with default context + today/tomorrow shortcuts
    status: completed
    dependencies:
      - today-api
  - id: block-task-link
    content: Link tasks to Focus Blocks via BlockEditor UI
    status: completed
    dependencies:
      - schema-context
  - id: quest-overlay
    content: Award points/streaks on task completion and show subtle standing line
    status: completed
    dependencies:
      - today-ui
  - id: polish-pass
    content: "Mobile-first visual polish: spacing, skeletons, empty states, dark mode pass"
    status: completed
    dependencies:
      - today-ui
---

# Beautiful Command Today Cockpit (Tasks + Calendar)

## UX North Star

The Command page should feel like the **Chairman’s daily cockpit**: one glance gives you **what matters today**, one tap lets you **act**, and everything is clearly labeled by **Context** (Personal vs House vs Arms) without account switching.

## Core Decisions

- **Tasks are primary**, Quests are an overlay.
- **Single inbox with required Context**, but the default view is a combined “Today” cockpit.

## Visual + Interaction Quality Gates (non-negotiable)

- **Mobile-first** (iPhone 390×844) is the baseline; desktop enhances, not vice versa.
- **44px+ touch targets** everywhere interactive.
- **No cramped rows**; prefer cards + chips.
- **Fast state feedback**: optimistic UI for check-off, subtle haptics (Capacitor later) and micro-motion.
- **Empty states**: tasteful, directional (“Add your first task”, “Schedule a Focus Block”).
- **Hierarchy**: Today → Next → Later. Avoid dumping everything.
- **Context clarity**: every task visually shows its Context chip; no ambiguity.

## Implementation Plan

### 1) Schema: Context + optional FocusBlock link

- Add `context` to `tasks` (required).
- Add `focus_block_id` to `tasks` (nullable) for light calendar linking.
- Provide a canonical context enum/list: `personal`, `house`, plus arm slugs.
- Files:
- [`/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/supabase/migrations/`](file:///Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/supabase/migrations/)
- [`/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/lib/types.ts`](file:///Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/lib/types.ts)

### 2) Today data layer (fast + scoped)

- Add a “Today” query shape:
- Overdue + due today + optionally “no due date but flagged Today”.
- Include counts per Context.
- Fetch today’s focus blocks in the same panel (list of next blocks).
- Files:
- [`/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/app/api/tasks/route.ts`](file:///Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/app/api/tasks/route.ts)
- [`/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/lib/hooks/useTasks.ts`](file:///Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/lib/hooks/useTasks.ts)
- (new) `runalnur-app/lib/hooks/useTodayCockpit.ts`

### 3) Command page UI: Today cockpit panel

- Add a top-of-page **Today** section with:
- **Top tasks list** (checkbox + title + context chip + due indicator)
- **Quick filters** (All, Personal, House, Arms…)
- **Quick add** (title + context + Today/Tomorrow shortcuts)
- **Next up** schedule list (today’s next focus blocks)
- Use existing design system classes (`agentic-card`, muted borders, subtle shadows) and motion tokens.
- Files:
- [`/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/app/page.tsx`](file:///Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/app/page.tsx)
- (new) `runalnur-app/components/dashboard/TodayPanel.tsx`
- (new) `runalnur-app/components/tasks/TaskRow.tsx`
- (new) `runalnur-app/components/ui/ContextChip.tsx`

### 4) Quick-capture everywhere (frictionless)

- Ensure task creation always sets Context (default = last used).
- Add keyboard-friendly flow on desktop and thumb-friendly on mobile.
- Files:
- (new) `runalnur-app/components/tasks/QuickAddTask.tsx`

### 5) Calendar ↔ Tasks integration (minimal but meaningful)

- In `BlockEditor`, show “Tasks in this block” and allow attaching/unattaching.
- From Today panel, allow “Add to next block” if a block exists.
- Files:
- [`/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/components/calendar/BlockEditor.tsx`](file:///Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/components/calendar/BlockEditor.tsx)

### 6) Quests overlay (subtle)

- On task completion, award standing points quietly.
- In Today panel, show a small “Standing” line (optional expand).
- Files:
- [`/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/lib/gamification/`](file:///Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/lib/gamification/)

### 7) Polish pass (beautiful + intuitive)

- Tight spacing and typography for iPhone.
- Add skeleton loaders for Today panel.
- Confirm dark mode looks perfect.

## Validation

- Add Personal + House tasks → both appear in Today with clear Context chips.
- Quick add is <3 seconds end-to-end.
- Check-off updates immediately and doesn’t jump layout.
- Next focus blocks show and link to Calendar.
- Mobile is comfortable: no clipping, no cramped buttons.