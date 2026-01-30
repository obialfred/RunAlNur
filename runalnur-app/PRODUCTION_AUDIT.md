# RunAlNur Web Production Readiness Audit (Button-by-Button, Route-by-Route)

Date: 2026-01-17  
Scope: **Web (Next.js App Router)** + “real connect” integrations expectations  
This document is an **audit report only** (no fixes applied). It is written to be actionable for a remediation agent with strong QA/verification.

---

## Executive Summary

### Current state
- The UI has many screens and flows, but the system is **not production safe** yet.
- The primary reason is **security/data isolation**: most server routes are effectively public and/or use **service-role Supabase**, making the app closer to a **single-tenant demo** than a secure multi-user system.

### Release blockers (must fix before production)
1. **Unauthenticated API surface**
   - `runalnur-app/middleware.ts` treats all `/api/*` as public because `PUBLIC_ROUTES` contains `"/api"`.
2. **RLS bypass / service-role used for user CRUD**
   - Many CRUD endpoints call `getSupabaseAdmin()` (service role) which bypasses RLS.
3. **No tenant/user scoping in schema**
   - Core tables (`projects`, `contacts`, `tasks`, `deals`, `properties`, etc.) have no `owner_id`/`org_id`/`tenant_id` fields.
4. **Privilege escalation**
   - `app/api/profile/route.ts` allows arbitrary upsert of `role`/`arm_access` for any user id (no auth checks).
5. **Unverified webhooks**
   - `app/api/clickup/webhook/route.ts`, `app/api/process-street/webhook/route.ts`, `app/api/webhooks/incoming/route.ts` accept unsigned payloads.
6. **AI endpoint unprotected**
   - `app/api/ai/chat/route.ts` has no auth or rate limiting (cost + abuse risk).
7. **Storage signed upload URL endpoint unprotected**
   - `app/api/storage/upload-url/route.ts` issues signed upload URLs without authz on bucket/path.
8. **Demo fallbacks in production paths**
   - In-memory “sample” stores are used when Supabase is not configured (`projects`, `contacts`, `tasks`, `activities`), masking failures.

### Not-finished UX/functionality blockers (user-facing)
- Multiple visible buttons do nothing (e.g., “NEW” on arm page, “NEW SOP”, “START” SOP row, “NEW PHASE”).
- Multiple flows lack error handling and success feedback (silent failures).
- A hard bug: `components/contacts/HubSpotSync.tsx` calls `/api/hubspot/contacts/sync` but the actual sync mechanism is `GET /api/hubspot/contacts?sync=1`.

---

## Inventory: Pages, Buttons, and What They Do

### Global layout/navigation

#### `app/layout.tsx`
- Wraps app in `LayoutShell`.
- Production note: `viewport.userScalable=false` + `maximumScale=1` can be accessibility-unfriendly.

#### `components/layout/LayoutShell.tsx`
- Treats `/onboarding` as an “auth route” (no sidebar/topbar). UX fine, but onboarding is public in middleware.

#### `components/layout/TopBar.tsx`
- **Search** triggers command palette by dispatching a synthetic keydown.
- **NEW dropdown** menu items exist but have **no handlers**.
- **User menu**: “Profile” and “Preferences” are placeholders; “Sign out” calls `supabase.auth.signOut()`.

#### `components/search/CommandPalette.tsx`
- Navigation-only command palette.

---

### Authentication pages

#### `/login` (`app/login/page.tsx`)
- **ENTER** → `supabase.auth.signInWithPassword`, then `router.push("/")`.
- Links: `/forgot-password`, `/signup`.
Gaps:
- No brute-force mitigation / rate limiting at server edge.
- Doesn’t honor middleware `redirectedFrom` param.

#### `/signup` (`app/signup/page.tsx`)
- **CREATE ACCOUNT** → `supabase.auth.signUp`.
- If auto-confirmed, client upserts `profiles` with `role: "owner"`.
Gaps:
- Role assignment from client is unsafe.
- No `emailRedirectTo` for confirmation flow.

