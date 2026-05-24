# MVT Landing Page — Deployment Guide

**Last Updated:** 2026-05-24
**Audience:** Developers shipping landing-page changes to production.

## Prerequisites

| Item | How to verify |
|---|---|
| `gh` CLI authenticated | `gh auth status` |
| Node.js ≥ 22 locally | `node --version` |
| Cloudflare account access | `npx wrangler whoami` |
| Branch up to date | `git pull origin main` |

GitHub Secrets (set once by repo owner):
- `CLOUDFLARE_API_TOKEN` — Workers scope token
- `CLOUDFLARE_ACCOUNT_ID` — `ff289b31351913173cd7d52c4396ed8e`
- `SUPABASE_URL` — `https://tnwelgvypmhhksqwnfmr.supabase.co`
- `SUPABASE_SERVICE_KEY` — `service_role` JWT from Supabase dashboard

Verify with `gh secret list`. Note: `gh secret list` only shows names + timestamps, NOT values. To validate a JWT key without revealing it, decode the payload via base64 and check `ref` matches the project URL:

```bash
echo "<jwt-key>" | cut -d. -f2 | tr '_-' '/+' | base64 -d 2>/dev/null
# expect: {"iss":"supabase","ref":"tnwelgvypmhhksqwnfmr","role":"service_role",...}
```

## Standard deploy flow (HTML/content changes)

```bash
# 1. Make edits in pages/<name>/index.html
# 2. Local build to catch syntax errors
node build.js

# 3. Verify worker.js shape
grep -c "PAGE_$(echo <name> | tr '[:lower:]-' '[:upper:]_')" worker.js  # should be ≥ 1

# 4. (Optional) Local serve smoke test
npx wrangler dev --port 8787 --local
curl -s http://localhost:8787/<page>/ | grep -oE '<title>[^<]+</title>'

# 5. Commit + push
git add pages/<name>/index.html worker.js build.js
git commit -m "feat(<scope>): <short description>"
git push origin main
```

GitHub Actions auto-deploys via `deploy.yml`. Check status:

```bash
gh run watch                                  # follow latest run
gh run list --workflow=deploy.yml --limit 3   # recent history
```

## Image upload flow

When adding/replacing images in `pages/<page>/images/`:

```bash
# 1. Drop .webp files into pages/<page>/images/
# 2. Rewrite HTML to use Supabase absolute URLs (one-time per page)
SUPA='https://tnwelgvypmhhksqwnfmr.supabase.co/storage/v1/object/public/landing-images/<page>'
perl -i -pe "s|src=\"images/([^\"]+)\"|src=\"${SUPA}/\$1\"|g" pages/<page>/index.html

# 3. Commit with [upload-images] flag to trigger upload job in CI
git add pages/<page>/
git commit -m "feat(<page>): add images [upload-images]"
git push origin main

# 4. Wait for workflow to finish, then verify
gh run watch
for img in $(ls pages/<page>/images/); do
  http=$(curl -sI "$SUPA/$img" -o /dev/null -w "%{http_code}")
  [ "$http" = "200" ] && echo "✓ $img" || echo "✗ $img → $http"
done
```

If `gh run` shows the upload job failed:
- `Missing environment variables` → `SUPABASE_URL`/`SUPABASE_SERVICE_KEY` GitHub Secrets not set
- `signature verification failed` → wrong JWT (check `ref` matches `tnwelgvypmhhksqwnfmr`)
- `Node.js 20 detected without native WebSocket` → workflow Node version not 22
- `SyntaxError: Unexpected identifier 'Supabase'` → `/** */` block comment swallowing `*/` from path glob; switch header to `//` line comments

## Adding a new landing page

### 1. Scaffold
```bash
mkdir -p pages/<new-name>/images
cp pages/escape/index.html pages/<new-name>/index.html
# Edit content, swap brand/copy/tracking IDs not changing
```

### 2. Register in `build.js`
Add to `PAGES_CONFIG`:
```javascript
'<new-name>': { path: '/<new-name>', name: 'Display Name' },
```

If serving on a brand subdomain, add to `HOST_DEFAULTS`:
```javascript
const HOST_DEFAULTS = {
  '<sub>.myvivatour.com': '/<new-name>',
};
```

