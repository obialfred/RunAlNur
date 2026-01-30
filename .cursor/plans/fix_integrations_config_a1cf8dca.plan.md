---
name: Fix Integrations Config
overview: Diagnose why ClickUp and Guru integrations stopped working and restore connectivity by ensuring proper environment variables are set.
todos:
  - id: check-env
    content: Check .env.local file for missing CLICKUP_CLIENT_ID, CLICKUP_CLIENT_SECRET, and GURU variables
    status: completed
  - id: add-vars
    content: Add the missing environment variables from ClickUp and Guru dashboards
    status: in_progress
  - id: restart
    content: Restart dev server to pick up new environment variables
    status: pending
---

# Fix ClickUp and Guru Integration Configuration

## Root Cause

The integrations are not working because **environment variables are missing**. The error "ClickUp OAuth not configured. Set CLICKUP_CLIENT_ID in environment." directly indicates the OAuth credentials are not set.

## Required Environment Variables

Add these to your `.env.local` file:

### For ClickUp OAuth (to enable the "Connect" button):

```bash
# Get these from ClickUp Settings > Apps > Create App
CLICKUP_CLIENT_ID=your_client_id_here
CLICKUP_CLIENT_SECRET=your_client_secret_here
```

**How to get ClickUp OAuth credentials:**

1. Go to [ClickUp Settings](https://app.clickup.com/settings) > Integrations > ClickUp API
2. Click "Create an App"
3. Set Redirect URL to: `http://localhost:3000/api/clickup/oauth` (or your production URL)
4. Copy the Client ID and Client Secret

### For Guru API (used in the modal):

```bash
# Get these from Guru Settings > API Access
GURU_USER_EMAIL=your_guru_email@example.com
GURU_USER_TOKEN=your_guru_api_token
```

**How to get Guru credentials:**

1. Go to Guru > Settings > API Access
2. Generate a new API token
3. Copy your email and the token

### Optional: Demo Mode Fallback

If you just want to use env-based API keys (no per-user OAuth):

```bash
DEMO_MODE=true
CLICKUP_API_KEY=pk_your_personal_api_key
```

## After Adding Variables

1. Save `.env.local`
2. Restart the dev server (`npm run dev`)
3. Go back to `/onboarding` or `/settings` to connect

## Quick Verification

After restart, the ClickUp "Connect" button should open an OAuth flow instead of showing the error. The Guru modal will work the same - you enter your API key and it gets stored encrypted in the database.