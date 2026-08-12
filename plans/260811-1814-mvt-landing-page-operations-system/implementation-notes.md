# Implementation notes — MVT Landing Page Operations System

Standing rules: log Decision / Deviation / Surprise as they happen during cook. No plan-IDs in code.

---

## Decision — `email_forwarded` after dual-send (T2b, 2026-08-12)

**Context:** Web3Forms free blocks server-side POSTs; CF Workers have no static IP. Email must leave the browser. Worker `/api/lead` is DB-only.

**Choice:** Omit `email_forwarded` from the insert payload entirely. Column historical meaning = "worker forwarded email to Web3Forms". That path is removed (`forwardLeadToEmail` deleted). New rows keep DB default (false/null).

**Not chosen:** Write `email_forwarded: true` always (would lie — worker does not know browser email outcome). Write `true` when dual-send "intended" (still a lie if Web3Forms fails).

**QA impact:** `docs/mvt-tracking-spec.md` §7 no longer selects/relies on `email_forwarded`. Verify inbox + Network tab (web3forms + `/api/lead`) instead.

## Decision — `/api/lead` status codes (T2b)

Client ignores `/api/lead` for form UX. Handler returns 200 only if Supabase insert succeeds; 502 on DB failure. No dual-sink fail-open (email is not a worker sink anymore).

## Decision — body limits (T2b)

`LEAD_MAX_BODY_BYTES = 32768`, `LEAD_MAX_BODY_KEYS = 40`. Content-Length pre-check + post-parse re-check. Over → 413. CF rate limit left as human ops.

## Decision — dual-send client (T2b)

`lead-attribution-client.js`: merge attribution → fire-and-forget `POST /api/lead` → `return nativeFetch(web3forms)` so page sees Web3Forms response. No await on lead path.
