# TripAdvisor Integration Reference

Detailed reference for the TripAdvisor scraping + auto-rotation system on MVT landing pages.

## Listing details

- **Business**: My Viva Tour
- **City**: Hanoi
- **TA URL**: https://www.tripadvisor.com/Attraction_Review-g293924-d29687552-Reviews-My_Viva_Tour-Hanoi.html
- **Localized URL** (Vietnamese): https://www.tripadvisor.com.vn/Attraction_Review-g293924-d29687552-Reviews-My_Viva_Tour-Hanoi.html

Always prefer `tripadvisor.com` (English) over `.com.vn` for English-speaking audience extraction.

---

## JSON schema (`data/tripadvisor-reviews.json`)

```json
{
  "_comment": "Auto-updated by n8n workflow weekly. Manual edits will be overwritten.",
  "lastUpdated": "ISO-8601 timestamp",
  "source": {
    "url": "TripAdvisor listing URL",
    "businessName": "My Viva Tour",
    "city": "Hanoi"
  },
  "rating": {
    "value": "5.0",
    "scale": 5,
    "count": 230,
    "distribution": {
      "excellent": 226,
      "good": 3,
      "average": 0,
      "poor": 0,
      "terrible": 1
    }
  },
  "award": {
    "name": "Travellers' Choice",
    "year": 2026,
    "issuer": "Tripadvisor"
  },
  "ranking": {
    "position": 47,
    "outOf": 852,
    "topPercent": 6,
    "category": "Hanoi Tour Operators"
  },
  "reviews": [
    {
      "name": "Ingie Marcho",
      "initials": "IM",
      "location": "Melbourne, Australia",
      "isAustralian": true,
      "tripType": null,
      "visitedDate": "March 2026",
      "rating": 5,
      "quote": "350-char-max review text...",
      "profileUrl": "https://www.tripadvisor.com/Profile/{slug}"
    }
    // ... 5 more
  ]
}
```

---

## Firecrawl scrape recipe

WebFetch is blocked by TripAdvisor (Cloudflare 403). Always use Firecrawl with stealth proxy.

### One-shot scrape (markdown extraction)

```js
mcp__claude_ai_firecrawl__firecrawl_scrape({
  url: "https://www.tripadvisor.com/Attraction_Review-g293924-d29687552-Reviews-My_Viva_Tour-Hanoi.html",
  formats: ["markdown"],
  proxy: "stealth",
  waitFor: 12000,
  onlyMainContent: true,
  location: { country: "US", languages: ["en"] }
})
```

Returns ~75KB markdown. Output is too large for direct context — save to file then parse.

### Why JSON schema extraction often fails

TripAdvisor is heavy SPA. Direct `formats: ["json"]` with schema returns empty/null because Firecrawl's LLM extraction runs before JS rendering completes. Markdown + manual regex parsing is more reliable.

---

## Manual extraction patterns (from markdown)

After running Firecrawl scrape and saving to `/tmp/ta-decoded.md`:

### Rating

```bash
grep -oE "[0-9]+\.[0-9]\s+of\s+5\s+bubbles" /tmp/ta-decoded.md | head -1
# Output: "5.0 of 5 bubbles" → rating = "5.0"
```

### Review count

```bash
grep -oE "\([0-9,]+\s+reviews\)" /tmp/ta-decoded.md | head -1
# Output: "(230 reviews)" → count = 230
```

### Award

```bash
grep -B 1 -A 3 -i "Travelers'\|Travellers'" /tmp/ta-decoded.md
# Look for "Travelers' Choice" + year on next line
```

### Ranking

```bash
grep -oE "#[0-9]+ of [0-9]+ [A-Za-z][^]]*" /tmp/ta-decoded.md | head -1
# Output: "#47 of 852 Boat Tours & Water Sports in Hanoi"
# Extract: position=47, outOf=852, topPercent=ceil(47/852*100)=6
```

### Reviewer profile links

```bash
grep -nE "Profile/" /tmp/ta-decoded.md
# Each result is line: [Name](https://www.tripadvisor.com/Profile/{slug})
# Pattern: \[([^\]]+)\]\(https://[^/]+/Profile/([^)]+)\)
```

### Review text blocks

After each profile link, the structure is:
```
[Name](Profile/...)

X contributions

5 of 5 bubbles

{review text — multiple paragraphs}

Read more

[Review of: My Viva Tour](...)

Visited {Month Year}
```

Quote = text between `5 of 5 bubbles` and `Read more`. Trim to 350 chars max.

### Reviewer location detection (Australian)

