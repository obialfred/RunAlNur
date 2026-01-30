---
name: Complete Empire OS
overview: Transform RunAlNur from a UI prototype into a fully functional AI-powered operational system with real database, real integrations (ClickUp, Process Street, HubSpot), real AI capabilities, fluid motion/Rive animation, and all CRUD operations working.
todos:
  - id: phase0-motion
    content: Motion system + Rive integration for fluid UI
    status: completed
  - id: phase1-supabase
    content: Deploy Supabase database and connect real data layer
    status: completed
  - id: phase1-auth
    content: Implement Supabase authentication with protected routes
    status: completed
    dependencies:
      - phase1-supabase
  - id: phase2-crud
    content: Build all CRUD operations (create/edit/delete) for projects, tasks, contacts
    status: completed
    dependencies:
      - phase1-supabase
  - id: phase6-ai
    content: Integrate real Claude/OpenAI with tool calling for actual actions
    status: completed
    dependencies:
      - phase2-crud
  - id: phase3-clickup
    content: Full ClickUp integration with OAuth and bidirectional sync
    status: completed
    dependencies:
      - phase1-supabase
  - id: phase7-janna
    content: "Build Janna-specific features: property database, renovation tracker, deal pipeline"
    status: completed
    dependencies:
      - phase2-crud
  - id: phase4-processstreet
    content: Process Street integration for SOP execution
    status: completed
    dependencies:
      - phase1-supabase
  - id: phase5-hubspot
    content: HubSpot integration for CRM sync
    status: completed
    dependencies:
      - phase1-supabase
  - id: phase9-notifications
    content: Real-time notifications and activity system
    status: completed
    dependencies:
      - phase1-supabase
  - id: phase10-search
    content: Global search and command palette
    status: completed
    dependencies:
      - phase2-crud
  - id: phase11-reports
    content: Reporting and analytics with charts and PDF export
    status: completed
    dependencies:
      - phase2-crud
  - id: phase12-automation
    content: Make/Zapier webhook integration for automation
    status: completed
    dependencies:
      - phase3-clickup
      - phase4-processstreet
  - id: phase13-governance
    content: Governance, RBAC, approvals, audit, and security controls
    status: completed
    dependencies:
      - phase1-auth
  - id: phase14-knowledge
    content: Knowledge layer (Guru/Scribe), docs, and vector search
    status: completed
    dependencies:
      - phase1-supabase
  - id: phase15-reliability
    content: Infrastructure, observability, backups, and performance
    status: completed
    dependencies:
      - phase1-supabase
  - id: phase16-adoption
    content: Onboarding, training, and usage workflows
    status: completed
    dependencies:
      - phase2-crud
---

# RunAlNur: Complete Empire OS Build

## Current State: UI Prototype with Mock Data

## Target State: Fully Operational AI-Powered Command Center

---

## Phase 0: Motion + Interaction System (Fluid UI + Rive)

### 0.1 Motion Tokens & Guidelines

- Define motion tokens (duration, delay, easing, spring) and apply consistently
- Page transitions, list reordering, panel expansion, and micro‑interactions
- Accessibility: honor reduced‑motion preferences globally
- Performance budget for animation (avoid layout thrash, limit heavy effects)

### 0.2 Rive Integration

- Add `@rive-app/react-canvas` for interactive vector animation
- Rive asset pipeline: `.riv` files stored in `/public/rive`
- State machines for:
  - AI thinking/streaming
  - Success/error confirmations
  - Empty states (no projects, no contacts)
  - Loading/progress
- Component wrappers for Rive (pause, play, trigger states)
- Fallback to CSS/Framer Motion when assets are not available

### 0.3 Motion Components

- Animated counters for report cards
- Table row enter/exit transitions
- Hover/press feedback on cards and buttons
- Animated command palette + AI input focus

**Files:**

- `components/motion/` - Motion primitives (FadeIn, SlideIn, Stagger)
- `components/rive/` - Rive wrappers and state control helpers
- `lib/motion/tokens.ts` - Duration/easing constants

