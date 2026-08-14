---
title: "Google Ads campaigns pointing at the 3 landing pages"
description: "Plan to route paid search traffic into escape/happytours/dental LPs so MVT Landing Form Submit can finally record gclid-attributable conversions."
status: pending
priority: P2
effort: ~6h human work in Ads UI, spread over 3 sessions
branch: main
tags: [google-ads, tracking, landing-pages, conversion, money-gate]
created: 2026-08-13
---

# Google Ads campaigns → 3 landing pages

**PLAN ONLY.** Nothing in this plan may be executed until Minh approves every money figure in
`phase-04`. No repo file changes are proposed — this is entirely Ads-UI + GTM/GA4 configuration work.

## Why

`MVT Landing Form Submit` shows 0.00 conversions not because the tag is broken but because Google Ads
only records what it can attribute to a `gclid`, and the single live campaign `AU_10May` points at the
main website, never at an LP
(`plans/reports/from-nt1-prompt2-260813-1358-ga4-ads-meta-number-reconciliation-report.md:63`).
Fix = ads that land on the LPs.

## Hard constraints (violating any = stop)

- Every monetary figure is a **proposal with a range**. Minh approves personally. No exceptions.
- **Do not touch `AU_10May`** (Search, 4.5M VND/day, budget-limited).
- **Do not raise the GA4-imported `form_submit` action back to Primary** — demoted 2026-08-13 on purpose.
- **Do not loosen the live `/api/lead` rate limits.** Flag, monitor, escalate — never widen.
- Ads live in child account **`806-163-1566 My Viva Tour`** (the spender), not the MCC `572-470-7852`.

## Quyết định Minh đã chốt (260813-1615) — KHÔNG bàn lại

- **Ngân sách là TIỀN THÊM**, không rút từ `AU_10May`. Lý do giữ: `AU_10May` đang *Limited by budget* và
  đang sinh toàn bộ conversion của tài khoản; rút bớt = bóp nghẹt thứ duy nhất đang chạy được để nuôi thứ
  chưa chứng minh. ⇒ phase 04 câu hỏi "additional or reallocated" đã **đóng = additional**.
- **Campaign dental đặt trong `806-163-1566`** (phương án A của phase 01), KHÔNG mở tài khoản con riêng.
  Lý do giữ: trang dental bắn **đúng cùng** conversion label `AW-17709107883/Wq0ECKXBmfsbEKuVrvxB`
  (verify 260813: dental ×1, escape ×2, happytours ×2) — tách tài khoản sẽ tạo phụ thuộc tracking chéo
  tài khoản, hoặc buộc sửa code trang để tạo label riêng.

**Vẫn CHỜ Minh:** mọi con số tiền cụ thể (3 ngân sách/ngày, trần Max CPC, target CPA, trần chi tháng +
ngày review). Phase 00 phải đo `AU_10May` (clicks, avg CPC thật) TRƯỚC khi chốt số.

## Phases

| # | Phase | Status | Blocked by | Gate |
|---|---|---|---|---|
| 00 | [Pre-flight verification in the Ads/GTM UI](phase-00-preflight-account-verification.md) | pending | — | read-only |
| 01 | [Account & campaign structure](phase-01-account-and-campaign-structure.md) | pending | 00 | — |
| 01b | [**Runbook: sửa + bật campaign escape có sẵn**](phase-01b-escape-existing-campaign-fix-and-enable-runbook.md) | **ready** | — | Minh duyệt 260814 |
| 02 | [Campaign→LP→keyword→URL mapping + UTM](phase-02-campaign-lp-keyword-url-mapping.md) | pending | 01 | — |
| 03 | [Double-counting audit of conversion actions](phase-03-conversion-double-counting-audit.md) | pending | 00 | **must pass before launch** |
| 04 | [Budget / bid / geo proposals (ranges)](phase-04-budget-bid-geo-proposals.md) | pending | 00, 02 | **MINH APPROVES MONEY** |
| 05 | [Launch + 24h verification checklist](phase-05-launch-and-24h-verification.md) | pending | 03, 04 | — |
| 06 | [Rate-limit & capacity risk register](phase-06-rate-limit-and-capacity-risk.md) | pending | — | monitoring only |

Phase 00 and 06 are read-only and can start immediately. 03 runs in parallel with 01/02.
Nothing spends money until 04 is signed off.

## Dependencies outside this plan

- Open question #3 in the reconciliation report (Meta pixel `579298288600609` ownership) is unrelated to
  Google Ads and does **not** block launch.
- Open question #4 (`AW-16765482840` firing on LPs via the GA4↔Ads link) **does** interact — see phase 03.

## Acceptance criteria

1. Three Search campaigns exist in `806-163-1566`, Enabled, Final URLs = the three canonical LP roots only.
2. Campaign-specific conversion goal on each = `MVT Landing Form Submit` and nothing else; GA4-imported
   action still Secondary; phase-03 inventory table filled in with no unexpected Primary action.
3. Ads reports Clicks > 0 on each campaign within 24h of launch.
4. `marketing_leads` rows arriving from LP hosts carry a non-null `gclid` for ad-sourced sessions.
5. `AU_10May` daily spend and impression share unchanged (±10%) vs the 7 days before launch.
6. Zero 429s on `/api/lead` in Cloudflare analytics for the first 7 days.

Note on (3)/(4): at current LP volume (142 GA4 events / 28 days) a **conversion** inside 24h is not a
realistic success criterion. Leading indicators only. See phase 05.

## Rollback

Pause the three new campaigns. Because every conversion setting is campaign-scoped (phase 03), pausing
restores the pre-launch state exactly, with no effect on `AU_10May` or on account-level goals.
