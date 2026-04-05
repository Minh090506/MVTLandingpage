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

## How It Works

1. You edit HTML files in `pages/` subfolders
2. Push to `main` branch
3. GitHub Actions automatically:
   - Runs `node build.js` to bundle pages into worker.js
   - Deploys worker.js to Cloudflare Workers
   - (Optional) Uploads images to Supabase if commit message contains `[upload-images]`

## Manual Deploy
- Go to Actions tab → "Build & Deploy MVT Landing Pages" → Run workflow
