# GitHub Secrets Setup Guide

## Required Secrets for Auto-Deploy

Go to: GitHub Repo → Settings → Secrets and variables → Actions → New repository secret

### 1. CLOUDFLARE_API_TOKEN
- Go to: https://dash.cloudflare.com/profile/api-tokens
- Create Token → "Edit Cloudflare Workers" template
- Copy and save as `CLOUDFLARE_API_TOKEN`

### 2. CLOUDFLARE_ACCOUNT_ID
- Value: `ff289b31351913173cd7d52c4396ed8e`
- (Already found from your Cloudflare account)

### 3. SUPABASE_URL
- Value: `https://tnwelgvypmhhksqwnfmr.supabase.co`
- (Your vivatour-db project)

### 4. SUPABASE_SERVICE_KEY
- Go to: https://supabase.com/dashboard/project/tnwelgvypmhhksqwnfmr/settings/api
- Copy the "service_role" key (NOT the anon key)
- Save as `SUPABASE_SERVICE_KEY`

## Worker secrets for the edge lead inbox (phase 2)

These live on **Cloudflare Workers**, not GitHub. Set them on BOTH workers
(`escape-myvivatour` and `vietnamdentaltravel`):

```
npx wrangler secret put TURNSTILE_SECRET -c wrangler.toml
npx wrangler secret put LEAD_GATEWAY_HMAC_SECRET -c wrangler.toml
npx wrangler secret put MVT_LEAD_GATEWAY_URL -c wrangler.toml
# repeat the three with -c wrangler-dental.toml
```

- `TURNSTILE_SECRET` — Cloudflare Turnstile *secret* key for site key
  `0x4AAAAAADtJJZkl7Qik4UNn` (same widget as the WP main site). Missing → `/api/lead`
  answers 503 fail-closed; no lead is recorded.
- `LEAD_GATEWAY_HMAC_SECRET` — shared HMAC-SHA256 secret with mvt-saas
  (`/api/internal/lead-intake/{publicId}`). Must match the SaaS side exactly.
- `MVT_LEAD_GATEWAY_URL` — mvt-saas origin, e.g. `https://operator.myvivatour.com`
  (no trailing slash; no path — the worker appends the route).

If `MVT_LEAD_GATEWAY_URL` or `LEAD_GATEWAY_HMAC_SECRET` is unset, leads are still
stored in the edge inbox (`marketing_leads`) and emailed via Web3Forms, but nothing
is forwarded; the 10-minute replay cron picks rows up once both are set.

Non-secret settings already in the wrangler tomls: `LEAD_REPLAY_HOSTS` ([vars],
keeps the two workers from replaying each other's rows), the `*/10 * * * *` cron
trigger, and the optional `LEAD_RATE_LIMITER` per-IP rate-limit binding
(`[[ratelimits]]`, needs wrangler >= 4.36 — older wrangler only warns
"Unexpected fields ... ratelimits" and deploys without the limiter).

Deprecated: `MVT_CRM_LEAD_URL` and `MVT_CRM_TOKEN` are no longer read by the
worker code (the HMAC gateway forward replaces that path). Leftover values on
Cloudflare are harmless and can be deleted with `npx wrangler secret delete`.

## How It Works

1. You edit HTML files in `pages/` subfolders
2. Push to `main` branch
3. GitHub Actions automatically:
   - Runs `node build.js` to bundle pages into worker.js
   - Deploys worker.js to Cloudflare Workers
   - (Optional) Uploads images to Supabase if commit message contains `[upload-images]`

## Manual Deploy
- Go to Actions tab → "Build & Deploy MVT Landing Pages" → Run workflow
