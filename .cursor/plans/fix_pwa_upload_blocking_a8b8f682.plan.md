---
name: Fix PWA Upload Blocking
overview: ""
todos:
  - id: workbox-exclude-r2
    content: Configure Workbox to use NetworkOnly for R2 requests
    status: completed
  - id: redeploy
    content: Deploy updated next.config.ts to Vercel
    status: completed
  - id: verify-upload
    content: Test upload after clearing service worker cache
    status: completed
---

# Fix Media Upload - PWA Service Worker Blocking

## Root Cause

The presigned URL generation and R2 CORS are both working (verified server-side). The issue is the **PWA service worker** is intercepting the `fetch()` PUT request to `*.r2.cloudflarestorage.com` and failing, which surfaces as a generic "Failed to fetch" TypeError that the code incorrectly blames on CORS.

## Evidence

1. Server-side presigned PUT test: **200 OK**
2. CORS preflight test from all origins: **204 with `allow-origin: *`**
3. Client-side upload: **fails with "network/CORS" error** (on both desktop and phone PWA)

The common factor is the PWA shell - both desktop and phone are running the installed PWA with a service worker.

## Fix

### 1. Exclude R2 from service worker fetch handling

Update [`runalnur-app/next.config.ts`](runalnur-app/next.config.ts) to tell Workbox to **ignore** requests to R2:

```typescript
workboxOptions: {
  skipWaiting: true,
  clientsClaim: true,
  // Don't intercept R2 upload requests
  navigateFallbackDenylist: [/^\/api\//],
  runtimeCaching: [
    {
      urlPattern: /\.r2\.cloudflarestorage\.com/,
      handler: 'NetworkOnly', // Never cache, always go to network
    },
  ],
}
```

### 2. Redeploy to Vercel

Push the updated config so the new service worker is generated and served.

### 3. User clears old service worker

After deploy, user must either:

- **Desktop PWA**: Close and reopen (skipWaiting should auto-update)
- **Mobile PWA**: Delete the PWA and reinstall, OR clear site data in browser settings
- **Browser**: Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

## Files to change

- [`runalnur-app/next.config.ts`](runalnur-app/next.config.ts) - add R2 to Workbox exclusions

## Verification

After clearing the old service worker, upload a test image - it should:

1. Get presigned URL from `/api/media/upload-url`
2. PUT directly to R2 (bypassing service worker)
3. Create DB record via `/api/media`
4. Appear in the media grid