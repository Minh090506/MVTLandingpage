# Tour Data Summary — Happy Tours Multi-Tour LP

Scraped from myvivatour.com (2026-05-17). All 3 tours have full itinerary, inclusions, hotel upgrade options.

---

## 💕 HONEYMOON — VBR12 "Beach Relaxing Holiday"

- **Source**: https://myvivatour.com/tour/beach-relaxing-holiday-12-days/
- **Duration**: 12 Days / 11 Nights
- **Tour-ID**: VBR12
- **USD price**: $890 (sale, was $950)
- **LP-AUD price**: **$1,899 (sale from $2,199)** — all-inclusive incl. AU flights
- **Destinations**: Hanoi → Halong (overnight cruise) → Ninh Binh → Hanoi → Phu Quoc (3 nights) → Ho Chi Minh → Mekong → departure
- **Themes**: Cuisine, Beach, Local signature, culture, relaxation, discovery
- **LP positioning**: Beach + cruise + romance combo (Halong overnight + Phu Quoc island days = perfect honeymoon)

### Itinerary (12 days)
1. Hanoi arrival
2. Hanoi → Halong Bay (overnight cruise, L+D on board)
3. Halong → Ninh Binh
4. Ninh Binh sights (Hoa Lu, Mua Cave, Trang An boat) → back to Hanoi
5. Hanoi city tour (Tran Quoc pagoda, Ho Chi Minh complex, Old Quarter cyclo)
6. Hanoi → Phu Quoc (flight)
7. Phu Quoc 4-Island speedboat tour (Coral Garden, May Rut, Gam Ghi, Fingernail Island)
8. Phu Quoc leisure (couples spa, beach time)
9. Phu Quoc → Ho Chi Minh (flight)
10. HCM City tour + Cu Chi Tunnels
11. HCM → Mekong Delta day trip
12. HCM departure

### Inclusions (per source)
- Government tax + 24/7 support
- Entrance tickets · English guide · all transfers
- Meals as per itinerary (B/L/D notations)
- Hotel accommodation
- All internal flights (7kg carry-on + 20kg checked)

### Hotel upgrades
- 3★ included · 4★ +$200 · 5★ +$490 (USD)

### Tour style upgrades
- Regular group included · Small group +$100 · Private +$220 (USD)

---

## 👨‍👩‍👧 FAMILY — VNF7 "Best of Northern Vietnam"

- **Source**: https://myvivatour.com/tour/the-best-of-northern-vietnam-6-days/
- **Duration**: 7 Days / 6 Nights
- **Tour-ID**: VNF7
- **USD price**: $399 (sale, was $520)
- **LP-AUD price**: **$1,699 (sale from $1,999)** — all-inclusive incl. AU flights
- **Destinations**: Hanoi → Halong (Lan Ha Bay overnight cruise) → Sapa (Fansipan + Cat Cat village) → Hanoi
- **Themes**: culture, discovery, scenic
- **LP positioning**: Active family adventure — cruise + cable car + ethnic village experiences kid-friendly

### Itinerary (7 days)
1. Hanoi arrival
2. Hanoi → Halong / Lan Ha Bay (overnight cruise, L+D on board)
3. Halong → back to Hanoi
4. Hanoi → Sapa (limousine, scenic mountain drive)
5. Sapa: Fansipan cable car ("Roof of Indochina") + Cat Cat ethnic village trek
6. Sapa → Hanoi (limousine)
7. Hanoi departure

### Inclusions
Same structure as VBR12 minus internal flights (only car/limo transfers)

### Hotel upgrades
- 3★ included · 4★ +$110 · 5★ +$280 (USD)

### Tour upgrades
- Group included · Private +$80 (USD)

### Tour highlights (from source)
- Fansipan cable car to "Roof of Indochina"
- Ethnic minority villages + local markets
- Northern cuisine
- Culture + nature + adventure mix

---

## ✨ LUXURY CRUISE — VLU10 "Luxury & Unique Vietnam"

