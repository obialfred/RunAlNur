---
name: RunAlNur Parity Roadmap
overview: Build RunAlNur as the primary internal OS with ClickUp-spec parity first, then expand toward full task/project suite (tailored to House Al Nūr), while designing the data model now for future multi-user scale.
todos:
  - id: p0-schema-folders-customfields
    content: Add folders + spec custom fields + org_id foundations to schema (without enabling multi-user UI yet)
    status: pending
  - id: p0-seed-house-structure
    content: Implement idempotent seeding of House Al Nūr folders/projects/seed tasks into Supabase
    status: pending
  - id: p0-navigation-tree
    content: Update navigation to show Arm → Folder → Project structure
    status: pending
  - id: p0-views
    content: Ensure Board + List views for tasks; add Calendar/Gantt where required by spec
    status: pending
  - id: p1-subtasks-deps
    content: Add subtasks + dependencies model + UI
    status: pending
  - id: p1-comments-mentions-notifs
    content: Add comments, @mentions parsing, and in-app notifications
    status: pending
  - id: p1-attachments
    content: Add attachments (Supabase Storage) and UI
    status: pending
  - id: p1-templates-forms
    content: Add templates + intake forms for common pipelines
    status: pending
  - id: p1-audit-log
    content: Add audit log entries for entity changes
    status: pending
  - id: p2-automations-kpis
    content: Add automations rules engine + KPI dashboards tied to Command Center
    status: pending
  - id: p3-clickup-sync
    content: "Optional: implement ClickUp export/import + webhook sync toggle per project"
    status: pending
---

# RunAlNur as Primary OS (ClickUp-Spec Parity Now, Full Suite Roadmap)

## What “full parity” means (practically)

We will **not** attempt to clone every ClickUp surface area 1:1. Instead we’ll deliver:

- **Parity with your House Al Nūr spec** (structure + starter tasks + required views)
- **Parity with core task/project primitives** that make it viable as long-term internal software
- A **roadmap to deeper ClickUp-style features**, built on foundations we lay now so we don’t have to redo schema later

---

## Target Feature Set (Tailored to RunAlNur)

### A) Spec parity (P0)

- Arms ↔ Spaces mapping (already conceptually aligned)
- Folders (00 Command Center, etc.)
- Lists (your lists) and seed tasks
- Views:
- Board + List everywhere
- Gantt for Janna/Casablanca + Nova/Studio Pro Gen1
- Calendar for OBX/Release Calendar (and optional corporate reporting)
- Dependencies enabled for Casablanca Projects
- Workspace-level fields mirrored as RunAlNur custom fields:
- Brand, Workstream, Priority, Region, Target Quarter, HubSpot Link, Process Street Run Link

### B) Core primitives (P1)

- Subtasks
- Comments (with @mention semantics)
- Attachments
- Templates (task/project templates)
- Intake forms (create tasks/projects from structured inputs)
- Notifications (in-app first; email/push later)
- Audit log (who changed what/when)

### C) “ClickUp-like power features” (P2/P3)

- Automations (rule engine: when X then Y)
- Goals / KPI tracking (ties to Command Center metrics)
- Advanced dashboards (filters, widgets)
- Time tracking / estimates (optional)
- Docs/Wiki (optional; can integrate Guru heavily)

---

## Multi-user: “plan/build now, ship later”

We will **design for multi-user now** by introducing an org/membership model and permission hooks, but we can ship the first release **single-user enforced** (you + AI), and turn on multi-user later.

### Multi-user foundations we add early

- `orgs`, `org_memberships` tables
- `owner_id` remains, but we add `org_id` to all major entities
- RLS policies written to support both modes:
- **Now**: `org_id` exists but defaults to your org; only you can access
- **Later**: membership-based access with role scopes (admin/member/viewer) and per-arm access

---

## Proposed Phases (execution order)

### Phase 0 (P0): Spec parity inside RunAlNur

- Add **Folders** concept between Arm and Project
- Seed the full House Al Nūr structure (folders + projects + seed tasks)
- Add required views (Board/List now; Calendar/Gantt next if needed for immediate operations)
- Add task fields matching the spec (Brand/Workstream/etc.)

### Phase 1 (P1): Core collaboration primitives

- Subtasks + Dependencies
- Comments + @mentions (in-app notifications)
- Attachments
- Templates + Intake forms
- Audit log

### Phase 2 (P2): OS-grade features

- Automation rules
- KPI dashboards tied into Command Center
- Optional time tracking

### Phase 3 (P3): Optional ClickUp sync

- If you still want ClickUp around for team adoption:
- One-way export first (RunAlNur → ClickUp)
- Then webhooks for limited 2-way sync

---

## Key files we will touch

- [`runalnur-app/lib/supabase/schema.sql`](runalnur-app/lib/supabase/schema.sql): add folders, comments, attachments, templates, org/membership scaffolding; extend tasks for subtasks/deps/custom_fields
- [`runalnur-app/lib/types.ts`](runalnur-app/lib/types.ts): add Folder/Comment/Attachment/Template/Org types
- `runalnur-app/app/api/folders/route.ts` (new): CRUD
- `runalnur-app/app/api/seed/house-al-nur/route.ts` (new): idempotent seeding endpoint
- `runalnur-app/components/layout/*`: sidebar tree (Arm → Folder → Project)
- `runalnur-app/app/projects/[id]/page.tsx`: add List/Calendar/Gantt tabs + dependencies/subtasks
- `runalnur-app/components/modals/TaskModal.tsx`: subtasks, comments, attachments

---

## Explicit answer to your question

- **Will this give full feature parity with ClickUp?** Not 100% of ClickUp’s entire product.
- **Will it give everything you need for your startup TODOs and the entire spec?** **Yes**, with Phase 0 + Phase 1.
- **Will it support scaling into internal company infrastructure?** **Yes**, because we’ll lay org/membership + permission hooks early, and enforce multi-user later.