---

## Phase 1: Foundation (Database + Auth)

### 1.1 Supabase Deployment

- Create Supabase project
- Deploy schema from `lib/supabase/schema.sql`
- Seed with real arms data
- Set up Row Level Security policies

### 1.2 Authentication

- Supabase Auth integration
- Login/logout functionality
- Protected routes
- User profile management

### 1.3 Real Data Layer

- Replace all mock data with Supabase queries
- Implement data hooks (useProjects, useContacts, etc.)
- Real-time subscriptions for live updates
- Optimistic updates for snappy UX

### 1.4 File Storage + Attachments

- Supabase Storage buckets for contracts, drawings, invoices, and media
- Attach files to projects/contacts/SOPs
- Versioned uploads for contracts and key documents
- Secure, signed URLs with expiration

**Files:**

- `lib/supabase/client.ts` - Already exists, needs connection
- `lib/hooks/useProjects.ts` - New
- `lib/hooks/useContacts.ts` - New
- `lib/hooks/useTasks.ts` - New
- `app/api/auth/` - New auth routes
- `components/auth/LoginForm.tsx` - New
- `middleware.ts` - Route protection

---

## Phase 2: CRUD Operations

### 2.1 Projects

- Create project modal/form
- Edit project functionality
- Delete project (with confirmation)
- Project status updates
- Assign projects to arms

### 2.2 Tasks

- Create task within projects
- Drag-and-drop task board
- Task status changes (todo/in_progress/done)
- Due date management
- Priority assignment

### 2.3 Contacts

- Create contact form
- Edit contact details
- Delete contacts
- Tag management
- Notes/activity log per contact

### 2.4 Activities

- Auto-log all changes
- Activity feed that shows real events
- Filter by arm, project, type

### 2.5 System Pages (Monitor)

- `/activity` page with full audit timeline
- `/status` page for system health + integrations
- Filters and saved views (per arm, per project)

**Files:**

- `components/modals/CreateProjectModal.tsx` - New
- `components/modals/CreateTaskModal.tsx` - New
- `components/modals/CreateContactModal.tsx` - New
- `components/forms/ProjectForm.tsx` - New
- `components/forms/TaskForm.tsx` - New
- `components/forms/ContactForm.tsx` - New
- All page files updated to use real mutations

---

## Phase 3: ClickUp Integration (Your Project Spine)

### 3.1 OAuth Connection

- ClickUp OAuth flow in Settings
- Store tokens in Supabase
- Token refresh handling

### 3.2 Workspace Sync

- Fetch ClickUp workspaces/spaces/folders/lists
- Map ClickUp structure to Arms
- Configure which list maps to which arm

### 3.3 Bidirectional Task Sync

- Push: Create task in RunAlNur → Creates in ClickUp
- Pull: Create task in ClickUp → Appears in RunAlNur
- Sync: Status changes reflect both ways
- Webhook listener for real-time updates

### 3.4 Project Timeline

- Fetch Gantt/timeline from ClickUp
- Display critical path
- Show dependencies

**Files:**

- `app/api/clickup/oauth/route.ts` - New
- `app/api/clickup/webhook/route.ts` - New
- `lib/integrations/clickup.ts` - Enhance existing
- `lib/hooks/useClickUp.ts` - New
- `components/settings/ClickUpConnect.tsx` - New

---

## Phase 4: Process Street Integration (Your SOP Engine)

### 4.1 OAuth Connection

- Process Street API authentication
- Store credentials

### 4.2 Workflow Sync

- Fetch all workflow templates
- Display in SOPs page with real data
- Categorize by arm

### 4.3 Run SOPs

- "Start" button actually creates a workflow run
- Track run progress in real-time
- Show completed/pending steps
- Link runs to projects

### 4.4 Checklist UI

- Embedded checklist view
- Check off steps from within RunAlNur
- Auto-complete notifications

**Files:**

