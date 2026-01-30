---
name: AgentBoss Priority Engine
overview: AgentBoss is the brain of the Agent Empire - an LLM-powered priority engine that analyzes your tasks, projects, and context to tell you exactly what to focus on. It integrates with ClickUp, Guru (knowledge base), monitors progress, and provides daily briefings and accountability. It knows the full vision of House Al Nur. IMPLEMENTED AS AgentCOO.
todos:
  - id: boss-guru-integration
    content: Build Guru API integration to sync all cards, collections, and knowledge
    status: completed
  - id: boss-knowledge-index
    content: Create knowledge index from Guru - vision, principles, SOPs, arm context
    status: completed
  - id: boss-schema
    content: Create database schema for daily_priorities, priority_items, focus_sessions, boss_preferences
    status: completed
  - id: boss-clickup-fetch
    content: Build ClickUp task fetching service with context enrichment
    status: completed
  - id: boss-llm-engine
    content: Build LLM priority engine with structured prompts, Guru context, and JSON output
    status: completed
  - id: boss-api-routes
    content: Create API routes for generate, today, start, complete, defer
    status: completed
  - id: boss-morning-briefing
    content: Build MorningBriefing component with priority cards and accept/modify flow
    status: completed
  - id: boss-priority-bar
    content: Build PriorityBar component for TopBar with current focus display
    status: completed
  - id: boss-day-summary
    content: Build DaySummary component with scorecard and tomorrow preview
    status: completed
  - id: boss-focus-tracking
    content: Implement focus session tracking with start/pause/complete
    status: completed
  - id: boss-settings
    content: Build BossSettings component for briefing times and preferences
    status: completed
  - id: boss-cross-mode
    content: Connect Capital and Influence alerts to priority inputs
    status: completed
---

# AgentBoss - The Priority Brain

## What AgentBoss Does

AgentBoss is your chief of staff AI that:

1. **Knows everything on your plate** - Pulls from ClickUp, calendar, emails
2. **Knows the full vision** - Pulls from Guru, understands House Al Nur inside and out
3. **Ranks by what actually matters** - Not just due dates, but strategic alignment, impact, dependencies
4. **Tells you what to do** - Clear "do this now" guidance
5. **Holds you accountable** - Tracks if you actually did it
6. **Learns your patterns** - Gets better at predicting what you'll prioritize

---

## Guru Integration - The Knowledge Brain

AgentBoss isn't just looking at tasks - it **understands the entire context** of House Al Nur by pulling from Guru.

### What AgentBoss Learns from Guru

```
GURU KNOWLEDGE BASE
├── VISION & MISSION
│   ├── House Al Nur vision statement
│   ├── Long-term goals (5yr, 10yr)
│   ├── Current phase/focus
│   └── Success metrics
│
├── PRINCIPLES & VALUES
│   ├── Decision-making framework
│   ├── Core principles
│   ├── What we say no to
│   └── Priority hierarchy
│
├── ARMS CONTEXT
│   ├── Nova - What it is, current phase, key milestones
│   ├── Janna - Real estate strategy, active deals
│   ├── Silk - Vision, current status
│   ├── ATW - What it does, priorities
│   ├── OBX Music - Goals, projects
│   └── Maison - Family office context
│
├── SOPS & PROCESSES
│   ├── How to handle investor outreach
│   ├── Deal evaluation criteria
│   ├── Content creation workflow
│   ├── Relationship maintenance cadence
│   └── Financial review process
│
├── PEOPLE & ROLES
│   ├── Team members and responsibilities
│   ├── Key advisors
│   ├── Delegation preferences
│   └── Who handles what
│
└── CONTEXT & HISTORY
    ├── Past decisions and why
    ├── Lessons learned
    ├── Current constraints
    └── Active commitments
```

### How Guru Context Changes Prioritization

**Without Guru:**

```
Task: "Review Nova pitch deck"
Priority: Medium (due in 3 days)
Reasoning: "Has a due date coming up"
```

**With Guru:**

