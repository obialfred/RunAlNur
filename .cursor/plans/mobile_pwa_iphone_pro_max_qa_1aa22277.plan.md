---
name: mobile_pwa_iphone_pro_max_qa
overview: Perform a route-by-route mobile UX audit and remediation focused on iPhone Pro Max dimensions in PWA (standalone) mode, then verify on Vercel production/preview with repeatable QA evidence.
todos:
  - id: qa-matrix
    content: Create route-by-route iPhone Pro Max PWA QA checklist and run through all routes.
    status: pending
  - id: shell-mobile
    content: "Fix global shell: safe areas, scroll containers, top/bottom nav stacking, spacing consistency."
    status: pending
  - id: overlays
    content: "Harden Dialog/Sheet for mobile: max-height, internal scroll, safe-area aware close/headers."
    status: pending
  - id: page-hotspots
    content: Apply responsive refactors to dense pages (calendar, settings, AI, capital/influence/arms) until checklist passes.
    status: pending
  - id: vercel-verify
    content: Verify fixes on Vercel deployment (PWA update behavior + mobile UX re-check).
    status: pending
---

# Mobile PWA Optimization (iPhone Pro Max)

## Goal

- Make the web app **pleasant and correct on mobile**, specifically **iPhone Pro Max** class devices in **PWA standalone** mode.
- Remove “terrible” mobile issues: cramped layouts, horizontal overflow, unusable tables, broken sticky/fixed stacking, modal/sheet overflow, inconsistent spacing/radius, and touch-target problems.
- Ensure fixes are **verifiable** and **don’t regress** other routes.

## Target device baseline

- **Viewport**: 430×932 CSS px (iPhone Pro Max class; matches your existing splash media queries in [`runalnur-app/app/layout.tsx`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/app/layout.tsx)).
- **Mode**: PWA standalone (manifest already sets `"display": "standalone"` in [`runalnur-app/public/manifest.json`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/public/manifest.json)).
- **Safe areas**: respect `env(safe-area-inset-*)` (already partially wired via [`runalnur-app/components/platform/SafeArea.tsx`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/components/platform/SafeArea.tsx) + CSS vars in [`runalnur-app/app/globals.css`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/app/globals.css)).

## QA method (no shortcuts)

- Use a deterministic route inventory (already available via `app/**/page.tsx` list) and execute **route-by-route** QA at the target viewport.
- For each route:
- **Layout**: no horizontal scrolling; content not hidden behind `TopBar`/`MobileNav`; correct safe-area padding; scroll works smoothly.
- **Tap targets**: key controls ≥44px; icon-only buttons have explicit size.
- **Overlays**: `Dialog`/`Sheet` fits within screen, scrolls internally, close controls reachable.
- **Data dense UIs**: tables/grids become cards or horizontal-scroll wrappers.
- Produce an audit artifact (markdown checklist) so it’s obvious what was checked and what changed.

## Route inventory (scope)

- All `56` routes found under [`runalnur-app/app`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/app) including:
- Core: `/`, `/projects`, `/projects/[id]`, `/contacts`, `/calendar`, `/ai`, `/settings`, `/media`, `/social/*`, `/coo/*`, `/influence/*`, `/capital/*`, `/arms/*`, auth routes.

## Implementation approach (high leverage first)

### 1) Fix the global shell for mobile correctness

Primary targets:

- [`runalnur-app/components/layout/LayoutShell.tsx`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/components/layout/LayoutShell.tsx)
- [`runalnur-app/components/layout/TopBar.tsx`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/components/layout/TopBar.tsx)
- [`runalnur-app/components/layout/MobileNav.tsx`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/components/layout/MobileNav.tsx)
- [`runalnur-app/app/globals.css`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/app/globals.css)

Concrete changes (expected):

- Normalize **viewport height + scroll containers** for iOS/PWA to eliminate scroll trapping/jank.
- Ensure content padding accounts for:
- top safe-area and any sticky update banner
- `TopBar` height
- `MobileNav` height + bottom safe-area
- Make mobile-only spacing consistent (reduce wasted padding; prevent clipped content).

### 2) Make overlays (dialogs/sheets) mobile-safe everywhere

Primary targets:

- [`runalnur-app/components/ui/dialog.tsx`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/components/ui/dialog.tsx)
- [`runalnur-app/components/ui/sheet.tsx`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/components/ui/sheet.tsx)

Concrete changes (expected):

- Add safe-area aware max-height + internal scrolling for `DialogContent`.
- Ensure close button is reachable and not under notch.
- Ensure `SheetContent` and nested scroll areas work on iOS (some CSS exists already; we’ll make it consistent and comprehensive).

### 3) Fix the worst offenders page-by-page (responsive refactors)

Pattern-based fixes:

- Replace desktop tables with:
- `.table-responsive` wrappers (already defined) or
- stacked cards on small screens
- Fix grids with `grid-cols-*` to collapse to 1 column under `md`.
- Clamp long titles/IDs with `truncate` / `break-words`.
- Reduce heavy dashboard density on mobile (progressive disclosure, collapsible panels, or “summary-first”).

Candidate hotspots (from file inventory / known dense screens):

- [`runalnur-app/app/calendar/page.tsx`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/app/calendar/page.tsx) + [`runalnur-app/components/calendar/WeekView.tsx`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/components/calendar/WeekView.tsx)
- [`runalnur-app/app/settings/page.tsx`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/app/settings/page.tsx)
- [`runalnur-app/app/ai/page.tsx`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/app/ai/page.tsx) + [`runalnur-app/components/ai/ChatInterface.tsx`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/components/ai/ChatInterface.tsx)
- Capital/Influence dashboards and any page that uses dense panels/widgets.

### 4) Verification on Vercel (production-relevant)

- Run fixes locally, then verify on a Vercel preview/deploy.
- Validate PWA behavior doesn’t “stick” to old assets (PWA config already uses `skipWaiting`/`clientsClaim` in [`runalnur-app/next.config.ts`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/next.config.ts); we’ll still verify update flow and cache busting).

## Test account / data

- Create a dedicated QA account via `/signup`.
- If email confirmation is enabled in Supabase, confirm the QA user in Supabase Auth dashboard for immediate access.
- Seed minimal sample content through the UI (1 project, 1 task, 1 contact) to validate real screens.

## Deliverables

- A mobile QA checklist markdown file committed to the repo (e.g. `runalnur-app/audit-runs/YYYY-MM-DD_mobile_pwa_iphone_pro_max.md`).
- Concrete UI changes across shell + primitives + page hotspots.
- A final “before/after” route checklist with any remaining known issues explicitly listed.