---
name: AgentCOO Priority Engine
overview: Transform the AI Manager into AgentCOO - a multi-model (Opus 4.5 + Gemini) priority engine that uses your Guru knowledge base to tell you exactly what to focus on, hold you accountable, and run daily operations for House Al Nur.
todos:
  - id: coo-prereq-read
    content: "PRE-WORK: Read existing AI files (agent.ts, ChatInterface.tsx, ai/page.tsx) and understand current patterns"
    status: completed
  - id: coo-schema
    content: Create database schema for priorities, sessions, preferences - TEST with actual inserts/queries
    status: completed
  - id: coo-knowledge
    content: Build Guru knowledge loader - VERIFY it fetches real cards and parses content correctly
    status: completed
  - id: coo-opus
    content: Implement Opus client - TEST with actual API call, verify response format
    status: completed
  - id: coo-gemini
    content: Implement Gemini client - TEST with actual API call, verify response format
    status: completed
  - id: coo-engine
    content: Build COO core engine - TEST priority generation with real ClickUp tasks + Guru context
    status: completed
  - id: coo-checkpoint-1
    content: "CHECKPOINT: Verify engine works end-to-end (fetch tasks, load knowledge, generate priorities)"
    status: completed
  - id: coo-api
    content: Build API routes - TEST each endpoint returns correct data, handles errors
    status: completed
  - id: coo-briefing-ui
    content: Build COO Briefing page - VISUAL CHECK in browser, verify no console errors
    status: completed
  - id: coo-upgrade-chat
    content: Upgrade AI Manager to COO - VISUAL CHECK rename works, personality shows
    status: completed
  - id: coo-checkpoint-2
    content: "CHECKPOINT: Full visual audit of all COO UI, test user flows work"
    status: completed
  - id: coo-priority-bar
    content: Build PriorityBar in TopBar - VISUAL CHECK it appears, timer works
    status: completed
  - id: coo-focus-tracking
    content: Implement focus tracking - TEST start/pause/complete actually persists state
    status: completed
  - id: coo-eod
    content: Build EOD summary - TEST Gemini generates honest assessment
    status: completed
  - id: coo-final-verify
    content: "FINAL: Complete end-to-end test - morning briefing, focus session, EOD summary"
    status: completed
---

# AgentCOO - The Operations Brain

## What We're Building

AgentCOO replaces AI Manager as the primary AI interface in RunAlNur. It's your Chief Operating Officer - pulling from ClickUp tasks, Guru knowledge, and calendar to:

1. Tell you what to focus on (with reasoning tied to House Al Nur vision)
2. Hold you accountable ("You deferred this 3 times. Do it or delete it.")
3. Run scheduled briefings (morning priorities, EOD summary)
4. Track focus sessions and completion

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        AgentCOO                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Opus 4.5   │    │    Gemini    │    │   Context    │  │
│  │  (Reasoning) │    │   (Push)     │    │   Builder    │  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘  │
│         │                   │                   │          │
│         └───────────┬───────┴───────────────────┘          │
│                     │                                       │
│              ┌──────▼──────┐                                │
│              │   COO Core   │                                │
│              │   Engine     │                                │
│              └──────┬──────┘                                │
│                     │                                       │
│    ┌────────────────┼────────────────┐                     │
│    │                │                │                     │
│    ▼                ▼                ▼                     │
│ ┌──────┐      ┌──────────┐    ┌───────────┐               │
│ │ Chat │      │ Briefing │    │ Priority  │               │
│ │ UI   │      │ View     │    │ Bar       │               │
│ └──────┘      └──────────┘    └───────────┘               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
         │              │              │
         ▼              ▼              ▼
    ┌─────────┐   ┌─────────┐   ┌─────────┐
    │ ClickUp │   │  Guru   │   │Calendar │
    │ Tasks   │   │Knowledge│   │ Events  │
    └─────────┘   └─────────┘   └─────────┘
