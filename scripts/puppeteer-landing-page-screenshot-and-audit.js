#!/usr/bin/env node
// Headless review: screenshot mobile+desktop, dump SEO/perf/tracking signals to JSON.
// Usage: node scripts/review-landing-page.js <url> <out-dir> [round-tag]

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const url = process.argv[2];
const outDir = process.argv[3];
const tag = process.argv[4] || 'r0';

if (!url || !outDir) {
  console.error('usage: review-landing-page.js <url> <outDir> [tag]');
  process.exit(1);
}
fs.mkdirSync(outDir, { recursive: true });

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 },
  { name: 'desktop', width: 1440, height: 900, isMobile: false, deviceScaleFactor: 1 },
];

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const summary = { url, tag, ts: new Date().toISOString(), viewports: {} };

  for (const vp of VIEWPORTS) {
    const page = await browser.newPage();
    await page.setViewport(vp);
    // Emulate reduced motion so scroll-reveal CSS (opacity:0 → .visible) doesn't
    // hide content during fullPage screenshot stitching. The page has a
    // prefers-reduced-motion override that sets opacity:1 !important.
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    if (vp.isMobile) {
      await page.setUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
      );
    }

    // Capture network requests + console
    const requests = [];
    const consoleErrors = [];
    page.on('request', r => requests.push({ url: r.url(), type: r.resourceType() }));
    page.on('pageerror', e => consoleErrors.push(String(e)));
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });

    const navStart = Date.now();
    const resp = await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    const loadMs = Date.now() - navStart;

    // Belt + suspenders: force-add .visible to every section-reveal element so
    // off-screen content is captured even if reduced-motion CSS isn't enough.
    await page.evaluate(() => {
      document.querySelectorAll('.section-reveal').forEach(el => el.classList.add('visible'));
    });
    // Let any deferred lazy-load images settle.
    await new Promise(r => setTimeout(r, 800));

    // Performance + Web Vitals approximation
    const perf = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] || {};
      const paint = performance.getEntriesByType('paint');
      const fcp = paint.find(p => p.name === 'first-contentful-paint')?.startTime;
      return {
        dom: nav.domContentLoadedEventEnd - nav.startTime,
        load: nav.loadEventEnd - nav.startTime,
        ttfb: nav.responseStart - nav.requestStart,
        fcp,
        domNodes: document.querySelectorAll('*').length,
        bodyTextLen: document.body.innerText.length,
      };
    });

    // SEO meta
    const seo = await page.evaluate(() => {
      const get = (sel, attr = 'content') => document.querySelector(sel)?.getAttribute(attr) || '';
      const all = sel => Array.from(document.querySelectorAll(sel)).map(e => e.textContent.trim()).filter(Boolean);
      const ldjsonRaw = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(s => {
        try { return JSON.parse(s.textContent); } catch { return null; }
      }).filter(Boolean);
      return {
        title: document.title,
        titleLen: document.title.length,
        description: get('meta[name="description"]'),
        descLen: (get('meta[name="description"]') || '').length,
        keywords: get('meta[name="keywords"]'),
        canonical: get('link[rel="canonical"]', 'href'),
        ogTitle: get('meta[property="og:title"]'),
        ogDesc: get('meta[property="og:description"]'),
        ogImage: get('meta[property="og:image"]'),
        twitterCard: get('meta[name="twitter:card"]'),
        h1: all('h1'),
        h2Count: document.querySelectorAll('h2').length,
        imgs: document.images.length,
        imgsMissingAlt: Array.from(document.images).filter(i => !i.alt).length,
        schemaTypes: ldjsonRaw.flatMap(j => Array.isArray(j) ? j : [j]).map(j => j['@type']).filter(Boolean),
        hreflang: Array.from(document.querySelectorAll('link[rel="alternate"]')).map(l => l.getAttribute('hreflang')).filter(Boolean),
      };
    });

    // Tracking detection from request URLs + inline script content
    const tracking = await page.evaluate(() => {
      const html = document.documentElement.outerHTML;
      return {
        gtmId: (html.match(/GTM-[A-Z0-9]+/) || [])[0],
        ga4Id: (html.match(/G-[A-Z0-9]+/) || [])[0],
        gAdsId: (html.match(/AW-\d+/) || [])[0],
        gAdsLabel: (html.match(/AW-\d+\/[A-Za-z0-9_-]+/) || [])[0],
        fbPixel: (html.match(/fbq\(['"]init['"],\s*['"](\d+)['"]/) || [])[1],
        hasDataLayer: typeof window.dataLayer !== 'undefined',
        dataLayerLen: (window.dataLayer || []).length,
        web3formsKey: (html.match(/access_key.{0,40}([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/) || [])[1],
        whatsappLink: !!html.match(/wa\.me\//),
      };
    });

    // Overflow / horizontal scroll detection
    const layout = await page.evaluate(() => {
      const docW = document.documentElement.scrollWidth;
      const winW = window.innerWidth;
      const overflowing = [];
      const all = document.body.querySelectorAll('*');
      for (const el of all) {
        const r = el.getBoundingClientRect();
        if (r.right > winW + 2 && r.width < winW * 2) {
          overflowing.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.className || '').toString().slice(0, 60),
            id: el.id || '',
            right: Math.round(r.right),
            w: Math.round(r.width),
          });
          if (overflowing.length > 15) break;
        }
      }
      return { docW, winW, hasHorizontalScroll: docW > winW + 2, overflowing };
    });

    // Screenshots
    const fullPath = path.join(outDir, `${tag}-${vp.name}-full.png`);
    const foldPath = path.join(outDir, `${tag}-${vp.name}-fold.png`);
    await page.screenshot({ path: foldPath, fullPage: false });
    await page.screenshot({ path: fullPath, fullPage: true });

    summary.viewports[vp.name] = {
      status: resp?.status(),
      loadMs,
      perf,
      seo,
      tracking,
      layout,
      consoleErrors: consoleErrors.slice(0, 20),
      requestCount: requests.length,
      imgRequests: requests.filter(r => r.type === 'image').length,
      scriptRequests: requests.filter(r => r.type === 'script').length,
      screenshots: { fold: path.basename(foldPath), full: path.basename(fullPath) },
    };

    await page.close();
  }

  await browser.close();

  const summaryPath = path.join(outDir, `${tag}-summary.json`);
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`Wrote ${summaryPath}`);
})().catch(e => { console.error(e); process.exit(1); });
