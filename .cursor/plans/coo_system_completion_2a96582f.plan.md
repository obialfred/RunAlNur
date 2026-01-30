---
name: COO System Completion
overview: "Complete the remaining AgentBoss/COO features: focus session persistence, PriorityBar integration, EOD summary UI, scheduled briefings, calendar integration, and cross-mode alert inputs. STATUS: CORE COMPLETE - Calendar and ClickUp sync are optional enhancements."
todos:
  - id: focus-sessions-api
    content: Create focus session API routes (start/pause/end) and useFocusSession hook
    status: completed
  - id: priority-bar
    content: Build PriorityBar component and integrate into TopBar with real-time timer
    status: completed
  - id: focus-time-display
    content: Connect COO page focus time to actual session data with real-time updates
    status: completed
  - id: eod-summary-ui
    content: Create DaySummary component and add EOD trigger to COO page
    status: completed
  - id: coo-settings
    content: Build COOSettings component for preferences configuration
    status: completed
  - id: calendar-integration
    content: Integrate Google/Outlook calendar into priority context
    status: cancelled
  - id: cross-mode-input
    content: Feed Capital and Influence alerts into priority generation
    status: completed
  - id: guru-caching
    content: Add guru_cards cache table and sync service
    status: cancelled
  - id: clickup-sync
    content: Sync completion status back to ClickUp when priority marked done
    status: cancelled
---

# COO/AgentBoss - Remaining Work

## Current State (What Works)

The core priority engine is operational:

- **Opus + Gemini** - Both models working, priority generation takes ~37s
- **Guru Knowledge** - Loads 18 House Al Nur cards, extracts vision/principles/arms
- **ClickUp Tasks** - Fetches ~44 tasks across all spaces/folders
- **Priority Generation** - Returns top 3 priorities with reasoning
- **Accountability Check-in** - Gemini generates push messages
- **Database Schema** - All tables created (`coo_priorities`, `coo_focus_sessions`, `coo_preferences`, `coo_accountability_log`)

## Critical Gaps (Phase 4-5)

### 1. Focus Session Tracking - NO PERSISTENCE

The schema for `coo_focus_sessions` exists but **NO API routes** to use it.

**Current Behavior:**

- Click "Start" → Status changes to `in_progress` locally
- Refresh page → Status resets to `pending`
- "Focus Time: 0m" is hardcoded static

**Missing APIs:**

```
POST /api/coo/sessions/start     - Create session, start timer
POST /api/coo/sessions/:id/pause - Pause with duration
POST /api/coo/sessions/:id/end   - End session (complete/defer)
GET  /api/coo/sessions/active    - Get current active session
```

**Files to create:**

- [app/api/coo/sessions/route.ts](runalnur-app/app/api/coo/sessions/route.ts) - Start session
- [app/api/coo/sessions/[id]/route.ts](runalnur-app/app/api/coo/sessions/[id]/route.ts) - Pause/End
- Update [lib/hooks/useCOO.ts](runalnur-app/lib/hooks/useCOO.ts) - Add `useFocusSession()` hook

---

### 2. PriorityBar in TopBar - NOT INTEGRATED

`PriorityBarItem` component exists in [components/coo/PriorityCard.tsx](runalnur-app/components/coo/PriorityCard.tsx) but is **never imported into TopBar**.

**Expected UX:**

```
┌────────────────────────────────────────────────────────────┐
│ 🎯 NOW: Review Nova pitch deck (1/3)  ⏱️ 1h 23m  [✓] [⏸]  │
└────────────────────────────────────────────────────────────┘
```

**Files to modify:**

- [components/layout/TopBar.tsx](runalnur-app/components/layout/TopBar.tsx) - Add PriorityBar
- Create [components/coo/PriorityBar.tsx](runalnur-app/components/coo/PriorityBar.tsx) - Full bar component with timer

---

### 3. EOD Summary UI - NO COMPONENT

The engine function `generateEODSummary()` and API `/api/coo/briefing?type=evening` exist, but there's **no UI to display it**.

**Missing:**

- [components/coo/DaySummary.tsx](runalnur-app/components/coo/DaySummary.tsx) - Scorecard + assessment
- EOD button or auto-trigger in COO page

---

### 4. Focus Time Display - NOT REAL-TIME

[app/coo/page.tsx](runalnur-app/app/coo/page.tsx) line 169 shows:

```tsx
<p className="text-xl font-semibold tabular-nums">0m</p>
```

**Should:**

- Fetch actual focus time from `coo_focus_sessions`
- Real-time timer when session is active
- Sum of all sessions for the day

---

### 5. Calendar Integration - HARDCODED EMPTY

In [lib/coo/engine.ts](runalnur-app/lib/coo/engine.ts) line 400:

```typescript
calendar: [], // TODO: Integrate calendar
```

**Missing:**

- Google/Outlook calendar API integration
- Calendar events in priority context
- Meeting prep considerations

---

### 6. Cross-Mode Alerts Input - NOT CONNECTED

The cross-mode alert system exists separately but is **NOT fed into priority generation**.

In the plan, priorities should consider:

- Capital alerts (bills due, tax deadlines)
- Influence alerts (relationship decay)

**Current:** Engine only uses ClickUp tasks + Guru knowledge

---

### 7. Guru Knowledge Caching - FETCHES EVERY TIME

Currently loads Guru cards fresh on every `generatePriorities()` call.

**Plan called for:**

- `guru_cards` cache table
- `guru_embeddings` for semantic search
- Daily sync + incremental updates

**Current:** Direct API call, ~3-5 second overhead per generation

---

### 8. COO Settings Page - NO UI

Preferences API exists (`/api/coo/preferences`) but **no settings UI**.

**Missing:**

- [components/coo/COOSettings.tsx](runalnur-app/components/coo/COOSettings.tsx)
- Configure: morning time, evening time, push intensity, max priorities

---

### 9. Scheduled Briefings - NO AUTOMATION

No cron jobs or scheduled tasks for:

- Morning briefing at configured time
- EOD summary at configured time
- Push notifications

---

### 10. ClickUp Sync on Complete - ONE-WAY ONLY

When priority is marked complete, ClickUp task status is **NOT updated**.

**Should:** Call ClickUp API to move task to "Complete" status

---

## Priority Order for Implementation

1. **Focus Session APIs + Persistence** (Critical - core functionality broken)
2. **PriorityBar in TopBar** (High - key accountability UX)
3. **Real Focus Time Display** (High - depends on #1)
4. **EOD Summary Component** (Medium - completes daily cycle)
5. **COO Settings Page** (Medium - user configuration)
6. **Calendar Integration** (Medium - better prioritization)
7. **Cross-Mode Alerts Input** (Medium - holistic priorities)
8. **Guru Knowledge Caching** (Low - performance optimization)
9. **Scheduled Briefings** (Low - requires external scheduler)
10. **ClickUp Sync on Complete** (Low - nice-to-have)

---

## Files Summary

### New Files Needed

- `app/api/coo/sessions/route.ts`
- `app/api/coo/sessions/[id]/route.ts`
- `components/coo/PriorityBar.tsx`
- `components/coo/DaySummary.tsx`
- `components/coo/COOSettings.tsx`

### Files to Modify

- `components/layout/TopBar.tsx` - Add PriorityBar
- `lib/hooks/useCOO.ts` - Add useFocusSession hook
- `app/coo/page.tsx` - Real focus time, EOD button
- `lib/coo/engine.ts` - Add calendar, cross-mode context