```

## Multi-Model Strategy

### Opus 4.5 (Anthropic) - The Strategist

- Priority analysis and ranking
- Connecting tasks to House Al Nur vision/principles
- Nuanced reasoning ("This matters because...")
- Morning briefing generation
- Strategic recommendations

### Gemini (Google) - The Enforcer

- Accountability check-ins
- Direct push messaging
- "Why haven't you done X?" confrontations
- Progress nudges throughout the day
- EOD summary with honest assessment

### Model Routing Logic

```typescript
// lib/coo/model-router.ts
type COOTask = 'prioritize' | 'briefing' | 'accountability' | 'checkin' | 'summary';

function routeToModel(task: COOTask): 'opus' | 'gemini' {
  switch (task) {
    case 'prioritize':
    case 'briefing':
      return 'opus';      // Strategic, needs deep reasoning
    case 'accountability':
    case 'checkin':
    case 'summary':
      return 'gemini';    // Direct, pushing, evaluative
  }
}
```

## Data Flow

### Priority Generation (Opus)

1. Fetch tasks from ClickUp (existing integration)
2. Load Guru knowledge context:

            - Core: Vision, Principles, Priority Hierarchy from "House Al Nur - Vision" and "House Al Nur - Principles"
            - Arms: Relevant arm context from "House Al Nur - Arms"
            - Current Phase: Where we are now from "House Al Nur - Current Phase"

3. Build enriched context for each task
4. Call Opus with structured prompt
5. Return ranked priorities with reasoning

### Accountability Check-in (Gemini)

1. Load today's priorities and their status
2. Check what's been completed vs. deferred
3. Call Gemini with accountability prompt
4. Return direct, no-BS feedback

## Key Components

### 1. COO Core Engine

**File:** `lib/coo/engine.ts`

```typescript
interface COOContext {
  tasks: EnrichedTask[];
  knowledge: {
    vision: string;
    principles: string[];
    priorityHierarchy: string[];
    currentPhase: string;
    armContext: Record<string, string>;
  };
  calendar: CalendarEvent[];
  history: {
    completedToday: string[];
    deferredTasks: DeferredTask[];
    focusTime: number;
  };
}

async function generatePriorities(date: Date): Promise<Priority[]>
async function getAccountabilityCheck(): Promise<string>
async function generateBriefing(type: 'morning' | 'evening'): Promise<Briefing>
```

### 2. Guru Knowledge Loader

**File:** `lib/coo/knowledge.ts`

Loads structured knowledge from the Guru cards we created:

- The Meta-Goal
- Priority Hierarchy
- Core Worldview
- Where We Are Now
- Each arm's context

### 3. Model Clients

**File:** `lib/coo/models.ts`

```typescript
// Opus client for strategic reasoning
async function callOpus(prompt: string, context: COOContext): Promise<string>

// Gemini client for accountability/push
async function callGemini(prompt: string, context: COOContext): Promise<string>
```

### 4. UI Components

**COO Chat** (upgrade existing ChatInterface)

- Rename from "AI Manager" to "COO"
- Add COO personality/tone
- Show priority context in responses

**COO Briefing Page** (`app/coo/page.tsx`)

- Morning briefing view with top 3 priorities
- Accept/modify flow
- Why each priority matters (Guru-backed reasoning)

**Priority Bar** (`components/coo/PriorityBar.tsx`)

- Shows in TopBar: "NOW: [Current Focus] - 1h 23m"
- Start/Pause/Complete buttons
- Always visible reminder

**EOD Summary** (`components/coo/DaySummary.tsx`)

- What got done vs. planned
- Honest Gemini assessment
- Tomorrow preview

## Database Schema

```sql
-- Daily priorities generated by COO
CREATE TABLE coo_priorities (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  priorities JSONB NOT NULL,  -- Array of {rank, taskId, title, reasoning, effort, status}
  generated_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  UNIQUE(user_id, date)
);

-- Focus sessions
CREATE TABLE coo_focus_sessions (
  id UUID PRIMARY KEY,
  priority_id UUID REFERENCES coo_priorities(id),
  task_title VARCHAR(500),
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP,
  outcome VARCHAR(20)  -- 'completed', 'paused', 'deferred'
);