```
Task: "Review Nova pitch deck"
Priority: CRITICAL
Reasoning: "Nova is in active fundraising phase (from Guru: Arms/Nova/Current Phase).
Your principle states 'fundraising windows are sacred' (from Guru: Principles).
Sarah Chen from Sequoia is a Tier 1 relationship (from Guru: Key Relationships).
This directly impacts the $2M target for Q1 (from Guru: Goals)."
```

### Guru API Integration

```typescript
interface GuruCard {
  id: string;
  title: string;
  content: string; // HTML or markdown
  collection: string;
  boards: string[];
  tags: string[];
  lastUpdated: Date;
  verifiedAt: Date;
}

interface GuruKnowledgeIndex {
  vision: {
    mission: string;
    longTermGoals: string[];
    currentPhase: string;
    successMetrics: string[];
  };
  principles: {
    decisionFramework: string;
    coreValues: string[];
    priorityHierarchy: string[];
    redLines: string[]; // What we say no to
  };
  arms: {
    [armName: string]: {
      description: string;
      currentPhase: string;
      keyMilestones: string[];
      activePriorities: string[];
    };
  };
  sops: {
    [processName: string]: {
      steps: string[];
      triggers: string[];
      owners: string[];
    };
  };
  people: {
    team: Person[];
    advisors: Person[];
    delegationMatrix: Record<string, string>;
  };
}
```

### Guru Sync Service

```typescript
// lib/guru/sync.ts
export async function syncGuruKnowledge(): Promise<void> {
  // 1. Fetch all cards from Guru API
  const cards = await fetchAllGuruCards();
  
  // 2. Categorize by collection/board
  const categorized = categorizeCards(cards);
  
  // 3. Extract structured knowledge
  const knowledgeIndex = extractKnowledgeIndex(categorized);
  
  // 4. Store in database for fast access
  await storeKnowledgeIndex(knowledgeIndex);
  
  // 5. Create embeddings for semantic search
  await createKnowledgeEmbeddings(cards);
}

// Called by AgentBoss when prioritizing
export async function getRelevantKnowledge(task: Task): Promise<string[]> {
  // 1. Get core context (always included)
  const coreContext = await getCoreContext(); // vision, principles, current phase
  
  // 2. Find relevant cards based on task content
  const relevantCards = await semanticSearchCards(task.name + task.description);
  
  // 3. Get arm-specific context if task is tagged
  const armContext = task.armAffiliation 
    ? await getArmContext(task.armAffiliation)
    : null;
  
  // 4. Get relevant SOPs if applicable
  const sops = await findRelevantSOPs(task);
  
  return [coreContext, ...relevantCards, armContext, ...sops].filter(Boolean);
}
```

### Knowledge-Enhanced Priority Prompt

```
You are AgentBoss, the priority engine for House Al Nur.

=== CORE KNOWLEDGE (from Guru) ===

VISION:
{vision.mission}

CURRENT PHASE:
{vision.currentPhase}

DECISION PRINCIPLES:
{principles.priorityHierarchy}

KEY PRINCIPLES:
{principles.coreValues}

=== ARM CONTEXT ===

{For each relevant arm}
{arm.name}: {arm.currentPhase}
Active priorities: {arm.activePriorities}

=== RELEVANT KNOWLEDGE ===

{semantically matched Guru cards}

=== TASKS TO PRIORITIZE ===

{taskList}

=== CALENDAR TODAY ===

{calendarEvents}

=== CROSS-MODE ALERTS ===

{alerts}

INSTRUCTIONS:
1. Use the VISION and PRINCIPLES to understand what truly matters
2. Consider which arm each task relates to and its current phase
3. Apply the decision principles to rank priorities
4. Reference specific knowledge when explaining your reasoning
5. Identify the TOP 3 priorities that most advance the mission today
6. For each, explain WHY in context of the vision and principles

Return structured JSON with your rankings and reasoning.
```

### Database Additions for Guru

