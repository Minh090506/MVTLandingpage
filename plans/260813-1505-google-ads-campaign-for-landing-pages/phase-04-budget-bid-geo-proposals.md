# Phase 04 — Budget / bid / geo proposals

**Priority:** P1 · **Status:** pending — **AWAITING MINH'S APPROVAL** · **Blocked by:** phase 00 (A3, B2), phase 02

> **EVERY NUMBER ON THIS PAGE IS A PROPOSAL WITH A RANGE, NOT A DECISION.**
> Nothing here may be entered into Google Ads until Minh approves each figure individually.
> The account bills in **VND** and runs on **GMT+7**; AUD equivalents must be computed at the rate shown
> on the Ads billing screen on the day of approval — no exchange rate is fixed in this document.

## Evidence base — read this before reading any number

The only hard data available is:

- `AU_10May`: 30 days, 41,425 impressions, **132,224,738 VND** spend, 4.5M VND/day budget, status
  *Limited by budget* (reconciliation report §2). **Clicks and avg CPC were not captured** → phase 00 B2
  must fetch them, and **the ranges below must be re-anchored on that real CPC before approval.**
- LP traffic, 28 days: **142 GA4 events total** (happytours 66, escape 59, dental 17), `generate_lead` = 1.

142 events across three pages is not a sample. It cannot support a conversion-rate estimate, a CPA
target, or a revenue forecast. Anything downstream of it in this document is labelled **FORECAST** and
should be treated as a hypothesis to be replaced by measurement after ~30 days of real spend.

## P1 — Daily budget (proposal, per campaign, VND)

| Campaign | Proposed range /day | Rationale |
|---|---|---|
| `LP_Escape_Search_AU` | **500,000 – 1,500,000 VND** | Highest ticket ($2,099 AUD) and the most complete LP; needs enough clicks/day to reach ~15 conversions/30d, the threshold below which Smart Bidding cannot be enabled later |
| `LP_HappyTours_Search_AU` | **500,000 – 1,500,000 VND** | Broadest keyword surface (multi-tour, entry price $676 AUD) → more query variety to learn from; same learning-threshold logic |
| `LP_Dental_Search_AU` | **300,000 – 1,000,000 VND** | Different brand, unproven demand, 17 events/28d, and healthcare-policy risk → smallest stake until it proves out |
| **Total** | **1,300,000 – 4,000,000 VND/day** | Lower bound ≈ 29% of what `AU_10May` alone spends daily; upper bound ≈ 89% |

**[ĐÃ CHỐT 260813 — Minh: ADDITIONAL.** Không rút từ `AU_10May`. Câu hỏi dưới giữ lại làm ngữ cảnh lý do.]

**Decision Minh must make explicitly: is this budget ADDITIONAL, or reallocated from `AU_10May`?**
`AU_10May` is already *Limited by budget*, meaning it would spend more if allowed. Reallocating starves a
campaign that is currently the only thing producing the account's 59.98 conversions/30d. Recommendation:
**additional**, funded as a test, with a fixed review date. If it must be reallocated, propose starting
at the **lower** bound of each range.

Lower bound of the range is chosen so each campaign can still clear roughly 15–25 clicks/day at a
plausible CPC; below that the campaign gathers no signal and the money is wasted regardless of how small
the amount is. That is the real floor — a "cheap test" that is too small to learn from is 100% waste.

## P2 — Bid strategy (proposal)

**Launch with Manual CPC (enhanced off) or Maximise Clicks with a Max CPC cap. Not Target CPA, not
Maximise Conversions.** Reason: those strategies need conversion history; the campaigns start at zero and
Google's own guidance is ~15–30 conversions in 30 days before conversion-based bidding is stable. Starting
on tCPA with zero data produces erratic spend and unusable learnings.

| Setting | Proposed range | Rationale |
|---|---|---|
| Max CPC cap | **20,000 – 60,000 VND** | Must be re-derived from `AU_10May`'s actual avg CPC (phase 00 B2). AU travel search is a competitive auction against Intrepid / TripADeal / Wendy Wu (`CLAUDE.md` competitor table); too low a cap = no impressions at all, which looks like "the campaign doesn't work" |
| Switch to Maximise Conversions | **when ≥15 conversions / 30 days** on that campaign | Objective, measurable trigger — not a calendar date |

## P3 — Target CPA (proposal — cannot be a number yet)

A CPA target is only meaningful as:

