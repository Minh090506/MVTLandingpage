# Phase 02 — Campaign → LP → keyword → destination URL mapping (+ UTM)

**Priority:** P1 · **Status:** pending · **Blocked by:** phase 01

## The one rule that decides whether this whole plan works

**Final URL must be one of exactly three canonical roots.** Any other host/path combination is served by
a 301 that rebuilds the `Location` header **without the query string**, which deletes the `gclid`:

- `build.js:443-452` — `REDIRECTS[pathname]` → `Location: <fixed URL>`, query dropped. Affects
  `/honeymoon`, `/family-tour`, `/luxury-cruise` (`build.js:155-157`).
- `build.js:457-466` — cross-host canonical guard → `` Location: `https://${canonicalHost}/` ``, query
  dropped. Fires whenever a known host serves another page's path.

A dropped `gclid` means the click cannot be attributed, which is the *exact* failure this plan exists to
fix. Traced: `worker-modules/lead-attribution-client.js:48` reads `window.location.search`, so if the
parameter never reaches the browser's address bar the lead row has `gclid = null` forever.

The three safe roots (verified against `build.js:152-154` + `build.js:383-387` — each resolves in-place
with **no** redirect, so the query survives):

| LP | Final URL | Why safe |
|---|---|---|
| escape | `https://escape.myvivatour.com/` | `PAGES_CONFIG.escape.path = '/'`, canonicalHost = same host → guard no-ops |
| happytours | `https://happytours.myvivatour.com/` | `HOST_DEFAULTS` rewrites `/` → `/happytours` *before* the guard (`build.js:396-398`) |
| dental | `https://implant.vietnamdentaltravel.com/` | same mechanism, `build.js:385` |

**Deep links into happytours sections** (`#tour-honeymoon`, `#tour-family`, `#tour-luxury`) are allowed
*as fragments on the canonical root* — Google inserts tracking parameters before the `#`. They are **not**
allowed as the `/honeymoon` style paths. Verify the fragment behaviour once on a live click (phase 05,
check V3) rather than trusting it.

## Mapping table

| Campaign | Ad group | LP / Final URL | Keyword group (source) | Match |
|---|---|---|---|---|
| `LP_Escape_Search_AU` | AG_Core | `https://escape.myvivatour.com/` | Tier 1: `vietnam tour from australia`, `vietnam holiday package`, `vietnam tours 2026`, `10 day vietnam tour`, `all inclusive vietnam tour`, `vietnam tour package australia` | Phrase + Exact |
| | AG_Destination | same | Tier 2: `ha long bay tour`, `halong bay cruise`, `hanoi tour`, `ho chi minh city tour`, `hoi an tour`, `mekong delta tour`, `cu chi tunnels tour`, `hue imperial city tour` | Phrase |
| | AG_LongTail | same | Tier 3: `vietnam tour packages from australia 2026`, `10 day vietnam tour with flights`, `all inclusive vietnam holiday from australia`, `guided vietnam tour with meals included`, `small group vietnam tour from australia` | Exact |
| | AG_Competitor *(paused at launch)* | same | `intrepid vietnam tour alternative`, `tripadeal vietnam`, `wendy wu tours vietnam`, `cheap vietnam tour with flights` | Phrase |
| `LP_HappyTours_Search_AU` | AG_Core | `https://happytours.myvivatour.com/` | `vietnam holiday packages`, `vietnam tour packages australia`, `vietnam group tour`, `vietnam travel package` | Phrase + Exact |
| | AG_Honeymoon | `https://happytours.myvivatour.com/#tour-honeymoon` | `vietnam honeymoon package`, `vietnam honeymoon tour from australia`, `romantic vietnam holiday` | Phrase + Exact |
| | AG_Family | `https://happytours.myvivatour.com/#tour-family` | `vietnam family tour`, `vietnam family holiday package`, `vietnam tour with kids` | Phrase + Exact |
| | AG_LuxuryCruise | `https://happytours.myvivatour.com/#tour-luxury` | `luxury vietnam tour`, `halong bay luxury cruise`, `vietnam cruise tour from australia` | Phrase + Exact |
| `LP_Dental_Search_AU` | AG_Core | `https://implant.vietnamdentaltravel.com/` | `dental implants vietnam`, `dental implant vietnam cost`, `vietnam dental clinic for australians` | Phrase + Exact |
| | AG_CostCompare | same | `dental implants cost australia vs vietnam`, `cheap dental implants overseas`, `affordable dental implants abroad` | Phrase |
| | AG_LongTail | same | `all on 4 dental implants vietnam price`, `full mouth dental implants vietnam from australia`, `dental tourism vietnam australian patients` | Exact |

