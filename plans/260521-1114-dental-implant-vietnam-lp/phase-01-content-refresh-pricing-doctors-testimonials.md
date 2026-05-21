# Phase 01 — Content Refresh: Pricing, Doctors, Brands, Testimonials

**Priority:** P0 — blocks deploy
**Status:** pending
**Owner:** main session
**Est:** 60–90 min

## Goal
Update `pages/vietnamdentaltravel/dental-implants-vietnam/index.html` (2,519 lines) so every fact-checkable claim matches the live website + master research doc. NO structural rewrite — only edits in place.

## Files to modify
- `pages/vietnamdentaltravel/dental-implants-vietnam/index.html` (single file, surgical edits)

## Edit checklist

### A. SEO + Schema (head, lines 8–193)
- [ ] Title: `Dental Implants Vietnam 2026 | Save up to 80% vs Australia — From AUD 1,220`
- [ ] Meta description: rewrite around AUD 1,220 anchor + Straumann/Dentium/DIO + lifetime warranty
- [ ] `og:title` + `og:description` + `twitter:*` — mirror above
- [ ] Product schema `"price": "700"` → `"1220"`
- [ ] FAQ schema Q1 answer: replace `$700 AUD` with `AUD 1,220 (USD 800)`
- [ ] FAQ schema Q2 brands: drop Nobel Biocare; list only Straumann · Dentium · DIO
- [ ] Add LocalBusiness schema with real address `49/134/173 Hoang Hoa Tham, Ba Dinh District, Hanoi`

### B. Hero (lines ~1414–1465)
- [ ] H1: keep `Your Dream Smile in Vietnam`
- [ ] Subtitle: `World-class dental implants from AUD 1,220 — Save up to 80% vs Australia`
- [ ] Stat 1: `AUD 1,220` / `DIO + Titanium Crown`
- [ ] Stat 2: `97%+` / `Implant success rate` (qualifier "industry standard")
- [ ] Stat 3: `500+` / `International patients`
- [ ] Stat 4: `Lifetime` / `Implant warranty`
- [ ] Trust badges: `✓ Hanoi Medical University surgeons`, `✓ Straumann · Dentium · DIO`, `✓ Lifetime warranty`, `✓ 24/7 English support`

### C. Social proof (lines ~1468–1502)
- [ ] H2: `Trusted by patients from Australia, USA, Canada, UK & New Zealand`
- [ ] Card 1: `500+` patients (not 100K+)
- [ ] Card 2: `Up to 80%` savings
- [ ] Card 3: `97%+` success rate
- [ ] Card 4: `4.9/5` Google reviews (keep)

### D. Calculator section
- [ ] Default Australia price for single implant: AUD 5,500 (industry mid-range)
- [ ] Vietnam price: AUD 1,510 (Cercon HT — mid tier, realistic)
- [ ] Add "After flights & 5 nights hotel" toggle showing AUD 1,500 deduction
- [ ] Display net savings prominently

### E. Pricing comparison table
- [ ] Single Implant row 1: `AUD 1,220` (DIO Titanium) vs Australia `AUD 4,500-5,500`
- [ ] Single Implant row 2: `AUD 1,510` (DIO Cercon HT) vs Australia `AUD 5,000-6,000`
- [ ] Single Implant row 3: `AUD 2,090` (DIO Lava Plus) vs Australia `AUD 6,000-7,500`
- [ ] Add new tab `All-on-4`: AUD 8,240 (no bar) / AUD 13,260 (with bar) per jaw
- [ ] Add new tab `All-on-6`: AUD 11,480 / AUD 16,580 per jaw

### F. Brand cards (3 only)
- [ ] **Straumann (Switzerland)** — SLActive, 6-week healing, lifetime warranty, complex cases
- [ ] **Dentium (USA/Korea)** — FDA approved, mid-premium, standard cases
- [ ] **DIO (South Korea)** — Published price brand, value tier, AUD 1,220 entry
- [ ] DELETE any Nobel Biocare card/mention

### G. Doctor team section
Replace generic placeholders with 4 real cards:
- [ ] **Dr. Do Quang Trung** — Associate Professor, PhD · Implantology & Prosthetics · Hanoi Medical University
- [ ] **Dr. Dang Trieu Hung** — PhD · Oral Surgery & Implants
- [ ] **Dr. Nguyen Thanh Huyen** — PhD · Restorative Dentistry
- [ ] **Dr. Tran Minh Thinh** — Second-Level Specialist · Periodontics & Implants
- [ ] Use `images/doctor-team.webp` for group photo

