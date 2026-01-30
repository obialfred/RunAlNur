---
name: two-tenant-isolation-qa
overview: Create a runnable two-tenant/two-user isolation verification script for Supabase-backed RunAlNur, exercising the core entity APIs and ensuring strict tenant separation (RLS + API scoping).
todos:
  - id: script-skeleton
    content: Add `runalnur-app/scripts/tenant-isolation.mjs` with env validation + structured output + exit codes.
    status: pending
  - id: seed-tenants-users
    content: Implement tenant + user creation/reuse and tenant_memberships wiring (admin client only).
    status: pending
  - id: exercise-entities
    content: For each core entity, seed A/B data then verify cross-tenant read/write denial using user JWT clients.
    status: pending
  - id: cleanup-mode
    content: Add deterministic cleanup mode for test-run-tagged rows and test users.
    status: pending
  - id: ci-docs
    content: Document how to run locally and in CI (required env vars, flags).
    status: pending
---

## Goal

Turn the manual “two-tenant / two-user” isolation check into a **repeatable, runnable QA script**.

## Preconditions

- Access to a Supabase project used by the deployed app.
- Service credentials available to the script runner (stored as env vars, not committed):
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- The app’s tenant schema + RLS policies are deployed (migrations applied).

## What the script will do

- Create or ensure two tenants exist: `tenantA`, `tenantB`.
- Create two auth users: `userA`, `userB` (or reuse if already present).
- Ensure memberships:
- `userA` in `tenantA`
- `userB` in `tenantB`
- For each core entity endpoint/table (projects, tasks, contacts, activities, etc.):
- Seed a record in tenantA as userA.
- Seed a record in tenantB as userB.
- Verify userA cannot read/write tenantB record.
- Verify userB cannot read/write tenantA record.
- Verify each user can read/write their own tenant’s records.

## Implementation shape

- Add a Node script under `runalnur-app/scripts/` (e.g. `tenant-isolation.mjs`).
- Use Supabase Admin client (service role) only for:
- Creating tenants/memberships
- Creating auth users
- Seeding test data (if needed)
- Use a user-scoped Supabase client (JWT for each user) to perform the **actual isolation checks**, so results reflect real RLS.

## Outputs

- Console report with pass/fail per entity and per action.
- Non-zero exit code on any failure (CI-friendly).

## Safety / cleanup

- Tag all seeded test rows with a `metadata.test_run_id` (or similar) for cleanup.
- Provide an optional `--cleanup` flag to delete test data and optionally the test users.

## Success criteria

- Script passes consistently.
- Any RLS/API regression causes a deterministic failure.