# Phase 06 — Rate-limit & capacity risk register

**Priority:** P2 · **Status:** pending (monitoring only) · **Blocked by:** — · **Runs from launch onward**

> **This phase does not change any limit.** Loosening a rate limit is Minh's decision, made on evidence,
> not a side effect of turning ads on. The plan's job is to name the failure mode, bound its blast
> radius, and define the trigger that would put the question in front of Minh.

## What is live today

| Zone | Hosts | Live limit | Source |
|---|---|---|---|
| `myvivatour.com` | `escape.myvivatour.com`, `happytours.myvivatour.com` | **10 requests / 1 minute / IP** | verified in the Cloudflare dashboard 2026-08-13 by NT1 |
| `vietnamdentaltravel.com` | `implant.vietnamdentaltravel.com` | **3 requests / 10 seconds / IP** — the zone's free plan forces a 10s window | verified 2026-08-13 by NT1 |

The rule matches **`POST` + path `/api/lead`**, action Block → `429` at the edge
(`scripts/cloudflare-rate-limit-wizard.sh:257,265`).

**Documentation divergence to reconcile (not to "fix" by changing the limit):**
`scripts/cloudflare-rate-limit-wizard.sh:187-188,309` documents **10 req/min for both zones** as the
threshold Minh locked on 2026-08-12, but the dental zone is live at 3 req/10s because the free plan
cannot express a 60-second window. The wizard text should be corrected to match reality — a docs task,
outside this plan's scope. Recorded here so the next reader does not "restore" the wizard's number.

## Why ads make this matter

Ad traffic arrives in bursts and skews mobile. Australian mobile carriers put many subscribers behind
shared egress IPs (CGNAT), so a per-IP limit is effectively a per-carrier-segment limit. The dental
window is the tight one: **4 lead submissions from one shared IP within 10 seconds → the 4th is blocked.**
At 3/10s the limit is also brittle against a single user double-tapping submit plus a retry.

The landing-page HTML itself is **not** rate limited — the rule matches `POST /api/lead` only
(`scripts/cloudflare-rate-limit-wizard.sh:265`). Ad clicks therefore cannot be blocked from reaching the
page. Only the lead POST is exposed.

## Blast radius when the limit does fire — bounded, and smaller than it looks

Traced through the dual-send design (`docs/mvt-tracking-spec.md:116-119`, §5 at `:162`):

| Path | Blocked by the rate limit? | Outcome |
|---|---|---|
| Browser → **Web3Forms** (the email) | **No** — goes browser→Web3Forms directly, never through the Worker | Sales still receives the lead by email |
| Browser → **`/api/lead`** → Supabase | **Yes** — 429 at the edge | **Row missing from `marketing_leads`** |
| `gtag` conversion → Google Ads | **No** — client-side, independent of the Worker | Ads conversion still recorded |
| `fbq('track','Lead')` | **No** — client-side | Still recorded |
| Form success UI | **No** — the client decides success from the Web3Forms response only, never from `/api/lead`'s status (`docs/mvt-tracking-spec.md:162`) | Customer sees success; no visible breakage |

So the failure is **silent data loss in the analytics store**, not a lost customer and not a lost
conversion. That is the correct severity to plan around: it degrades measurement, not revenue — but
because it is silent, it needs an active detector rather than a complaint to surface it.

## Risk table

| # | Risk | Likelihood now | Likelihood at ad scale | Impact | Mitigation |
|---|---|---|---|---|---|
| RL1 | Dental 3 req/10s blocks a genuine lead POST | Low (17 events/28d) | **Medium** | Med — missing DB row, email + conversion survive | Detector D1/D2 below; escalate to Minh with data |
| RL2 | Shared CGNAT IP aggregates several real users | Low | Medium | Med — same as RL1 | Same |
| RL3 | Someone "fixes" a 429 by widening the limit without approval | Low | Low | **High** — reopens the abuse surface the limit was created for | This document; the limit is Minh's decision, full stop |
| RL4 | The wizard's documented 10/min is taken as truth and the dental rule is "corrected" to match | Medium | Medium | Med | Divergence recorded above |

## Detectors — set these up at launch, not after the first loss

- **D1. Cloudflare analytics**, both zones: count of blocked (`429`) requests on `POST /api/lead`,
  checked at T+24h (phase 05 V9) and then weekly. Expected value: **0**.
- **D2. Reconciliation**, weekly: per host, compare the number of lead emails in
  `info@myvivatour.com` against `count(*)` in `marketing_leads`. A persistent gap in the same direction
  (emails > rows) is the signature of rate-limit loss. This is the only detector that catches the failure
  when Cloudflare's analytics retention has already rolled over.
- **D3.** Spike watch: if a single campaign's clicks/day jumps by more than ~3× after a budget change,
  re-run D1 the next morning.

## Escalation trigger — the only condition under which the limit question goes to Minh

Any **one** of: a non-zero 429 count on `POST /api/lead` in any week · a D2 gap of ≥2 leads in a week ·
dental daily lead volume exceeding roughly 10/day.

At that point, present to Minh: the observed 429 count, the D2 gap, the affected host, and the options
(raise the threshold · widen the window · move the dental zone off the free plan so a 60s window becomes
expressible · leave as is and accept the loss). **Do not pre-select one.** Note that the third option
costs money and therefore is itself a money decision.

## Out of scope for this plan

Changing any Cloudflare rule, changing `LEAD_ALLOWED_HOSTS`
(`worker-modules/lead-ingest-handler.js:18-22`), or altering the body/key caps
(`worker-modules/lead-ingest-handler.js:25-26`). No repo file is modified by this plan.
