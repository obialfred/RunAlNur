---
name: runalnur_stabilization_mobile_tasks_ai_integrations_security
overview: "Stabilize RunAlNur end-to-end: fix broken core flows (tasks/calendar, contacts visibility, AI connectivity), complete iPhone PWA mobile optimization across all routes, restore key integrations (ClickUp/Guru/COO), add initial Social+Intelligence connectors, harden security so connections persist, and close with icons + hosting/native roadmap."
todos:
  - id: mobile-qa
    content: Route-by-route iPhone Pro Max PWA audit + fixes (shell, nav, overlays, page hotspots) with an audit artifact.
    status: pending
  - id: tasks-calendar
    content: Make calendar date actions create real tasks (and/or clarify focus blocks vs tasks) and ensure due_date + UI feedback works.
    status: pending
  - id: ai-connect
    content: Fix AI connectivity + provider naming; split providers (Claude/Gemini/OpenAI) in Settings and show demo-mode clearly.
    status: pending
  - id: contacts-fix
    content: Fix contacts visibility (write/read tenant consistency) and verify persistence in production.
    status: pending
  - id: integrations-restore
    content: Restore ClickUp/Guru/COO integrations reliability and add health/last-sync indicators.
    status: pending
  - id: intel-x
    content: Define and implement Intelligence connector starting with X ingestion feeding /influence/intel.
    status: pending
  - id: social-instagram
    content: Implement Instagram connect first (multi-brand accounts), then roadmap LinkedIn/YouTube/TikTok.
    status: pending
  - id: security-hardening
    content: Apply production safety checklist (authz, tenant scoping, webhooks verification, rate limits) to prevent disconnects/regressions.
    status: pending
  - id: icons
    content: Fix/standardize icons and branding across manifest/layout for web and iOS readiness.
    status: pending
  - id: hosting-native-roadmap
    content: Produce a migration roadmap for Cloudflare hosting and/or native iOS strategy (Capacitor vs SwiftUI), staged after stabilization.
    status: pending
---

# RunAlNur Stabilization Plan (Mobile + Broken Flows + Integrations + Security)

## Goals (what “fixed” means)

- **Not broken**: tasks, calendar date actions, contacts, AI chat all function with clear success/error states.
- **Mobile is good**: every route usable on **iPhone Pro Max** class devices in **PWA standalone** mode.
- **Integrations stay connected**: credentials stored per-user/tenant, refresh/health checks work, and regressions are prevented by QA gates.
- **Secure enough for production**: authz + tenant scoping so production doesn’t silently break or leak.

## What I already see in code (anchors)

- **Calendar is “Focus Blocks”**: `/calendar` creates focus blocks via `/api/focus-blocks` and uses `BlockEditor`.
- [`runalnur-app/app/calendar/page.tsx`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/app/calendar/page.tsx)
- [`runalnur-app/components/calendar/BlockEditor.tsx`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/components/calendar/BlockEditor.tsx)
- **Tasks API is authenticated + tenant-scoped** (`tenant_id`), supports `focus_block_id` filtering.
- [`runalnur-app/app/api/tasks/route.ts`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/app/api/tasks/route.ts)
- **AI Chat API exists and falls back to “demo response” if no key is available**, even when user expects real AI.
- [`runalnur-app/app/api/ai/chat/route.ts`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/app/api/ai/chat/route.ts)
- **Settings “OpenAI / Claude” label is hard-coded** as a single integration entry; provider mapping only includes `openai`.
- [`runalnur-app/app/settings/page.tsx`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/app/settings/page.tsx)
- **Contacts page uses `/api/contacts` via `useContacts()`; if contacts “don’t show”, it’s either auth/tenant mismatch, query, or data not written into the tenant-scoped table.**
- [`runalnur-app/app/contacts/page.tsx`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/app/contacts/page.tsx)
- [`runalnur-app/lib/hooks/useContacts.ts`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/lib/hooks/useContacts.ts)

