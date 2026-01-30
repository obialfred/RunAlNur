---
name: ClickUp Setup + Integration
overview: Automate the complete House Al Nur ClickUp structure (folders, lists, seed tasks) via API, then wire RunAlNur to display and interact with that ClickUp data as your unified command dashboard.
todos:
  - id: extend-clickup-client
    content: Add createFolder and createList methods to ClickUp client
    status: completed
  - id: create-spec-data
    content: Create house-al-nur-spec.ts with all 5 spaces, 23 folders, 47 lists, ~100 seed tasks
    status: completed
  - id: create-setup-executor
    content: Build idempotent setup-executor.ts that creates missing items
    status: completed
  - id: create-setup-api
    content: Create /api/clickup/setup endpoint (POST to run, GET to check)
    status: completed
  - id: add-setup-ui
    content: Add Setup ClickUp Structure button to Settings page
    status: completed
  - id: run-setup
    content: Execute setup to populate ClickUp with full structure
    status: completed
  - id: manual-clickup-steps
    content: "In ClickUp UI: create status template, add views, enable dependencies"
    status: completed
  - id: add-space-mapping
    content: Add CLICKUP_SPACE_MAP to constants.ts
    status: completed
  - id: build-hierarchy-hook
    content: Create useClickUpHierarchy hook to fetch folders/lists/tasks
    status: completed
  - id: update-arm-pages
    content: Update arm pages to display ClickUp folders and lists
    status: completed
  - id: update-command-center
    content: Add ClickUp tasks widgets to Command Center dashboard
    status: completed
---

# ClickUp Setup + RunAlNur Integration

## Goal

Set up your entire House Al Nur spec **in ClickUp** (the right tool for task management), then make **RunAlNur your AI-powered dashboard** that reads/writes to ClickUp.

---

## Part 1: Automate ClickUp Structure (via API)

### What the API CAN create:

- Folders in each Space
- Lists in each Folder
- Seed tasks in each List
- Custom field values on tasks

### What requires manual UI (API limitation):

- Status template ("Standard - Al Nur") - create once, apply to spaces
- Views (Board/List/Gantt/Calendar) - add manually per list
- Dependencies toggle - enable manually per list

### Implementation

**1. Extend ClickUp client** ([`lib/integrations/clickup.ts`](runalnur-app/lib/integrations/clickup.ts))

```typescript
// Add these methods
async createFolder(spaceId: string, name: string)
async createList(folderId: string, name: string)  
async createFolderlessList(spaceId: string, name: string)
```

**2. Create spec data file** (`lib/clickup/house-al-nur-spec.ts`)

Contains the entire structure as typed data:

- 5 Spaces (Corporate, Nova, Janna, ATW, OBX)
- 23 Folders total
- 47 Lists total
- ~100 seed tasks

**3. Create setup executor** (`lib/clickup/setup-executor.ts`)

Idempotent logic:

1. Fetch existing structure (spaces → folders → lists)
2. For each space: create missing folders
3. For each folder: create missing lists
4. For each list: create seed tasks (skip if name exists)
5. Return report of what was created vs already existed

**4. Create setup API** (`app/api/clickup/setup/route.ts`)

- `POST` - Execute setup, returns progress
- `GET` - Check what exists vs what's missing

**5. Add UI trigger** (Settings page)

"Setup ClickUp Structure" button that runs the setup with progress feedback.

---

## Part 2: Manual ClickUp Steps (Checklist)

After the automation runs, do these in ClickUp UI:

1. [ ] Create status template "Standard – Al Nūr" (Backlog → In Progress → Blocked → Review → Done)
2. [ ] Apply template to all 5 Spaces
3. [ ] Add Board view to every List
4. [ ] Add Gantt view to: Janna/Casablanca Projects, Nova/Studio Pro Gen1 Launch
5. [ ] Add Calendar view to: OBX/Release Calendar
6. [ ] Enable Dependencies in: Janna/Casablanca Projects

---

## Part 3: RunAlNur Integration (Dashboard Layer)

### 3.1 Space-to-Arm Mapping

Add to [`lib/constants.ts`](runalnur-app/lib/constants.ts):

```typescript
export const CLICKUP_SPACE_MAP: Record<ArmId, string> = {
  nova: "Nova",
  janna: "Janna",
  atw: "Arabia & The World",
  obx: "OBX / Obi Alfred",
  house: "House Al Nūr – Corporate",
};
```

### 3.2 Fetch ClickUp hierarchy

New hook: `useClickUpHierarchy(spaceId)`

- Returns folders → lists → tasks for a space
- Caches in memory for fast re-renders

### 3.3 Display in RunAlNur

**Arm pages** (`/arms/[arm]`):

- Show ClickUp folders as sections
- Show lists as project cards
- Click list → see tasks from ClickUp

**Command Center** (`/`):

- "Tasks Due Today" widget pulling from ClickUp
- "Recent Activity" from ClickUp (if webhook set up)
- Quick-create task → pushes to ClickUp

### 3.4 AI Integration

AI tools can now:

- `get_clickup_tasks(space, list)` - fetch tasks
- `create_clickup_task(list_id, name, ...)` - create task
- `update_task_status(task_id, status)` - change status
- `get_overdue_tasks()` - across all spaces

---

## File Changes Summary

| File | Change |

|------|--------|

| `lib/integrations/clickup.ts` | Add createFolder, createList methods |

| `lib/clickup/house-al-nur-spec.ts` | New - full structure data |

| `lib/clickup/setup-executor.ts` | New - idempotent setup logic |

| `app/api/clickup/setup/route.ts` | New - setup endpoint |

| `lib/constants.ts` | Add CLICKUP_SPACE_MAP |

| `lib/hooks/useClickUpHierarchy.ts` | New - fetch hierarchy |

| `app/arms/[arm]/page.tsx` | Show ClickUp folders/lists |

| `app/page.tsx` | ClickUp tasks widget |

| `app/settings/page.tsx` | Setup button |

---

## Execution Order

1. **Extend ClickUp client** (add create methods)
2. **Create spec data file** (all folders/lists/tasks)
3. **Create setup executor** (idempotent logic)
4. **Create setup API + UI** (trigger button)
5. **Run setup** → creates ~170 items in ClickUp
6. **Manual UI steps** (status template, views)
7. **Add Space-Arm mapping** (constants)
8. **Build hierarchy hook** (fetch ClickUp structure)
9. **Update Arm pages** (display ClickUp data)
10. **Update Command Center** (ClickUp widgets)

---

## End State

- **ClickUp**: Full House Al Nur structure with all folders, lists, seed tasks
- **RunAlNur**: Unified dashboard showing ClickUp data + AI that can create/update tasks
- **You**: One place to see everything, with the power of ClickUp behind it