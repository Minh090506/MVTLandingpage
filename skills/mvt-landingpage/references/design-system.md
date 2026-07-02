# MVT Landing Page Design System Reference

Read this file when you need the exact CSS classes, component HTML, or responsive breakpoints for building an MVT landing page. This is the source of truth for visual consistency across all myvivatour.com landing pages.

## Table of Contents
1. [CSS Reset & Variables](#css-reset--variables)
2. [Typography Scale](#typography-scale)
3. [Layout Grid](#layout-grid)
4. [Component: Navigation](#navigation)
5. [Component: Hero Section](#hero-section)
6. [Component: Feature Cards](#feature-cards)
7. [Component: Destination Cards](#destination-cards)
8. [Component: Accordion](#accordion)
9. [Component: Gallery + Lightbox](#gallery--lightbox)
10. [Component: Pricing Cards](#pricing-cards)
11. [Component: Testimonials](#testimonials)
12. [Component: Booking Form](#booking-form)
13. [Responsive Breakpoints](#responsive-breakpoints)
14. [Animation System](#animation-system)

## CSS Reset & Variables

```css
* { margin: 0; padding: 0; box-sizing: border-box; }

:root {
    --primary: #D4AF37;
    --dark: #111827;
    --light: #F8FAFC;
    --text-dark: #1F2937;
    --text-light: #6B7280;
    --border: #E5E7EB;
    --success: #10B981;
}

html { scroll-behavior: smooth; }
body { font-family: 'Plus Jakarta Sans', sans-serif; color: var(--text-dark); line-height: 1.6; }
```

## Typography Scale

```css
h1, h2, h3, h4 { font-family: 'Playfair Display', serif; }
h1 { font-size: clamp(2.5rem, 8vw, 4.5rem); font-weight: 700; }
h2 { font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 600; }
h3 { font-size: 1.5rem; font-weight: 600; }

/* Price display */
.price { font-size: 4rem; font-weight: 700; color: var(--primary); font-family: 'Playfair Display', serif; }
.was-price { text-decoration: line-through; color: var(--text-light); font-size: 1.25rem; }
```

## Layout Grid

```css
.container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }
.section { padding: 5rem 0; }
.text-center { text-align: center; }
.mb-5 { margin-bottom: 2.5rem; }
```

Grid patterns used across sections:
- **4-column**: `grid-template-columns: repeat(4, 1fr)` → 2 cols on tablet, 1 on mobile
- **3-column**: `grid-template-columns: repeat(3, 1fr)` → 2 on tablet, 1 on mobile
- **2-column**: `grid-template-columns: repeat(2, 1fr)` → 1 on mobile

## Navigation

Fixed top nav with backdrop blur on scroll.

```css
.nav {
    position: fixed; top: 0; width: 100%; z-index: 1000;
    background: rgba(255,255,255,0.95);
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
}
.nav.scrolled { box-shadow: 0 2px 20px rgba(0,0,0,0.1); }
.nav-brand { font-family: 'Playfair Display', serif; font-size: 1.5rem; color: var(--primary); font-weight: 700; }
.nav-link { color: var(--text-dark); font-weight: 500; transition: color 0.3s; }
.nav-link:hover { color: var(--primary); }
.nav-cta { background: var(--primary); color: white; padding: 0.5rem 1.5rem; border-radius: 50px; }
```

## Hero Section

Full-viewport hero with gradient overlay.

```css
.hero {
    min-height: 100vh;
    background: url('HERO_IMAGE_URL') center/cover;
    display: flex; align-items: center; justify-content: center;
    position: relative; color: white; text-align: center;
}
.hero::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%);
}
.hero-content { position: relative; z-index: 1; max-width: 900px; }
.hero-badge {
    display: inline-block; background: var(--primary); color: white;
    padding: 0.5rem 1.5rem; border-radius: 50px; font-weight: 600;
    margin-bottom: 1.5rem; text-transform: uppercase; letter-spacing: 2px;
}
.btn-primary {
    background: var(--primary); color: white; padding: 1rem 3rem;
    border: none; border-radius: 50px; font-size: 1.1rem; font-weight: 600;
    cursor: pointer; transition: transform 0.3s, box-shadow 0.3s;
}
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(212,175,55,0.4); }
```

## Feature Cards (Highlights)

```css
.highlight-card {
    background: white; padding: 2rem; border-radius: 16px; text-align: center;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    transition: transform 0.3s ease;
    opacity: 0; transform: translateY(30px); /* animated on scroll */
}
.highlight-card.visible { opacity: 1; transform: translateY(0); }
.highlight-card:hover { transform: translateY(-5px); }
.highlight-icon { font-size: 2.5rem; margin-bottom: 1rem; }
```

## Destination Cards

```css
.destination-card {
    position: relative; border-radius: 16px; overflow: hidden;
    aspect-ratio: 4/3; cursor: pointer;
    opacity: 0; transform: translateY(30px);
}
.destination-card img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; }
.destination-card:hover img { transform: scale(1.1); }
.destination-overlay {
    position: absolute; bottom: 0; left: 0; right: 0;
    padding: 1.5rem;
    background: linear-gradient(transparent, rgba(0,0,0,0.8));
    color: white;
}
```

## Accordion (Itinerary & FAQ)

```css
.accordion-item {
    background: white; border-radius: 12px; margin-bottom: 1rem;
    border: 1px solid var(--border); overflow: hidden;
}
.accordion-header {
    padding: 1.25rem 1.5rem; cursor: pointer;
    display: flex; justify-content: space-between; align-items: center;
    font-weight: 600; font-size: 1.05rem;
    transition: background 0.3s;
}
.accordion-header:hover { background: rgba(212,175,55,0.05); }
.accordion-content {
    max-height: 0; overflow: hidden;
    transition: max-height 0.4s ease;
}
.accordion-item.active .accordion-content { max-height: 1000px; }
.accordion-toggle { font-size: 1.5rem; transition: transform 0.3s; color: var(--primary); }
.accordion-item.active .accordion-toggle { transform: rotate(180deg); }
.accordion-body { padding: 0 1.5rem 1.5rem; }
.day-header { color: var(--primary); font-weight: 600; margin-bottom: 0.5rem; font-size: 1.1rem; }
.day-details {
    display: flex; gap: 2rem; margin-top: 1rem; padding-top: 1rem;
    border-top: 1px solid var(--border);
}
.detail-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-light); }
.detail-value { font-weight: 600; color: var(--text-dark); }
```

## Gallery + Lightbox

```css
.gallery-grid {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
}
.gallery-item {
    border-radius: 12px; overflow: hidden; cursor: pointer;
    aspect-ratio: 4/3;
    opacity: 0; transform: translateY(20px);
}
.gallery-item img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
.gallery-item:hover img { transform: scale(1.1); }

/* Lightbox modal */
.lightbox {
    display: none; position: fixed; inset: 0; z-index: 2000;
    background: rgba(0,0,0,0.95);
    align-items: center; justify-content: center;
}
.lightbox.active { display: flex; }
.lightbox img { max-width: 90vw; max-height: 90vh; object-fit: contain; border-radius: 8px; }
.lightbox-close { position: absolute; top: 1rem; right: 1.5rem; color: white; font-size: 2rem; cursor: pointer; }
.lightbox-nav { position: absolute; top: 50%; color: white; font-size: 3rem; cursor: pointer; padding: 1rem; }
.lightbox-prev { left: 1rem; }
.lightbox-next { right: 1rem; }
```

## Pricing Cards

```css
.pricing-main {
    background: linear-gradient(135deg, var(--dark) 0%, #1a2332 100%);
    color: white; border-radius: 24px; padding: 3rem; text-align: center;
    position: relative; overflow: hidden;
}
.pricing-main::before {
    content: ''; position: absolute; top: -50%; right: -50%;
    width: 100%; height: 100%;
    background: radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%);
}
.upgrade-card {
    background: white; border-radius: 16px; padding: 2rem;
    border: 1px solid var(--border); text-align: center;
    transition: transform 0.3s, box-shadow 0.3s;
}
.upgrade-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}
.upgrade-price { font-size: 1.75rem; font-weight: 700; color: var(--primary); }
```

## Testimonials

```css
.testimonial-card {
    background: white; padding: 2rem; border-radius: 16px;
    border-left: 4px solid var(--primary);
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}
.testimonial-stars { color: var(--primary); font-size: 1.2rem; margin-bottom: 1rem; }
.testimonial-text { font-style: italic; color: var(--text-light); margin-bottom: 1rem; line-height: 1.7; }
.testimonial-author { font-weight: 600; }
.testimonial-location { color: var(--text-light); font-size: 0.9rem; }
```

## Booking Form

```css
.booking-form {
    background: white; border-radius: 24px; padding: 3rem;
    box-shadow: 0 20px 60px rgba(0,0,0,0.1);
    max-width: 700px; margin: 0 auto;
}
.form-group { margin-bottom: 1.5rem; }
.form-group label { display: block; margin-bottom: 0.5rem; font-weight: 600; }
.form-group input, .form-group textarea, .form-group select {
    width: 100%; padding: 0.875rem 1rem; border: 2px solid var(--border);
    border-radius: 12px; font-size: 1rem; font-family: inherit;
    transition: border-color 0.3s;
}
.form-group input:focus, .form-group textarea:focus {
    border-color: var(--primary); outline: none;
}
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
```

## Responsive Breakpoints

```css
@media (max-width: 968px) {
    /* 4-col → 2-col grids */
    .highlights-grid, .gallery-grid { grid-template-columns: repeat(2, 1fr); }
    .destinations-grid { grid-template-columns: repeat(2, 1fr); }
    .section { padding: 3rem 0; }
}

@media (max-width: 768px) {
    .nav-links { display: none; } /* Show hamburger */
    .form-row { grid-template-columns: 1fr; }
    .day-details { flex-direction: column; gap: 0.5rem; }
    .testimonials-grid { grid-template-columns: 1fr; }
}

@media (max-width: 480px) {
    .highlights-grid, .gallery-grid { grid-template-columns: 1fr; }
    .destinations-grid { grid-template-columns: 1fr; }
    .hero h1 { font-size: 2rem; }
    .pricing-main { padding: 2rem 1.5rem; }
}
```

## Animation System

All scroll animations use Intersection Observer:

```javascript
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

// Targets with staggered delays
document.querySelectorAll('.highlight-card, .destination-card, .upgrade-card, .testimonial-card, .gallery-item')
    .forEach((el, i) => {
        el.style.transitionDelay = `${i * 0.1}s`;
        observer.observe(el);
    });
```

Base transition for animated elements:
```css
.highlight-card, .destination-card, .upgrade-card, .testimonial-card, .gallery-item {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.6s ease, transform 0.6s ease;
}
.visible {
    opacity: 1;
    transform: translateY(0);
}
```
