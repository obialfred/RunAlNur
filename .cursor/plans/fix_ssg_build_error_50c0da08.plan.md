---
name: Fix SSG Build Error
overview: Fix the build error caused by Supabase client creation during static generation by making the client creation lazy and client-side only.
todos:
  - id: fix-auth-client
    content: Add typeof window check to auth-client.ts for SSG safety
    status: completed
  - id: fix-topbar
    content: Move createSupabaseClient call to handleSignOut in TopBar.tsx
    status: completed
  - id: rebuild-deploy
    content: Rebuild and deploy to verify the fix works
    status: completed
---

# Fix SSG Build Error with Supabase Client

The build fails because `TopBar` (in LayoutShell) calls `createSupabaseClient()` at render time, which happens during static generation when environment variables may not be properly available.

## Root Cause

- `TopBar` imports and calls `createSupabaseClient()` at component render time
- During SSG, Next.js pre-renders pages including the layout
- The Supabase SDK throws "Invalid supabaseUrl" because the env var may be undefined/empty during build

## Fix Strategy

### 1. Update auth-client.ts with better defensive checks

Add a `typeof window` check to ensure the real client is only created on the client side:

```typescript
export function createSupabaseClient(): SupabaseClient<Database> {
  // Return stub during SSR/SSG
  if (typeof window === 'undefined') {
    return createStubClient();
  }
  // ... rest of the logic
}
```

### 2. Update TopBar to use lazy client initialization

Move `createSupabaseClient()` call into the `handleSignOut` function instead of component body:

```typescript
const handleSignOut = async () => {
  const supabase = createSupabaseClient();
  await supabase.auth.signOut();
  router.push("/login");
};
```

This ensures the Supabase client is only created when the user clicks sign out, not during render.

## Files to modify

- [lib/supabase/auth-client.ts](lib/supabase/auth-client.ts) - Add window check
- [components/layout/TopBar.tsx](components/layout/TopBar.tsx) - Move client creation to handler