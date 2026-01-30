---
name: Production Knowledge Page
overview: Fix the Knowledge page to display Guru cards correctly (the field mapping is broken) and rebuild it to production quality with search, collection filtering, card detail view, and polish matching the rest of RunAlNur.
todos:
  - id: fix-api-mapping
    content: Fix field mapping in /api/guru/cards to normalize preferredPhrase to title
    status: completed
  - id: create-hooks
    content: Create useGuruCards and useGuruCollections hooks with search/filter support
    status: completed
  - id: knowledge-card
    content: Create KnowledgeCard component for grid display
    status: completed
  - id: card-detail
    content: Create CardDetail slide-in panel for viewing full card content
    status: completed
  - id: rebuild-page
    content: Rebuild Knowledge page with search, collection tabs, card grid, and animations
    status: completed
  - id: polish
    content: Add loading skeletons, empty states, and final polish
    status: completed
---

# Production-Ready Knowledge Page

## Problem

The Knowledge page shows "Untitled" for all cards because the Guru API returns `preferredPhrase` as the title field, but the frontend expects `card.title`. Additionally, the page lacks production polish - no search, no filtering, no detail view.

## Root Cause

In [app/knowledge/page.tsx](runalnur-app/app/knowledge/page.tsx) line 40:

```tsx
<td className="font-medium">{card.title || "Untitled"}</td>
```

But Guru returns `preferredPhrase` (see [lib/integrations/guru.ts](runalnur-app/lib/integrations/guru.ts) line 24).

## Solution

### 1. Fix Field Mapping in API Route

Normalize the Guru response in [app/api/guru/cards/route.ts](runalnur-app/app/api/guru/cards/route.ts) to map fields to a consistent shape:

```typescript
const normalizedCards = cards.map(card => ({
  id: card.id,
  title: card.preferredPhrase,  // Map preferredPhrase to title
  content: card.content,
  collection: card.collection,
  updatedAt: card.lastModified,
  createdAt: card.dateCreated,
  verificationState: card.verificationState,
  owner: card.owner,
}));
```

### 2. Rebuild Knowledge Page UI

Replace the basic table with a production-quality interface:

```
+--------------------------------------------------+
| Knowledge                           [Search...] |
| Guru knowledge cards and memory                  |
+--------------------------------------------------+
| [All] [Vision] [Principles] [Arms] [Arabia] ... |
+--------------------------------------------------+
| +----------------+  +----------------+           |
| | The Meta-Goal  |  | Mission Stmt   |           |
| | Vision         |  | Vision         |           |
| | Updated today  |  | Updated today  |           |
| +----------------+  +----------------+           |
| +----------------+  +----------------+           |
| | Core Worldview |  | Nova - Shield  |           |
| | Principles     |  | Arms           |           |
| | Updated today  |  | Updated today  |           |
| +----------------+  +----------------+           |
+--------------------------------------------------+
```

Features:

- Search input with debounced query
- Collection filter tabs (fetched from /api/guru/collections)
- Card grid layout (responsive, 2-4 columns)
- Card click opens detail panel/modal with full content
- Loading skeleton states
- Empty states when no results
- Framer Motion animations matching existing patterns

### 3. Create Card Detail Component

New component `components/knowledge/CardDetail.tsx`:

- Slide-in panel or modal showing full card content
- Render HTML content safely
- Show metadata (collection, last updated, owner)
- Link to open in Guru

### 4. Add Hooks

New hook `lib/hooks/useGuruCards.ts`:

- Wraps /api/guru/cards with query/collection params
- Handles search debouncing

New hook `lib/hooks/useGuruCollections.ts`:

- Fetches collections for filter tabs

## Files to Modify

- `app/api/guru/cards/route.ts` - Normalize field mapping
- `app/knowledge/page.tsx` - Complete rebuild

## Files to Create

- `components/knowledge/KnowledgeCard.tsx` - Card component for grid
- `components/knowledge/CardDetail.tsx` - Detail panel/modal
- `lib/hooks/useGuruCards.ts` - Data hook with search
- `lib/hooks/useGuruCollections.ts` - Collections hook

## ClickUp Task Flow Status

ClickUp integration appears functional - the Command Center already shows ClickUp workspace hierarchy when connected. No additional work needed there.