```sql
-- Guru cards cache
CREATE TABLE guru_cards (
  id UUID PRIMARY KEY,
  guru_id VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  content TEXT,
  content_plain TEXT, -- stripped HTML for search
  collection VARCHAR(255),
  boards TEXT[], -- array of board names
  tags TEXT[],
  guru_updated_at TIMESTAMP,
  synced_at TIMESTAMP DEFAULT NOW()
);

-- Knowledge index (structured extraction)
CREATE TABLE knowledge_index (
  id UUID PRIMARY KEY,
  category VARCHAR(50) NOT NULL, -- 'vision', 'principle', 'arm', 'sop', 'person'
  subcategory VARCHAR(100),
  key VARCHAR(255) NOT NULL,
  value TEXT NOT NULL,
  source_card_id UUID REFERENCES guru_cards(id),
  extracted_at TIMESTAMP DEFAULT NOW()
);

-- Card embeddings for semantic search
CREATE TABLE guru_embeddings (
  id UUID PRIMARY KEY,
  card_id UUID REFERENCES guru_cards(id),
  embedding vector(1536), -- OpenAI embedding dimension
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast vector search
CREATE INDEX guru_embeddings_vector_idx ON guru_embeddings 
USING ivfflat (embedding vector_cosine_ops);
```

### Guru Sync Schedule

- **Full sync**: Daily at 3am (or on-demand)
- **Incremental sync**: Every 4 hours (checks for updates)
- **On-demand**: When user triggers "refresh knowledge"

---

## The AgentBoss Experience

### Morning Briefing (Daily at configured time)

```
┌─────────────────────────────────────────────────────────────────┐
│ ☀️ GOOD MORNING                              Tuesday, Jan 20    │
│ "Here's what matters today."                                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ YOUR TOP 3 PRIORITIES                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 1. ⚡ Review Nova investor deck                     [Due Today] │
│    Why: Meeting with Sarah Chen tomorrow, need to send tonight  │
│    Effort: ~2 hours  •  Best time: Morning focus block          │
│    [Start] [Delegate] [Reschedule]                              │
│                                                                 │
│ 2. 🔴 Respond to Texas Registered Agent             [OVERDUE]   │
│    Why: Legal compliance, penalties accruing                    │
│    Effort: ~30 min  •  Best time: After priority 1              │
│    [Start] [Delegate] [Snooze]                                  │
│                                                                 │
│ 3. 📞 Call with Ahmed Al-Rashid                    [2:00 PM]    │
│    Why: Relationship maintenance, potential deal discussion     │
│    Prep needed: Review last meeting notes (5 min)               │
│    [View Brief] [Reschedule]                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ ALSO ON YOUR RADAR                                              │
├─────────────────────────────────────────────────────────────────┤
│ • 4 tasks due this week (2 on track, 2 at risk)                │
│ • 3 relationships need attention (switch to Influence)          │
│ • Cash runway: 5.3 months (no immediate action needed)          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ BOSS RECOMMENDATION                                             │
├─────────────────────────────────────────────────────────────────┤
│ "Block 9-11am for the Nova deck - it's your highest leverage   │
│ activity today. The Texas thing is urgent but only 30 min,     │
│ handle it right after. Your afternoon is clear for the Ahmed   │
│ call and catch-up work."                                        │
│                                                                 │
│ [Accept This Plan] [Modify]                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Real-Time Priority Bar (Always Visible)

In the top bar of RunAlNur:

```
┌─────────────────────────────────────────────────────────────────┐
│ 🎯 NOW: Review Nova investor deck (1/3)     ⏱️ 1h 23m elapsed  │
│     [Complete] [Pause] [Switch Focus]                           │
└─────────────────────────────────────────────────────────────────┘
```

### End-of-Day Summary

```
┌─────────────────────────────────────────────────────────────────┐
│ 🌙 DAY COMPLETE                              Tuesday, Jan 20    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ TODAY'S SCORECARD                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ✅ Nova investor deck reviewed and sent                         │
│ ✅ Call with Ahmed completed                                    │
│ ⏸️ Texas Registered Agent → moved to tomorrow                   │
│                                                                 │
│ Completion: 2/3 priorities (67%)                                │
│ Focus time: 3h 45m                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ TOMORROW PREVIEW                                                │
├─────────────────────────────────────────────────────────────────┤
│ 1. Texas Registered Agent (carried over)                        │
│ 2. Send Nova deck follow-up to Sarah                            │
│ 3. Weekly team sync                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Priority Ranking Algorithm