- `app/api/process-street/oauth/route.ts` - New
- `app/api/process-street/webhook/route.ts` - New
- `lib/integrations/process-street.ts` - Enhance existing
- `lib/hooks/useProcessStreet.ts` - New
- `components/sops/SOPRunner.tsx` - New
- `components/sops/ChecklistView.tsx` - New

---

## Phase 5: HubSpot Integration (Your CRM)

### 5.1 OAuth Connection

- HubSpot OAuth flow
- Store tokens

### 5.2 Contact Sync

- Bidirectional contact sync
- Map HubSpot properties to our fields
- Sync on create/update/delete

### 5.3 Deal Tracking (for Janna)

- Fetch deals from HubSpot
- Display deal pipeline
- Track deal stages
- Associate contacts with deals

### 5.4 Company Management

- Sync companies
- Associate contacts with companies

**Files:**

- `app/api/hubspot/oauth/route.ts` - New
- `app/api/hubspot/webhook/route.ts` - New
- `lib/integrations/hubspot.ts` - Enhance existing
- `lib/hooks/useHubSpot.ts` - New
- `components/contacts/HubSpotSync.tsx` - New
- `app/deals/page.tsx` - New deals page for Janna

---

## Phase 6: Real AI Manager

### 6.1 Claude/OpenAI Integration

- API integration with actual LLM
- Streaming responses
- Conversation history

### 6.2 Tool Calling (The Real Power)

The AI can actually EXECUTE actions:

```
Tools:
- create_project(name, arm, description, priority)
- create_task(project_id, name, due_date, priority)
- create_contact(name, email, arm, company, role)
- update_task_status(task_id, status)
- start_sop(sop_id, project_id)
- get_project_status(project_id)
- get_arm_summary(arm_id)
- search_contacts(query)
- get_overdue_tasks()
- create_daily_briefing()
```

### 6.3 Context Awareness

- AI knows current user
- AI knows current page context
- AI can reference recent activity

### 6.4 Scheduled Briefings

- Cron job for daily/weekly briefings
- Email or in-app delivery
- Customizable per user

### 6.5 AI Governance + Safety

- Approval queue for high‑impact actions (finance, legal, deletions)
- Action policies (allow/deny lists per user role)
- Full audit log of AI decisions and tool calls
- Rate limits and budget caps (tokens + cost)

**Files:**

- `app/api/ai/chat/route.ts` - Rewrite with real AI
- `lib/ai/tools.ts` - New tool definitions
- `lib/ai/agent.ts` - Agent with tool execution
- `lib/ai/briefings.ts` - Briefing generation
- `app/api/cron/briefings/route.ts` - Scheduled job

---

## Phase 7: Janna-Specific Features (Casablanca Project)

Your most active project needs dedicated support:

### 7.1 Property Database

- Property details (address, units, sqft, acquisition date)
- Financial details (purchase price, renovation budget, target rent)
- Photo gallery

### 7.2 Renovation Tracker

- Phase management (Design, Permits, Construction, etc.)
- Milestone tracking with dates
- Budget vs. actual spending
- Contractor assignments

### 7.3 Architect/Contractor Management

- Vendor database
- Contract tracking
- Payment schedule
- Performance notes

### 7.4 Deal Pipeline

- Lead → Under Review → Due Diligence → Under Contract → Closed
- Pipeline visualization
- Deal scoring

**Files:**

- `app/arms/janna/properties/page.tsx` - New
- `app/arms/janna/properties/[id]/page.tsx` - New
- `app/arms/janna/deals/page.tsx` - New
- `components/janna/PropertyCard.tsx` - New
- `components/janna/RenovationTracker.tsx` - New
- `components/janna/DealPipeline.tsx` - New
- Database tables: properties, renovation_phases, vendors, deals

---

## Phase 8: Nova-Specific Features

### 8.1 Product Catalog

- Products database
- SKU management
- Specifications

### 8.2 Launch Tracker

- Product launch checklist integration
- Launch countdown
- Marketing checklist

**Files:**

- `app/arms/nova/products/page.tsx` - New
- `app/arms/nova/launches/page.tsx` - New

