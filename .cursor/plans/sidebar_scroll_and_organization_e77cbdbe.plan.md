---
name: Sidebar scroll and organization
overview: Fix sidebar scroll behavior and reorganize navigation to reduce visual clutter while maintaining quick access to key features.
todos:
  - id: scroll-fix
    content: Add h-screen and overflow-hidden to sidebar aside element for proper scroll containment
    status: completed
  - id: collapsible-sections
    content: Convert NavSection into collapsible component with expand/collapse toggle
    status: completed
  - id: persist-state
    content: Add localStorage persistence for section collapse states
    status: completed
  - id: auto-expand
    content: Auto-expand section when navigating to item within it
    status: completed
---

# Sidebar Scroll and Organization

## Current Issues

**Scroll Problem**: The `ScrollArea` in [Sidebar.tsx](runalnur-app/components/layout/Sidebar.tsx) has `className="flex-1"` but the parent `aside` needs explicit height constraints for the flex child to properly calculate overflow.

**Organization Problem**: Command mode has 23 navigation items across 4 sections plus 2 footer items. The "Orchestrate" section alone has 7 arms listed individually.

---

## Part 1: Fix Scroll Behavior

The sidebar `aside` element needs `h-screen` or `h-full` with `overflow-hidden` to properly constrain the flex children:

```tsx
// Current (line 462)
className="hidden md:flex w-56 border-r border-border bg-sidebar flex-col"

// Fixed
className="hidden md:flex w-56 border-r border-border bg-sidebar flex-col h-screen overflow-hidden"
```

Also ensure the ScrollArea viewport fills properly by adding `h-full` to the inner content wrapper.

---

## Part 2: Sidebar Organization Options

Here are three approaches to reduce clutter:

### Option A: Collapsible Sections (Recommended)

Add expand/collapse toggles to section headers. Sections remember their state.

```
- MONITOR (expanded by default)
  Command Center, Activity, Live Status, Reports

+ ORCHESTRATE (collapsed - shows count badge "7")
  
- DELEGATE (expanded)
  Projects, Contacts, SOPs, Knowledge, COO, AI Chat

+ CONTINUITY (collapsed)
```

**Pros**: Everything accessible, user controls density

**Cons**: Extra click to access collapsed items

### Option B: Merge Arms into Single "Arms" Page

Replace 7 individual arm links with one "ARMS" link that goes to a hub page with cards for each arm.

```
ORCHESTRATE
  ARMS → /arms (hub page with all 7)
```

**Pros**: Dramatically reduces items (7 → 1)

**Cons**: Extra navigation step to reach specific arm

### Option C: Progressive Disclosure with "Favorites"

Show only pinned/favorite items by default, with a "More..." expander for the rest.

```
ORCHESTRATE
  ★ NOVA (pinned)
  ★ JANNA (pinned)
  More arms... (expands to show rest)
```

**Pros**: Personalized, shows most-used items

**Cons**: Requires state management, initial setup

---

## Recommendation

Implement **Part 1** (scroll fix) and **Option A** (collapsible sections) because:

1. Collapsible sections are familiar UX pattern
2. No loss of functionality - just toggle to see items
3. Can persist state in localStorage
4. Sections auto-expand when navigating to an item within them
```
┌─────────────────────┐
│ RN  RUNALNUR        │
│     Empire OS       │
├─────────────────────┤
│ • MONITOR         ▼ │ ← Expanded
│   Command Center    │
│   Activity          │
│   Live Status    ●  │
│   Reports           │
│                     │
│ • ORCHESTRATE    ▶ │ ← Collapsed (7)
│                     │
│ • DELEGATE       ▼ │ ← Expanded
│   Projects          │
│   Contacts          │
│   ...               │
│                     │
│ • CONTINUITY     ▶ │ ← Collapsed
│                     │
│    (scrollable)     │
├─────────────────────┤
│   Setup Wizard      │
│   Settings          │
└─────────────────────┘
```


---

## Implementation Files

1. [Sidebar.tsx](runalnur-app/components/layout/Sidebar.tsx) - Main changes
2. May need a `useSidebarState` hook for persisting collapse state