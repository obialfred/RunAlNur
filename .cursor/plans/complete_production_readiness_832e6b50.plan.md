---
name: Complete Production Readiness
overview: "Address all remaining issues from the production audit: fix form state bugs, add missing API demo fallbacks, remove Rive, create missing endpoints, fix modal dismiss/stability bugs, wire TopBar dropdowns, and add graceful auth page errors."
todos:
  - id: fix-form-state
    content: Fix ProjectModal/TaskModal/ContactModal form state bug (name sending empty)
    status: pending
  - id: fix-modal-dismiss
    content: Fix modal dismiss after error state
    status: pending
  - id: fix-delete-dialog
    content: Fix UI instability on EDIT/DELETE - prevent modal nesting
    status: pending
  - id: wire-topbar
    content: Wire TopBar NEW dropdown handlers (Project/Task/Contact/SOP)
    status: pending
  - id: api-demo-fallbacks
    content: Add demo fallbacks to /api/activities, /api/properties, /api/deals
    status: pending
  - id: ai-chat-fallback
    content: Add demo fallback to /api/ai/chat
    status: pending
  - id: create-clickup-status
    content: Create /api/clickup/status/route.ts endpoint
    status: pending
  - id: wire-ai-buttons
    content: Wire AI page buttons to auto-submit messages
    status: pending
  - id: auth-error-messages
    content: Add graceful error messages to auth pages when Supabase missing
    status: pending
  - id: remove-rive
    content: Delete RiveAnimation component and remove @rive-app/react-canvas
    status: pending
  - id: verify-build
    content: Run npm run build to verify everything compiles
    status: pending
---

# Complete Production Readiness

Based on the full audit, here are ALL remaining issues to fix:

---

## Priority 1: Critical UI Bugs (Site is Broken)

### 1.1 Form State Bug - Name Fields Send Empty String

**Problem**: All create modals (Project, Task, Contact) send `name: ""` causing 400 errors.
**Files**:

- [`components/modals/ProjectModal.tsx`](runalnur-app/components/modals/ProjectModal.tsx)
- [`components/modals/TaskModal.tsx`](runalnur-app/components/modals/TaskModal.tsx)
- [`components/modals/ContactModal.tsx`](runalnur-app/components/modals/ContactModal.tsx)

**Fix**: Ensure inputs have `name` attribute and state is properly bound. Add validation before submit.

### 1.2 Modal Dismiss Bug After Error

**Problem**: Modals don't close via Cancel/X/Escape after a save error.
**Fix**: Ensure `onOpenChange` properly resets error state and allows dismissal.

### 1.3 UI Instability on EDIT/DELETE

**Problem**: "React.Children.only" error causing page collapse when using EDIT/DELETE buttons.
**Files**:

- [`app/projects/page.tsx`](runalnur-app/app/projects/page.tsx)
- [`app/contacts/page.tsx`](runalnur-app/app/contacts/page.tsx)

**Fix**: Ensure delete confirmation doesn't nest inside edit modal; close edit modal before showing delete dialog.

---

## Priority 2: Missing Functionality (Features Don't Work)

### 2.1 TopBar NEW Dropdown Items Not Wired

**File**: [`components/layout/TopBar.tsx`](runalnur-app/components/layout/TopBar.tsx)
**Fix**: Add handlers for "New Project", "New Task", "New Contact", "Start SOP".

### 2.2 API Routes Return 503 (Demo Mode Fallbacks Missing)

**Problem**: These routes fail without Supabase instead of returning demo data:

- `/api/activities` - returns 503
- `/api/properties` - returns 503
- `/api/deals` - returns 503

**Fix**: Add demo-mode fallbacks like the existing `/api/projects` has.

### 2.3 AI Chat Returns 500

**File**: [`app/api/ai/chat/route.ts`](runalnur-app/app/api/ai/chat/route.ts)
**Fix**: Add demo-mode fallback response when AI credentials unavailable.

### 2.4 Missing `/api/clickup/status` Endpoint

**Problem**: Settings page TEST button calls this but it doesn't exist.
**Fix**: Create `app/api/clickup/status/route.ts`.

### 2.5 AI Page Buttons Don't Auto-Submit

**Problem**: Clicking "SUMMARIZE" / suggested prompts just fills input instead of submitting.
**File**: [`components/ai/ChatInterface.tsx`](runalnur-app/components/ai/ChatInterface.tsx)
**Fix**: Wire buttons to actually submit the message.

---

## Priority 3: UX Polish

### 3.1 Auth Pages Show Nothing When Supabase Missing

**Problem**: Login/Signup/Forgot-password silently fail.
**Files**:

- [`app/login/page.tsx`](runalnur-app/app/login/page.tsx)
- [`app/signup/page.tsx`](runalnur-app/app/signup/page.tsx)
- [`app/forgot-password/page.tsx`](runalnur-app/app/forgot-password/page.tsx)

**Fix**: Show error message like "Authentication service not configured" instead of silent failure.

### 3.2 Remove Rive (User Confirmed Not Using)

**Delete**: `components/rive/RiveAnimation.tsx`
**Update**: Remove `@rive-app/react-canvas` from `package.json`
**Update**: Replace RiveAnimation in ChatInterface with CSS fallback (already has fallback prop)
**Keep**: EmptyState.tsx (already doesn't use Rive internally)

---

## Priority 4: Security (For Real Production Later)

These are noted but NOT required for demo/preview:

- `/api/deals/[id]` - needs auth
- `/api/properties/[id]` - needs auth
- `/api/notifications/register` - authz flaw
- Webhook signature verification
- OAuth state verification for ClickUp
- Tenant isolation / RLS

---

## Summary of Changes

| File | Change |
|------|--------|
| `components/modals/ProjectModal.tsx` | Fix form state, modal dismiss |
| `components/modals/TaskModal.tsx` | Fix form state, modal dismiss |
| `components/modals/ContactModal.tsx` | Fix form state, modal dismiss |
| `app/projects/page.tsx` | Fix delete dialog nesting |
| `app/contacts/page.tsx` | Fix delete dialog nesting |
| `components/layout/TopBar.tsx` | Wire NEW dropdown handlers |
| `app/api/activities/route.ts` | Add demo fallback |
| `app/api/properties/route.ts` | Add demo fallback |
| `app/api/deals/route.ts` | Add demo fallback |
| `app/api/ai/chat/route.ts` | Add demo fallback |
| `app/api/clickup/status/route.ts` | Create new file |
| `components/ai/ChatInterface.tsx` | Wire buttons to submit, remove Rive |
| `app/login/page.tsx` | Add Supabase error message |
| `app/signup/page.tsx` | Add Supabase error message |
| `app/forgot-password/page.tsx` | Add Supabase error message |
| `components/rive/RiveAnimation.tsx` | Delete file |
| `package.json` | Remove @rive-app/react-canvas |