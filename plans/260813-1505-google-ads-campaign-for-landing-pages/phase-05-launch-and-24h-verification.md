# Phase 05 — Launch + 24-hour verification checklist

**Priority:** P1 · **Status:** pending · **Blocked by:** phase 03 (gate passed), phase 04 (money approved)

## Set expectations first

At the current LP volume, **a conversion inside 24 hours is not a realistic success criterion.** The
24h checks below are all *leading indicators* — they prove the plumbing carries a `gclid` end to end.
"0 conversions at T+24h" is an expected reading, not a failure. The conversion check has its own,
longer horizon (T+7d / T+30d at the bottom).

## T-0 — before enabling

- [ ] L1. Campaign-specific conversion goal on each campaign = **only** `MVT Landing Form Submit`
      (phase 03).
- [ ] L2. Budgets exactly as approved in phase 04. Screenshot the approval alongside the entered value.
- [ ] L3. Location targeting = Australia, option **Presence**, Vietnam excluded, Search Partners and
      Display **off** (phase 04 P4).
- [ ] L4. Final URLs are the three canonical roots (or a canonical root + `#fragment`) and nothing else
      (phase 02).
- [ ] L5. Auto-tagging confirmed ON (phase 00 A2).
- [ ] L6. Final URL suffix set per campaign, five UTM keys only (phase 02).
- [ ] L7. Record `AU_10May`'s last-7-day daily spend and impression share as the baseline for check V8.

## T+0 to T+1h — page-side proof, costs nothing

- [ ] **V1. `gclid` survives to the page and into the DB.**
      Open `https://escape.myvivatour.com/?gclid=TEST_MANUAL_260814&utm_source=google&utm_medium=cpc&utm_campaign=lp_escape_search_au`
      → console `mvtAttribution()` must show `gclid: 'TEST_MANUAL_260814'` plus the three UTM values
      (`worker-modules/lead-attribution-client.js:48` reads `window.location.search`).
      Submit a QA lead → the `marketing_leads` row must carry that `gclid`. Repeat for happytours and
      the dental host.
      *This does not create an Ads conversion — a fake gclid is not attributable. It proves the page
      half of the chain, which is the half that can be tested for free.*

- [ ] **V2. Prove the 301 trap is real and that no ad points at it.**
      `curl -sI 'https://escape.myvivatour.com/honeymoon?gclid=TRAP'` → the `Location` header comes back
      **without** the query string (`build.js:443-452`). Then re-confirm no ad's Final URL matches any
      redirect path or cross-host path. This check exists so the trap stays documented and nobody
      "helpfully" points an ad at `/honeymoon` next quarter.

- [ ] **V3. Fragment deep links.** After the first real click on an AG_Honeymoon / AG_Family /
      AG_LuxuryCruise ad, confirm the landed URL contains `?gclid=…` **before** the `#tour-*` fragment.
      If parameters land after the fragment (or are dropped), switch those ad groups to the plain
      canonical root — risk R3 in phase 02.

## T+24h — account-side

- [ ] **V4. Clicks recorded.** Each new campaign shows Impressions > 0 and Clicks > 0. Zero impressions
      after 24h means the Max CPC cap is too low or the campaign is still in review — diagnose before
      raising any budget.
- [ ] **V5. Where the clicks came from.** Campaign → Locations report: AU only, no Vietnam, no "interest"
      spillover. Catches a mis-set location option on day 1 instead of day 30.
- [ ] **V6. `gclid` in real lead rows.** Query Supabase `marketing_leads` for rows created since launch,
      grouped by `page_host`, counting rows with non-null `gclid`. Any ad-sourced lead with a null
      `gclid` means a redirect or a stripped parameter — go back to V2.
- [ ] **V7. GA4 per-host read.** Open the saved exploration **`LP - 3 landing page (loc theo hostname)`**
      (GA4 → Khám phá, account `myvivatourvn@gmail.com` = `authuser=2`; segment filters hostname to the
      three LPs — `docs/mvt-tracking-spec.md:231-244`). Add *Session source / medium*; expect
      `google / cpc` rows to appear. **Remember the property timezone lags ICT**
      (`docs/mvt-tracking-spec.md:246`) — a launch-evening click may report on the previous day.
- [ ] **V8. `AU_10May` not harmed.** Its daily spend and impression share within ±10% of the L7 baseline.
      A drop means the new campaigns are cannibalising the auction (phase 02 risk R2) → revisit keyword
      de-confliction, do not "fix" it by editing `AU_10May`.
- [ ] **V9. No `429`s.** Cloudflare analytics, both zones, `POST /api/lead` → zero blocked requests
      (phase 06).
- [ ] **V10. No unexpected conversion action attributed.** Ads → Campaigns → segment by Conversion
      action. Only `MVT Landing Form Submit` may appear under the LP campaigns. A `Whatsapp` /
      `TechSol - *` row appearing here means the campaign-specific goal was not applied — pause and fix
      before spending another day (phase 03 M1).

## T+7d / T+30d — the conversion check

- [ ] C1. `MVT Landing Form Submit` status moves off *"Chưa ghi nhận / Đang chờ"* to actively recording.
- [ ] C2. Conversions in Ads reconcile with lead rows: `count(marketing_leads where gclid is not null)`
      per host ≈ Ads conversions per campaign, allowing for the 90-day click window and for leads that
      convert days after the click.
- [ ] C3. Re-confirm the GA4-imported action is **still Secondary** — a standing weekly check
      (phase 03 M2).
- [ ] C4. Re-derive avg CPC and lead rate from real data; replace the phase 04 FORECAST table with
      measurements and revisit budgets with Minh.

## Rollback

Pause the three `LP_*` campaigns. Nothing shared was mutated (no account-level goal, no conversion
action, no GTM tag, no repo file), so pausing returns the system to its pre-launch state. If V10 fails,
pause **immediately** — a mis-attributed conversion feeding a bid strategy compounds daily.

## Success criteria (measurable)

| Criterion | Measured by | Threshold |
|---|---|---|
| Clicks flowing | Ads campaign report | > 0 per campaign at T+24h |
| `gclid` reaches the DB | Supabase `marketing_leads.gclid` | ≥ 1 non-null ad-sourced row within 7 days |
| No conversion pollution | Ads segment by conversion action | exactly 1 action attributed |
| `AU_10May` unharmed | daily spend + impression share | within ±10% of baseline |
| Edge stable | Cloudflare 429 count on `/api/lead` | 0 |