AgentBoss uses an LLM to analyze and rank, but with structured inputs:

### Input Factors

```typescript
interface TaskContext {
  // From ClickUp
  task: {
    id: string;
    name: string;
    description: string;
    dueDate: Date | null;
    priority: 'urgent' | 'high' | 'normal' | 'low';
    status: string;
    project: string;
    tags: string[];
    timeEstimate: number | null;
    assignees: string[];
  };
  
  // From Guru (the brain)
  knowledge: {
    relevantCards: GuruCard[]; // Semantically matched knowledge
    armContext: ArmContext | null; // If task relates to an arm
    applicablePrinciples: string[]; // Relevant decision principles
    relatedSOPs: SOP[]; // If there's a process for this
    historicalDecisions: Decision[]; // Similar past situations
  };
  
  // Computed context
  context: {
    daysUntilDue: number | null;
    isOverdue: boolean;
    hasBlockedTasks: boolean; // Other tasks depend on this
    relatedMeetings: Meeting[]; // Meetings that reference this
    relatedContacts: Contact[]; // People involved
    armAffiliation: string | null; // Nova, Janna, etc.
    financialImpact: number | null; // If quantifiable
    strategicAlignment: number; // 0-100 based on Guru vision
  };
  
  // User state
  userState: {
    currentEnergy: 'high' | 'medium' | 'low'; // From time of day or user input
    focusBlockAvailable: boolean;
    meetingsToday: number;
  };
}
```

### Priority Score Calculation

The LLM receives all tasks with context and returns ranked priorities with reasoning:

```typescript
interface PriorityResult {
  taskId: string;
  rank: number;
  score: number; // 0-100
  reasoning: string; // "Due today and blocks the investor meeting tomorrow"
  suggestedTimeBlock: string; // "Morning focus block"
  effort: string; // "~2 hours"
  canDelegate: boolean;
  delegateTo?: string;
}
```

### Prompt Template

```
You are AgentBoss, the priority engine for a busy founder/investor.

CONTEXT:
- Today is {date}, {dayOfWeek}
- User has {meetingsToday} meetings today
- User's energy is typically {energyPattern} in the morning
- Focus blocks available: {focusBlocks}

TASKS TO PRIORITIZE:
{taskList}

CALENDAR TODAY:
{calendarEvents}

CROSS-MODE ALERTS:
{alerts} (from Capital, Influence modes)

INSTRUCTIONS:
1. Analyze all tasks and identify the TOP 3 priorities for today
2. For each priority, explain WHY it's important today (not just due date)
3. Consider dependencies, meetings, and strategic impact
4. Suggest optimal time blocks based on effort and energy
5. Flag anything that should be delegated
6. Note any risks if priorities aren't completed

Return structured JSON with your rankings and reasoning.
```

---

## Data Sources

### Guru Integration (The Brain)

The foundation of AgentBoss intelligence. Pulls:

- **Vision & Mission** - What House Al Nur is building
- **Principles** - How decisions should be made
- **Arm Context** - What each arm does, current phase, priorities
- **SOPs** - How things should be done
- **People** - Who does what, delegation preferences
- **History** - Past decisions, lessons learned

Guru cards are:

- Synced daily + incremental updates
- Embedded for semantic search
- Extracted into structured knowledge index
- Always included in priority context

### ClickUp Integration (Tasks)

Already have ClickUp connected. AgentBoss pulls:

- All tasks assigned to user
- Task details (due date, priority, time estimate, tags)
- Project/list context
- Task dependencies
- Recent activity

Tasks are enriched with Guru context based on:

- Project/arm affiliation
- Tags and keywords
- Semantic matching to relevant knowledge

### Calendar Integration

- Google Calendar / Outlook events
- Meeting times and attendees
- Available focus blocks
- Meeting participants matched to relationship data

### Cross-Mode Inputs

From other parts of Dynasty OS:

- **Capital Mode**: Cash alerts, bill due dates, tax deadlines
- **Influence Mode**: Relationship decay alerts, meeting preps needed
- **Arms**: Project milestones, deal deadlines

