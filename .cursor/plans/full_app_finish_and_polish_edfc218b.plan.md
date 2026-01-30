---
name: full_app_finish_and_polish
overview: End-to-end audit and remediation to make RunAlNur a fully working, multi-user app with real in-app integrations, no placeholder flows, and polished responsive UI across desktop/mobile.
todos:
  - id: baseline-run
    content: "Run and document baseline: dev server, build, lint; identify failing flows without demo fallbacks."
    status: pending
  - id: auth-rls
    content: Remove dev/public bypasses, implement strict auth + RLS-backed data isolation across APIs.
    status: pending
  - id: finish-ui
    content: Wire or remove all visible controls; eliminate placeholder behavior; replace reloads with state refresh.
    status: pending
  - id: real-integrations
    content: Complete per-user encrypted integration connect/test/disconnect and ensure all sync endpoints use stored credentials.
    status: pending
  - id: responsive-polish
    content: Fix mobile/desktop visual glitches, accessibility (zoom), and standardize loading/empty/error UI.
    status: pending
  - id: perf-stability
    content: Lighthouse/perf pass and stability hardening (rate limits, gating, logs).
    status: pending
---

## Goals (what “fully finished” means here)

- All primary product flows work end-to-end with real data: auth, projects, tasks, contacts, arms, SOP runs, AI, notifications.
- Multi-user safe: strict user data isolation in DB (RLS) and in API routes.
- Real integrations: in-app connect/test/disconnect with per-user encrypted credential storage.
- No fake UI: any visible control either performs the promised action or is removed/relabeled.
- No visual glitches: responsive layouts, correct safe-area behavior, accessible interaction (including zoom), consistent empty/loading/error states.

## Current findings (high-signal)

- Auth is intentionally bypassed for large parts of the UI via `PUBLIC_ROUTES` in [`runalnur-app/middleware.ts`](runalnur-app/middleware.ts) (lines ~12–33) and via a dev bypass for all `/api/*` in dev (lines ~69–72).
- API auth helper has “demo mode” fallbacks that return a mock `dev-user` when Supabase/cookies are missing in development in [`runalnur-app/lib/api/auth.ts`](runalnur-app/lib/api/auth.ts) (lines ~26–55).
- DB schema already supports strict per-user isolation and encrypted per-user integration storage with RLS policies in [`runalnur-app/lib/supabase/schema.sql`](runalnur-app/lib/supabase/schema.sql) (e.g. `user_integrations`, `owner_id` on tables, RLS enabled/policies).
- Many routes still use service-role Supabase (`getSupabaseAdmin()` in [`runalnur-app/lib/supabase/server.ts`](runalnur-app/lib/supabase/server.ts)) and “force demo” (`forceDemo = NODE_ENV==='development'`) in multiple APIs (found in projects/tasks/contacts/activities/COO APIs), which can mask real breakage and can bypass RLS.
- Integrations UI is already wired to per-user endpoints (`/api/integrations/[provider]`) and ClickUp OAuth flow (`/api/clickup/oauth/start` + callback) is present; encryption is required and enforced in route code. Settings still contains some “env file” instructions that need to be updated to match the real in-app connect approach.
- One clear production risk: `GET /api/cron/briefings` is currently ungated in [`runalnur-app/app/api/cron/briefings/route.ts`](runalnur-app/app/api/cron/briefings/route.ts).
- Accessibility/polish: zoom is disabled globally via viewport settings in [`runalnur-app/app/layout.tsx`](runalnur-app/app/layout.tsx) (`userScalable: false`, `maximumScale: 1`).

## Execution approach (iterative, verifiable)

### Phase 0 — Establish a trustworthy baseline (no “demo masking”)

