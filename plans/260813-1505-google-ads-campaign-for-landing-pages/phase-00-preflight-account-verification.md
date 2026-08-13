# Phase 00 — Pre-flight verification in the Ads / GTM / GA4 UI

**Priority:** P1 · **Status:** pending · **Blocks:** 01, 03, 04 · **Cost:** 0 (read-only)

Everything below is a *look, do not change* task. Each answer feeds a later phase. This phase exists
because the later phases would otherwise rest on assumptions, and three of the assumptions are the kind
that silently invert an entire campaign's economics.

## Context links

- `plans/reports/from-nt1-prompt2-260813-1358-ga4-ads-meta-number-reconciliation-report.md` §2, §4
- `docs/mvt-tracking-spec.md` §3 (conversion), §7b (per-host GA4 reading)

## Checklist — record every answer in this file before moving on

### A. Account & auto-tagging

- [ ] A1. Confirm ads will be created in child **`806-163-1566 My Viva Tour`**, not the MCC.
- [ ] A2. **Auto-tagging (`gclid`) is ON** in `806-163-1566` → Admin → Account settings → Auto-tagging.
      *If OFF, the entire plan fails silently — no gclid means no attributable conversion, which is the
      exact failure being fixed.* Record current state before changing anything; turning it on is a
      change to a live spending account → surface to Minh first.
- [ ] A3. Account currency + billing timezone. Report says **GMT+7**. Every daily-budget number is a
      GMT+7 day, while the audience is in Australia (AEST = GMT+10). Consequences in phase 04.
- [ ] A4. Is cross-account conversion tracking enabled (i.e. does `806` use manager-level conversion
      actions)? Both known actions sit at MCC level. If `806` is set to "this account's own
      conversions", the MCC actions will not be selectable → phase 01 option A breaks.

### B. Existing campaign `AU_10May` — read only, never edit

- [ ] B1. Export its **keyword list**. Needed to avoid auction self-competition (phase 02, risk R2).
- [ ] B2. Record its **avg CPC, clicks, impression share, lost IS (budget)** over the last 30 days.
      This is the only real CPC evidence available for this market/account. Phase 04's ranges must be
      re-anchored on it — the ranges written today are priors, not measurements.
- [ ] B3. Record its conversion-goal configuration (account-level vs campaign-specific). Do not change.

### C. Conversion actions — feeds phase 03

- [ ] C1. List **every** conversion action visible to `806-163-1566` (MCC-level + account-level),
      with: source, Primary/Secondary, **Count = One or Every**, attribution window, and whether it is
      included in the account default goal set.
- [ ] C2. For `MVT Landing Form Submit`: confirm **Count = One**. `docs/mvt-tracking-spec.md:98` states
      the design intent "one lead = one conversion" and deliberately shares one label between the main
      form and the exit popup, distinguishing them only by `form_id`. That intent only holds if Count is
      **One**; if it is **Every**, a visitor who submits both the main form and the exit popup produces
      2 conversions and Smart Bidding will chase the duplicate.
- [ ] C3. Confirm the GA4-imported lead action is still **Secondary** (demoted 2026-08-13).

### D. GTM container audit — the third-party tags

- [ ] D1. In GTM container `GTM-KRFGX69D` (the one all three LPs load), list every tag of type
      *Google Ads Conversion Tracking*. The 59.98 conversions in the account come from third-party-built
      actions (`TechSol - Form_BookNow`, `TechSol - Whatsapp`, `Whatsapp`, `Form_Contact`, `Email`).
- [ ] D2. For each such tag, read its **trigger**. Specifically: is there a WhatsApp-click conversion tag
      whose trigger is a click on a `wa.me` link? All three LPs ship a floating WhatsApp button, so such
      a trigger *will* fire on LP traffic. If it does and the action is Primary, the new campaigns will
      report WhatsApp clicks as conversions mixed in with real form leads. Phase 03 resolves it.
- [ ] D3. Check whether those tags are host-scoped (trigger condition on `Page Hostname`). If they are
      scoped to the main site only, risk drops to zero and phase 03 records that as verified.

### E. GA4 stream settings

- [ ] E1. Web stream → Enhanced measurement → is **Form interactions** ON? If ON, GA4 auto-collects a
      `form_submit` event on the landing pages, which is exactly the event the GA4-imported conversion
      action is built from. That is the mechanism by which the demoted action could start firing on LP
      leads *in addition to* the gtag action. Record the state; do not toggle.
- [ ] E2. Confirm the saved exploration `LP - 3 landing page (loc theo hostname)` still exists
      (`docs/mvt-tracking-spec.md:239`) — phase 05 depends on it.
- [ ] E3. GA4 ↔ Google Ads links: which Ads accounts are linked? Reconciliation report §4 shows
      `AW-16765482840` firing on `happytours.myvivatour.com` with no such ID in the LP source, i.e. it
      arrives via a link, not via code. Unknown account = unknown party receiving LP conversion signal.

## Exit criteria

Every box above ticked with a written answer. A1–A2 and C1–C2 are blocking; the rest can be recorded as
"unknown, risk accepted" with Minh's sign-off if a UI permission is missing.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Auto-tagging OFF (A2) | Low | Critical — plan produces 0 conversions again | Verify first, before any budget is set |
| Count = Every (C2) | Medium | High — inflated conversions, Smart Bidding chases duplicates | Fix to One *before* launch; it is a shared setting, so changing it touches `AU_10May`'s reporting too → Minh decides |
| No permission to read MCC conversion settings | Medium | Medium | Escalate to Minh; do not launch blind |
