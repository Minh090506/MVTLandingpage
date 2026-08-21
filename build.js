#!/usr/bin/env node
/**
 * MVT Landing Page Builder
 * ========================
 * Reads HTML files from pages/ subfolders and bundles them into worker.js
 * with path-based routing for Cloudflare Workers.
 *
 * Usage: node build.js
 *
 * Structure expected:
 *   pages/escape/index.html      → served at /
 *   pages/honeymoon/index.html   → served at /honeymoon
 *   pages/family-tour/index.html → served at /family-tour
 *   pages/luxury-cruise/index.html → served at /luxury-cruise
 *
 * Output: worker.js (ready to deploy via wrangler)
 */

const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.join(__dirname, 'pages');
const DATA_DIR = path.join(__dirname, 'data');
const OUTPUT_FILE = path.join(__dirname, 'worker.js');

/**
 * Load TripAdvisor data and inject into HTML.
 * Replaces the block between <!-- TA-REVIEWS-START --> and <!-- TA-REVIEWS-END -->
 * with cards generated from data/tripadvisor-reviews.json.
 * Also substitutes inline tokens: <!--TA_COUNT-->...<!--/TA_COUNT-->, etc.
 *
 * If JSON file is missing or malformed → returns html unchanged (graceful fallback to hardcoded).
 */
// Inject the attribution/lead-routing client into a page's <head>.
// It must run before any form handler, so it goes immediately after <head>.
// Idempotent: a page that already carries the marker is returned untouched.
const LEAD_CLIENT_MARKER = 'mvt-lead-attribution';