```
max acceptable CPA = booking value × gross margin % × (lead → booking rate)
```

Two of the three inputs are unknown to this plan: **gross margin %** and **lead → booking rate**. Both are
Minh's business figures. Publishing a CPA number without them would be fabrication.

Illustrative arithmetic only, to show the shape of the answer — **not a proposal**: at $2,099 AUD, if
margin were 20% and 1 in 10 leads booked, the break-even CPA would be ~$42 AUD per lead; at 1 in 20 it
halves to ~$21. A factor-of-two swing on an unmeasured input. **Ask Minh for the two inputs; do not set a
tCPA before the first ~15 real conversions exist to check the assumption against.**

## P4 — Geo & language (no money — but decides who sees the ads)

| Setting | Proposal | Rationale |
|---|---|---|
| Locations | **Australia** only | LPs are AUD-priced, en-AU, AU-targeted (`CLAUDE.md`) |
| Location option | **"Presence: people in or regularly in your targeted locations"** — NOT "presence or interest" | Default is presence-or-interest, which serves ads to people *searching about* Australia from anywhere, including Vietnam. On a small test budget this is the single largest silent waste |
| Excluded locations | **Vietnam** (explicit) | Team/office traffic and local curiosity clicks; also prevents self-clicks from skewing a tiny sample |
| Language | English | |
| Networks | **Search only** — Search Partners OFF, Display Network OFF | Both default ON and both spend test budget on low-intent inventory that cannot be diagnosed at this volume |
| Ad schedule | All hours at launch | Do not guess. Collect 30 days, then cut hours on data |

**Timezone trap:** the account runs **GMT+7** but the audience is in Australia (AEST = GMT+10, AEDT =
GMT+11). A "daily budget" resets at midnight Vietnam time, which is 3–4am in Sydney — i.e. mid-morning
Australian browsing is on the *same* Ads day, but late-evening AU traffic (after 9–10pm AEST) rolls into
the *next* Ads day. Any ad-schedule rule written later must be entered in GMT+7 offsets, and any daily
report compared against GA4 must account for GA4's own reported skew
(`docs/mvt-tracking-spec.md:246`).

## P5 — FORECAST (explicitly labelled; built on almost no data)

Chain of assumptions, each of which can be wrong by 2× or more:

| Input | Assumed | Confidence |
|---|---|---|
| Avg CPC | 20,000 – 60,000 VND | **Low** — no LP-keyword CPC data exists; must be replaced by phase 00 B2 |
| Clicks/day at mid budget (~2.4M VND total) | 40 – 120 | derived, inherits the CPC uncertainty |
| LP lead conversion rate | 1% – 3% | **Very low confidence** — industry prior for travel lead forms; the observed data is a single `generate_lead` event |
| Leads / 30 days, all 3 LPs | **12 – 108** | the range spans nearly an order of magnitude, which is an honest reflection of the evidence |

Use this only to answer "is the test big enough to learn anything" (at the low end: barely; at the high
end: comfortably). **Do not use it to forecast revenue, and do not put it in front of anyone as a
projection.** Replace it with measured numbers after 30 days.

## Approval checklist for Minh

- [ ] Escape daily budget: ______ VND (proposed 500k – 1.5M)
- [ ] Happytours daily budget: ______ VND (proposed 500k – 1.5M)
- [ ] Dental daily budget: ______ VND (proposed 300k – 1M)
- [x] Additional budget, or reallocated from `AU_10May`? → **ADDITIONAL** (Minh chốt 260813)
- [ ] Max CPC cap: ______ VND (proposed 20k – 60k, re-anchor on phase 00 B2 first)
- [ ] Gross margin % and lead→booking rate, for a real CPA target: ______ / ______
- [ ] Total monthly test ceiling and the review date at which the test stops or scales: ______

## Risks

| Risk | L×I | Mitigation |
|---|---|---|
| Budget reallocated away from `AU_10May`, which currently produces all account conversions | Med × High | Explicit approval question above; phase 05 monitors `AU_10May` impression share |
| Location option left at "presence or interest" → VN/other traffic burns the test | **High** × High | Named as its own setting line; verify in phase 05 check V5 |
| Max CPC cap too low → ~0 impressions, test concludes "ads don't work" when nothing was tested | Med × High | Re-anchor on real CPC from phase 00 B2 before launch, not after |
| tCPA set from the illustrative example above | Low × High | Marked "not a proposal"; approval checklist requires the two real inputs |
