# Plan — Dental Implant Vietnam Landing Page

**Date:** 2026-05-21
**Branch:** main
**Status:** Awaiting user approval
**Domain target:** `implant.vietnamdentaltravel.com` (subdomain of master brand, easy DNS via existing CF Workers)

## Context links
- Research: [research/research-summary.md](research/research-summary.md)
- Brainstorm: [research/brainstorm-lp-content-strategy-and-positioning.md](research/brainstorm-lp-content-strategy-and-positioning.md)
- Current LP: `pages/vietnamdentaltravel/dental-implants-vietnam/index.html` (2,519 lines, Apr 14 — needs content refresh)
- Master research doc: Google Drive `VDT – Nghiên Cứu Implant 2026`

## Recommended domain (RFC for user approval)

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **implant.vietnamdentaltravel.com** ⭐ | Brand consistency, canonical already in code, free subdomain on existing CF zone | "implant" tech-sounding | **PICK** |
| dentalvietnam.com.au | Memorable, .au geo signal | Needs new registration, splits SEO | Future v2 |
| vietnamdentaldeals.com | Clear value | Sounds bargain, weaker brand | Skip |
| myvivatour.com/dental-implants | Reuse existing | Mixed brand (tour ≠ dental) | Skip |

**Decision:** Ship under `implant.vietnamdentaltravel.com` first. Reserve `dentalvietnam.com.au` later if Google Ads campaign proves the niche.

## Architecture

Reuse existing `pages/vietnamdentaltravel/dental-implants-vietnam/index.html` (don't rewrite — fix gaps).
Register with `build.js` PAGES_CONFIG for serving via the same `worker.js` pipeline (no separate `worker-dental.js`).

```
pages/vietnamdentaltravel/dental-implants-vietnam/index.html
  → build.js (add config)
  → worker.js
  → CF Workers route: implant.vietnamdentaltravel.com/* → /vietnamdentaltravel/dental-implants-vietnam
```

## Phases

| Phase | File | Goal | Status |
|---|---|---|---|
| 01 | [phase-01-content-refresh-pricing-doctors-testimonials.md](phase-01-content-refresh-pricing-doctors-testimonials.md) | Fix wrong claims (price, brands, doctors, testimonials) | pending |
| 02 | [phase-02-build-integration-worker-config-and-routing.md](phase-02-build-integration-worker-config-and-routing.md) | Register in build.js, add HOST_DEFAULTS for subdomain | pending |
| 03 | [phase-03-deploy-cloudflare-workers-and-dns-route.md](phase-03-deploy-cloudflare-workers-and-dns-route.md) | Deploy to CF, configure DNS, smoke test | pending |

## Key changes summary (vs current LP)

| Section | Current (wrong) | Fix to |
|---|---|---|
| Hero subtitle | "$700 — Save 70%" | "from AUD 1,220 — Save up to 80%" |
| Hero stat 1 | "From $700 AUD per implant" | "AUD 1,220 from · DIO + Titanium Crown" |
| Hero stat 3 | "100K+ Happy patients" | "500+ International patients" |
| Trust badge | "Straumann & Nobel Biocare" | "Straumann · Dentium · DIO" |
| Schema price | `"700"` | `"1220"` |
| Social proof H2 | "Why 100K+ Australians" | "Trusted by patients from AU, US, CA, UK, NZ" |
| FAQ price answer | "from $700 AUD" | "from AUD 1,220 (USD 800)" |
| Cost table row | "$700 AUD" | "AUD 1,220" |
| Brand cards | Mentions Nobel | Replace Nobel card with Dentium |
| Doctor names | Generic / missing | 4 real cards (Do Quang Trung Assoc. Prof, + 3 PhDs) |
| Testimonials | Generic | 5 real (Paul Logue verbatim Google review) |
| Address | "Ho Chi Minh City & Hanoi" | "49/134/173 Hoang Hoa Tham, Ba Dinh, Hanoi" |
| Tagline | None | "Not just care. Family-level support." |

## Success criteria (Definition of Done)
- [ ] All `$700` references replaced with `AUD 1,220` (or context-appropriate AUD price)
- [ ] "Nobel Biocare" mentions removed (real brands: Straumann · Dentium · DIO)
- [ ] Real doctor names + credentials shown in team section
- [ ] At least 3 real testimonial quotes (Paul Logue must be verbatim from Google review)
- [ ] Real Hanoi address in footer + contact section
- [ ] `build.js` PAGES_CONFIG includes dental entry, generates valid `worker.js`
- [ ] `HOST_DEFAULTS` maps `implant.vietnamdentaltravel.com` → dental page
- [ ] `node build.js` runs without error, worker.js produced
- [ ] Mobile-test on iPhone SE viewport (375×667) — no overflow, sticky CTAs visible
- [ ] All-on-4/All-on-6 pricing present
- [ ] Schema.org JSON-LD validates (Product price = 1220, FAQ updated)

## Risk register
| Risk | Mitigation |
|---|---|
| Subdomain DNS not yet pointing to CF | Phase 03 documents required DNS step (CNAME → workers.dev or zone routing) |
| Worker.js size grows past CF 1MB free limit | Current escape+happytours+dental should still be < 600KB combined; monitor |
| Conflict with existing `worker-dental.js` | Phase 02 deletes the obsolete standalone worker after unifying into main `worker.js` |
| User has different domain preference | Phase 02 parameterizes the host map so swap is one-line |