function injectLeadAttributionClient(html, pageFolder) {
  if (html.includes(LEAD_CLIENT_MARKER)) return html;

  const clientPath = path.join(__dirname, 'worker-modules', 'lead-attribution-client.js');
  if (!fs.existsSync(clientPath)) {
    console.warn('  ⚠ lead-attribution-client.js missing — leads will bypass /api/lead');
    return html;
  }

  const source = fs
    .readFileSync(clientPath, 'utf-8')
    .replace(/__MVT_LANDING_PAGE__/g, pageFolder.replace(/'/g, ''));

  const trackingPath = path.join(__dirname, 'worker-modules', 'tracking-client.js');
  const tracking = fs.existsSync(trackingPath) ? fs.readFileSync(trackingPath, 'utf-8') : '';

  const tag = `<script data-${LEAD_CLIENT_MARKER}>\n${source}\n${tracking}\n</script>`;
  const headIndex = html.indexOf('<head>');
  if (headIndex === -1) {
    console.warn(`  ⚠ ${pageFolder}: no <head> found — attribution client not injected`);
    return html;
  }
  return html.slice(0, headIndex + 6) + '\n' + tag + html.slice(headIndex + 6);
}

function injectTripAdvisorData(html) {
  const dataPath = path.join(DATA_DIR, 'tripadvisor-reviews.json');
  if (!fs.existsSync(dataPath)) {
    console.log('  ℹ TripAdvisor JSON not found — using hardcoded fallback');
    return html;
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  } catch (e) {
    console.warn(`  ⚠ TripAdvisor JSON malformed: ${e.message} — using fallback`);
    return html;
  }

  if (!data.reviews || !Array.isArray(data.reviews) || data.reviews.length === 0) {
    console.warn('  ⚠ TripAdvisor JSON has no reviews — using fallback');
    return html;
  }

  const escapeHtml = (s) => String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const renderCard = (r, idx) => {
    const featured = r.isAustralian ? ' featured' : '';
    const subtitle = r.isAustralian
      ? `📍 ${escapeHtml(r.location)} · Visited ${escapeHtml(r.visitedDate)}`
      : `${escapeHtml(r.location)} · Visited ${escapeHtml(r.visitedDate)}`;
    return `                <article class="ta-review-card${featured}">
                    <div class="ta-review-header">
                        <div class="ta-reviewer">
                            <div class="ta-avatar" aria-hidden="true">${escapeHtml(r.initials)}</div>
                            <div>
                                <strong>${escapeHtml(r.name)}</strong>
                                <small>${subtitle}</small>
                            </div>
                        </div>
                        <span class="ta-stars" aria-label="${r.rating} out of 5 stars">★★★★★</span>
                    </div>
                    <blockquote class="ta-review-body">
                        <q>${escapeHtml(r.quote)}</q>
                    </blockquote>
                    <a class="ta-review-source" href="${escapeHtml(r.profileUrl)}" target="_blank" rel="noopener">View on TripAdvisor →</a>
                </article>`;
  };

  const cardsHtml = data.reviews.map(renderCard).join('\n\n');
  const reviewsBlock = `<!-- TA-REVIEWS-START — auto-injected by build.js from data/tripadvisor-reviews.json -->
            <div class="ta-reviews-grid">
${cardsHtml}
            </div>
            <!-- TA-REVIEWS-END -->`;

  let result = html.replace(
    /<!-- TA-REVIEWS-START[\s\S]*?<!-- TA-REVIEWS-END -->/,
    reviewsBlock
  );

  // Inline token substitution: <!--TA_COUNT-->old<!--/TA_COUNT--> → new
  const tokens = {
    TA_RATING: data.rating?.value ?? '5.0',
    TA_COUNT: String(data.rating?.count ?? 250),
    TA_AWARD_YEAR: String(data.award?.year ?? 2026),
    TA_RANK_POS: String(data.ranking?.position ?? 47),
    TA_RANK_TOTAL: String(data.ranking?.outOf ?? 852),
    TA_RANK_PERCENT: String(data.ranking?.topPercent ?? 6),
  };

  for (const [token, value] of Object.entries(tokens)) {
    const regex = new RegExp(`<!--${token}-->[\\s\\S]*?<!--/${token}-->`, 'g');
    result = result.replace(regex, `<!--${token}-->${value}<!--/${token}-->`);
  }

  console.log(`  📊 TripAdvisor data: ${data.rating?.value}/5 · ${data.rating?.count} reviews · ${data.reviews.length} cards rendered`);
  return result;
}

// Landing page config: folder name → route path
// The first entry with isDefault:true is the homepage (/)
// `redirectTo` entries emit a 301 redirect instead of serving HTML — used to
// consolidate placeholder paths onto the fully-built happytours sections.
// `canonicalHost` marks the one hostname a page should index under — drives the
// host-scoped sitemap and the cross-host 301 guard in the worker.
const PAGES_CONFIG = {
  'escape':                   { path: '/', isDefault: true,  name: 'Escape Australia 10-Day Tour',              canonicalHost: 'escape.myvivatour.com' },
  'happytours':               { path: '/happytours',                  name: 'Vietnam Holiday Packages - Multi-Tour',      canonicalHost: 'happytours.myvivatour.com' },
  'dental-implants-vietnam':  { path: '/dental-implants-vietnam',     name: 'Dental Implants Vietnam — VietnamDentalTravel', canonicalHost: 'implant.vietnamdentaltravel.com' },
  'honeymoon':                { path: '/honeymoon',                   name: 'Vietnam Honeymoon (301 → happytours)',     redirectTo: 'https://happytours.myvivatour.com/#tour-honeymoon' },
  'family-tour':              { path: '/family-tour',                 name: 'Vietnam Family Tour (301 → happytours)',    redirectTo: 'https://happytours.myvivatour.com/#tour-family' },
  'luxury-cruise':            { path: '/luxury-cruise',               name: 'Luxury Vietnam Cruise (301 → happytours)',  redirectTo: 'https://happytours.myvivatour.com/#tour-luxury' },
};

function readPageHTML(folderName) {
  const htmlPath = path.join(PAGES_DIR, folderName, 'index.html');
  if (!fs.existsSync(htmlPath)) {
    console.warn(`  ⚠ Skipping "${folderName}" — no index.html found`);
    return null;
  }
  let content = fs.readFileSync(htmlPath, 'utf-8');

  // Inject TripAdvisor reviews + data only into pages that have the marker
  if (content.includes('TA-REVIEWS-START')) {
    content = injectTripAdvisorData(content);
  }

  console.log(`  ✓ ${folderName} (${(content.length / 1024).toFixed(1)} KB)`);
  return content;
}

function escapeTemplateLiteral(str) {
  return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

function build() {
  console.log('🔨 MVT Landing Page Builder');
  console.log('==========================\n');
  console.log('Reading pages:');

  const pages = {};
  const redirects = {};
  let defaultPage = null;

  for (const [folder, config] of Object.entries(PAGES_CONFIG)) {
    // Redirect-only entries skip HTML loading entirely; they're served as 301 by the worker.
    if (config.redirectTo) {
      redirects[config.path] = config.redirectTo;
      console.log(`  ↪ ${folder} → 301 → ${config.redirectTo}`);
      continue;
    }
    const html = readPageHTML(folder);
    if (html) {
      pages[folder] = { ...config, html };
      if (config.isDefault) defaultPage = folder;
    }
  }

  // Also scan for any new folders not in config
  if (fs.existsSync(PAGES_DIR)) {
    const dirs = fs.readdirSync(PAGES_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    for (const dir of dirs) {
      if (!PAGES_CONFIG[dir]) {
        const html = readPageHTML(dir);
        if (html) {
          pages[dir] = { path: `/${dir}`, name: dir, html };
          console.log(`  + Auto-discovered: ${dir} → /${dir}`);
        }
      }
    }
  }

  // Inject attribution capture + lead routing into every page. Done at build time so
  // a new landing page picks it up automatically without hand-wiring its forms.
  for (const [folder, page] of Object.entries(pages)) {
    page.html = injectLeadAttributionClient(page.html, folder);
  }

  const pageCount = Object.keys(pages).length;
  console.log(`\n📄 ${pageCount} pages loaded\n`);

  if (pageCount === 0) {
    console.error('❌ No pages found! Make sure pages/ folder has subfolders with index.html');
    process.exit(1);
  }

  // Generate worker.js
  let workerCode = `// Auto-generated by build.js — DO NOT EDIT DIRECTLY
// Edit HTML files in pages/ subfolders, then run: node build.js
// Generated: ${new Date().toISOString()}
// Pages: ${pageCount}

`;

  // Add each page as a constant
  for (const [folder, page] of Object.entries(pages)) {
    const varName = `PAGE_${folder.replace(/-/g, '_').toUpperCase()}`;
    workerCode += `const ${varName} = \`${escapeTemplateLiteral(page.html)}\`;\n\n`;
  }

  // Build route map
  workerCode += `// Route map: path → HTML content\nconst ROUTES = {\n`;
  for (const [folder, page] of Object.entries(pages)) {
    const varName = `PAGE_${folder.replace(/-/g, '_').toUpperCase()}`;
    workerCode += `  '${page.path}': ${varName},\n`;
  }
  workerCode += `};\n\n`;

  // Canonical host map — each page indexes under exactly one hostname.
  workerCode += `// Canonical host per page path — drives host-scoped sitemap + cross-host 301 guard\nconst PAGE_HOSTS = {\n`;
  for (const [folder, page] of Object.entries(pages)) {
    if (page.canonicalHost) {
      workerCode += `  '${page.path}': '${page.canonicalHost}',\n`;
    }
  }
  workerCode += `};\nconst KNOWN_HOSTS = new Set(Object.values(PAGE_HOSTS));\n\n`;

  // 301 redirect map — placeholder paths consolidate onto fully-built happytours sections.
  workerCode += `// 301 redirects: path → external URL (Location header)\nconst REDIRECTS = {\n`;
  for (const [path, target] of Object.entries(redirects)) {
    workerCode += `  '${path}': '${target}',\n`;
  }
  workerCode += `};\n\n`;

  // Add the default page reference
  if (defaultPage) {
    const defaultVar = `PAGE_${defaultPage.replace(/-/g, '_').toUpperCase()}`;
    workerCode += `const DEFAULT_PAGE = ${defaultVar};\n\n`;
  }

  // Generate 404 page
  workerCode += `const PAGE_404 = \`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Not Found | MyVivaTour</title>
  <style>
    body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#F8FAFC;color:#1F2937;text-align:center}
    .container{max-width:500px;padding:2rem}
    h1{font-family:'Playfair Display',serif;font-size:3rem;color:#D4AF37;margin-bottom:1rem}
    p{margin-bottom:1.5rem;color:#6B7280}
    a{color:#D4AF37;text-decoration:none;font-weight:600}
    a:hover{text-decoration:underline}
    .tours{text-align:left;margin:2rem 0}
    .tours a{display:block;padding:0.75rem 1rem;margin:0.5rem 0;background:#fff;border-radius:8px;border:1px solid #E5E7EB;transition:all 0.2s}
    .tours a:hover{border-color:#D4AF37;transform:translateX(4px);text-decoration:none}
  </style>
</head>
<body>
  <div class="container">
    <h1>404</h1>
    <p>This page doesn't exist. Explore our Vietnam tours below:</p>
    <div class="tours">
`;

  // Add links to all pages in 404
  for (const [folder, page] of Object.entries(pages)) {
    workerCode += `      <a href="${page.path}">${page.name || folder}</a>\n`;
  }

  workerCode += `    </div>
  </div>
</body>
</html>\`;\n\n`;

  // Add sitemap generator — host-scoped: each hostname's sitemap lists only the
  // page(s) canonical to that host, so one page never advertises under 3 domains.
  workerCode += `function generateSitemap(hostname) {
  let hosts = Object.values(PAGE_HOSTS).filter(h => h === hostname);
  // Unknown host (workers.dev preview, localhost) → list every page at its canonical host
  if (hosts.length === 0) hosts = [...KNOWN_HOSTS];
  const urls = hosts.map(h => \`  <url>
    <loc>https://\${h}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>\`).join('\\n');

  return \`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
\${urls}
</urlset>\`;
}\n\n`;

  // llms.txt (llmstxt.org) — LLM-friendly brand index for generative engines.
  // Facts (prices, ratings) are duplicated from page copy — update here when tour prices change.
  workerCode += `const LLMS_MVT = \`# MyVivaTour — Vietnam Tours for Australian Travellers

> Australian-focused Vietnam tour operator (myvivatour.com). All prices in AUD, land-only unless stated (international airfare excluded, domestic Vietnam flights included where listed). Rated 5.0/5 from 250+ TripAdvisor reviews — Travellers' Choice 2026, Top 6% of Hanoi tour operators. Contact: info@myvivatour.com · WhatsApp +84 974 036 614.

## Landing Pages

- [10-Day All-Inclusive Vietnam Holiday from Australia](https://escape.myvivatour.com/): Hanoi, Ha Long Bay, Hoi An, Ho Chi Minh City & Mekong Delta. From $2,099 AUD including hotels, meals, guides and domestic flights.
- [Vietnam Holiday Packages — Honeymoon, Family, Luxury Cruise](https://happytours.myvivatour.com/): Three curated tours — Honeymoon from $2,070, Family from $676, Luxury Cruise from $1,379 AUD. Hotels, meals & domestic flights included.

## Company

- [Main website](https://www.myvivatour.com/): Full tour catalogue and day-by-day itineraries
- [TripAdvisor listing](https://www.tripadvisor.com/Attraction_Review-g293924-d29687552-Reviews-My_Viva_Tour-Hanoi.html): Independent traveller reviews
\`;

const LLMS_DENTAL = \`# VietnamDentalTravel — Dental Implants in Hanoi for Australians

> Dental tourism service in Hanoi, Vietnam. Genuine Straumann, Dentium & DIO implants from AUD 1,220 all-inclusive (consultation, 3D CBCT scan, fixture, abutment, crown) — 65-80% below Australian prices. Surgeons are Associate Professors from Hanoi Medical University; partner clinic certified by the Vietnamese Ministry of Health. Lifetime implant warranty. Contact: info@myvivatour.com · WhatsApp +84 974 036 614.

## Landing Pages

- [Dental Implants Vietnam — prices, brands, safety, FAQ](https://implant.vietnamdentaltravel.com/): Single implants from AUD 1,220 · All-on-4 from AUD 8,240 per jaw · All-on-6 from AUD 11,480 per jaw. Free treatment plan within 24 hours.

## Company

- [Main website](https://vietnamdentaltravel.com/): Full service list and clinic details
\`;

function generateLlmsTxt(hostname) {
  return hostname.endsWith('vietnamdentaltravel.com') ? LLMS_DENTAL : LLMS_MVT;
}\n\n`;

  // Add robots.txt generator
  workerCode += `function generateRobotsTxt(baseUrl) {
  return \`User-agent: *
Allow: /

Sitemap: \${baseUrl}/sitemap.xml\`;
}\n\n`;

  // Lead ingest endpoint. Kept in its own source file so the handler stays reviewable
  // and testable instead of living inside a template string.
  const leadIngestPath = path.join(__dirname, 'worker-modules', 'lead-ingest-handler.js');
  workerCode += fs.readFileSync(leadIngestPath, 'utf-8') + '\n\n';

  // Fetch handler with routing
  workerCode += `// Host-based default page mapping — when a custom subdomain hits "/", serve its dedicated LP
// Avoids needing separate workers per subdomain
const HOST_DEFAULTS = {
  'happytours.myvivatour.com': '/happytours',
  'implant.vietnamdentaltravel.com': '/dental-implants-vietnam',
  // Add new hosts here as more subdomains are added
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    let pathname = url.pathname.replace(/\\/+$/, '') || '/';
    const baseUrl = \`\${url.protocol}//\${url.hostname}\`;

    // If root path on a host-specific subdomain, rewrite to the subdomain's default page
    if (pathname === '/' && HOST_DEFAULTS[url.hostname]) {
      pathname = HOST_DEFAULTS[url.hostname];
    }

    // Lead ingest — must run before the redirect rules below, which would otherwise
    // 301 a cross-host POST and drop the body.
    if (pathname === '/api/lead') {
      return handleLeadIngest(request, url, env, ctx);
    }

    // Favicon
    if (pathname === '/favicon.ico') {
      return new Response(null, { status: 204 });
    }

    // Sitemap (host-scoped)
    if (pathname === '/sitemap.xml') {
      return new Response(generateSitemap(url.hostname), {
        headers: {
          'Content-Type': 'application/xml;charset=UTF-8',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    // llms.txt — LLM-friendly index for generative engines (GEO)
    if (pathname === '/llms.txt') {
      return new Response(generateLlmsTxt(url.hostname), {
        headers: {
          'Content-Type': 'text/plain;charset=UTF-8',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    // Robots.txt
    if (pathname === '/robots.txt') {
      return new Response(generateRobotsTxt(baseUrl), {
        headers: {
          'Content-Type': 'text/plain;charset=UTF-8',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    // 301 redirects (placeholder paths → happytours anchors). Checked before ROUTES
    // so a /honeymoon-style path never serves stale HTML.
    const redirectTarget = REDIRECTS[pathname];
    if (redirectTarget) {
      return new Response(null, {
        status: 301,
        headers: {
          'Location': redirectTarget,
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    // Cross-host duplicate guard: every path is technically reachable on every bound
    // hostname; 301 to the page's canonical host so each page indexes under one URL.
    // Unknown hosts (workers.dev preview) are left alone so previews keep working.
    const canonicalHost = PAGE_HOSTS[pathname];
    if (canonicalHost && KNOWN_HOSTS.has(url.hostname) && url.hostname !== canonicalHost) {
      return new Response(null, {
        status: 301,
        headers: {
          'Location': \`https://\${canonicalHost}/\`,
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    // Route to the correct landing page
    const html = ROUTES[pathname];
    if (html) {
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
        },
      });
    }

    // 404 for unmatched routes
    return new Response(PAGE_404, {
      status: 404,
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'no-cache',
      },
    });
  },
};
`;

  // Write output
  fs.writeFileSync(OUTPUT_FILE, workerCode);
  const outputSize = (fs.statSync(OUTPUT_FILE).size / 1024).toFixed(1);
  console.log(`✅ worker.js generated (${outputSize} KB)`);
  console.log('\nRoutes:');
  for (const [folder, page] of Object.entries(pages)) {
    const tag = page.isDefault ? ' (homepage)' : '';
    console.log(`  ${page.path} → ${page.name}${tag}`);
  }
  if (Object.keys(redirects).length) {
    console.log('\nRedirects (301):');
    for (const [path, target] of Object.entries(redirects)) {
      console.log(`  ${path} → ${target}`);
    }
  }
  console.log(`\n🚀 Ready to deploy: npx wrangler deploy`);
}

build();