-- COO preferences
CREATE TABLE coo_preferences (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE,
  morning_briefing_time TIME DEFAULT '08:00',
  evening_summary_time TIME DEFAULT '18:00',
  max_priorities INTEGER DEFAULT 3,
  push_intensity VARCHAR(20) DEFAULT 'medium'  -- 'gentle', 'medium', 'aggressive'
);
```

## API Routes

```
POST /api/coo/priorities/generate  - Generate today's priorities (Opus)
GET  /api/coo/priorities/today     - Get today's priorities
POST /api/coo/priorities/:id/start - Start focus on a priority
POST /api/coo/priorities/:id/complete - Mark complete
POST /api/coo/priorities/:id/defer - Defer to another day

GET  /api/coo/briefing/morning     - Get morning briefing (Opus)
GET  /api/coo/briefing/evening     - Get EOD summary (Gemini)
POST /api/coo/checkin              - Get accountability check (Gemini)

GET  /api/coo/preferences          - Get COO preferences
PUT  /api/coo/preferences          - Update preferences
```

## Implementation Phases

### Phase 1: Core Engine + Opus Integration

- COO engine with Opus for priority generation
- Guru knowledge loader (use existing cards)
- ClickUp task fetching (existing)
- Basic priority generation API
- Database schema

### Phase 2: Gemini Integration + Accountability

- Add Gemini client
- Model routing logic
- Accountability check endpoint
- Push messaging system

### Phase 3: UI - Briefing + Chat Upgrade

- Rename AI Manager to COO
- Build COO Briefing page
- Morning briefing component
- Accept/modify priority flow

### Phase 4: Priority Bar + Focus Tracking

- Priority bar in TopBar
- Focus session tracking
- Start/pause/complete flow
- Timer display

### Phase 5: EOD + Scheduling

- EOD summary generation (Gemini)
- Cron jobs for scheduled briefings
- Push notifications for briefings
- Weekly pattern analysis

## Files to Create/Modify

### New Files

- `lib/coo/engine.ts` - Core COO engine
- `lib/coo/knowledge.ts` - Guru knowledge loader
- `lib/coo/models.ts` - Opus + Gemini clients
- `lib/coo/prompts.ts` - Prompt templates
- `app/coo/page.tsx` - COO briefing page
- `app/api/coo/priorities/route.ts` - Priority APIs
- `app/api/coo/briefing/route.ts` - Briefing APIs
- `components/coo/PriorityBar.tsx` - Top bar priority display
- `components/coo/MorningBriefing.tsx` - Briefing component
- `components/coo/DaySummary.tsx` - EOD component

### Files to Modify

- `app/ai/page.tsx` → Rename to COO, update UI
- `components/ai/ChatInterface.tsx` → Add COO personality
- `components/layout/TopBar.tsx` → Add PriorityBar
- `lib/ai/agent.ts` → Integrate COO tools

## Environment Variables Needed

```
# Existing
ANTHROPIC_API_KEY=xxx

# New
GOOGLE_AI_API_KEY=xxx  # For Gemini
```

---

## Anti-Cheat Guardrails and Quality Enforcement

### CRITICAL: These rules are non-negotiable during implementation.

### 1. Understand Before You Work (No Working Blind)

Before touching ANY file or writing ANY code:

**MUST DO:**

- Read the existing file completely if modifying it
- Read related files that import/export to understand dependencies
- Read the Guru knowledge cards to understand the House Al Nur context
- Read existing patterns in the codebase (how other similar features work)
- Understand the data flow end-to-end before implementing

**FORBIDDEN:**

- Writing code without reading the file first
- Assuming how something works without checking
- Copying patterns without verifying they fit
- Implementing based on memory of "how it probably works"

**Verification:** Before each implementation step, state what was read and what was understood.

### 2. No Shortcuts in Implementation

**MUST DO:**

- Implement every function completely (no stubs, no "TODO: implement later")
- Handle all error cases properly
- Add proper TypeScript types (no `any` unless absolutely necessary with justification)
- Follow existing code patterns in the codebase exactly
- Test each endpoint/function actually works before moving on

**FORBIDDEN:**

- Leaving placeholder implementations
- Skipping error handling "for now"
- Using `any` type to avoid thinking about types
- Writing code that "should work" without verification
- Moving to the next task before the current one actually works

### 3. Forced Quality Checks

After EVERY implementation step, run these checks:

```
1. LINT CHECK: Run ReadLints on modified files
         - If errors: Fix them before proceeding
         - No exceptions

