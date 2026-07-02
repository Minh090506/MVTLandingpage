# Smart Booking Form: Chips, Departure City, Bridge CTA

Pattern shipped to `escape.myvivatour.com` on **2026-05-16** (commits `3d18fa3` + `82c8e05`). Combines three CRO upgrades that work as a system — don't ship one without the others.

## Why this pattern

Old flow: hero had a 3-field quick form (Name/Email/Phone). Main booking form had Name/Email/Phone + generic textarea (`"Tell us about your dream Vietnam holiday..."`). Two problems:

1. **Split intent** — visitors filled the hero form (low-quality lead, no context) and never engaged with the main form. Hero form was capturing the easy clicks but leaking the rest.
2. **Vague leads** — sales team got blank or one-line messages → 3+ email round-trips before being able to quote → conversion lag.

New flow:

- Hero = **single pulsing CTA** scrolling to `#booking` (no form). One clear action.
- Main form = **chips + departure city + structured placeholder**. Low friction (one click per chip), high info value (sales gets segmentation data instantly).
- "Why Choose This Tour?" section relocated to **right before the form** with a **bridge CTA** at the end → value-stack lands at the commit moment, then chains straight into the form.

Measured impact (anecdotal — track properly via GA4 going forward): cleaner hero, longer time-on-page in pre-booking section, sales reports describe leads as "much easier to quote" because departure city + intent chips arrive on first message.

## Three coordinated changes

### 1. Single-CTA hero

```html
<button class="cta-button cta-button-hero" onclick="smoothScroll('booking')">
    Get My Free Vietnam Quote →
</button>
<p class="hero-cta-reassurance">
    🇦🇺 Free, no obligation · Reply within 2 hours · Trusted by 500+ Australian travellers
</p>
```

```css
/* Pulsing gold glow draws attention to single CTA */
.cta-button-hero {
    font-size: 1.15rem;
    padding: 1rem 2.25rem;
    margin-top: 0.5rem;
    box-shadow: 0 10px 28px rgba(212, 175, 55, 0.4);
    animation: ctaPulse 2.4s ease-in-out infinite;
}
@keyframes ctaPulse {
    0%, 100% { box-shadow: 0 10px 28px rgba(212, 175, 55, 0.4); }
    50%      { box-shadow: 0 14px 36px rgba(212, 175, 55, 0.65); }
}
.hero-cta-reassurance {
    color: rgba(255, 255, 255, 0.85);
    font-size: 0.85rem;
    font-weight: 500;
    margin-top: 0.9rem;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}

/* Mobile: full-width tap target */
@media (max-width: 768px) {
    .cta-button-hero {
        font-size: 1rem;
        padding: 0.85rem 1.75rem;
        width: 100%;
        max-width: 320px;
    }
}
```

**Don't keep both** the old hero form and the new CTA — pick one. The whole point is removing intent-split.

### 2. Departure city dropdown + intent chips + smart textarea

Insert after the Phone field, before the Message textarea.

```html
<div class="form-group">
    <label for="departure_city">Departure City</label>
    <select id="departure_city" name="departure_city">
        <option value="">Select your departure airport (optional)</option>
        <option value="Sydney (SYD)">Sydney (SYD)</option>
        <option value="Melbourne (MEL)">Melbourne (MEL)</option>
        <option value="Brisbane (BNE)">Brisbane (BNE)</option>
        <option value="Perth (PER)">Perth (PER)</option>
        <option value="Adelaide (ADL)">Adelaide (ADL)</option>
        <option value="Gold Coast (OOL)">Gold Coast (OOL)</option>
        <option value="Cairns (CNS)">Cairns (CNS)</option>
        <option value="Other / Not sure yet">Other / Not sure yet</option>
    </select>
</div>

<div class="form-group">
    <span class="form-group-legend">What matters most to you?</span>
    <p class="field-hint">Tick all that apply — helps us tailor your quote</p>
    <div class="interest-chips" role="group" aria-label="Trip preferences">
        <input type="checkbox" id="i_price" value="Best price">
        <label for="i_price">💰 Best price</label>
        <input type="checkbox" id="i_luxury" value="Luxury upgrade">
        <label for="i_luxury">✨ Luxury upgrade</label>
        <input type="checkbox" id="i_family" value="Family-friendly">
        <label for="i_family">👨‍👩‍👧 Family-friendly</label>
        <input type="checkbox" id="i_honeymoon" value="Honeymoon">
        <label for="i_honeymoon">💕 Honeymoon</label>
        <input type="checkbox" id="i_solo" value="Solo traveller">
        <label for="i_solo">🎒 Solo traveller</label>
        <input type="checkbox" id="i_dietary" value="Dietary needs">
        <label for="i_dietary">🥗 Dietary needs</label>
        <input type="checkbox" id="i_flights" value="Flights included">
        <label for="i_flights">✈️ Flights included</label>
        <input type="checkbox" id="i_flexible" value="Flexible dates">
        <label for="i_flexible">📅 Flexible dates</label>
    </div>
    <!-- Aggregated at submit time for clean sales email -->
    <input type="hidden" id="interests_summary" name="interests_summary" value="">
</div>

<div class="form-group">
    <label for="message">Anything else we should know?</label>
    <textarea id="message" name="message" rows="5" maxlength="1000" placeholder="Example: We're 2 adults travelling in March 2026 from Sydney. We'd love vegetarian meals, a quieter pace, and we're celebrating our anniversary. Any tips for upgrading to the cruise suite?

→ Or just tell us: travel month, number of travellers & ages, and anything special we should know."></textarea>
</div>
```

