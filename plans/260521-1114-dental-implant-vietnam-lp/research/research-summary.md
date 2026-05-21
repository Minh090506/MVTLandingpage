# Research Summary — Dental Implant Vietnam LP

**Source:** vietnamdentaltravel.com (scraped 2026-05-21) + master research doc on Drive (`VDT – Nghiên Cứu Implant 2026`)

## 1. Product/Service Reality

### Implant brands offered (only 3 — NOT Nobel Biocare)
- **Straumann** (Switzerland) — premium, SLActive surface, 6-week healing, lifetime warranty
- **Dentium** (USA/Korea) — mid-premium, FDA approved
- **DIO** (South Korea) — published-price brand, value tier

### Pricing (AUD, single tooth, published on VDT site)
| Crown | Implant only | + Crown |
|---|---|---|
| Titanium Porcelain | AUD 1,000 | **AUD 1,220** ← entry |
| Cercon Full-Ceramic | 1,000 | 1,360 |
| Cercon HT | 1,000 | 1,510 |
| Lava Plus 3M | 1,000 | 2,090 |

### All-on-4 / All-on-6 (per jaw, AUD)
- All-on-4 no bar: **8,240** | with bar: **13,260**
- All-on-6 no bar: **11,480** | with bar: **16,580**
- vs Australia all-on-4: AUD 25,000–35,000 → **save AUD 17–26k per jaw**

## 2. USPs (5 pillars)
1. **Worry-Free Guarantee** — flights, airport pickup, hotel, appointments arranged
2. **Top Hanoi Medical University dentists** (Assoc. Professors, PhDs)
3. **Exceptional English-speaking care** — "Not just care. Family-level support."
4. **Int'l standards + 70% lower** — GENORAY 3D CBCT, Herident Dental Clinic partner, MoH certified
5. **24/7 support** — even after returning home

## 3. Doctor team
- Do Quang Trung (Assoc. Prof, PhD — Implantology)
- Dang Trieu Hung (PhD — Oral Surgery)
- Nguyen Thanh Huyen (PhD — Restorative)
- Tran Minh Thinh (Second-Level Specialist — Perio + Implants)
- Do Thi Ha, Hoang Dinh Phuc, Le Ngoc Son (supporting team)

## 4. Real testimonials (5 published smile stories)
1. **Paul Logue (AU)** — 2 implants + 5 ceramic crowns + bridge, 2 weeks/6 visits, ★★★★★ Google review, returned 6mo later
2. **Karen Rooke (62, AU nurse)** — full mouth, 14 days/8 sessions, solo trip on her birthday
3. **Swan Couple** — couple's joint dental + Hanoi adventure
4. **Garry Stanton Matthew (63, Bangkok)** — convert skeptic→believer day 1
5. **Wendy Merrington** — warmth/laughter journey

## 5. Address & contact
- 49/134/173 Hoang Hoa Tham, Ba Dinh District, Hanoi
- WhatsApp: +84 974036614
- Email: info@myvivatour.com
- Socials: IG @vietnamdentaltravel, TikTok, YouTube @VietnamDentalTravel

## 6. Competitor positioning
| Rival | Type | Weakness vs VDT |
|---|---|---|
| Dental Departures | Marketplace | No travel support, no case management |
| DentaVacation / MTC | US broker | Generic, not VN-specialist, quote-only |
| SmileJet | AU agency | AU-based, no in-country team |
| Picasso Dental | AU agency | Same — broker without Hanoi presence |

**VDT-only edge:** in-country Hanoi team + full travel coordination + transparent pricing.

## 7. Audit of existing LP (`pages/vietnamdentaltravel/dental-implants-vietnam/index.html`, 2,519 lines, last edit Apr 14)

### Wrong/outdated (MUST fix)
- ❌ Hero "From $700" → should be **AUD 1,220** (or USD $800)
- ❌ Trust badge "Straumann & Nobel Biocare" → drop Nobel, use Straumann/Dentium/DIO
- ❌ "100K+ Australians" claim → unsupported; downgrade to "500+ international patients"
- ❌ Schema price `"700"` → `"1220"`
- ❌ FAQ pricing answer `$700 AUD` → fix
- ❌ Cost compare table `$700 AUD` row

### Already correct (keep)
- ✓ Multi-section structure (Hero, Social Proof, Calculator, Compare, Timeline, Brands, Clinics, Team, Testimonials, Patients, Safety, FAQ, Booking)
- ✓ GTM/GA4/FB Pixel + Schema.org
- ✓ Mobile responsive CSS
- ✓ Canonical `https://implant.vietnamdentaltravel.com`
- ✓ 36 images already in `pages/vietnamdentaltravel/dental-implants-vietnam/images/`

### Missing (SHOULD add)
- Real doctor names + credentials
- Real testimonial quotes (Paul Logue verbatim Google review)
- Real Hanoi address
- All-on-4/6 dedicated pricing
- 9-step process timeline (matches research doc)
- "Not just care. Family-level support." tagline
- Worry-Free Guarantee + lifetime warranty messaging

## 8. Drive image inventory
- Folder: `Tư liệu Landing Page` → `Implant`, `Crown`, `CSVC` (facilities), `Đội ngũ bác sĩ` (doctors), `Khách hàng` (patients), `Banner 1920x743`, `Video clip`, `Bảng giá VDT`
- Repo already has 36 webp images (clinic-treatment-*, csvc-*, doctor-team, implant-*, real-patient-1..6, patient-happy-1..4, sterilization-*, hero-banner, logo-color) — sufficient for v1, no Drive download needed.