2. VISUAL CHECK: If UI was modified, load it in browser
         - Take a snapshot or screenshot
         - Verify it looks correct, not broken
         - Check for console errors
         - No "it probably looks fine" - actually verify

3. FUNCTIONAL CHECK: If API was modified, test it
         - Make an actual request
         - Verify the response is correct
         - Check error cases work

4. INTEGRATION CHECK: Verify connected parts still work
         - If you modified a hook, check the components using it
         - If you modified an API, check the hooks calling it
         - If you modified a component, check the page using it
```

### 4. Go-Back Verification Protocol

Before marking ANY task complete:

**STEP 1: Re-read the task requirement**

- What was asked for?
- What was actually built?
- Do they match exactly?

**STEP 2: Test the happy path**

- Does the main use case work?
- Can you demonstrate it working?

**STEP 3: Test edge cases**

- What if data is missing?
- What if API fails?
- What if user is not authenticated?

**STEP 4: Visual inspection (for UI)**

- Does it match the design intention?
- Is it ugly or broken anywhere?
- Does it fit the RunAlNur aesthetic?

**STEP 5: Check downstream effects**

- Did this change break anything else?
- Are related features still working?

**Only after ALL 5 steps pass can the task be marked complete.**

### 5. Specific Anti-Cheat Rules for This Project

**For Guru Knowledge Loader:**

- Actually fetch cards from the API, verify data comes back
- Parse content correctly, verify parsing works
- Don't assume card structure, check it

**For Model Clients (Opus/Gemini):**

- Test each model actually responds
- Verify prompts produce expected output format
- Check token limits aren't being hit
- Don't mock the response during development

**For Priority Generation:**

- Verify ClickUp tasks are actually being fetched
- Verify Guru context is actually being included in prompts
- Check that priorities make sense (not random)
- Test with real data, not fake/mock data

**For UI Components:**

- Load every component in the browser
- Check it renders without errors
- Verify interactivity works (clicks, inputs)
- Test loading states and error states
- Check responsive behavior

**For Database Schema:**

- Run migrations actually work
- Insert test data, verify it saves
- Query data, verify it returns correctly
- Don't assume SQL is correct, test it

### 6. Definition of Done Checklist

A task is ONLY done when ALL of these are true:

- [ ] Code is written and saved
- [ ] Linter shows no errors on modified files
- [ ] TypeScript compiles without errors
- [ ] Functionality was tested and works
- [ ] UI was visually verified (if applicable)
- [ ] No console errors in browser (if applicable)
- [ ] Related features weren't broken
- [ ] Code follows existing patterns in codebase
- [ ] Edge cases were considered and handled

### 7. Red Flags That Indicate Cheating

If any of these happen, STOP and fix before proceeding:

- "This should work" without testing
- "I'll fix that error later"
- Moving to next task while current one has errors
- Using placeholder/mock data in final implementation
- Skipping visual verification
- Assuming API response format without checking
- Not reading the file before editing it
- Copying code without understanding it
- Ignoring TypeScript/lint errors

### 8. Implementation Verification Commands

Use these to verify work:

```bash
# Check for lint errors
npx eslint path/to/file.ts

# Check TypeScript
npx tsc --noEmit

# Test API endpoint
curl -X POST http://localhost:3000/api/coo/priorities/generate

# Check console for errors
# Open browser DevTools > Console before testing

# Verify build works
npm run build
```

---

## Final Note on Quality

This system (AgentCOO) is supposed to hold the USER accountable. It would be embarrassing if the system itself was built with shortcuts. Build it properly, test it thoroughly, verify it works. No exceptions.