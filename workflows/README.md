# n8n Workflows for MVT Landing Pages

## `scrape-tripadvisor-reviews.json` — Auto-update TripAdvisor reviews

**Schedule:** Every Monday 09:00 (cron `0 9 * * 1`)

**What it does:**

1. Scrape https://www.tripadvisor.com/Attraction_Review-g293924-d29687552-Reviews-My_Viva_Tour-Hanoi.html via Firecrawl (with stealth proxy + JSON schema extraction)
2. Filter reviews: 5-star only, 80–600 chars (good signal-to-noise)
3. Pick 6 best:
   - 1 Australian reviewer (if available) — featured at position #1
   - 5 most recent quality reviews
4. Format to match `data/tripadvisor-reviews.json` schema
5. Compare with current JSON in repo (skip commit if unchanged)
6. Commit updated JSON to `main` branch via GitHub API
7. GitHub Actions auto-deploys in ~2 minutes

**Result:** Landing page TripAdvisor section stays fresh without manual editing.

---

## Setup (one-time)

### 1. Import workflow into your n8n instance

```
n8n UI → Workflows → Import from File → workflows/scrape-tripadvisor-reviews.json
```

### 2. Create credentials

#### Credential: **Firecrawl API Key** (HTTP Header Auth)
- Name: `Firecrawl API Key`
- Header name: `Authorization`
- Header value: `Bearer fc-YOUR_FIRECRAWL_API_KEY`
- Get key from: https://www.firecrawl.dev/app/api-keys

#### Credential: **GitHub PAT (repo:contents)** (HTTP Header Auth)
- Name: `GitHub PAT (repo:contents)`
- Header name: `Authorization`
- Header value: `Bearer ghp_YOUR_GITHUB_PAT`
- Generate PAT: https://github.com/settings/tokens/new
- Required scope: `repo` (or fine-grained: `Contents: Read & Write` on `Minh090506/MVTLandingpage`)

### 3. Test run

- Open the workflow in n8n
- Click **Execute workflow** manually
- Verify each node passes:
  - `Firecrawl Scrape TA` — should return ~10+ reviews
  - `Pick 6 + Format JSON` — should produce JSON matching the schema
  - `GitHub: Get Current SHA` — should return current file SHA
  - `Prepare Commit Payload` — should produce base64 + commit message
  - `Skip if Unchanged` — branches based on whether reviews changed
  - `GitHub: Commit Update` — pushes the commit (only if changed)

### 4. Activate

Toggle the workflow **Active** in n8n. It will now run every Monday at 09:00 (server timezone).

---

## Safety features

- **Quality filter**: only 5-star reviews with 80–600 chars are picked → avoids 1-star trolls and ultra-short low-signal reviews
- **No-change detection**: if scraped reviews match current JSON, no commit is made → no spam commits
- **Bot-attributed commits**: commits authored by `TripAdvisor Auto-Sync Bot <bot@myvivatour.com>` for clarity
- **Conventional commit format**: `chore(reviews): auto-update TripAdvisor reviews — {count} reviews, {n} cards`

---

## Manual override

Want to manually edit reviews? Edit `data/tripadvisor-reviews.json` directly + push. **But** the next workflow run will overwrite it. To pin specific reviews:

- Option A: disable the workflow
- Option B: add a `pinned: true` flag on a review and modify the workflow's `Pick 6 + Format JSON` node to always include pinned reviews

---

## Alternative: GitHub Actions cron (no n8n needed)

If you don't have an n8n instance running, this can be done via GitHub Actions instead. Create:

- `scripts/scrape-tripadvisor.js` — Node.js equivalent of the n8n logic
- `.github/workflows/update-reviews.yml` — cron trigger + run script + commit

Pros: No external service, all in repo. Cons: Requires `FIRECRAWL_API_KEY` as GitHub secret.

Ask Claude to scaffold this if you prefer the GitHub Actions route.
