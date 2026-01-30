---
name: Fix Media Upload End-to-End
overview: Get Media upload fully working on Vercel/PWA by fixing the most likely blocker (R2 browser CORS for presigned PUT), aligning env vars/endpoints, and ensuring uploaded assets can be read back (public URL or signed read URLs).
todos:
  - id: r2-cors
    content: Configure Cloudflare R2 bucket CORS to allow browser PUT uploads from runalnur-app.vercel.app
    status: completed
  - id: endpoint-align
    content: Update storage client to use CLOUDFLARE_R2_ENDPOINT when present
    status: completed
  - id: signed-reads-or-public-url
    content: "Ensure assets can be read back: implement signed read URLs in /api/media or set CLOUDFLARE_R2_PUBLIC_URL + make bucket publicly readable"
    status: completed
  - id: better-errors
    content: Improve client upload error messages to surface CORS/403 issues clearly
    status: completed
  - id: verify
    content: "Verify end-to-end upload: upload-url -> PUT -> create asset -> appears in grid"
    status: completed
---

# Fix Media Upload End-to-End

## What’s most likely broken

Your production env is configured for R2 (all `CLOUDFLARE_*` vars exist in Production), so uploads use **browser → presigned PUT → R2**. When that “does nothing”, the #1 cause is **R2 bucket CORS not allowing PUT from `runalnur-app.vercel.app`**.

A secondary issue is that we currently rely on `CLOUDFLARE_R2_PUBLIC_URL` for read/display URLs, but Production has `CLOUDFLARE_R2_ENDPOINT` and **does not show `CLOUDFLARE_R2_PUBLIC_URL`**. That can make “upload succeeded but nothing shows / images broken” even after upload works.

## Plan

### 1) Fix Cloudflare R2 CORS (required for browser direct uploads)

In Cloudflare Dashboard → R2 → `runalnur-media` bucket → CORS:

- **Allowed origins**:
- `https://runalnur-app.vercel.app`
- (optional) your custom domain if/when you add one
- **Allowed methods**: `PUT`, `GET`, `HEAD`
- **Allowed headers** (safe superset for presigned PUT + preflight):
- `content-type`
- `x-amz-date`
- `x-amz-content-sha256`
- `x-amz-security-token`
- `authorization`
- `x-amz-user-agent`
- `x-amz-acl`
- **Expose headers**: `etag`
- **Max age**: 86400

This alone typically makes the PUT succeed immediately.

### 2) Align R2 endpoint usage in code

Right now, [`runalnur-app/lib/media/storage.ts`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/lib/media/storage.ts) ignores `CLOUDFLARE_R2_ENDPOINT` even though it exists in Production.

Update it so the S3 client uses:

- `process.env.CLOUDFLARE_R2_ENDPOINT` if present
- else fallback to `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`

This prevents subtle mismatches and makes it easier to move to a custom domain later.

### 3) Make reads work reliably (so uploads show up)

Choose one:

- **Option A (simple)**: Add `CLOUDFLARE_R2_PUBLIC_URL` in Vercel Production and make the bucket publicly readable via Cloudflare public bucket/custom domain.
- **Option B (robust, private bucket)**: Change `GET /api/media` to return **signed read URLs** (via `createSignedReadUrl`) for thumbnail/preview/original so the UI always has a valid `https://...` URL even if the bucket is private.

Given this is internal software, Option B is safer and avoids “public bucket” exposure.

### 4) Improve upload error reporting in UI

In [`runalnur-app/lib/hooks/useMediaUpload.ts`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/lib/hooks/useMediaUpload.ts):

- When PUT fails, include `status`, `statusText`, and response body (if any)
- Detect CORS/network errors and show a direct message: “R2 CORS likely not configured”

This prevents silent failures and makes future debugging easy.

### 5) Verify

- Upload a small `.jpg`
- Confirm:
- `POST /api/media/upload-url` returns 200 with a presigned `url`
- `PUT` returns 200
- `POST /api/media` returns 200
- Asset appears in the grid

## Files to change

- [`runalnur-app/lib/media/storage.ts`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/lib/media/storage.ts)
- [`runalnur-app/app/api/media/route.ts`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/app/api/media/route.ts) (if doing signed read URLs)
- [`runalnur-app/lib/hooks/useMediaUpload.ts`](/Users/obi/Projects/RunAlNur/RunAlNur/runalnur-app/lib/hooks/useMediaUpload.ts)

## Todos

- **r2-cors**: Configure R2 bucket CORS for browser PUT uploads
- **endpoint-align**: Use `CLOUDFLARE_R2_ENDPOINT` when present
- **signed-reads-or-public-url**: Implement signed read URLs (preferred) or set `CLOUDFLARE_R2_PUBLIC_URL`
- **better-errors**: Improve upload error reporting in UI
- **verify**: Upload test image and confirm it appears