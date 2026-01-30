---
name: Three Mode System
overview: ""
todos:
  - id: mode-context
    content: Create mode context (lib/mode/context.tsx) with localStorage persistence
    status: pending
  - id: mode-switcher
    content: Build ModeSwitcher component with animated popover on logo click
    status: pending
    dependencies:
      - mode-context
  - id: sidebar-modes
    content: Update Sidebar.tsx to render different navigation per mode
    status: pending
    dependencies:
      - mode-context
  - id: mode-provider
    content: Wrap app layout with ModeProvider
    status: pending
    dependencies:
      - mode-context
  - id: capital-routes
    content: Create /capital route folder with dashboard, portfolio, treasury, entities pages
    status: pending
    dependencies:
      - sidebar-modes
  - id: influence-routes
    content: Create /influence route folder with dashboard, relationships, intel, legitimacy pages
    status: pending
    dependencies:
      - sidebar-modes
  - id: command-enhance
    content: Add Continuity section (decisions, principles, timeline) to Command mode
    status: pending
    dependencies:
      - sidebar-modes
  - id: capital-components
    content: "Build Capital components: HoldingsTable, EntityTree, NAVChart"
    status: pending
    dependencies:
      - capital-routes
  - id: influence-components
    content: "Build Influence components: RelationshipGraph, IntelFeed, ContactScoreCard"
    status: pending
    dependencies:
      - influence-routes
  - id: schema-update
    content: Add new database tables for Capital and Influence data
    status: pending
  - id: capital-api
    content: Build API routes for holdings, entities, accounts, commitments
    status: pending
    dependencies:
      - schema-update
  - id: influence-api
    content: Build API routes for relationships, intel, legitimacy
    status: pending
    dependencies:
      - schema-update
---

# Three Mode System Implementation

## Overview

Transform RunAlNur into a 3-mode system where clicking the RN logo switches between Command, Capital, and Influence modes. Each mode has its own navigation structure while sharing the same unified data layer.

---

## Mode Switcher UX

Clicking the RN square logo opens a sleek popover with mode selection:

```
┌────────────────────────────────────┐
│  ┌────┐                            │
│  │ RN │  RUNALNUR                  │
│  └────┘  Empire OS                 │
│                                    │
│  ─────────────────────────────     │
│                                    │
│  ◉ COMMAND                         │
│    Run the empire                  │
│                                    │
│  ○ CAPITAL                         │
│    What you own                    │
│                                    │
│  ○ INFLUENCE                       │
│    Who you know                    │
│                                    │
└────────────────────────────────────┘
```

The active mode shows a filled indicator. Switching modes animates the sidebar content.

---

## Mode Definitions

### Command Mode (Default)

**Route prefix:** `/` (root)

**Icon:** Command/Crown

**Color accent:** Default (no accent)

```
MONITOR
  Command Center  /
  Activity        /activity
  Live Status     /status
  Reports         /reports

ORCHESTRATE
  Nova            /arms/nova
  Janna           /arms/janna
  Silk            /arms/silk
  ATW             /arms/atw
  OBX Music       /arms/obx
  House           /arms/house
  Maison          /arms/maison

DELEGATE
  Projects        /projects
  Contacts        /contacts
  SOPs            /sops
  Knowledge       /knowledge
  AI Manager      /ai

CONTINUITY
  Decisions       /decisions
  Principles      /principles
  Timeline        /timeline
  Inbox           /inbox
```

### Capital Mode

**Route prefix:** `/capital`

**Icon:** Vault/Coins

**Color accent:** Subtle gold tint on logo

```
OVERVIEW
  Dashboard       /capital
  Net Worth       /capital/networth

HOLDINGS
  Portfolio       /capital/portfolio
  By Entity       /capital/entities
  By Asset Class  /capital/assets

TREASURY
  Accounts        /capital/treasury
  Cash Flow       /capital/cashflow
  Forecasts       /capital/forecasts

INVESTMENTS
  Commitments     /capital/investments
  Capital Calls   /capital/calls
  Distributions   /capital/distributions

STRUCTURE
  Entities        /capital/entities
  Ownership       /capital/ownership
```

### Influence Mode

**Route prefix:** `/influence`

**Icon:** Network/Users

**Color accent:** Subtle blue tint on logo

```
OVERVIEW
  Dashboard       /influence
  This Week       /influence/week

RELATIONSHIPS
  All Contacts    /influence/relationships
  Inner Circle    /influence/inner
  Strategic       /influence/strategic
  Network Graph   /influence/graph

INTELLIGENCE
  News Feed       /influence/intel
  Alerts          /influence/alerts
  Watchlist       /influence/watchlist

LEGITIMACY
  Media           /influence/media
  Recognition     /influence/recognition
  Footprint       /influence/footprint
```

---

## Technical Implementation

### 1. Mode Context

