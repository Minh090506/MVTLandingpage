# From NT2-docs → NT1 — T9 stale GTM docs + T9b CI test gate

**Date:** 2026-08-12  
**FIXED:** YES  
**Status:** DONE  
**Canonical harness report:** `.harness/reports/T9/T9-stale-gtm-id-docs-and-ci-test-gate-attempt-1.md`

## Root cause (short)

- Dead boilerplate GTM `GTM-TPQWV864` still lived in evergreen guides after live code moved to `GTM-KRFGX69D` → docs re-infected agents/humans.
- CI validate job never ran lead pipeline unit tests → green CI ≠ green lead tests.

## Diff inventory (file × change)

| File | Lines / locus | Change |
|---|---|---|
| `CLAUDE-CODE-PROMPTS.md` | ~5–12 | GTM-KRFGX69D + account/container numerics + verified 2026-08-12 |
| | ~30–45 | Prompt 1: GTM only for GA4; Ads gtag loader = AW |
| | ~251 | Checklist IDs verified live |
| `CONVERSION-TRACKING-GUIDE.md` | ~6–9, ~27, ~382+ | GTM + GA4-via-GTM + Ads loader notes |
| `GOOGLE-ADS-SETUP-PROMPTS.md` | 10, 13, 580 | GTM-KRFGX69D |
| `GOOGLE-ADS-ACTION-PLAN.md` | 44 | GTM-KRFGX69D |
| `SESSION-SUMMARY.md` | 26–30 | Tracking table corrected |
| `CAMPAIGN-MONITORING-GUIDE.html` | 101 | URL → accounts/6256769444/containers/261027424 |
| `docs/mvt-landingpage-project-overview.md` | 41, 63–65 | Overview + table |
| `skills/mvt-landingpage/SKILL.md` | 547–554 | Skill tracking checklist |
| `.github/workflows/validate.yml` | after Setup Node | Two test steps before validator/enforce |

## Acceptance

- Target evergreen files: **0** × `GTM-TPQWV864`
- `node scripts/test-lead-attribution-client.mjs` → **42 ok**, all passed
- `node scripts/test-lead-ingest-handler.mjs` → **32 ok**, all passed
- validate.yml: tests before gate; no deploy job changes

## Out of scope residual

worktrees / harness assignment text / index-v2 draft still mention old ID — intentional exclusions.