---

## Phase 9: Notifications + Real-time

### 9.1 Notification System

- In-app notifications
- Notification preferences
- Mark as read/unread
- Notification bell with count

### 9.2 Real-time Updates

- Supabase realtime subscriptions
- Live activity feed
- Task status changes appear instantly
- Collaborative awareness

### 9.3 Email Notifications

- Overdue task alerts
- Daily digest option
- @mention notifications

### 9.4 System Health + Integration Status

- Health dashboard for ClickUp/PS/HubSpot/Supabase
- Webhook failure queue + retries
- Incident log for integration outages

**Files:**

- `lib/notifications/` - New
- `components/notifications/NotificationBell.tsx` - New
- `components/notifications/NotificationPanel.tsx` - New
- `app/api/notifications/route.ts` - New

---

## Phase 10: Search + Command Palette

### 10.1 Global Search

- Search projects, tasks, contacts across all arms
- Fuzzy matching
- Recent searches

### 10.2 Command Palette (Cmd+K)

- Quick actions from anywhere
- Navigate to any page
- Create items quickly
- Trigger AI commands

**Files:**

- `components/search/GlobalSearch.tsx` - New
- `components/search/CommandPalette.tsx` - New
- `lib/hooks/useSearch.ts` - New

---

## Phase 11: Reporting + Analytics

### 11.1 Dashboard Analytics

- Projects by status chart
- Tasks completion rate
- Activity over time
- Arm performance comparison

### 11.2 Project Reports

- Export project summary as PDF
- Include tasks, timeline, budget
- Professional formatting

### 11.3 Empire Report

- Monthly/quarterly rollup
- All arms summary
- Key metrics
- Export to PDF

**Files:**

- `components/charts/` - New chart components
- `lib/reports/` - Report generation
- `app/reports/page.tsx` - New

---

## Phase 12: Make/Zapier Automation Layer

### 12.1 Webhook Endpoints

- Incoming webhooks from Make/Zapier
- Trigger actions in RunAlNur

### 12.2 Outgoing Events

- Emit events when things happen
- Connect to Make/Zapier for automation

### 12.3 Pre-built Automations

- New Janna deal → Create HubSpot deal + Start SOP
- Task overdue → Send notification
- Project completed → Generate report

**Files:**

- `app/api/webhooks/incoming/route.ts` - New
- `lib/events/emitter.ts` - New
- Documentation for Make/Zapier setup

---

## Phase 13: Governance + Security (Chaebol‑Level Control)

### 13.1 Roles & Permissions (RBAC)

- Arm-level roles (Owner, Operator, Assistant, Read‑only)
- Per‑feature permissions (Projects, SOPs, CRM, AI actions)
- Contractor accounts with limited scopes
- Multi‑tenant readiness (arm isolation + future subsidiaries)

### 13.2 Approvals + Human‑in‑the‑Loop

- Approval queue for financial/legal/contract actions
- Multi‑step approvals for high‑impact changes
- Audit justification required for deletions and overrides

### 13.3 Audit + Compliance

- Immutable audit trail for every change
- Exportable logs (CSV/PDF)
- Data retention policies and deletion workflows

### 13.4 Security Hardening

- MFA enforcement
- Session/device management
- IP allowlist (optional)
- SSO (optional later)

---

## Phase 14: Knowledge + Documents (Guru/Scribe Layer)

### 14.1 Guru Integration

- Search + surface Guru cards inside RunAlNur
- Map Guru collections to arms
- Link cards to projects and SOPs

### 14.2 Scribe → Process Street Bridge

- Import Scribe SOPs into Process Street
- Attach SOPs to projects with auto‑run triggers

### 14.3 Document Index + Vector Search

- Ingest contracts, specs, reports into a doc index
- Embeddings for AI recall and search
- Versioning + “what changed” diffs

---

## Phase 15: Infrastructure + Reliability

### 15.1 Environments + CI/CD

- Dev/Staging/Prod environments
- Automated deploys + previews
- Secrets management