**Dental keywords are new.** The `CLAUDE.md` SEO Keywords Database is tour-only; do not copy tour tiers
into the dental campaign. The Australian-English rules from that section still apply everywhere:
**"holiday" not "vacation"**, always include the **year**, include **"from Australia"**, and quote the
**AUD** price in ad copy (escape $2,099 AUD · happytours from $676 AUD · dental from AUD 1,220).

**Match types:** Phrase and Exact only at launch. Broad match without conversion history spends the test
budget on discovery; that is precisely the money that is supposed to buy conversion signal. Consistent
with the `CLAUDE.md` template, which already specifies Exact/Phrase.

## Negative keywords

Apply the `CLAUDE.md` shared list to all three campaigns:
`free, DIY, backpacker, visa application, embassy, volunteer, teach english, work in vietnam,
immigration, one way, booking.com, hostel, airbnb`

Add, specific to this build:

- **Cross-brand:** add `dental, implant, teeth, tooth, dentist, veneers` as negatives on the two tour
  campaigns; add `tour, holiday, cruise, halong, itinerary` as negatives on the dental campaign. Without
  this, "vietnam dental tour" style queries bounce between brands and the wrong LP gets the click.
- **Cannibalisation guard (R2):** after phase 00 B1 exports `AU_10May`'s keywords, any keyword present in
  both must be resolved — either removed from the LP campaign or removed from `AU_10May`… and
  **`AU_10May` must not be edited**, therefore: remove it from the LP campaign. Two campaigns in the same
  account bidding the same query do not both show; Google picks one and the other's data is diluted,
  while `AU_10May` is already "Limited by budget".
- **Brand terms:** `myvivatour`, `my viva tour` — decide once whether brand traffic belongs to
  `AU_10May` (main site) or an LP. Default: leave brand to `AU_10May`, negative it out of LP campaigns.

## UTM / tracking parameters

`gclid` (auto-tagging) is the **only** thing Google Ads uses to attribute a conversion. UTMs exist purely
so the row in `marketing_leads` and the GA4 report are human-readable. Do not rely on UTM for Ads
attribution and do not disable auto-tagging to "keep URLs clean".

Set a **campaign-level Final URL suffix** (not manual per-ad tags — DRY, one place to change):

```
utm_source=google&utm_medium=cpc&utm_campaign=lp_escape_search_au&utm_content={adgroupid}&utm_term={keyword}
```

…substituting `lp_happytours_search_au` / `lp_dental_search_au` per campaign.

Restricted to exactly these five keys on purpose: `worker-modules/lead-attribution-client.js:21-24`
captures `utm_source/medium/campaign/term/content` plus `gclid/fbclid/msclkid` and nothing else. Adding
`utm_matchtype` or `utm_device` would look fine in the URL and then vanish — the shared client does not
forward unknown keys, so those values would never reach `marketing_leads`.

Resulting live URL shape: `https://escape.myvivatour.com/?gclid=<auto>&utm_source=google&utm_medium=cpc&…`

## Success criteria

- Every ad's Final URL, when pasted into a browser with `?gclid=TEST` appended, returns **200 with the
  query intact** — not a 301.
- `mvtAttribution()` in the page console shows the `gclid` and all five UTM values.
- No keyword appears in both an LP campaign and `AU_10May`.

## Risks

| # | Risk | L×I | Mitigation |
|---|---|---|---|
| R1 | An ad is pointed at `/honeymoon` (or any cross-host path) and 301 strips the `gclid` | Med × Critical | Final-URL whitelist above; phase 05 check V2 actively probes for it |
| R2 | LP campaigns cannibalise budget-limited `AU_10May` | Med × High | Keyword de-confliction after phase 00 B1; impression-share check in phase 05 |
| R3 | Fragment-based deep links lose parameters on some ad formats | Low × Med | Verify on first real click; fall back to plain root URL if so |
| R4 | Dental campaign disapproved under healthcare policy | Med × Med | Independent campaign so it pauses alone; keep tour campaigns unaffected |
