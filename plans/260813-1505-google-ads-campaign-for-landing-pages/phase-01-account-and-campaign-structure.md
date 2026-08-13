# Phase 01 — Account & campaign structure

**Priority:** P1 · **Status:** pending · **Blocked by:** phase 00 (A1, A4)

## Decision 1 — which account holds the LP campaigns

`572-470-7852` is a **manager (MCC)**; MCCs cannot run campaigns. All three LP campaigns go in the
spending child **`806-163-1566 My Viva Tour`**. Not a judgement call, a structural fact.

## Decision 2 — dental: same account or its own?

`implant.vietnamdentaltravel.com` is a different zone **and** a different brand
(`CLAUDE.md` → Cấu trúc thư mục; `build.js:154`). Two options:

> **[ĐÃ CHỐT 260813 — Minh chọn A]**: dental nằm trong `806-163-1566`. Bảng so sánh dưới giữ lại làm hồ sơ lý do.

| | **A. Dental campaign inside `806-163-1566`** | **B. New child account under the MCC for VietnamDentalTravel** |
|---|---|---|
| Conversion action | `MVT Landing Form Submit` is already selectable | Needs cross-account conversion tracking, or a brand-new action + a new AW ID in the dental page |
| Setup cost | ~0 | New account, billing, tag decision, re-verify conversions |
| Data density | All LP conversion data pools in one account — matters enormously at 142 events/28d | Splits already-thin data across two accounts |
| Brand hygiene | Tour and dental search terms, negatives, audiences and auto-applied Recommendations share one surface | Clean separation |
| Handoff to a dental agency later | Painful (must migrate) | Trivial (grant access to one account) |
| Billing separation | None — one invoice | Separate invoice per brand |

**Recommendation: A now, B later.** Rationale: the dental page fires the *same* conversion label as the
tour pages — verified at `pages/dental-implants-vietnam/index.html:2567`
(`AW-17709107883/Wq0ECKXBmfsbEKuVrvxB`, identical to `pages/escape/index.html:4597` and
`pages/happytours/index.html:5321`). Option B therefore introduces a hard dependency on cross-account
conversion tracking; if that is misconfigured the dental campaign reports **zero conversions** and looks
exactly like today's bug. Not worth it while dental gets 17 GA4 events per 28 days.

**Trigger to move to B** (write it down now so the decision is not re-litigated): dental spend exceeds
~25% of total LP spend for two consecutive months, **or** dental is handed to an external agency,
**or** a dental-specific ad policy strike lands (healthcare policy) that would risk the tour account.

## Decision 3 — how many campaigns

`CLAUDE.md` → "Google Ads Campaign Setup" defines 4 campaign templates (Core, Destination, Long-tail,
Competitor) **per tour**. Applied literally to 3 LPs that is 12 campaigns.

**Deviation, deliberate:** collapse the 4 templates into 4 **ad groups** inside **one campaign per LP**.

- Why: 12 campaigns each need their own daily budget; splitting a test budget 12 ways means no campaign
  ever accumulates enough clicks to learn anything, and Google's daily-budget pacing wastes more at low
  budgets. One campaign per LP concentrates both budget and (eventually) conversion signal.
- The `CLAUDE.md` keyword tiers, negatives and ad-copy template are used **unchanged** — only the
  container changes from campaign to ad group.
- **Trigger to split back out to the documented 4-campaign shape:** a campaign is consistently
  "Limited by budget" *and* has ≥15 conversions/30 days. Until then, splitting is premature.

## Resulting structure

```
MCC 572-470-7852 (manager — no campaigns)
└── 806-163-1566 My Viva Tour  (spender, GMT+7)
    ├── AU_10May                      ← LIVE, DO NOT TOUCH (Search, main website)
    ├── LP_Escape_Search_AU           ← new
    │   ├── AG_Core            (Tier 1 keywords)
    │   ├── AG_Destination     (Tier 2)
    │   ├── AG_LongTail        (Tier 3)
    │   └── AG_Competitor      (Tier 4-ish, PAUSED at launch — see below)
    ├── LP_HappyTours_Search_AU       ← new
    │   ├── AG_Core · AG_Honeymoon · AG_Family · AG_LuxuryCruise
    └── LP_Dental_Search_AU           ← new
        ├── AG_Core · AG_CostCompare · AG_LongTail
```

Naming convention `LP_<Page>_<Type>_<Geo>` — the `LP_` prefix makes it trivial to filter LP campaigns
away from `AU_10May` in every report, and to write a one-line "pause all LP campaigns" rollback.

**Competitor ad group paused at launch.** Bidding on `intrepid vietnam tour alternative` etc. is the
lowest-intent, highest-CPC slice of the `CLAUDE.md` template; with a test-sized budget it consumes
spend that the Core group needs to gather conversion signal. Enable it only after the Core group has
proven CPA. This is a sequencing decision (80/20), not a scope cut — the keywords stay in the plan.

## Campaign type — Search only

No Performance Max, no Display, no Demand Gen at launch. PMax cannot be attributed cleanly, cannot be
keyword-controlled, and needs conversion history the account does not have for LPs. Revisit after
phase 05 shows a working conversion path.

## Files / artefacts owned by this phase

None in the repo. This phase produces Ads-UI objects only. No `pages/*`, `build.js`, or
`worker-modules/*` change is required or proposed anywhere in this plan.

## Risks

| Risk | L×I | Mitigation |
|---|---|---|
| Cross-account conversion tracking off, if option B is chosen anyway | Med × Critical | Option A avoids it entirely; if B is chosen, verify phase 00 A4 first |
| Dental healthcare ad policy disapproval affects the shared tour account's standing | Low × High | Keep dental in its own campaign so it can be paused independently; escalate to B on first strike |
| 3 new campaigns compete with `AU_10May` in the same auction | Med × Med | Phase 02 keyword de-confliction + phase 05 impression-share check |