### H. Process timeline (9 steps from research doc)
**Before travel:** 1) Free online consult (24h response), 2) Treatment plan + travel coord, 3) Visa + flight support
**In Hanoi:** 4) Welcome + 3D CBCT, 5) Prep treatment (if needed), 6) Implant placement (1-2h), 7) Healing 3-6mo (Straumann 6 weeks), 8) Crown fitting (CAD/CAM)
**After:** 9) 24/7 aftercare + lifetime warranty

### I. Testimonials (5 real stories)
- [ ] **Paul Logue (AU)** — verbatim Google quote: `"I could not be more satisfied with the entire experience. The implants were placed with great care, the ceramic crowns looked incredibly natural, and the bridge fit perfectly. Extremely affordable compared with prices back in Australia."` Treatment: 2 implants + 5 ceramic crowns + bridge, 2 weeks/6 visits
- [ ] **Karen Rooke (62, AU nurse)** — quote about solo trip on her birthday, 14 days/8 sessions, fear of needles
- [ ] **Swan Couple** — couple's joint dental + Hanoi adventure
- [ ] **Garry Stanton Matthew (63, Bangkok)** — convert skeptic→believer day 1
- [ ] **Wendy Merrington** — warmth/laughter journey
- [ ] Use `images/real-patient-1.webp` ... `real-patient-5.webp` (already present)

### J. FAQ (10 questions from research doc)
- [ ] Q1 Safety: Hanoi Medical Uni affiliation + genuine brand materials
- [ ] Q2 Cost 2026: from AUD 1,220 (USD 800) — 70-80% less than AU
- [ ] Q3 How long stay: 3-5 days first visit; return 3-6mo for crown (Straumann 6 weeks)
- [ ] Q4 Brand choice: Straumann (complex/fast) · Dentium (mid) · DIO (value)
- [ ] Q5 AU insurance: extras cover may reimburse; we provide invoices (mention HCF/Bupa/MBF/Medibank — past patients)
- [ ] Q6 Aftercare: Worry-Free Guarantee, lifetime warranty, remedial treatment in VN if needed
- [ ] Q7 Combine with holiday: MyVivaTour sister brand offers Hanoi tours
- [ ] Q8 All-on-4 pricing: AUD 8,240–13,260 per jaw
- [ ] Q9 What's included: consult + 3D CBCT + implant + abutment + crown + airport transfer
- [ ] Q10 How to start: WhatsApp/email X-rays, 24h response

### K. Booking section + footer
- [ ] Address line: `49/134/173 Hoang Hoa Tham, Ba Dinh District, Hanoi, Vietnam`
- [ ] WhatsApp: `+84 974 036 614` (verify `wa.me/84974036614` link)
- [ ] Email: `info@myvivatour.com`
- [ ] Tagline: `Not just care. Family-level support.` (subtitle under address)
- [ ] Web3Forms key: `cf0ca620-d064-4640-9454-afb27d588f67` (verify already in form)

## Implementation approach
Use `Edit` tool for each section (don't rewrite whole file). Group edits by region of file (top-down: head → hero → social proof → calculator → pricing → brands → doctors → timeline → testimonials → FAQ → footer).

## Success criteria
- [ ] `grep "700\b\|nobel\|Nobel\|100K\|100,000" pages/vietnamdentaltravel/dental-implants-vietnam/index.html` returns 0 hits
- [ ] All 4 doctor names appear: `Do Quang Trung`, `Dang Trieu Hung`, `Nguyen Thanh Huyen`, `Tran Minh Thinh`
- [ ] Paul Logue verbatim quote present
- [ ] Hanoi address present
- [ ] All-on-4 + All-on-6 pricing tables present
- [ ] HTML parses (no broken tags) — verify via `node -e "require('fs').readFileSync(...)"` length + tag balance

## Risks
- Massive edit volume → break HTML structure → use small targeted Edits, never `replace_all` on common strings
- 2,519 line file → some edits may not have unique `old_string` → include 2-3 surrounding lines for context
