---
name: Finish Site for Production
overview: Remove unused Rive dependencies and create the missing `/api/clickup/status` endpoint to make all settings page TEST buttons work.
todos:
  - id: remove-rive
    content: Delete RiveAnimation component and remove @rive-app/react-canvas from package.json
    status: pending
  - id: update-chatinterface
    content: Replace RiveAnimation usage with CSS-only loading dots in ChatInterface
    status: pending
  - id: update-emptystate
    content: Remove unused riveSrc prop from EmptyState component
    status: pending
  - id: create-clickup-status
    content: Create /api/clickup/status/route.ts endpoint
    status: pending
  - id: verify-build
    content: Run npm run build to verify everything compiles
    status: pending
---

# Finish Site for Production

## Tasks

### 1. Remove Rive Dependencies

Since you're not using Rive:

- **Delete** [`components/rive/RiveAnimation.tsx`](runalnur-app/components/rive/RiveAnimation.tsx) - uses `@rive-app/react-canvas`
- **Update** [`components/rive/EmptyState.tsx`](runalnur-app/components/rive/EmptyState.tsx) - remove unused `riveSrc` prop
- **Update** [`components/ai/ChatInterface.tsx`](runalnur-app/components/ai/ChatInterface.tsx) - replace `RiveAnimation` with inline CSS dots fallback (already present)
- **Remove** `@rive-app/react-canvas` from [`package.json`](runalnur-app/package.json)

### 2. Create Missing API Status Endpoint

The Settings page calls `/api/clickup/status` directly, but only `/api/clickup?action=status` exists:

- **Create** `app/api/clickup/status/route.ts` - simple redirect/wrapper that returns connection status

### 3. Verify Build

- Run `npm run build` to confirm no errors