// Shared click instrumentation for landing pages.
//
// build.js injects this into every page. It pushes the standard engagement events
// defined in docs/mvt-tracking-spec.md so a new landing page is measurable the day
// it ships, without hand-wiring listeners.
//
// Pages that already instrument their own clicks (escape, happytours) set
// window.MVT_PAGE_TRACKS_CLICKS = true. The flag is read at event time, not at
// load time, because this script is injected into <head> and runs before any
// page-level script has had a chance to declare it.
//
// Scroll depth is not gated: no page instruments it today.
(function () {
  'use strict';

  window.dataLayer = window.dataLayer || [];

  function push(payload) {
    try {
      window.dataLayer.push(payload);
    } catch (e) {
      // Never let analytics break the page.
    }
  }

  function label(el) {
    var text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    return text.slice(0, 120);
  }

  document.addEventListener('click', function (e) {
    if (window.MVT_PAGE_TRACKS_CLICKS) return;
    var target = e.target;
    if (!target || !target.closest) return;

    var whatsapp = target.closest('a[href*="wa.me"], a[href*="api.whatsapp.com"]');
    if (whatsapp) {
      push({ event: 'whatsapp_click', link_url: whatsapp.href, cta_text: label(whatsapp) });
      return;
    }

    var tel = target.closest('a[href^="tel:"]');
    if (tel) {
      push({ event: 'phone_click', link_url: tel.href });
      return;
    }

    var email = target.closest('a[href^="mailto:"]');
    if (email) {
      push({ event: 'email_click', link_url: email.href });
      return;
    }

    // Any button-ish element: explicit <button>, or a link styled as a CTA.
    var cta = target.closest('button, .btn, [class*="cta"], a[href^="#booking"], a[href^="#contact"]');
    if (cta) {
      push({ event: 'cta_click', cta_text: label(cta), cta_id: cta.id || '' });
    }
  }, true);

  // Scroll depth — fires once per threshold, tells us where long pages lose people.
  var thresholds = [25, 50, 75, 90];
  var fired = {};
  var ticking = false;

  function checkScroll() {
    ticking = false;
    var doc = document.documentElement;
    var scrollable = doc.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;
    var percent = Math.round(((window.pageYOffset || doc.scrollTop) / scrollable) * 100);
    for (var i = 0; i < thresholds.length; i++) {
      var mark = thresholds[i];
      if (percent >= mark && !fired[mark]) {
        fired[mark] = true;
        push({ event: 'scroll_depth', percent_scrolled: mark });
      }
    }
  }

  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(checkScroll);
  }, { passive: true });
})();