Create a mode context to manage state across the app:

**File:** `lib/mode/context.tsx`

```typescript
type Mode = 'command' | 'capital' | 'influence';

interface ModeContextValue {
  mode: Mode;
  setMode: (mode: Mode) => void;
}
```

- Persists to localStorage
- Syncs with URL prefix on navigation
- Provides mode-aware styling variables

### 2. Mode Switcher Component

**File:** `components/layout/ModeSwitcher.tsx`

- Replaces the current Link wrapper on the logo
- Uses Popover from shadcn/ui
- Animated transitions using existing motion tokens
- Shows current mode indicator
- Optional: Logo background subtly changes per mode

### 3. Dynamic Sidebar

Update [Sidebar.tsx](runalnur-app/components/layout/Sidebar.tsx) to:

- Read from mode context
- Render different navigation sections per mode
- Animate transitions between modes with `AnimatePresence`
- Use `layoutId` for smooth active state transitions

### 4. Route Structure

New route folders:

```
app/
├── (command)/              # Command mode (existing routes moved here or aliased)
│   ├── page.tsx           # Dashboard
│   ├── activity/
│   ├── projects/
│   └── ...
├── capital/               # Capital mode
│   ├── page.tsx          # Capital dashboard
│   ├── portfolio/
│   ├── treasury/
│   ├── investments/
│   └── entities/
└── influence/            # Influence mode
    ├── page.tsx         # Influence dashboard
    ├── relationships/
    ├── intel/
    └── legitimacy/
```

### 5. Database Schema Additions

New tables for Capital and Influence (as previously defined):

**Capital tables:**

- `entities` - Legal entities structure
- `holdings` - Asset positions
- `accounts` - Bank/brokerage accounts
- `commitments` - PE/VC commitments
- `capital_calls` - Call tracking
- `distributions` - Distribution tracking

**Influence tables:**

- `relationship_scores` - Contact scoring additions
- `relationship_edges` - Network connections
- `intel_items` - News/intelligence
- `intel_alerts` - Prioritized alerts
- `legitimacy_metrics` - Recognition tracking

---

## Implementation Phases

### Phase 1: Mode Infrastructure (1-2 days)

1. Create mode context with localStorage persistence
2. Build ModeSwitcher component with popover
3. Update Sidebar to be mode-aware
4. Add mode indicator to logo (subtle color/icon change)

### Phase 2: Capital Mode Shell (2-3 days)

1. Create `/capital` route folder
2. Build Capital dashboard page (placeholder metrics)
3. Build Portfolio page (manual holdings entry)
4. Build Entities page (structure visualization)
5. Add Capital navigation to sidebar

### Phase 3: Influence Mode Shell (2-3 days)

1. Create `/influence` route folder
2. Build Influence dashboard page
3. Upgrade contacts with relationship scoring
4. Build Relationships page with graph visualization
5. Add Influence navigation to sidebar

### Phase 4: Command Mode Enhancement (1-2 days)

1. Add Continuity section (Decisions, Principles, Timeline)
2. Add Inbox for approvals/notifications
3. Ensure all existing routes work cleanly

### Phase 5: Data Layer (3-5 days)

1. Create database schema for new tables
2. Build API routes for CRUD operations
3. Create hooks for data fetching
4. Wire up components to real data

---

## File Changes Summary

**New files:**

- `lib/mode/context.tsx` - Mode state management
- `components/layout/ModeSwitcher.tsx` - Logo click handler + popover
- `app/capital/page.tsx` - Capital dashboard
- `app/capital/portfolio/page.tsx` - Holdings view
- `app/capital/treasury/page.tsx` - Accounts view
- `app/capital/investments/page.tsx` - Commitments view
- `app/capital/entities/page.tsx` - Entity structure
- `app/influence/page.tsx` - Influence dashboard
- `app/influence/relationships/page.tsx` - Relationship graph
- `app/influence/intel/page.tsx` - Intelligence feed
- `app/influence/legitimacy/page.tsx` - Media tracking
- `components/capital/*` - Capital-specific components
- `components/influence/*` - Influence-specific components

**Modified files:**

- [Sidebar.tsx](runalnur-app/components/layout/Sidebar.tsx) - Mode-aware navigation
- [layout.tsx](runalnur-app/app/layout.tsx) - Wrap with ModeProvider
- [globals.css](runalnur-app/app/globals.css) - Mode-specific accent colors
- [schema.sql](runalnur-app/lib/supabase/schema.sql) - New tables

---

## Design Consistency

All new components will use:

- Existing motion tokens from `lib/motion/tokens.ts`
- Same card styles (`.agentic-card`)
- Same typography (`.text-section`, `.text-label`)
- Same color system (monochrome with status colors)
- Same spacing and sizing patterns
- `useReducedMotion` support throughout

---

Ready to begin with Phase 1: Mode Infrastructure?