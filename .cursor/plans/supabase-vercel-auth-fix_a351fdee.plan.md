---
name: supabase-vercel-auth-fix
overview: Restore Supabase configuration for the deployed Vercel-installed Chrome PWA by verifying the correct Vercel project/root directory, ensuring required Supabase env vars exist for the right environment, redeploying, and confirming the PWA picks up the new build (service worker + cache).
todos:
  - id: vercel-target
    content: Identify the exact Vercel project + environment backing the installed Chrome PWA, and confirm Root Directory is runalnur-app/.
    status: completed
  - id: env-audit
    content: Audit Vercel env vars for required Supabase public keys (and key server-side vars) without printing secret values.
    status: completed
  - id: env-restore
    content: Restore/copy missing env vars into the correct Vercel project/environment safely.
    status: completed
  - id: redeploy
    content: Trigger redeploy for the affected environment.
    status: completed
  - id: verify
    content: Verify on deployed URL that auth banner is gone and key endpoints respond; ensure PWA updates to new build.
    status: completed
---

## Goal

Get rid of the in-app banner “Authentication service not configured” on the **installed Vercel Chrome PWA**, and restore full Supabase auth + data.

## Working theory (most likely)

The deployed app is missing `NEXT_PUBLIC_SUPABASE_URL` and/or `NEXT_PUBLIC_SUPABASE_ANON_KEY` at runtime, so `isSupabaseClientConfigured()` returns false and the login page shows the warning (see `runalnur-app/lib/supabase/auth-client.ts` and `runalnur-app/app/login/page.tsx`). This is typically because the **Vercel project env vars are missing or attached to the wrong project/root**.

## Plan (CLI-driven, no secret values printed)

- Verify which Vercel project + domain the PWA is using
- Use `vercel project ls` / `vercel env ls` / `vercel ls` to find the project and confirm its Root Directory is `runalnur-app/`.
- Confirm which environment is affected (Production vs Preview).

- Audit Vercel environment variables for that project/environment
- Check for:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Also sanity-check common required server vars for full functionality (these won’t cause the login banner, but will break features):
- `SUPABASE_SERVICE_ROLE_KEY` (if used by any routes)
- `INTEGRATIONS_ENCRYPTION_KEY`
- `CRON_SECRET`
- Integration provider secrets (ClickUp OAuth client/secret, etc.)

- Restore missing env vars safely
- If the values exist locally or in Vercel but under the wrong environment/project, copy them into the correct target via CLI.
- Do **not** echo/print values to logs.

- Force a fresh deploy
- Trigger a redeploy for the correct environment so the new env vars are embedded where needed.

- Confirm the fix on the deployed URL
- Hit `/login` and confirm the banner is gone.
- Hit `/api/health` and `/api/status` to confirm basic routing.

- Ensure the installed PWA updates
- Confirm the service worker update banner appears and refreshes.
- If the PWA is “stuck” on an old build, perform a SW update cycle (skipWaiting/clientsClaim are already configured), and clear the SW cache if necessary.

## Expected deliverable

- PWA login works again (no “auth not configured” banner).
- Supabase-backed flows resume.

## Notes

- I can’t read your `.env.local` contents directly from the editor here (it’s ignored), so the CLI approach will source values from Vercel or prompt securely where required.
- If Vercel CLI isn’t authenticated in this environment, we’ll need to log in once (still no secret values printed).