### 3. Cross-zone subdomain (if outside myvivatour.com)
Create `wrangler-<brand>.toml`:
```toml
name = "<worker-name>"
main = "worker.js"
compatibility_date = "2024-01-01"
workers_dev = true

[[routes]]
pattern = "<sub>.<other-zone>.com"
custom_domain = true
```

Add deploy step in `.github/workflows/deploy.yml`:
```yaml
- name: Deploy <brand> Worker
  uses: cloudflare/wrangler-action@v3
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    command: deploy -c wrangler-<brand>.toml
```

### 4. Build + smoke test
```bash
node build.js
npx wrangler dev --port 8787 --local
curl -s http://localhost:8787/<new-name> | grep '<title>'
curl -sI -H "Host: <sub>.<zone>.com" http://localhost:8787/ | head -1   # host-default routing
```

### 5. Run audit
```bash
mkdir -p /tmp/lp-audit-new
node scripts/puppeteer-landing-page-screenshot-and-audit.js http://localhost:8787/<new-name> /tmp/lp-audit-new/ r1
```

Open `/tmp/lp-audit-new/r1-summary.json`. Required pass criteria:
- `layout.overflowing` empty on mobile
- `seo.imgsMissingAlt` = 0
- `tracking` has all 5 IDs populated
- `consoleErrors` empty (or each one traced)
- Mobile `perf.fcp` < 2500ms

### 6. Test form submission
```bash
node test-form-submit.js   # custom puppeteer script that fills + submits form
# Check info@myvivatour.com inbox for the test entry
```

Server-side curl to Web3Forms is blocked on the free plan — submissions must go through a real browser origin.

### 7. Commit + push
```bash
git add pages/<new-name>/ build.js .github/workflows/deploy.yml wrangler-*.toml worker.js
git commit -m "feat(<new-name>): launch landing page [upload-images]"
git push origin main
```

## Rollback procedures

### Worker rollback
1. Cloudflare dashboard → Workers & Pages → `<worker-name>` → Versions
2. Find last known-good version → click "Rollback to this version"
3. Confirms in seconds; no rebuild needed

### Git revert (last commit broke prod)
```bash
git revert HEAD
git push origin main
# Auto-deploys reverted state
```

### Image revert (uploaded a bad replacement)
Re-upload the previous version from local `pages/<page>/images/` (still source of truth). Supabase Storage upsert is idempotent.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| 404 on a new route after push | Forgot to add to `PAGES_CONFIG` OR worker.js not rebuilt | Run `node build.js` + commit worker.js |
| New page accessible at path but NOT at custom subdomain | Missing entry in `HOST_DEFAULTS` | Add and rebuild |
| Subdomain points to old content | Worker name in `wrangler-<brand>.toml` deployed stale worker.js | Re-run `deploy-<brand>.yml` workflow |
| Images broken on production | Either not uploaded to Supabase, or HTML still using `images/` relative paths | Run upload + sed rewrite per "Image upload flow" |
| Form returns success but no email received | Web3Forms destination email mismatch | Check Web3Forms dashboard for access_key destination |
| `gh run` workflow fails, no `paths` match | Trigger filter excludes changed paths | Manually `gh workflow run deploy.yml --ref main` |
| `signature verification failed` from Supabase | Wrong project's `service_role` key | Decode JWT, verify `ref`, re-set secret with `printf "%s" "$KEY" \| gh secret set ...` |
| `Unexpected identifier 'Supabase'` in upload script | Path glob `*/` closing `/** */` block comment | Convert script header to `//` line comments |

## Workflow dispatch examples

```bash
# Force a full deploy + image upload
gh workflow run deploy.yml --ref main

# Trigger dental-only fast path
gh workflow run deploy-dental.yml --ref main

# Check last 5 runs of any workflow
gh run list --limit 5

# Get failure log for a specific run
gh run view <run-id> --log-failed | tail -50
```

## Local development without deploy

```bash
node build.js
npx wrangler dev --port 8787 --local
open http://localhost:8787/<page>
```

Wrangler dev hot-reloads on `worker.js` change — but `worker.js` is generated, so you must re-run `node build.js` after editing `pages/<page>/index.html`. Consider a `npm run dev` script if iterating heavily.

## Unresolved
- Form destination email verification — currently relies on Web3Forms dashboard (no API to query the configured `to` for a given access_key).
- No staging environment — main branch goes straight to production. Recommendation: add a `staging.escape-myvivatour.workers.dev` worker for preview.