#### `/forgot-password` (`app/forgot-password/page.tsx`)
- **SEND RESET LINK** → `supabase.auth.resetPasswordForEmail(... redirectTo /reset-password)`.

#### `/reset-password` (`app/reset-password/page.tsx`)
- **UPDATE PASSWORD** → `supabase.auth.updateUser({ password })`, then redirects to `/`.
Gaps:
- Most products redirect to `/login` after reset; current behavior may surprise users.

#### `/auth/callback` (`app/auth/callback/route.ts`)
- Exchanges `code` for session using `createClient` (anon key) and upserts `profiles` with `role: "owner"`.
Gaps:
- Role assignment is unsafe.
- No explicit cookie wiring via Next `cookies()`; likely not setting session correctly server-side.

---

### Setup & Settings

#### `/onboarding` (`app/onboarding/page.tsx`)
- Step 3 “Verify Database” does `supabase.from("arms").select("count")`.
Gaps:
- Likely invalid query unless a `count` column exists; no user-facing error.
- Integration connect here is mostly UI, not secure secret storage.

#### `/settings` (`app/settings/page.tsx`)
- Integrations list with **CONNECT / TEST / DOCS**.
- ClickUp uses `ClickUpConnect` (OAuth URL).
Gaps:
- “CONNECT” modal validates key length and instructs `.env.local`; not real connect.
- No per-user/tenant integration storage.

---

### Core CRUD pages

#### `/` Command Center (`app/page.tsx`)
- Shows setup banner if “no integrations” (only checks 3 integrations).
- Links to `/projects/[id]`.

#### `/projects` (`app/projects/page.tsx`)
Controls:
- **NEW PROJECT** → opens `ProjectModal`.
- Row **EDIT/DELETE**.
Network calls:
- Delete: `DELETE /api/projects/:id`.
- Modal submit: `POST /api/projects` or `PATCH /api/projects/:id`.
Gaps:
- No error handling on fetch responses.
- Filtering is client-side only (API supports filters but UI doesn’t call them).

#### `/projects/[id]` (`app/projects/[id]/page.tsx`)
Controls:
- **EDIT** project → opens `ProjectModal`.
- **TASK** → opens `TaskModal`.
- Tasks clickable → opens `TaskModal`.
Gaps:
- `onSaved={() => window.location.reload()}` is not production-grade state management.
- “Notes” tab is placeholder.

#### `/contacts` (`app/contacts/page.tsx`)
Controls:
- **SYNC HUBSPOT** → `HubSpotSync`.
- **NEW CONTACT** → `ContactModal`.
- Row **EDIT/DELETE**.
Network calls:
- Delete: `DELETE /api/contacts/:id`.
- HubSpot sync: `POST /api/hubspot/contacts/sync` (**no matching route**, likely broken).
Gaps:
- No error handling.

---

### Monitoring pages

#### `/activity` (`app/activity/page.tsx`)
- Read-only activity feed from `/api/activities`.

#### `/reports` (`app/reports/page.tsx`)
- **EXPORT PDF** → `window.print()`.
- **EXPORT JSON** → downloads client-generated blob.
Gaps:
- No server-side reporting, filters, or date ranges.

#### `/status` (`app/status/page.tsx`)
- Reads `/api/status` and integration status endpoints.
Gaps:
- Status endpoints are unauthenticated.

---

### SOPs

#### `/sops` (`app/sops/page.tsx`)
- **NEW SOP** button has no handler.
- Each row has `SOPRunner` with **START SOP** plus a separate **START** button with no handler.

#### `components/sops/SOPRunner.tsx`
- `START SOP` → `POST /api/process-street/runs`, then loads tasks and toggles status via `/api/process-street/tasks`.
Gaps:
- No error handling UX; backend endpoints are unauthenticated.

