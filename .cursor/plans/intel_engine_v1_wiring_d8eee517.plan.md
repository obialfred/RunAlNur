---
name: Intel Engine v1 Wiring
overview: Turn the existing live News Intelligence Feed into a persistent Intelligence Engine v1 (memory + ingestion) in Supabase, then feed the COO/AgentBoss prompts with top intel signals—keeping UI unchanged and minimizing deployment risk.
todos:
  - id: migration-intel-tables
    content: Add tenant-aware intel_sources + intel_items tables with RLS + indexes
    status: pending
  - id: ingest-module
    content: Implement lib/intelligence/ingest.ts to upsert deduped items from aggregator
    status: pending
    dependencies:
      - migration-intel-tables
  - id: api-db-first
    content: Update /api/intelligence to read from Supabase when INTEL_ENGINE_ENABLED is on; refresh triggers ingest
    status: pending
    dependencies:
      - ingest-module
  - id: cron-ingest
    content: Add /api/cron/intelligence ingestion route using service role (bounded users)
    status: pending
    dependencies:
      - ingest-module
  - id: coo-intel-context
    content: Inject intel counts/headlines into COO priority prompt + morning briefing radar
    status: pending
    dependencies:
      - api-db-first
---

# Intelligence Engine v1 (Memory + Ingestion + COO Integration)

## What’s true right now

- **Feed layer exists**: UI + `/api/intelligence` + `useIntelligence` + aggregator (`runalnur-app/lib/integrations/intelligence.ts`).
- **Engine layer does not exist yet in migrations**: there is **no `intel_items` table in `supabase/migrations/`** (the older `lib/supabase/schema-dynasty.sql` contains a non-tenant-aware `intel_items`, but it’s not part of your applied migrations).
- **COO already uses Opus+Gemini** and supports extra context inputs (e.g. `relationshipFollowupsDueCount`) via [`runalnur-app/lib/coo/engine.ts`](runalnur-app/lib/coo/engine.ts).

## Goal

Convert the live feed into a **durable intelligence engine v1**:

- **Memory**: store deduped items in Supabase (`intel_sources`, `intel_items`) with tenant isolation.
- **Ingestion**: ingest on-demand and via cron using the existing aggregator.
- **Serve**: `/api/intelligence` reads from DB first (optionally “top up” from live).
- **COO integration**: provide **intel counts + top headlines** as additional context in priority generation and morning briefing.

## Key design choices (to keep things stable)

- **Simple-first**: no embeddings/pgvector/scoring pipeline in v1.
- **Feature flag**: `INTEL_ENGINE_ENABLED=true` switches API to DB-backed; otherwise current live behavior stays.
- **Minimal surface area**: mostly additive files + one new migration; avoid touching unrelated pages.

## Implementation steps

### 1) Add tenant-aware intel tables (migration)

Create a new migration under `runalnur-app/supabase/migrations/`:

- `intel_sources`
- `tenant_id`, `user_id`, `source_type` (`x|news|rss`), `name`, `config` (JSONB), `is_active`, `last_fetched_at`
- `intel_items`
- `tenant_id`, `user_id`, `region`, `source_type`, `source_name`, `external_id`, `url`, `title`, `summary`, `content`, `image_url`, `tags[]`, `published_at`, `fetched_at`, `read_at`, `archived_at`
- **Unique constraint**: `(tenant_id, user_id, source_type, external_id)` to dedupe.
- Add indexes: `(tenant_id,user_id,published_at desc)`, unread index, region/source filters.
- Add RLS policies matching your tenant pattern (similar to `coo_priorities` + `influence_followups`): user can manage rows where `auth.uid()=user_id`.

### 2) Build a small storage/ingestion module

Add:

- `runalnur-app/lib/intelligence/ingest.ts`
- `ingestIntelligence(tenantId, userId, options)`
- calls `IntelligenceAggregator.fetchAll()` and upserts into `intel_items`
- maps `IntelligenceItem.id` into `external_id` (and stores canonical URL)

### 3) Update `/api/intelligence` to be DB-first

Modify:

- `runalnur-app/app/api/intelligence/route.ts`

Behavior:

- If `INTEL_ENGINE_ENABLED=true` and Supabase is available in auth context:
- **GET** returns rows from `intel_items` filtered by `regions/sources/limit`
- If `refresh=true`, run `ingestIntelligence(tenantId,userId)` first, then return updated rows
- Else (feature flag off): fall back to current in-memory aggregator behavior.

### 4) Add cron ingestion route (optional but recommended)

Add:

- `runalnur-app/app/api/cron/intelligence/route.ts`

Behavior:

- Uses `getSupabaseAdmin()` and ingests for a bounded set of users (e.g. active profiles in default tenant) to avoid runaway costs.
- This makes the feed feel “alive” without waiting for a user to open the app.

### 5) Feed intel into COO/AgentBoss context (no UI changes required)

Update:

- `runalnur-app/lib/coo/engine.ts`

Changes:

- In `generatePriorities(...)`, compute:
- `intelUnreadCount` (last 24h, unread)
- `intelTopHeadlines` (top 3 by recency)
- Inject into `buildPriorityUserPrompt(...)` via `additionalContext` (extend prompt builder to print an **INTEL** section, like the existing Influence section).
- In `generateMorningBriefing(...)`, set `onRadar` fields with real counts:
- `relationshipsNeedingAttention` from `influence_followups`
- `tasksDueThisWeek/tasksAtRisk` (optional) and `intelUnreadCount` (either by adding a new field or folding into `recommendation` until UI supports it)

## How this ties to “Intelligence Engine” plan

This completes the **Brain+Memory foundation** portion of [`/.cursor/plans/empire_intelligence_engine_2b6e2c00.plan.md`](.cursor/plans/empire_intelligence_engine_2b6e2c00.plan.md):

- You get **persistent `intel_items`** (memory), dedupe, and tenant-aware access.
- Later phases (embeddings/scoring/opportunity/risk) can be layered on top without changing the UI again.

## Files touched / added

- Add: `runalnur-app/supabase/migrations/2026xxxx_intel_engine_v1.sql`
- Add: `runalnur-app/lib/intelligence/ingest.ts`
- Update: `runalnur-app/app/api/intelligence/route.ts`
- Add (optional): `runalnur-app/app/api/cron/intelligence/route.ts`
- Update: `runalnur-app/lib/coo/engine.ts`
- Update: `runalnur-app/lib/coo/prompts.ts`

## Environment

- `INTEL_ENGINE_ENABLED=true`
- Existing keys remain: `X_BEARER_TOKEN`, `NEWSAPI_KEY`, `GNEWS_API_KEY`
- Existing COO model config remains (Opus + Gemini) and benefits from added intel context.