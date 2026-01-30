---
name: Final Production Fixes
overview: Remove Rive dependencies and create the missing /api/clickup/status endpoint - only 3 small changes needed.
todos:
  - id: remove-rive-chatinterface
    content: Remove RiveAnimation import and usage from ChatInterface.tsx
    status: completed
  - id: create-clickup-status
    content: Create /api/clickup/status/route.ts endpoint
    status: completed
  - id: remove-rive-package
    content: Remove @rive-app/react-canvas from package.json
    status: completed
  - id: verify-build
    content: Run npm run build to verify
    status: completed
---

# Final Production Fixes

Only 3 changes remain:

---

## 1. Remove Rive from ChatInterface

**File**: [`components/ai/ChatInterface.tsx`](runalnur-app/components/ai/ChatInterface.tsx)

**Changes**:

- Remove line 10: `import { RiveAnimation } from "@/components/rive/RiveAnimation";`
- Replace lines 164-176 (RiveAnimation usage) with the existing CSS fallback it already has

Current code to replace:

```tsx
<div className="w-16 h-6">
  <RiveAnimation
    src="/rive/ai-thinking.riv"
    className="w-full h-full"
    fallback={
      <div className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-pulse" />
        ...
      </div>
    }
  />
</div>
```

Replace with just the CSS dots (the fallback content).

---

## 2. Create /api/clickup/status Endpoint

**Create**: `app/api/clickup/status/route.ts`

Simple status check that mirrors the existing `?action=status` behavior:

```typescript
import { NextResponse } from "next/server";
import { getClickUpClient } from "@/lib/integrations/clickup";

export async function GET() {
  const client = getClickUpClient();
  if (!client) {
    return NextResponse.json({ connected: false });
  }
  try {
    await client.getWorkspaces();
    return NextResponse.json({ connected: true });
  } catch {
    return NextResponse.json({ connected: false });
  }
}
```

---

## 3. Remove Rive Package

**File**: [`package.json`](runalnur-app/package.json)

Remove: `"@rive-app/react-canvas": "^4.26.1",`

---

## Optional Cleanup

- Delete `components/rive/RiveAnimation.tsx` (no longer used)
- Keep `components/rive/EmptyState.tsx` (it doesn't actually use Rive)

---

## Verify

Run `npm run build` to confirm everything compiles.