---

### Arms

#### `/arms/[arm]` (`app/arms/[arm]/page.tsx`)
- **NEW** button has no handler.

#### `/arms/janna/deals` (`app/arms/janna/deals/page.tsx`)
- **SYNC HUBSPOT** → `GET /api/hubspot/deals?sync=1&arm_id=...`.
- **NEW DEAL** → `POST /api/deals` with placeholder payload (“New Deal”).
Gaps:
- No edit/delete.

#### `/arms/janna/properties` (`app/arms/janna/properties/page.tsx`)
- **NEW PROPERTY** opens modal; clicking card opens modal.
Gaps:
- No delete flow.

#### `/arms/janna/properties/[id]` (`app/arms/janna/properties/[id]/page.tsx`)
- **NEW PHASE** button has no handler (but backend supports `POST /api/properties/:id/phases`).

---

### AI

#### `/ai` (`app/ai/page.tsx`, `components/ai/ChatInterface.tsx`)
- Form submit → `POST /api/ai/chat`.
Gaps:
- UI claims a specific model; backend uses env (`AI_PROVIDER`, `OPENAI_MODEL`, `ANTHROPIC_MODEL`).
- No auth/rate limit; tool actions are not tenant-scoped.

---

## Inventory: API Routes (Auth/Authz, Validation, Security)

### Systemic issues across most API routes
- Middleware exempts `/api/*` from auth.
- Many routes use `getSupabaseAdmin()` (service role).
- Most routes accept `request.json()` and insert/update with little/no validation.
- No tenant model in schema.
- No rate limiting on AI/webhooks/upload-url.

### Core CRUD routes

#### Projects
- `GET/POST /api/projects` (`app/api/projects/route.ts`)
  - Uses service role; demo fallback when Supabase missing.
- `GET/PATCH/DELETE /api/projects/:id` (`app/api/projects/[id]/route.ts`)
  - PATCH updates with `{ ...body }` (arbitrary field updates).

#### Tasks
- `GET/POST /api/tasks` (`app/api/tasks/route.ts`)
- `GET/PATCH/DELETE /api/tasks/:id` (`app/api/tasks/[id]/route.ts`)
  - Same risks as projects.

#### Contacts
- `GET/POST /api/contacts` (`app/api/contacts/route.ts`)
- `GET/PATCH/DELETE /api/contacts/:id` (`app/api/contacts/[id]/route.ts`)
  - Search uses interpolated ilike expression from user input; needs sanitization/validation.

#### Activities
- `GET/POST /api/activities` (`app/api/activities/route.ts`)
  - Demo fallback.

#### Approvals
- `GET/POST/PATCH /api/approvals` (`app/api/approvals/route.ts`)
  - No auth; anyone can approve.

#### Notifications
- `GET/POST/PATCH /api/notifications` (`app/api/notifications/route.ts`)
  - Caller can filter by `user_id` without auth.
- `POST/DELETE /api/notifications/register` (`app/api/notifications/register/route.ts`)
  - Accepts `userId` from client; attacker can register/unregister tokens for other users.

#### Profile (critical)
- `GET/PUT /api/profile` (`app/api/profile/route.ts`)
  - Arbitrary profile upsert including `role`/`arm_access` for any `id`.

### Integration routes

#### ClickUp
- `GET/POST /api/clickup` (`app/api/clickup/route.ts`): uses env token or global DB token.
- `GET /api/clickup/oauth` (`app/api/clickup/oauth/route.ts`): no OAuth `state` verification; stores tokens globally by provider.
- `POST /api/clickup/webhook` (`app/api/clickup/webhook/route.ts`): no signature verification.
- `GET/POST /api/clickup/mappings` (`app/api/clickup/mappings/route.ts`): no auth.

#### HubSpot
- `GET /api/hubspot/status` no auth.
- `GET /api/hubspot/contacts` supports `sync=1` (writes to DB with service role).
- `GET /api/hubspot/deals` supports `sync=1` (writes to DB with service role).
Gap:
- Writes into shared tables without tenant model.