## Phase 0 — Establish a real QA environment (so we can reproduce)

- Create a dedicated QA account via `/signup`.
- Verify production env is pointing at the intended Supabase project + has required env vars.
- Add a “QA runbook” doc: how to test PWA on iPhone and how to force-update SW.

## Phase 1 — Mobile UI optimization (route-by-route iPhone Pro Max PWA)

Targets (high leverage):

- [`runalnur-app/components/layout/LayoutShell.tsx`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/components/layout/LayoutShell.tsx) (scroll/padding/stacking)
- [`runalnur-app/components/layout/TopBar.tsx`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/components/layout/TopBar.tsx) (mobile header density)
- [`runalnur-app/components/layout/MobileNav.tsx`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/components/layout/MobileNav.tsx) (safe-area, touch targets)
- [`runalnur-app/components/ui/dialog.tsx`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/components/ui/dialog.tsx) + [`runalnur-app/components/ui/sheet.tsx`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/components/ui/sheet.tsx) (overlay max-height + internal scroll)
- [`runalnur-app/app/globals.css`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/app/globals.css) (mobile utilities already exist; we’ll make them consistent and used everywhere)

Work style:

- Audit **all routes** in `runalnur-app/app/**/page.tsx` at 430×932 with safe-areas.
- Fix the shell + primitives first, then fix page hotspots.
- Create an audit artifact: `runalnur-app/audit-runs/YYYY-MM-DD_mobile_pwa_iphone_pro_max.md` with pass/fail per route.

## Phase 2 — Fix “creating tasks doesn’t do anything” (especially from calendar date)

This breaks in two likely ways:

- UI is creating **focus blocks** but user expects **tasks**.
- “Calendar date task” creation path is missing or not wiring `due_date`/task create correctly.

Concrete plan:

- Add an explicit **Create Task for this date/time** flow from `/calendar` (and/or from `BlockEditor`) that calls `POST /api/tasks` with:
- `name`
- `due_date` derived from selected date
- optional `focus_block_id` for linkage
- optional `context`
- Ensure the UI shows errors from `/api/tasks` (it returns helpful `name is required` 400 today).
- Verify end-to-end: create task for a specific date, then confirm it appears in tasks lists and remains after refresh.

Primary files:

- [`runalnur-app/app/calendar/page.tsx`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/app/calendar/page.tsx)
- [`runalnur-app/components/calendar/BlockEditor.tsx`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/components/calendar/BlockEditor.tsx)
- [`runalnur-app/app/api/tasks/route.ts`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/app/api/tasks/route.ts)

## Phase 3 — AI is “not connected” + provider labels wrong (OpenAI/Claude vs Claude/Gemini)

What’s happening today:

- If no per-user key exists, `/api/ai/chat` returns **demo responses** (`isDemo: true`). This feels like “API isn’t connected” even when the UI looks live.
- Settings has a single AI integration entry named **“OpenAI / Claude”** and doesn’t expose Gemini as a first-class connect/test.

Concrete plan:

- Split AI providers into explicit integrations:
- `anthropic` (Claude)
- `gemini` (Google)
- `openai`
- Update Settings integration list + provider mapping (`getProviderName`) so **CONNECT/TEST/DISCONNECT** works for each.
- Update AI UI labels to match actual behavior (e.g. toggle should read **Claude/Gemini**, not OpenAI/Claude, if that’s the intended product direction).
- Add clear UI banner when AI is in demo mode (based on `isDemo` from API).

Primary files:

- [`runalnur-app/app/settings/page.tsx`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/app/settings/page.tsx)
- [`runalnur-app/app/api/ai/chat/route.ts`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/app/api/ai/chat/route.ts)
- [`runalnur-app/components/ai/ChatInterface.tsx`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/components/ai/ChatInterface.tsx) (provider toggle + UX)