Australian reviewers appear with location like `Melbourne, Australia1 contribution`. Detect via regex:

```js
const isAustralian = (loc) => {
  if (!loc) return false;
  const s = loc.toLowerCase();
  return /\baustralia\b|\bsydney\b|\bmelbourne\b|\bbrisbane\b|\badelaide\b|\bperth\b|\bcanberra\b|\bdarwin\b|\bhobart\b|\bgold coast\b|\bnew south wales\b|\bvictoria\b|\bqueensland\b/.test(s);
};
```

---

## n8n workflow (`workflows/scrape-tripadvisor-reviews.json`)

### Node sequence

1. **Schedule Trigger** — cron `0 9 * * 1` (every Monday 9am)
2. **HTTP Request → Firecrawl** — POST to `api.firecrawl.dev/v1/scrape` with stealth proxy
3. **Code Node "Pick 6 + Format JSON"** — filters quality reviews, picks 1 Aussie + 5 recent, trims quotes, formats to schema
4. **HTTP Request → GitHub** — GET current `data/tripadvisor-reviews.json` SHA
5. **Code Node "Prepare Commit Payload"** — base64-encode new content, compare with existing (skip if unchanged), prepare commit message
6. **IF Node "Skip if Unchanged"** — branch on `skipped` flag
7. **HTTP Request → GitHub PUT** — commit updated JSON to `main` branch
8. **Code Nodes** — log success / no-change

### Required credentials

| Credential | Type | Value |
|---|---|---|
| Firecrawl API Key | HTTP Header Auth | `Authorization: Bearer fc-{key}` from firecrawl.dev/app/api-keys |
| GitHub PAT | HTTP Header Auth | `Authorization: Bearer ghp_{token}` with `repo:contents` scope on Minh090506/MVTLandingpage |

### Quality filter logic (in Code node)

```js
const quality = data.reviews.filter(r =>
  r.rating === 5 &&
  r.text && r.text.length >= 80 && r.text.length <= 600 &&
  r.name && r.name.length >= 2
);

const aussie = quality.find(r => isAustralian(r.location));
const nonAussie = quality.filter(r => r !== aussie).slice(0, aussie ? 5 : 6);
const picked = aussie ? [aussie, ...nonAussie] : nonAussie;
```

### Quote trimming

```js
const trimQuote = (text) => {
  if (text.length <= 350) return text.trim();
  const cut = text.slice(0, 350);
  const lastSentence = Math.max(cut.lastIndexOf('.'), cut.lastIndexOf('!'), cut.lastIndexOf('?'));
  return lastSentence > 200 ? cut.slice(0, lastSentence + 1).trim() : cut.trim() + '...';
};
```

---

## Build-time injection (`build.js` function `injectTripAdvisorData`)

Reads `data/tripadvisor-reviews.json` + replaces marker block in HTML:

```js
const reviewsBlock = `<!-- TA-REVIEWS-START — auto-injected by build.js from data/tripadvisor-reviews.json -->
<div class="ta-reviews-grid">
${cardsHtml}
</div>
<!-- TA-REVIEWS-END -->`;

result = html.replace(
  /<!-- TA-REVIEWS-START[\s\S]*?<!-- TA-REVIEWS-END -->/,
  reviewsBlock
);
```

### Inline token replacement

```js
const tokens = {
  TA_RATING: data.rating?.value ?? '5.0',
  TA_COUNT: String(data.rating?.count ?? 230),
  TA_AWARD_YEAR: String(data.award?.year ?? 2026),
  TA_RANK_POS: String(data.ranking?.position ?? 47),
  TA_RANK_TOTAL: String(data.ranking?.outOf ?? 852),
  TA_RANK_PERCENT: String(data.ranking?.topPercent ?? 6),
};

for (const [token, value] of Object.entries(tokens)) {
  const regex = new RegExp(`<!--${token}-->[\\s\\S]*?<!--/${token}-->`, 'g');
  result = result.replace(regex, `<!--${token}-->${value}<!--/${token}-->`);
}
```

Use tokens in HTML like:
```html
<p>Showing 6 of <!--TA_COUNT-->230<!--/TA_COUNT--> reviews</p>
```

### Graceful fallback

If JSON is missing or malformed, `injectTripAdvisorData()` logs a warning and returns html unchanged. Page renders with hardcoded fallback content. Never crashes the build.

---

## Card render template

