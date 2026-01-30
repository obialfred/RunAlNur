---
name: command-cockpit-polish
overview: Fix the broken calendar due-date control on the Command home task quick-add, correct mode/sidebars so Influence content pages don’t fall back to the Command sidebar, and do a focused visual + mobile sidebar polish pass (desktop + mobile PWA).
todos:
  - id: fix-quickadd-calendar
    content: Make the Command home quick-add calendar icon open a real date picker and persist due_date.
    status: completed
  - id: fix-mode-routing
    content: Ensure /media and /social are treated as Influence mode so the sidebar doesn’t revert to Command.
    status: completed
  - id: remove-temp-public-routes
    content: Remove TEMP public-route bypasses for /media and /social from middleware once routing is fixed.
    status: completed
  - id: polish-ui
    content: Polish TodayPanel + mobile sidebar spacing/visual alignment based on screenshots.
    status: completed
  - id: verify-build
    content: Run build/lint and do quick smoke checks for calendar picker + mode sidebar + mobile sheet.
    status: completed
---

## What I see in your screenshots (root causes)

- **Calendar icon on Command home task quick-add does nothing**
- The UI shows a calendar glyph beside the due date, but it’s **not interactive**.
- This is in `QuickAddTask` used by `TodayPanel` on the Command home page: [`runalnur-app/components/tasks/QuickAddTask.tsx`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/components/tasks/QuickAddTask.tsx) and [`runalnur-app/components/dashboard/TodayPanel.tsx`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/components/dashboard/TodayPanel.tsx).

- **Sidebar “reverts to Command sidebar” on content sections**
- `ModeProvider` derives mode from the URL: [`runalnur-app/lib/mode/context.tsx`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/lib/mode/context.tsx)
- Today it only treats routes starting with `/capital` and `/influence` as those modes. Everything else becomes `command`.
- Your **Influence media/social pages are routed as `/media` and `/social`**, so the mode becomes `command`, which makes the sidebar display Command navigation.

- **Mobile sidebar slop**
- The sidebar uses a Sheet overlay and a scroll container; we’ll tighten spacing/safe-area handling and reduce visual “washed out”/misaligned elements visible in the screenshots.

## Plan

### 1) Fix the “calendar icon” due-date control on Command home

- Update `QuickAddTask` to make the calendar affordance actually open a date picker.
- Keep it minimal + reliable across mobile/desktop:
- Add an explicit **calendar button** next to Today/Tomorrow/No due.
- Use a native `input[type=date]` (hidden) triggered by that button (best cross-platform reliability in PWA).
- When a date is chosen, display it (and allow clearing).
- Ensure the POST payload continues to use `due_date` and doesn’t break existing APIs.

Files:

- [`runalnur-app/components/tasks/QuickAddTask.tsx`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/components/tasks/QuickAddTask.tsx)
- (If needed) shared small UI helper component for date input.

### 2) Stop mode/sidebar from reverting to Command on Influence content routes

- Decide on the correct routing strategy:
- **Option A (minimal change)**: treat `/media` and `/social` as **Influence mode** in `getModeFromPath()`.
- **Option B (cleaner URL)**: migrate those routes to `/influence/media` and `/influence/social` and add redirects.

Given you want a quick fix, we’ll do **Option A** now.

Files:

- [`runalnur-app/lib/mode/context.tsx`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/lib/mode/context.tsx)
- Possibly sidebar nav active-route logic in [`runalnur-app/components/layout/Sidebar.tsx`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/components/layout/Sidebar.tsx) (only if active highlighting is wrong for `/media`/`/social`).

### 3) Remove the temporary public-route bypass for `/media` and `/social`

- You re-added `/media` and `/social` to `PUBLIC_ROUTES` in `middleware.ts` for UI testing.
- That’s a security bypass and also hides auth bugs.
- After mode routing is fixed, remove those TEMP entries and rely on normal auth gating.

File:

- [`runalnur-app/middleware.ts`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/middleware.ts)

### 4) Visual polish pass on Today panel + mobile sidebar

Target the issues visible in screenshots:

- **Typography/spacing alignment** in the Today card header + chips.
- **Chip overflow and spacing** so it doesn’t look cramped.
- **Task quick-add layout** on desktop: reduce dead space and align the add button; ensure consistent borders.
- **Mobile sidebar**:
- Ensure the sheet uses full safe-area height and consistent padding.
- Confirm scroll performance and remove any layout shifts.

Files:

- [`runalnur-app/components/dashboard/TodayPanel.tsx`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/components/dashboard/TodayPanel.tsx)
- [`runalnur-app/components/layout/LayoutShell.tsx`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/components/layout/LayoutShell.tsx)
- [`runalnur-app/components/layout/Sidebar.tsx`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/components/layout/Sidebar.tsx)
- CSS tweaks in [`runalnur-app/app/globals.css`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/app/globals.css) only if needed.

### 5) Verification

- Run `npm run build` and `npm run lint`.
- Smoke test in browser:
- Command home: calendar icon opens date picker and sets due date.
- Navigate to `/influence/*` and `/media`, `/social`: sidebar stays in Influence mode.
- Mobile viewport: open/close sidebar, verify no visual glitches.