## Phase 4 — Contacts not showing

Concrete plan:

- Trace contact creation path (ContactModal → `/api/contacts`) and confirm `tenant_id` + `owner_id` are set consistently.
- Fix any mismatch between read filters and write payload.
- Ensure contacts seeded/created in production appear after refresh and across sessions.

Primary files:

- [`runalnur-app/app/contacts/page.tsx`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/app/contacts/page.tsx)
- [`runalnur-app/lib/hooks/useContacts.ts`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/lib/hooks/useContacts.ts)
- (Next step during execution: inspect `/api/contacts` routes + `ContactModal`.)

## Phase 5 — Restore ClickUp + Guru + COO/AgentBoss “fully connected”

Concrete plan:

- Verify per-user credential storage endpoints used by Settings (`/api/integrations/*`).
- Fix any regressions where integrations were previously env-only and now need DB credentials.
- Add “health” views that show:
- connected identity (email/username)
- scopes
- connectedAt
- lastSuccessfulSync
- lastError
- Add retry-safe sync jobs where needed (avoid silent failure).

Primary files:

- Settings integration section in [`runalnur-app/app/settings/page.tsx`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/app/settings/page.tsx)
- (Next step during execution: inspect `runalnur-app/app/api/integrations/**`, `lib/integrations/user-credentials.ts`, ClickUp/Guru clients.)

## Phase 6 — Intelligence integration (X + others)

Concrete plan:

- Define “Intelligence” as a connector + ingestion pipeline:
- source config (X lists/users/keywords + RSS + YouTube channels + etc)
- fetch/ingest schedule
- normalize into a single `intel_items` table
- Start with X read-only ingestion (or a 3rd-party aggregator if X API constraints block us).
- Wire `/influence/intel` to show real ingested items.

## Phase 7 — Social media integration (start with Instagram; multi-brand)

Concrete plan:

- Implement a Social Accounts model:
- brands: OBX, Nurullah, HouseAlNur, Nova, Janna
- per brand: connected Instagram account(s)
- token storage + refresh
- Start with Instagram Graph API OAuth (Business/Creator) and implement:
- connect
- list accounts/pages
- read insights + media
- (later) publishing via Content Publishing API where available
- Expand to LinkedIn/YouTube/TikTok after Instagram baseline.

## Phase 8 — Security hardening so things don’t break/disconnect

This is required for “production stable”. Use the existing audit as a checklist.

- Ensure `/api/*` routes require auth where appropriate.
- Ensure tenant scoping is enforced end-to-end.
- Add webhook signature verification.
- Add rate limits on AI + upload-url endpoints.

Reference checklist:

- [`runalnur-app/PRODUCTION_AUDIT.md`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/PRODUCTION_AUDIT.md)

## Phase 9 — Proper icons (web + future native)

Concrete plan:

- Confirm all manifest icons exist and are correct sizes (there’s already a static QA gate in [`runalnur-app/scripts/qa-gates.mjs`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/scripts/qa-gates.mjs)).
- Add missing platform icons (favicon, maskable, Apple touch, pinned tab) and align branding (RunAlNur vs Dynasty OS naming) across:
- [`runalnur-app/app/layout.tsx`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/app/layout.tsx)
- [`runalnur-app/public/manifest.json`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/public/manifest.json)

## Phase 10 — Platform/hosting roadmap (Vercel → Cloudflare? Native iOS?)

Concrete plan:

- **Short-term**: keep Vercel while stabilizing (fast deploys, easy previews).
- **Medium-term Cloudflare**:
- evaluate Next.js compatibility: Pages/Workers vs staying on Vercel for App Router features
- move static assets + R2 storage where applicable
- set up WAF/rate limits at edge
- **Native iOS**:
- decide: Capacitor wrapper vs fully native SwiftUI
- if Capacitor: add iOS dev account, set bundle ID, push notifications/capabilities
- establish CI build pipeline for iOS