# RunAlNur Web Production Readiness Audit (Post-Opus, Fresh Audit)

Date: 2026-01-17  
Scope: Next.js App Router (web), API routes, auth/authz, integrations, and “is it finished?” verdict  

## Verdict (be honest)
**No — the site is not “finished” / production-ready yet.**

Significant progress was made (auth now enforced broadly; many CRUD routes now require auth; webhook verification and AI rate limiting exist), but **critical multi-user security and “real integration” requirements are still incomplete**.

---

## What *is* materially improved vs the earlier audit

### 1) API auth is no longer fully public
- `runalnur-app/middleware.ts` no longer treats all `/api/*` routes as public.
- Most API routes are now protected by middleware unless explicitly listed under `PUBLIC_API_ROUTES`.

### 2) Core CRUD endpoints now do auth checks in code
The following routes now call `getAuthenticatedUser()` and return 401 on missing auth:
- Projects: `app/api/projects/route.ts`, `app/api/projects/[id]/route.ts`
- Tasks: `app/api/tasks/route.ts`, `app/api/tasks/[id]/route.ts`
- Contacts: `app/api/contacts/route.ts`, `app/api/contacts/[id]/route.ts`
- Activities: `app/api/activities/route.ts`
- Approvals: `app/api/approvals/route.ts`
- Notifications list/update/create: `app/api/notifications/route.ts`
- Storage signed upload URL: `app/api/storage/upload-url/route.ts`
- HubSpot contacts sync endpoint: `app/api/hubspot/contacts/route.ts`
- Profile: `app/api/profile/route.ts`
- AI chat: `app/api/ai/chat/route.ts` (plus rate limiting)

### 3) Profile privilege escalation is reduced
- `app/api/profile/route.ts` blocks non-admins from changing `role`/`arm_access`.

### 4) Webhooks have verification helpers
- `lib/api/webhooks.ts` provides signature/secret verification.
- ClickUp + Process Street webhook handlers were updated to verify signatures.

### 5) Obvious broken HubSpot contacts sync button is fixed
- `components/contacts/HubSpotSync.tsx` now uses `GET /api/hubspot/contacts?sync=1` and shows feedback.

---

## Still NOT production-ready: current release blockers

### A) Tenant model / data isolation is not real yet (still a blocker)
Even where “owner checks” exist in code, the underlying system is still missing a proper tenant model:
- Many database writes/reads still use `getSupabaseAdmin()` (service role), which bypasses RLS entirely.
- The schema appears not to be consistently scoped (e.g. tables may not have `owner_id`/`org_id` columns everywhere).
- Some routes attempt `owner_id` behavior but also include fallbacks when the column isn’t present, which means **data isolation is best-effort, not guaranteed**.

**Consequence:** With multiple users in the same Supabase project, you cannot claim hard isolation yet.

### B) Several important API routes still have no in-route auth/authz
These endpoints currently do not call `getAuthenticatedUser()` and rely on middleware only (or are explicitly public):

- **ClickUp OAuth callback is public and has no state verification**
  - File: `app/api/clickup/oauth/route.ts`
  - Issues:
    - No OAuth `state` verification (CSRF risk).
    - Stores tokens in `integrations` without user/tenant scoping (global token).

- **ClickUp API route uses global integration token**
  - File: `app/api/clickup/route.ts`
  - Issues:
    - Pulls the ClickUp token from a single `integrations` row (`provider=clickup`), not per user.
    - Uses service role DB access.

- **ClickUp mappings are effectively global**
  - File: `app/api/clickup/mappings/route.ts`
  - Issues:
    - No auth checks inside the route.
    - Uses service role.

- **HubSpot deals route is not aligned with the newer auth pattern**
  - File: `app/api/hubspot/deals/route.ts`
  - Issues:
    - No `getAuthenticatedUser()`; uses service role for sync writes.
    - No user/tenant ownership in synced payload.

- **Guru cards/status routes are not gated in-route**
  - Files: `app/api/guru/cards/route.ts`, `app/api/guru/status/route.ts`
  - Issues:
    - No auth checks inside the route.
    - Uses global env token.

