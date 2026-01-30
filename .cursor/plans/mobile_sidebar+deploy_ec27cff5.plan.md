---
name: Mobile Sidebar+Deploy
overview: "Deploy the latest code to Vercel, then finish iPhone UX fixes: reliable sidebar scrolling, swipe-to-open, and tighter AI page mobile layout, with PWA/service-worker update behavior so changes actually reach devices."
todos:
  - id: deploy-vercel
    content: Deploy latest `runalnur-app` to Vercel and confirm iPhone is on the new deployment
    status: completed
  - id: sidebar-scroll-single-container
    content: Refactor mobile sheet/sidebar to avoid nested scroll and ensure iOS momentum scrolling
    status: completed
  - id: swipe-anywhere-open
    content: Implement swipe-right-anywhere gesture to open the mobile sidebar safely on iOS
    status: completed
  - id: ai-mobile-polish
    content: Tighten AI page mobile layout so content fits and touch targets are comfortable
    status: completed
  - id: sw-update-prompt
    content: Make PWA/service-worker updates apply immediately and optionally show an in-app refresh prompt
    status: completed
---

# Mobile iPhone Sidebar + Deployment Fix

## Why you’re not seeing changes

- You’re testing `runalnur-app.vercel.app` but **haven’t redeployed**, so your phone is still running the older deployment (and possibly an older service-worker cache).

## Implementation Plan

### 1) Deploy the latest code to Vercel

- Deploy `runalnur-app/` as the Vercel project root.
- Confirm the new deployment is live (new Deployment ID / timestamp) and that iPhone is loading that version.
- After deploy, validate by checking for a visible “tell” (e.g., sidebar close button behavior) on the phone.

### 2) Make sidebar scroll reliable on iPhone (no nested scroll traps)

- Ensure there is exactly **one** scroll container inside the mobile sheet.
- Update the sheet/sidebar structure so:
- `SheetContent` is `overflow-hidden` and `flex flex-col min-h-0`.
- The sidebar nav area (`SidebarContent`) owns `overflow-y-auto` with `min-h-0` + `-webkit-overflow-scrolling: touch`.
- Files:
- [`/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/components/ui/sheet.tsx`](file:///Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/components/ui/sheet.tsx)
- [`/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/components/layout/Sidebar.tsx`](file:///Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/components/layout/Sidebar.tsx)
- [`/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/components/layout/LayoutShell.tsx`](file:///Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/components/layout/LayoutShell.tsx)

### 3) Implement “swipe anywhere to open” (safe on iOS)

- Replace the current edge-only gesture with a **swipe-right anywhere** gesture **only when the sidebar is closed**, with strong guards:
- Require mostly-horizontal swipe (e.g., `abs(dx) > abs(dy) * 2`)
- Require minimum distance (e.g., 60px)
- Ignore if the gesture begins on an input/textarea, or on horizontally scrollable elements.
- Wire it so it opens the mobile sheet; optionally add swipe-left-to-close if not already handled.
- Files:
- [`/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/lib/hooks/useEdgeSwipe.ts`](file:///Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/lib/hooks/useEdgeSwipe.ts)
- [`/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/components/layout/LayoutShell.tsx`](file:///Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/components/layout/LayoutShell.tsx)

### 4) Tighten AI page mobile layout (fit + spacing)

- Re-audit `AI` page on iPhone sizes (390×844):
- Ensure header is compact and doesn’t push the chat card off-screen.
- Ensure the message list area uses available height and input stays visible above the bottom nav.
- Ensure quick actions + suggested prompts are mobile-first (horizontal scroll, 44px targets, no overflow).
- Files:
- [`/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/app/ai/page.tsx`](file:///Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/app/ai/page.tsx)
- [`/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/components/ai/ChatInterface.tsx`](file:///Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/components/ai/ChatInterface.tsx)

### 5) Prevent “no difference on phone” going forward (PWA/service worker update)

- Configure `next-pwa` to activate new service workers immediately (skip waiting + claim clients), and add a tiny in-app “Update available → Refresh” prompt.
- Files:
- [`/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/next.config.ts`](file:///Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/next.config.ts)
- (new) `runalnur-app/lib/hooks/useServiceWorkerUpdate.ts`
- (small UI hook-in) `runalnur-app/components/pwa/InstallPrompt.tsx` or `runalnur-app/components/layout/LayoutShell.tsx`

## Validation (on iPhone)

- Open deployed URL in Safari and confirm the deployment is updated.
- Open sidebar and **scroll to the bottom** (verify it scrolls smoothly).
- Perform **swipe-right anywhere** to open sidebar.
- On `/ai`, verify nothing is clipped and the input stays usable.