```css
/* Chip-style multi-select — visually-hidden checkbox keeps keyboard a11y + screen reader support */
.form-group .field-hint {
    font-size: 0.8rem;
    color: var(--text-light);
    margin: -0.35rem 0 0.6rem;
    font-weight: 400;
}
.interest-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}
.interest-chips input[type="checkbox"] {
    position: absolute;
    opacity: 0;
    width: 1px;
    height: 1px;
    pointer-events: none;
}
.interest-chips label {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.65rem 1rem;
    min-height: 44px;            /* WCAG 2.1 AA + Apple HIG touch target */
    box-sizing: border-box;
    border: 2px solid var(--border);
    border-radius: 999px;
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--dark);
    cursor: pointer;
    background: #fff;
    transition: all 0.2s ease;
    user-select: none;
    line-height: 1.2;
}
.interest-chips label:hover {
    border-color: var(--primary);
    background: rgba(212, 175, 55, 0.08);
}
.interest-chips input[type="checkbox"]:checked + label {
    border-color: var(--primary-text);
    background: var(--primary);
    color: var(--dark);
    font-weight: 700;
    box-shadow: 0 2px 6px rgba(212, 175, 55, 0.25);
}
.interest-chips input[type="checkbox"]:focus-visible + label {
    outline: 2px solid var(--primary-text);
    outline-offset: 2px;
}
/* `<label>` without `for=` is invalid semantics for a group of inputs — use a styled span */
.form-group-legend {
    display: block;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--dark);
}
```

### 3. Bridge CTA inside the relocated highlights section

When you move "Why Choose This Tour?" to sit directly before the booking section, append this inside the highlights container so visitors don't have to scroll-search for the form:

```html
<div style="text-align:center;margin-top:2.5rem;">
    <button class="cta-button" onclick="smoothScroll('booking')" style="padding:1rem 2.25rem;font-size:1.1rem;">
        Get My Free Quote ↓
    </button>
    <p style="color:rgba(255,255,255,0.75);font-size:0.85rem;margin-top:0.75rem;">
        Takes 60 seconds · No payment needed · Reply within 2 hours
    </p>
</div>
```

## Form submit handler additions

The existing `handleSubmit` uses `FormData(form)` → `Object.fromEntries()`. Two tweaks at the top:

```js
async function handleSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const submitBtn = document.getElementById('submitBtn');
    const formStatus = document.getElementById('formStatus');

    // Aggregate interest chips into one readable line for the sales team
    const checkedChips = Array.from(
        form.querySelectorAll('.interest-chips input[type="checkbox"]:checked')
    ).map(cb => cb.value);
    document.getElementById('interests_summary').value =
        checkedChips.length ? checkedChips.join(', ') : '—';

    // dataLayer push — GA4 custom params require strings/numbers
    // (arrays render as "[object Object]" in GA4 reports — convert to comma-string)
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        event: 'form_submit',
        form_id: 'bookingForm',
        departure_city: document.getElementById('departure_city').value || '(not set)',
        interests: checkedChips.join(', ') || '(none)',
        interest_count: checkedChips.length
    });

    // ... existing fetch + success handling unchanged
}
```