### 15.2 Observability

- Error tracking (Sentry)
- Logs + metrics dashboards
- Performance monitoring

### 15.3 Data Protection

- Automated backups
- Restore drills
- Rate limits and abuse protections

### 15.4 Job Queue + Sync Reliability

- Background jobs for sync (ClickUp/HubSpot/PS)
- Retry strategy for failed webhooks
- Dead‑letter queue for failures

---

## Phase 16: Adoption + Training

### 16.1 Onboarding

- First‑run wizard
- Guided tours per arm
- Seeded templates for new projects

### 16.2 Usage Systems

- SOP‑based training for staff
- Help center + internal docs
- Usage analytics to track adoption

### 16.3 Mobility

- Responsive layout polish
- PWA shell for mobile access

---

## Priority Order

Based on your immediate needs (Casablanca project):

1. **Phase 1** - Database + Auth (you need real data persistence)
2. **Phase 2** - CRUD Operations (you need to create real projects/tasks)
3. **Phase 0** - Motion + Interaction (run in parallel with Phase 2)
4. **Phase 6** - Real AI Manager (you want AI that actually works)
5. **Phase 3** - ClickUp Integration (your task management spine)
6. **Phase 7** - Janna Features (your active project needs this)
7. **Phase 4** - Process Street (SOPs for the renovation)
8. **Phase 5** - HubSpot (CRM for architects/contractors)
9. **Phase 13** - Governance + Security (controls + approvals)
10. **Phase 14** - Knowledge + Docs (Guru/Scribe + search)
11. **Phase 9** - Notifications + Health (stay on top of things)
12. **Phase 10** - Search + Command Palette (speed)
13. **Phase 11** - Reporting + Analytics (visibility)
14. **Phase 15** - Infrastructure + Reliability (stability)
15. **Phase 16** - Adoption + Training (usage)
16. **Phase 8** - Nova Features (when Nova becomes active)
17. **Phase 12** - Automation (optimization layer)

---

## Estimated Scope

| Phase | Complexity | Time Estimate |

|-------|------------|---------------|

| 0. Motion + Rive | Medium | 4-6 hours |

| 1. Foundation | Medium | 4-6 hours |

| 2. CRUD | Medium | 4-6 hours |

| 3. ClickUp | High | 6-8 hours |

| 4. Process Street | High | 6-8 hours |

| 5. HubSpot | High | 6-8 hours |

| 6. Real AI | High | 8-10 hours |

| 7. Janna Features | Medium | 4-6 hours |

| 8. Nova Features | Low | 2-4 hours |

| 9. Notifications | Medium | 4-6 hours |

| 10. Search | Medium | 3-4 hours |

| 11. Reporting | Medium | 4-6 hours |

| 12. Automation | Medium | 4-6 hours |

| 13. Governance + Security | High | 6-8 hours |

| 14. Knowledge + Docs | High | 6-10 hours |

| 15. Infrastructure | Medium | 4-6 hours |

| 16. Adoption + Training | Low | 3-5 hours |

**Total: ~78-113 hours of development**

---

## What You Need to Provide

1. **Supabase project** - Create at supabase.com, give me the URL and keys
2. **ClickUp API key** - From your ClickUp settings
3. **ClickUp workspace structure** - How it's organized (workspaces/spaces/folders)
4. **Process Street API key** - From your PS settings
5. **HubSpot access token** - From HubSpot developer portal
6. **Claude/OpenAI API key** - For real AI
7. **Casablanca architects list** - So I can import real data
8. **Your ClickUp workspace ID** - To know where to sync
9. **Rive assets** - `.riv` files or motion references (empty states, loaders, AI avatar)
10. **Guru API access** - For knowledge layer integration
11. **Scribe access/exports** - To import SOPs into Process Street
12. **Approval matrix** - Who can approve what (finance, legal, deletions)

---

## The Bottom Line

What you have: **A prototype**

What you need: **A production system**

The UI is done. Now we need to make it real.