#### Process Street
- `GET /api/process-street/workflows`, `GET/POST /api/process-street/runs`, `GET/PATCH /api/process-street/tasks`, `GET /api/process-street/status`
  - No auth.
- `POST /api/process-street/webhook` no verification.

#### Guru
- `GET /api/guru/cards`, `GET /api/guru/status`
  - No auth.

### AI
- `POST /api/ai/chat` (`app/api/ai/chat/route.ts`)
  - No auth/rate limit; can be abused.

### Storage
- `POST /api/storage/upload-url` (`app/api/storage/upload-url/route.ts`)
  - No auth; arbitrary bucket/path.

### Cron/Webhooks/Misc
- `GET /api/cron/briefings` no auth; can be used to force expensive AI generation.
- `POST /api/webhooks/incoming` no verification.
- `GET /api/health`, `GET /api/status` likely fine but may leak internal details in production.

---

## Data Model / RLS Audit (Supabase)

From `lib/supabase/schema.sql` (snippet reviewed):
- Tables lack tenant scoping (`org_id`, `owner_id`, etc.).
- No explicit RLS enable/policy statements present in the schema file.

Consequence:
- Even with auth middleware, you cannot safely enforce per-user data access without schema changes + RLS policies.

---

## Offline-first / Sync Engine Audit

Files: `lib/hooks/useOfflineFirst.ts`, `lib/db/sync.ts`, `lib/db/local.ts`
- Sync engine writes directly to Supabase via anon client.
- Assumes strong RLS exists.

Risks:
- Without tenant scoping + RLS, this becomes a “write to shared DB” channel.
- Conflict strategy is effectively “remote wins.”
- IndexedDB data is not encrypted at rest.

---

## Deployment / Ops Audit

`next.config.ts`:
- `images.unoptimized = true` (OK for some contexts; not ideal for web perf).
- Turbopack workspace-root warning exists; can affect build reproducibility.

Logging:
- Mostly `console.*` (no structured logs / request IDs).

Secrets:
- Integration tokens are global env vars; “real connect” requires secure per-tenant storage (and rotation).

---

## Verification / QA Checklist (anti-cheating, anti-laziness)

### A) Button-by-button functional QA (with Network tab evidence)
Minimum required checks:
- `/projects`: create, edit, delete, pagination, filters.
- `/projects/[id]`: create task, edit task, delete task.
- `/contacts`: create, edit, delete, HubSpot sync (should be fixed).
- `/settings`: each CONNECT opens modal; ClickUp OAuth opens correct URL; TEST endpoints reflect real connectivity.
- `/sops`: start run, load tasks, toggle status.
- `/arms/[arm]`: “NEW” must do something or be removed.
- `/arms/janna/properties/[id]`: “NEW PHASE” must do something or be removed.
- `/ai`: chat works; failure cases present correct UX.

### B) Security QA (curl/Postman, with transcripts)
1. Unauthenticated access (incognito/no cookies) should return **401/403** for:
   - `GET /api/projects`
   - `DELETE /api/projects/:id`
   - `POST /api/storage/upload-url`
   - `POST /api/ai/chat`
2. Privilege escalation attempt:
   - `PUT /api/profile` trying to set role/admin should be rejected.
3. Webhook spoofing:
   - Fake payloads to `/api/clickup/webhook` should be rejected without valid signature.

### C) Data isolation QA
Create two users:
- User A cannot see/mutate user B’s projects/contacts/tasks.

---

## Bottom line

The app looks cohesive, but it is not production-ready until:
- APIs are authenticated and authorized,
- the schema supports tenant scoping and RLS/policies,
- webhooks and AI endpoints are protected,
- integration connect flows become real (secure per-tenant token storage + refresh),
- placeholder buttons are wired or removed.