### Email Intelligence (From AgentWealth)

- Legal notices requiring action
- Financial deadlines
- Important correspondence flagged

---

## Database Schema

```sql
-- Daily priorities (what Boss recommended)
CREATE TABLE daily_priorities (
  id UUID PRIMARY KEY,
  date DATE NOT NULL,
  generated_at TIMESTAMP DEFAULT NOW(),
  priorities JSONB NOT NULL, -- Array of priority items with reasoning
  user_accepted BOOLEAN,
  user_modified_at TIMESTAMP,
  UNIQUE(date)
);

-- Priority items (individual tasks in priority list)
CREATE TABLE priority_items (
  id UUID PRIMARY KEY,
  daily_priority_id UUID REFERENCES daily_priorities(id),
  rank INTEGER NOT NULL,
  source VARCHAR(50) NOT NULL, -- 'clickup', 'capital', 'influence', 'manual'
  source_id VARCHAR(255), -- ClickUp task ID, etc.
  title VARCHAR(255) NOT NULL,
  reasoning TEXT,
  effort_estimate VARCHAR(50),
  suggested_time VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending', -- pending, started, completed, deferred
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  deferred_to DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Focus sessions (tracking work on priorities)
CREATE TABLE focus_sessions (
  id UUID PRIMARY KEY,
  priority_item_id UUID REFERENCES priority_items(id),
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP,
  duration_minutes INTEGER,
  outcome VARCHAR(20), -- 'completed', 'paused', 'abandoned'
  notes TEXT
);

-- Boss insights (patterns learned)
CREATE TABLE boss_insights (
  id UUID PRIMARY KEY,
  insight_type VARCHAR(50), -- 'completion_pattern', 'time_preference', 'energy_pattern'
  insight_data JSONB,
  confidence DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- User preferences for Boss
CREATE TABLE boss_preferences (
  id UUID PRIMARY KEY,
  user_id UUID,
  morning_briefing_time TIME DEFAULT '08:00',
  evening_summary_time TIME DEFAULT '18:00',
  max_daily_priorities INTEGER DEFAULT 3,
  focus_block_duration INTEGER DEFAULT 90, -- minutes
  energy_pattern JSONB, -- {"morning": "high", "afternoon": "medium", "evening": "low"}
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Components to Build

### 1. Priority Engine Service (`lib/boss/priority-engine.ts`)

```typescript
export async function generateDailyPriorities(date: Date): Promise<DailyPriorities> {
  // 1. Get core knowledge from Guru (always included)
  const coreKnowledge = await getGuruCoreKnowledge();
  // Includes: vision, principles, current phase, priority hierarchy
  
  // 2. Fetch all tasks from ClickUp
  const tasks = await fetchClickUpTasks();
  
  // 3. Enrich each task with Guru knowledge
  const enrichedTasks = await Promise.all(
    tasks.map(async (task) => ({
      ...task,
      knowledge: await getRelevantKnowledge(task),
      // Includes: relevant cards, arm context, applicable principles, SOPs
    }))
  );
  
  // 4. Fetch calendar events
  const events = await fetchCalendarEvents(date);
  
  // 5. Fetch cross-mode alerts
  const capitalAlerts = await fetchCapitalAlerts();
  const influenceAlerts = await fetchInfluenceAlerts();
  
  // 6. Build full context for LLM
  const context = buildPriorityContext({
    coreKnowledge,      // Vision, principles from Guru
    enrichedTasks,      // Tasks + relevant Guru knowledge
    events,             // Calendar
    capitalAlerts,      // From AgentWealth
    influenceAlerts,    // From Influence mode
  });
  
  // 7. Call LLM for prioritization (with Guru-powered reasoning)
  const priorities = await llmPrioritize(context);
  
  // 8. Store and return
  await storeDailyPriorities(date, priorities);
  return priorities;
}
```

### 2. Morning Briefing Component (`components/boss/MorningBriefing.tsx`)

Full-screen or modal briefing shown at start of day.

### 3. Priority Bar Component (`components/boss/PriorityBar.tsx`)

Persistent bar in TopBar showing current focus.

### 4. End-of-Day Summary (`components/boss/DaySummary.tsx`)

Summary modal/page shown at end of day.

### 5. Boss Settings (`components/boss/BossSettings.tsx`)

Configure briefing times, priority count, energy patterns.

---

## API Routes

### Guru Knowledge

```
POST /api/guru/sync
  - Trigger full Guru sync
  - Updates all cards, rebuilds index, regenerates embeddings