- **Process Street runs route has no in-route auth**
  - File: `app/api/process-street/runs/route.ts`
  - Issues:
    - No auth checks inside the route.
    - Global env token model.

### C) Push notification device registration is still a security bug
- File: `app/api/notifications/register/route.ts`
- Issue: Accepts `userId` from request body/query and uses service role to upsert/delete device tokens.
- **Impact:** An authenticated user could register/unregister tokens for another user by providing a different `userId` (authz flaw).

### D) Expensive “cron” briefing endpoint is not role-gated
- File: `app/api/cron/briefings/route.ts`
- Issue: Triggers AI briefing generation with no role check/secret header requirement.
- Even if middleware protects it from anonymous callers, any logged-in user could potentially trigger costs unless additional gating exists.

### E) “Finished product” integration connect is still not real
Current “CONNECT” UX is mostly instructional:
- Settings “connect” flows largely instruct users to add env vars and restart.
- OAuth token storage is global, not per user/tenant.

**Consequence:** It does not meet the expectation of “real connect buttons for each user/org” with secure storage, rotation, revocation, and per-user permissions.

---

## Page inventory (source-of-truth from app router)

Derived from `runalnur-app/app/**/page.tsx`:

### Static pages
- `/` (Command Center) — `app/page.tsx`
- `/activity` — `app/activity/page.tsx`
- `/ai` — `app/ai/page.tsx`
- `/contacts` — `app/contacts/page.tsx`
- `/forgot-password` — `app/forgot-password/page.tsx`
- `/knowledge` — `app/knowledge/page.tsx`
- `/login` — `app/login/page.tsx`
- `/onboarding` — `app/onboarding/page.tsx`
- `/projects` — `app/projects/page.tsx`
- `/reports` — `app/reports/page.tsx`
- `/reset-password` — `app/reset-password/page.tsx`
- `/settings` — `app/settings/page.tsx`
- `/signup` — `app/signup/page.tsx`
- `/sops` — `app/sops/page.tsx`
- `/status` — `app/status/page.tsx`

### Dynamic pages (require seeded IDs / params)
- `/projects/[id]` — `app/projects/[id]/page.tsx`
- `/arms/[arm]` — `app/arms/[arm]/page.tsx` (arm slugs from constants, e.g. `nova`, `janna`, `silk`, …)
- `/arms/janna/deals` — `app/arms/janna/deals/page.tsx`
- `/arms/janna/properties` — `app/arms/janna/properties/page.tsx`
- `/arms/janna/properties/[id]` — `app/arms/janna/properties/[id]/page.tsx`

## UX / product completeness gaps (still not “finished”)

### 1) TopBar “NEW” menu items do nothing
- File: `components/layout/TopBar.tsx`
- The dropdown items (`New Project`, `New Task`, `New Contact`, `Start SOP`) have no click handlers.

### 2) Many pages are still “demo-ish” without real multi-user semantics
- Some pages and components assume global/shared data rather than tenant-scoped.
- Several integrations are “configured by env” instead of per-user setup.

---

## Production readiness conclusion

### If “finished” means “nice UI and it runs locally”
It’s closer than before, and many obvious broken flows/security holes were addressed.

### If “finished” means “safe for real users + real integrations + real data isolation”
**Not finished yet.** The remaining blockers are fundamental:
- Proper tenant model + RLS policies (or consistent server-side authz with non-service-role clients)
- Per-user/tenant integration tokens + OAuth state verification
- Fix `/api/notifications/register` authz flaw
- Gate expensive endpoints like `/api/cron/briefings`
- Wire TopBar “NEW” actions (or remove them)

### Page: `/contacts`

#### Control: `NEW CONTACT` button
- **Expected**: open modal; `Save` creates contact.
- **Observed**: modal opens; `Save` triggers **`POST /api/contacts` → 400** and renders an error alert.
- **Impact**: contact creation appears broken via UI in this audit run.
- **Evidence**:
  - Network (browser): `POST /api/contacts` returned **400**.
  - UI (a11y snapshot): `role="alert"` includes `Name and arm_id are required` plus debug showing `received.name: ""` and `receivedKeys` including `name` + `arm_id`.