- Make local run deterministic: confirm `npm run dev`, `npm run build`, `npm run lint` in `runalnur-app/`.
- Configure Supabase and run schema:
- Apply [`runalnur-app/lib/supabase/schema.sql`](runalnur-app/lib/supabase/schema.sql).
- Ensure `.env.local` has required Supabase keys and **encryption keys** (used by `isEncryptionConfigured()`).
- Define “demo mode” explicitly:
- Replace implicit `NODE_ENV==='development'` demo fallbacks with an explicit `DEMO_MODE=true` flag (default off).

### Phase 1 — Multi-user correctness: auth + RLS + no service-role bypass

- Middleware:
- Remove “TEMP allow main routes for testing UI” from `PUBLIC_ROUTES` in [`runalnur-app/middleware.ts`](runalnur-app/middleware.ts).
- Remove the dev bypass that allows all `/api/*` without auth.
- Keep only truly public pages (login/signup/forgot/reset/auth callback) and webhook endpoints that do their own verification.
- Server auth/session:
- Ensure Supabase auth cookies are set/rotated correctly (login/signup/callback) and are readable by API routes.
- Ensure `getAuthenticatedUser()` reads role from `profiles` (not untrusted user_metadata) for permissions.
- API routes:
- Stop using `getSupabaseAdmin()` for user-owned CRUD; switch to a user-scoped Supabase client so RLS enforces isolation.
- Remove “owner_id missing column” fallbacks once schema is enforced (they can silently degrade isolation).
- Add consistent request validation + error messaging for all CRUD routes.

### Phase 2 — “No fake features”: finish or remove every visible control

- Inventory and enforce for each page:
- `/projects` + `/projects/[id]` (project/task CRUD, counters, reload behavior)
- `/contacts` (CRUD + HubSpot sync UX)
- `/arms/[arm]` (project/contact creation, ClickUp tab behaviors)
- `/sops` (workflows list + `SOPRunner` start/toggle with clear success/failure UI)
- `/settings` (connect/test/disconnect for each provider; ClickUp mappings UX)
- `/ai` (auth, rate limit UX, clear model/provider messaging)
- `/status` (accurate status; no leaking secrets)
- Replace `window.location.reload()` patterns with state refresh (`useApi` refresh hooks) to avoid jank.

### Phase 3 — Real integrations (per-user, encrypted)

- Ensure the following are truly end-to-end:
- ClickUp: `/api/clickup/oauth/start` creates `oauth_states` row + cookie; callback verifies state, stores `user_integrations`, refresh tokens when needed.
- HubSpot/Process Street/Guru: connect via `/api/integrations/[provider]` stores encrypted keys; sync routes consume stored creds (not env).
- AI providers: connect/store keys per user; AI routes select provider based on connected creds; add cost guardrails.
- Add a “connected account” summary UI (provider metadata) and a clear “reconnect” path.

### Phase 4 — Visual polish + responsive QA (desktop + mobile)

- Fix accessibility + PWA ergonomics:
- Allow zoom (remove `userScalable:false` and `maximumScale:1`) and verify text scaling.
- Validate safe-area padding, keyboard avoidance, and table horizontal scrolling.
- Standardize UI states:
- Loading skeletons, empty states, and error toasts across pages.
- Eliminate layout shifts and inconsistent spacing.

### Phase 5 — Performance + stability

- Lighthouse pass (mobile + desktop), fix biggest offenders:
- Reduce unnecessary re-renders (React compiler already enabled), memoize expensive lists.
- Audit PWA caching strategy and ensure stale data isn’t shown incorrectly.
- Ensure production build is clean (no console spam, no 404 assets).

## Verification (definition of done)

- Two real users in Supabase:
- User A cannot read/write any of User B’s records (projects/tasks/contacts/etc.).
- Critical flows verified with Network evidence:
- Create/edit/delete project and task; create/edit/delete contact; run an SOP; connect+test an integration; AI chat with error handling.
- Mobile + desktop UI:
- No overflow/overlap, tap targets 44px, correct safe-area insets, no blocked scrolling.
- Deployment readiness:
- No unauthenticated access to protected APIs.
- Expensive endpoints (briefings/AI) gated and rate-limited.