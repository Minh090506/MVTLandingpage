# Brainstorm — LP Content Strategy + Positioning

## Target audience
**Primary:** Australians 45–70, missing 1–full mouth of teeth, comparing AU dental quotes (AUD 4,500–8,000/tooth) against dental tourism options. Pain: cost shock, fear of "cheap = risky" overseas.
**Secondary:** US/Canada (English speakers), UK, expats in SEA.

## Core message (one-liner)
> **"Straumann-grade dental implants in Hanoi from AUD 1,220 — placed by Hanoi Medical University professors, with full travel concierge and a worry-free lifetime warranty."**

## Positioning (vs 4 competitor archetypes)
| Rival angle | Their pitch | Our counter |
|---|---|---|
| Marketplace (Dental Departures) | "Cheapest listing" | "We're the clinic, not a directory — one number, one team, one accountability." |
| US broker (DentaVacation) | "Find a clinic abroad" | "We're Vietnam specialists, in-country team in Hanoi, not a referrer in Texas." |
| AU agency (SmileJet, Picasso) | "Australian company helps you find Vietnam dentist" | "Skip the middleman. Talk directly to your dentist's team, English-speaking, in Hanoi." |
| Bargain clinics ($150 implants) | "Lowest price" | "Genuine Straumann/Dentium/DIO + Assoc. Prof surgeons. Bargain implants fail — we last." |

## CRO levers to deploy
1. **Specific anchor price (not "from $X")** — "AUD 1,220 — DIO + Titanium Crown, all in" beats "from $700"
2. **Savings calculator** with travel costs baked in — show "net AUD 6,000+ saved after flights"
3. **Real Google review embed** (Paul Logue) — beats generic "100K+ patients"
4. **Doctor-first social proof** — Assoc. Prof + PhD credentials matter for medical procedure
5. **Risk reversal** — Lifetime warranty + 24/7 post-care + remedial-treatment-included-if-needed
6. **WhatsApp-first CTA** — Asian patient flow expects WhatsApp, not Calendly
7. **X-ray upload micro-CTA** — low-commitment lead capture vs full booking form

## Section plan (final, 12 sections)
1. **Sticky header** — Logo · Pricing · Doctors · Reviews · FAQ · [WhatsApp + Free Quote CTA]
2. **Hero** — "Your Dream Smile in Vietnam · Save up to 80% on Dental Implants" + AUD 1,220 anchor + 2 CTAs
   - 4 stats: "AUD 1,220 from" · "3 brands" · "500+ patients" · "Lifetime warranty"
   - Trust badges: ✓ Hanoi Medical University · ✓ Straumann/Dentium/DIO · ✓ Lifetime warranty · ✓ English support
3. **Social proof bar** — "Trusted by patients from 🇦🇺 🇺🇸 🇨🇦 🇬🇧 🇳🇿" + 4 number tiles
4. **Savings calculator** — interactive: # implants × brand → vs AU/US/UK cost, "net savings after flights"
5. **Transparent pricing tables** — Tab: [Single] [All-on-4] [All-on-6] [Multi-unit] with real published AUD prices
6. **3 implant brand cards** — Straumann (premium) · Dentium (mid) · DIO (value) — drop Nobel
7. **9-step journey timeline** — Before travel (1-3) · In Hanoi (4-8) · After returning (9)
8. **Doctor team** — 4 cards: Assoc. Prof Do Quang Trung + 3 PhDs with photos
9. **Facilities** — Herident Clinic partnership, GENORAY 3D CBCT, sterilization gallery
10. **Testimonials** — 5 real stories: Paul Logue (verbatim Google review highlighted) + Karen + Swan + Garry + Wendy
11. **FAQ** — 10 Qs from research doc (safety, cost, duration, brands, insurance, warranty, holiday combine, all-on-4, what's included, how to start)
12. **Booking section** — WhatsApp button + form (Web3Forms) + clinic address + 24/7 contact

## Tagline candidates (test in hero subtitle)
- ✓ **"Not just care. Family-level support."** (existing VDT brand line)
- "Save thousands. Smile for a lifetime."
- "Premium implants. Hanoi prices."

## Mobile-first principles
- WhatsApp sticky float (always visible)
- Sticky mobile CTA bar (bottom): "AUD 1,220 → Free Quote in 24h"
- Compress hero stats from 4 → 2 on small screens
- Calculator → single column with native pickers
- Tables → horizontal scroll OR card-stack on <768px

## Trust architecture priority order
1. Real doctor credentials with photos (medical procedure = trust > price)
2. Genuine Google review screenshots (Paul Logue verbatim)
3. Lifetime warranty + Worry-Free Guarantee badge
4. Clinic certifications (Vietnam MoH, ISO)
5. Specific patient counts ("500+ international", not "100K+")
6. Physical address visible (49/134/173 Hoang Hoa Tham, Ba Dinh, Hanoi)

## Conversion event tracking (already wired)
- GTM: `GTM-TPQWV864`
- GA4: `G-LKDCCNJMP3`
- Google Ads conversion: `AW-17709107883/Wq0ECKXBmfsbEKuVrvxB`
- FB Pixel: `579298288600609`
- Events to fire: `form_submit_lead`, `whatsapp_click`, `phone_click`, `calculator_used`, `xray_upload`

## Open questions (defer until v1 ships)
- Want Vietnamese version (multi-lang) or English-only? — assume EN-only for v1
- Need separate page for All-on-4 or one combined LP? — combined for v1, split later if traffic warrants
- Embed real Google reviews via API or static quote? — static quote for v1 (faster, no API key needed)