```js
const renderCard = (r) => {
  const featured = r.isAustralian ? ' featured' : '';
  const subtitle = r.isAustralian
    ? `📍 ${escapeHtml(r.location)} · Visited ${escapeHtml(r.visitedDate)}`
    : `${escapeHtml(r.location)} · Visited ${escapeHtml(r.visitedDate)}`;
  return `<article class="ta-review-card${featured}">
    <div class="ta-review-header">
      <div class="ta-reviewer">
        <div class="ta-avatar" aria-hidden="true">${escapeHtml(r.initials)}</div>
        <div>
          <strong>${escapeHtml(r.name)}</strong>
          <small>${subtitle}</small>
        </div>
      </div>
      <span class="ta-stars" aria-label="${r.rating} out of 5 stars">★★★★★</span>
    </div>
    <blockquote class="ta-review-body">
      <q>${escapeHtml(r.quote)}</q>
    </blockquote>
    <a class="ta-review-source" href="${escapeHtml(r.profileUrl)}" target="_blank" rel="noopener">View on TripAdvisor →</a>
  </article>`;
};
```

`escapeHtml` is critical — quotes contain user-generated text including emojis, special chars, accented names.

---

## CSS for TripAdvisor section

Brand colors: green `#00aa6c` (TA brand), gold `#D4AF37` (MVT brand).

### Featured card distinguishing styles

```css
.ta-review-card.featured {
    border: 2px solid #00aa6c;
    background: linear-gradient(135deg, #fff 0%, #f0fdf4 100%);
    position: relative;
}

.ta-review-card.featured::before {
    content: '🇦🇺 Australian Reviewer';
    position: absolute;
    top: -10px;
    right: 12px;
    background: #00aa6c;
    color: white;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.25rem 0.65rem;
    border-radius: 999px;
}
```

### Trust badge layout (use flex, not grid — for natural baseline alignment)

```css
.ta-badge-content {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 1rem 1.25rem;
}
```

Grid `auto 1fr auto auto` causes vertical alignment issues with mixed-height children (logo block vs ranking text). Flex baseline is cleaner.

### Award badge sizing (proportional)

```css
.ta-award {
    gap: 0.4rem;
    padding: 0.35rem 0.6rem;       /* compact */
    background: linear-gradient(135deg, #fff5d6 0%, #ffe9a8 100%);
    border: 1px solid #d4af37;
    border-radius: 8px;
    line-height: 1.1;
}
.ta-award strong { font-size: 0.65rem; }   /* "TRAVELLERS' CHOICE" label */
.ta-award small  { font-size: 0.75rem; }   /* "2026" year */
```

Award is supplementary — should NOT be visually dominant over the rating number.

---

## Schema.org integration

Add to `TouristTrip` JSON-LD block:

```json
"aggregateRating": {
  "@type": "AggregateRating",
  "ratingValue": "5.0",
  "bestRating": "5",
  "worstRating": "1",
  "ratingCount": "230",
  "reviewCount": "230",
  "url": "https://www.tripadvisor.com/Attraction_Review-g293924-d29687552-Reviews-My_Viva_Tour-Hanoi.html"
},
"award": "Tripadvisor Travellers' Choice 2026"
```

The `url` field tells Google the rating source. Required for verifiability — Google may flag fake structured data without it.

---

## Common issues

| Issue | Cause | Fix |
|---|---|---|
| Firecrawl JSON returns empty | TA SPA renders after Firecrawl extracts | Use `formats: ["markdown"]` + waitFor: 12000 + manual regex |
| Stealth proxy timeout | TA blocks data center IPs aggressively | Increase `waitFor` to 15000+, retry 2-3× with backoff |
| Reviews look duplicated | Same review pulled multiple times in markdown | Dedupe by `profileUrl` + first 100 chars of quote |
| n8n commit fails 422 | SHA mismatch (someone edited JSON manually) | Re-run "Get Current SHA" node |
| Featured card not Aussie | Filter regex doesn't match new city | Add city to `isAustralian()` regex (e.g., new emerging tier-2 AU cities) |
| Build inject silently skips | Marker comment got stripped/edited | Verify `<!-- TA-REVIEWS-START -->` exact match in HTML |

---

## Manual override workflow

If user wants to pin specific reviews (e.g., a glowing review from a celebrity):

1. Disable n8n workflow temporarily (or extend it with a `pinned: true` flag check)
2. Edit `data/tripadvisor-reviews.json` directly
3. Add `_pinned: true` to the manually-curated reviews
4. Modify n8n "Pick 6 + Format JSON" code to always include pinned reviews and only fill remaining slots with auto-picked

Currently the workflow does NOT support pinning — adding it requires ~10 lines in the Code node.