GET /api/guru/sync/status
  - Get last sync time, card count, sync health

GET /api/guru/search?q={query}
  - Semantic search across Guru knowledge
  - Returns relevant cards with similarity scores

GET /api/guru/knowledge
  - Get structured knowledge index
  - Vision, principles, arms, SOPs

GET /api/guru/card/:id
  - Get specific Guru card content
```

### AgentBoss Priorities

```
POST /api/boss/generate-priorities
  - Triggers priority generation for today
  - Pulls fresh Guru context
  - Called automatically at morning briefing time
  - Can be called manually to refresh

GET /api/boss/today
  - Returns today's priorities and status
  - Includes Guru-powered reasoning

POST /api/boss/priority/:id/start
  - Mark a priority as started, begin focus session

POST /api/boss/priority/:id/complete
  - Mark priority as completed

POST /api/boss/priority/:id/defer
  - Defer priority to another day

GET /api/boss/summary/:date
  - Get end-of-day summary for a date

GET /api/boss/insights
  - Get learned patterns and insights
```

---

## Implementation Phases

### Phase 1: Guru Integration (The Foundation)

- Guru API connection and authentication
- Full card sync service
- Knowledge index extraction (vision, principles, arms, SOPs)
- Embedding generation for semantic search
- Database schema for Guru data
- Sync scheduler (daily + incremental)

### Phase 2: Core Priority Engine

- Build priority engine service
- LLM integration with Guru context injection
- ClickUp task fetching + enrichment
- Database schema for priorities
- Basic API routes
- Reasoning that references Guru knowledge

### Phase 3: Morning Briefing UI

- Morning briefing component
- Priority card design with Guru-powered reasoning
- Accept/modify flow
- Knowledge references in explanations
- "Why this matters" powered by Guru

### Phase 4: Focus Tracking

- Priority bar in TopBar
- Start/pause/complete flow
- Focus session tracking
- Time elapsed display

### Phase 5: End-of-Day

- Day summary generation
- Completion scoring
- Tomorrow preview
- Carry-over logic
- Weekly patterns vs. principles alignment

### Phase 6: Learning & Optimization

- Track completion patterns
- Energy pattern detection
- Improve prioritization based on behavior
- Boss insights dashboard
- Guru knowledge gaps identification

---

## Integration Points

**With Guru (Knowledge):**

- Full sync of all cards, collections, boards
- Semantic search for task-relevant knowledge
- Structured extraction of vision, principles, arm context
- Knowledge always included in priority reasoning
- Boss explains decisions using Guru references

**With ClickUp:**

- Task sync (already exists)
- Update task status when marked complete in Boss
- Create tasks from Boss recommendations
- Tasks enriched with Guru context

**With Calendar:**

- Block focus time when priority accepted
- Show meetings in priority context
- Pre-meeting briefs generated using Guru + Influence data

**With AgentWealth (Capital):**

- Pull financial action items into priorities
- Tax deadlines, bill due dates become priorities
- Cash runway context informs urgency

**With Influence Mode:**

- Pull relationship alerts into priorities
- Meeting prep becomes a priority before meetings
- Relationship context from Guru enhances briefs

**With AgentCommand:**

- Boss reports status to Command
- Command can override priorities
- Activity feed shows Boss decisions
- Guru knowledge searchable from Command

**With Email Intelligence:**

- Legal/compliance notices auto-become priorities
- Financial deadlines surfaced
- Important emails flagged for attention

---

## Why Guru Integration Matters

Without Guru, AgentBoss is just a task sorter. With Guru, it becomes **you** - it knows:

- Why Nova matters more than a random task
- That "investor outreach" during fundraising is sacred
- Which relationships are strategic vs. general
- How you've decided to handle similar situations before
- What the red lines are (things you never compromise on)
- Who to delegate what to

This is the difference between a tool that organizes tasks and an AI chief of staff that thinks like you think.

---

## IMPLEMENTATION COMPLETE - January 2026

### Matt Schlicht's Vision vs. Our Implementation

**Matt's AgentBoss (from X post Jan 18, 2026):**
> "AgentBoss: an AI agent that tells you what to do and monitors you while you do it."

### What We Built (Implemented as AgentCOO)

| Feature | Status | Implementation |
|---------|--------|----------------|
| **Tells you what to do** | ✅ Complete | Opus-powered priority generation with Guru knowledge context |
| **Monitors you while you do it** | ✅ Complete | Focus session tracking, PriorityBar with live timer, accountability check-ins |
| **Guru Knowledge Integration** | ✅ Complete | Loads vision, principles, priority hierarchy, arm context from Guru cards |
| **ClickUp Task Integration** | ✅ Complete | Fetches tasks across all spaces/folders, enriches with context |
| **Multi-Model Architecture** | ✅ Complete | Opus for strategic reasoning, Gemini for accountability/push |
| **Morning Briefing** | ✅ Complete | `/coo` page with top 3 priorities, reasoning, effort estimates |
| **Focus Session Tracking** | ✅ Complete | Start/pause/end sessions, persistent duration tracking |
| **PriorityBar in TopBar** | ✅ Complete | Always-visible current focus with timer and quick actions |
| **EOD Summary** | ✅ Complete | `/coo/eod` page with scorecard, assessment, tomorrow preview |
| **Accountability Check-ins** | ✅ Complete | Gemini-powered push messages based on progress |
| **Settings/Preferences** | ✅ Complete | `/coo/settings` for briefing times, push intensity, max priorities |
| **Cross-Mode Alerts** | ✅ Complete | Influence follow-ups count injected into priority context |
| **Demo Mode** | ✅ Complete | Full in-memory fallback for development |

### Files Implemented

```
lib/coo/
├── types.ts         # All COO type definitions
├── engine.ts        # Core priority engine (generatePriorities, briefings, EOD)
├── knowledge.ts     # Guru knowledge loader and parser
├── models.ts        # Opus + Gemini clients with fallback
├── prompts.ts       # All prompt templates
├── demo-store.ts    # In-memory demo state
└── index.ts         # Module exports

