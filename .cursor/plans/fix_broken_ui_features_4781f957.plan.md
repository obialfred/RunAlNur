---
name: Fix Broken UI Features
overview: Fix all non-functional buttons, dropdowns, and features across the site by wiring up missing handlers, adding demo-mode fallbacks to APIs, and fixing form state management - all without requiring Supabase.
todos:
  - id: topbar-new-dropdown
    content: Wire TopBar NEW dropdown items to open modals/navigate
    status: completed
  - id: topbar-user-menu
    content: Wire Profile/Preferences menu items to navigate to /settings
    status: completed
  - id: api-activities-demo
    content: Add demo-mode fallback to /api/activities returning sample data
    status: completed
  - id: api-properties-demo
    content: Add demo-mode fallback to /api/properties returning sample Janna properties
    status: completed
  - id: api-deals-demo
    content: Add demo-mode fallback to /api/deals returning sample deals
    status: completed
  - id: api-ai-demo
    content: Add demo-mode fallback to /api/ai/chat returning mock response
    status: completed
  - id: fix-form-state
    content: Fix form name fields being sent empty in Project/Task/Contact modals
    status: completed
  - id: ai-page-buttons
    content: Wire AI page suggested prompts and action buttons
    status: completed
  - id: arm-header-dropdown
    content: Fix NEW dropdown on arm pages not showing
    status: completed
  - id: fix-edit-delete-crash
    content: Fix React errors when clicking EDIT/DELETE on project/contact rows
    status: completed
---

# Fix All Broken UI Features

Based on the audit, there are 4 categories of broken features that need fixing:

## 1. TopBar Dropdowns Not Wired Up

The "+ NEW" dropdown and User Avatar dropdown have items that do nothing when clicked.

**File:** [`components/layout/TopBar.tsx`](runalnur-app/components/layout/TopBar.tsx)

| Dropdown Item | Current State | Fix |
|--------------|---------------|-----|
| New Project | No onClick | Open ProjectModal |
| New Task | No onClick | Open TaskModal (need to select project first or show project picker) |
| New Contact | No onClick | Open ContactModal |
| Start SOP | No onClick | Navigate to `/sops` or open SOP picker |
| Profile | No onClick | Navigate to `/settings` (Profile tab) |
| Preferences | No onClick | Navigate to `/settings` (Preferences section) |

## 2. API Demo-Mode Fallbacks Missing

Several API routes return 503 when Supabase is not configured. Need to add in-memory demo data like `/api/projects` and `/api/contacts` already have.

**Files to add demo fallbacks:**

- [`app/api/activities/route.ts`](runalnur-app/app/api/activities/route.ts) - Return sample activity feed
- [`app/api/properties/route.ts`](runalnur-app/app/api/properties/route.ts) - Return sample Janna properties
- [`app/api/deals/route.ts`](runalnur-app/app/api/deals/route.ts) - Return sample deals
- [`app/api/ai/chat/route.ts`](runalnur-app/app/api/ai/chat/route.ts) - Return mock AI response instead of 500

## 3. Form State Bug (name fields sent empty)

The modals are sending empty `name` values despite user input. This is a React controlled input bug.

**Root cause investigation needed in:**

- [`components/modals/ProjectModal.tsx`](runalnur-app/components/modals/ProjectModal.tsx)
- [`components/modals/TaskModal.tsx`](runalnur-app/components/modals/TaskModal.tsx)
- [`components/modals/ContactModal.tsx`](runalnur-app/components/modals/ContactModal.tsx)

Likely fix: Ensure `Input` component properly propagates `value` prop changes.

## 4. Other Broken Buttons

| Page | Button | Issue | Fix |
|------|--------|-------|-----|
| `/reports` | EXPORT PDF | Calls `window.print()` which works | Already working |
| `/reports` | EXPORT JSON | Already implemented | Already working |
| `/ai` | Suggested prompts | Don't trigger chat | Wire to set input + auto-submit |
| `/ai` | SUMMARIZE/CREATE TASK/STATUS | No action | Wire to AI commands |
| `/arms/janna` | NEW dropdown on arm header | Doesn't show dropdown | Fix dropdown trigger |
| `/onboarding` | Step buttons | Don't advance wizard | Already working (need step completion) |
| `/settings` | SET ENV VARS | No feedback | Show toast/instructions |
| `/contacts` | SYNC HUBSPOT | Returns 400 | Add graceful error handling + demo mode |
| `/arms/janna/deals` | SYNC HUBSPOT | Returns 400 | Same fix |

## 5. UI Instability (React errors on EDIT/DELETE)

The "React.Children.only expected single child" error suggests a dialog nesting issue.

**Files to investigate:**

- [`app/projects/page.tsx`](runalnur-app/app/projects/page.tsx)
- [`app/contacts/page.tsx`](runalnur-app/app/contacts/page.tsx)
- Modal/Dialog component interactions

## Implementation Order

1. **TopBar dropdowns** - High visibility, quick win
2. **API demo fallbacks** - Unblocks all pages that show empty/error states
3. **Form state bug** - Critical for any data entry
4. **AI page buttons** - Core feature
5. **UI instability** - Polish