**Critical detail:** chips have `id=` but NO `name=` attribute, so `FormData` ignores them. Only `interests_summary` (the aggregated hidden field) is sent to Web3Forms → sales email shows ONE clean line:

```
Interests Summary: Best price, Honeymoon, Flights included
```

NOT a cluttered list of `interest_price: on`, `interest_honeymoon: on`, etc.

## Hardening checklist (don't skip)

Run this checklist before shipping any LP that uses this pattern:

- [ ] All text inputs have `maxlength` (name 100, email 254, phone 20, message 1000) — spam protection
- [ ] All text inputs have `autocomplete` (`name`, `email`, `tel`) — mobile autofill
- [ ] Chip group uses `<span class="form-group-legend">` NOT `<label>` without `for=` (semantic correctness)
- [ ] Chip labels have `min-height: 44px` + `box-sizing: border-box` (touch target)
- [ ] Visually-hidden checkbox uses `position: absolute; opacity: 0; width: 1px; height: 1px;` — NOT `display: none` (keeps keyboard + screen reader access)
- [ ] `:focus-visible + label` rule present for keyboard navigation
- [ ] Departure city `<option value="">` shows "(optional)" hint so visitors know they can skip
- [ ] Single-CTA hero has reassurance line — losing the old form's "Reply within 2 hours" trust copy is a CRO regression if you forget to add it back
- [ ] Bridge CTA in highlights section uses `smoothScroll('booking')` — same target as hero CTA
- [ ] After removing hero form, also delete its JS handler (`handleHeroQuickSubmit`) + CSS (`.hero-quick-form`, `.hero-quick-form input:focus`, mobile breakpoint overrides) — orphan code

## What to copy across to other tour LPs

When porting to honeymoon / family-tour / luxury-cruise pages, **swap the chip values to match the tour intent**:

| Tour | Likely chip set |
|---|---|
| **Honeymoon** | 💕 Private balcony, ✨ 5-star upgrade, 🌹 Anniversary, 🍷 Wine experiences, 🧖 Spa included, 🌅 Sunset cruise, ✈️ Business class, 📸 Photographer |
| **Family** | 👶 Travelling with kids, 🍔 Kid-friendly meals, 🏊 Pool / beach time, 🚌 Short drive days, 🎢 Theme park, 🐘 Animal encounters, 👨‍👩‍👧‍👦 Connecting rooms, 💉 Health/safety priority |
| **Luxury cruise** | 🛏️ Suite cabin, 🥂 All-inclusive drinks, 🍽️ Specialty dining, 💆 Spa package, 🛬 Private transfers, 👔 Butler service, 🎩 Formal nights, 🌊 Sea-view balcony |

Departure city dropdown stays the same across all tours.

## Section-reorder mechanics

Three things move when applying this pattern:

1. **Delete** the entire `<div class="hero-quick-form">...</div>` from inside `.hero-content` (everything between the line below the existing `cta-button` and the closing `</div>` of hero-content)
2. **Cut** the `<section class="highlights">...</section>` block (originally placed right after `</section>` of hero)
3. **Paste** the highlights block immediately before `<section class="booking section" id="booking">` AND append the bridge-CTA `<div>` inside its `.container`

After the move, re-run `node build.js` → check `worker.js` for orphan references:

```bash
grep -c "hero-quick-form\|heroQuickForm\|heroQuickStatus\|heroQuickBtn\|handleHeroQuickSubmit" worker.js
# expect: 0
```

Also verify there's exactly ONE "Why Choose This Tour" heading (not zero, not two):

```bash
grep -c "Why Choose This Tour" worker.js
# expect: 1
```

## When NOT to use this pattern

- **Low-ticket tours (<$500 AUD)**: friction tolerance is much lower; chips might over-engineer. Consider name+email only with a single big CTA.
- **B2B / group enquiries**: replace the consumer chips with a "group size + organisation type" dropdown — different segmentation needs.
- **One-step funnels (waitlist, lead magnet)**: don't add chips — the goal is fastest possible capture, not lead quality.

## Verify on production

```bash
# Both new fields must be present
curl -s https://escape.myvivatour.com/ | \
  grep -c 'departure_city\|interest-chips\|interests_summary\|form-group-legend\|cta-button-hero'
# expect: ≥ 5

# No orphan hero-form refs
curl -s https://escape.myvivatour.com/ | \
  grep -c "heroQuickForm\|hero-quick-form"
# expect: 0
```