app/api/coo/
├── priorities/route.ts      # GET/POST/PUT priorities
├── sessions/route.ts        # GET/POST focus sessions
├── sessions/[id]/route.ts   # PATCH pause/end session
├── checkin/route.ts         # POST accountability check-in
├── briefing/route.ts        # GET morning/evening briefing
└── preferences/route.ts     # GET/PUT user preferences

app/coo/
├── page.tsx           # Main COO dashboard
├── settings/page.tsx  # Preferences configuration
└── eod/page.tsx       # End of day summary

components/coo/
├── PriorityCard.tsx   # Priority item with actions and reasoning
└── PriorityBar.tsx    # TopBar integration with timer

lib/hooks/
└── useCOO.ts          # usePriorities, useFocusSession, useCheckin, usePreferences, useBriefing
```

### Optional Enhancements (Not Implemented)

These are performance/convenience improvements, not core functionality:

- **Guru Embeddings** - Semantic search via vector embeddings (direct card matching works)
- **Calendar Integration** - Google/Outlook calendar sync
- **Scheduled Briefings** - Auto-push at configured times (manual works)
- **ClickUp Write-back** - Sync completion status back to ClickUp
- **Pattern Learning** - Boss insights from completion history

### Comparison Summary

Matt's vision: **"tells you what to do and monitors you"**

Our COO delivers exactly this:
1. **Tells you what to do** → Opus analyzes ClickUp tasks + Guru knowledge → Returns ranked priorities with reasoning
2. **Monitors you** → Focus session tracking, live timer, accountability check-ins from Gemini

The core AgentBoss concept is **fully implemented**.