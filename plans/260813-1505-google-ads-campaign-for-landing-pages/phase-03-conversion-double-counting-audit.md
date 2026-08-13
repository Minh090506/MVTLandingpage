# Phase 03 — Double-counting audit (gate: must pass before launch)

**Priority:** P1 · **Status:** pending · **Blocked by:** phase 00 (C, D, E) · **Blocks:** phase 05

Goal: enumerate **every** conversion action that could land in the new campaigns' `Conversions` column,
and prove that only one of them should. Today all counters read 0, so a double-count is invisible; it
becomes visible — and starts steering Smart Bidding — the moment ad traffic arrives. Audit now.

## Inventory — fill from phase 00 C1/D1/E1, then decide

| # | Conversion action | Source | Fires on LP hosts? | Optimisation | Verdict |
|---|---|---|---|---|---|
| 1 | `MVT Landing Form Submit` | gtag `AW-17709107883/Wq0ECKXBmfsbEKuVrvxB` | **Yes** — verified in all 3 pages: `pages/escape/index.html:4597,4775`, `pages/happytours/index.html:5321,5662`, `pages/dental-implants-vietnam/index.html:2567` | Primary | **KEEP — the only intended conversion** |
| 2 | GA4-imported lead form submission (`form_submit`) | GA4 → Ads import | **Possibly** — see M2 below | Secondary (demoted 2026-08-13) | **MUST STAY SECONDARY** |
| 3 | `TechSol - Form_BookNow` | third-party GTM tag | ? — phase 00 D2/D3 | ? | Must be excluded from LP campaigns |
| 4 | `TechSol - Whatsapp` | third-party GTM tag | **Likely** — see M1 | ? | Must be excluded from LP campaigns |
| 5 | `Whatsapp` | third-party | Likely (same mechanism) | ? | Must be excluded |
| 6 | `Form_Contact` | third-party | ? | ? | Must be excluded |
| 7 | `Email` | third-party | ? | ? | Must be excluded |
| 8 | Anything owned by `AW-16765482840` | arrives via the GA4↔Ads link, **not** in LP source | **Yes** — observed firing `page_view` on `happytours.myvivatour.com` (reconciliation report §4) | Unknown account | Cannot be controlled from here — see M3 |

Rows 1 and 8 are verified by direct evidence. Rows 2–7 are hypotheses with named mechanisms; phase 00
turns each into a fact.

## The three mechanisms that would actually cause a double count

**M1 — WhatsApp float click counted as a conversion.**
All three LPs ship a floating WhatsApp button (`CLAUDE.md` → Bước 3 checklist), and the LPs load
container `GTM-KRFGX69D`. If a `TechSol - Whatsapp` / `Whatsapp` conversion tag in that container is
triggered by a click on a `wa.me` link **without a hostname condition**, every LP WhatsApp click becomes
a conversion in the new campaigns. Effect: conversion count inflated by a low-intent action, CPA looks
great, Smart Bidding later optimises toward people who tap WhatsApp and never submit a form.
*Check:* phase 00 D2/D3. *Fix:* mechanism below (campaign-specific goals) neutralises it regardless.

**M2 — GA4 enhanced measurement resurrects `form_submit` on the LPs.**
The GA4-imported action is built on `form_submit`. If GA4 Enhanced Measurement → *Form interactions* is
ON for the stream, GA4 auto-collects `form_submit` on the landing pages too — the same physical lead that
already fires the gtag conversion. Today this is harmless because the action is **Secondary** (Secondary
actions report into *All conversions*, not into *Conversions*, and never influence bidding). It becomes a
real double count the instant anyone promotes it back to Primary.
**Therefore: the GA4-imported action stays Secondary. This is a standing decision from 2026-08-13 and is
not open for re-litigation inside this plan.** It also matches `docs/mvt-tracking-spec.md:100` (chốt
260812: gtag is the single conversion source into Ads).
*If someone promotes it anyway:* every LP lead counts twice, reported CPA halves, Smart Bidding bids ~2×
too aggressively, and the error is invisible in the UI because both actions are named plausibly.

**M3 — a foreign Ads account (`AW-16765482840`) receives LP signal via the GA4↔Ads link.**
It fires on `happytours.myvivatour.com` and does not exist in the LP source, so it is not fixable by
editing the pages. It does not double-count *our* column, but it does mean an unknown party gets LP
conversion data. Out of scope to fix here; raised as reconciliation-report open question #4. Record, do
not act.

## Control mechanism — campaign-specific conversion goals

Set each new campaign's goal to **campaign-specific**, containing **only** `MVT Landing Form Submit`.

Why this and not "fix the account-level goals":
- Blast radius zero. Account-level goal edits would change how `AU_10May` reports and bids — forbidden.
- It neutralises M1 and rows 3–7 **without** touching any third-party conversion action, so nothing the
  third party owns breaks.
- Rollback is pausing the campaign; no shared setting was ever mutated.

Additionally verify (phase 00 C2) that `MVT Landing Form Submit` has **Count = One**. The design
deliberately shares one conversion label between the main form and the exit popup, separating them by
`form_id` (`docs/mvt-tracking-spec.md:98`) — with Count = Every, a visitor who submits both counts twice.
Changing Count is an account-wide setting → if it is currently `Every`, present it to Minh rather than
flipping it, because it also changes `AU_10May`'s historical reporting shape.

## Test matrix

| What | How | Pass |
|---|---|---|
| Only 1 action in each new campaign's goal set | Ads UI → campaign → Settings → Conversion goals | Exactly `MVT Landing Form Submit` |
| GA4-imported action still Secondary | Tools → Conversions | Secondary |
| WhatsApp click on an LP does **not** create a conversion | Click the float on a staging visit; watch Ads "All conversions" segmented by action after 24h | No third-party action attributed to an LP campaign |
| One lead ≠ two conversions | QA lead via main form, then a second QA lead via exit popup, from different sessions | Counts match submissions 1:1 |

## Rollback

Pause the three campaigns. No conversion action, account goal, GTM tag, or GA4 setting was modified by
this plan, so there is nothing else to revert.

## Risks

| Risk | L×I | Mitigation |
|---|---|---|
| Someone promotes the GA4 action to Primary "to get more conversion data" | Med × High | Documented here + in `docs/mvt-tracking-spec.md:100`; add to phase 05 weekly check |
| Third-party edits `GTM-KRFGX69D` after launch and adds an LP-firing conversion tag | Med × Med | Campaign-specific goals contain the damage; re-run phase 00 D1 monthly |
| Count = Every discovered only after spend | Low × High | Phase 00 C2 is blocking |