- **Source**: https://myvivatour.com/tour/luxury-unique-vietnam-10-days/
- **Duration**: 10 Days / 9 Nights
- **Tour-ID**: VLU10
- **USD price**: $999 (sale, was $1,550) — biggest savings of the 3
- **LP-AUD price**: **$2,999 (sale from $3,499)** — all-inclusive incl. AU flights
- **Destinations**: Hanoi → Halong overnight cruise → Hoi An (3 nights) → Ho Chi Minh → Mekong → departure
- **Themes**: Cuisine, Beach, Local signature, History, culture, relaxation, discovery
- **LP positioning**: Premium curated journey — handpicked luxury resorts + Halong overnight + leisure days

### Itinerary (10 days)
1. Hanoi arrival
2. Hanoi → Halong / Lan Ha Bay overnight cruise (L+D on board)
3. Halong → Pearl Farm Village → back to Hanoi
4. Hanoi city tour → flight to Hoi An (via Da Nang)
5. Hoi An: My Son Sanctuary + rice paper workshop + Thu Bon River boat
6. Hoi An leisure (Old Town shopping, beach)
7. Hoi An → Ho Chi Minh (flight)
8. HCM City tour + Cu Chi Tunnels
9. HCM → Mekong Delta (My Tho, Vinh Trang pagoda, orchards, honey tea & coconut candy)
10. HCM departure

### Inclusions
Same baseline + all internal flights

### Hotel upgrades
- **4&5★ combination INCLUDED** (premium baseline)
- 5★ luxury hotel +$200 (USD)

### Tour upgrades
- Small group (7-15 ppl) included · Private +$100 (USD)

### Tour highlights (from source)
- Luxury accommodation throughout
- Small group only (premium feel)
- Overnight Halong Bay cruise
- Balanced luxury / culture / nature / relaxation

---

## Cross-tour shared destinations (for compare table + Why MVT section)

| Destination | Honeymoon (VBR12) | Family (VNF7) | Luxury (VLU10) |
|---|---|---|---|
| Hanoi | ✓ (2 nights) | ✓ (2 nights) | ✓ (2 nights) |
| Halong Bay overnight cruise | ✓ | ✓ | ✓ |
| Ninh Binh | ✓ | — | — |
| Sapa | — | ✓ | — |
| Hoi An | — | — | ✓ (3 nights) |
| Hue | — | — | (no) |
| Phu Quoc | ✓ (3 nights) | — | — |
| Ho Chi Minh | ✓ (3 nights) | — | ✓ (3 nights) |
| Mekong Delta | ✓ | — | ✓ |
| Cu Chi Tunnels | ✓ | — | ✓ |
| My Son Sanctuary | — | — | ✓ |

**All 3 share Halong Bay overnight cruise** — strong shared visual asset (use `Cruise_HaLong_*.webp` series from Drive).

---

## Image strategy (for build)

### Reuse from existing Supabase (escape page images, already CDN-cached)

- `hero-halong-cruise.jpg` → main hero of happytours
- `dest-hanoi.jpg`, `dest-halong.jpg`, `dest-hoian.jpg`, `dest-hcm.jpg`, `dest-mekong.jpg` → destination references
- `gallery-*.jpg` (existing 8 shots) → reuse for tour section galleries

### Upload from Drive (new — high priority)

- **Phu Quoc 3-5 photos** → Honeymoon hero + section gallery
- **Sapa 2-3 photos** → Family section
- **Emily and James from Australia.jpg** → Honeymoon featured testimonial
- **The Tan Family from Malaysia.jpg** → Family featured testimonial
- **The Sharma Family from India.jpg** → Family supporting testimonial
- **Luxury hotel/spa interior** if available → Luxury Cruise section

Total new uploads: ~10-12 images.

---

## Customer testimonial mapping

| Tour section | Featured customer (real photo from Drive) |
|---|---|
| Honeymoon | Emily and James from Australia |
| Family | The Tan Family from Malaysia |
| Luxury Cruise | (use TripAdvisor reviewers from existing data) |

Plus shared TripAdvisor section reuses existing 6 reviewers (incl. Aussie Ingie Marcho).

---

## Open follow-up

- VLU10 has $400+ price drop ($1,550 → $999 USD) → strong "limited time" angle. Consider a small "★ Lowest price ever" pill on the luxury card.
- All 3 share Halong overnight cruise → shared video asset (existing `3ASbxKprZSc` works).
- AU flights need to be added to all baselines (sources are land-only prices). Already factored into LP prices above.
