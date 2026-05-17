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
    TA_COUNT: String(data.rating?.count ?? 230),
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
const PAGES_CONFIG = {
  'escape':        { path: '/', isDefault: true,  name: 'Escape Australia 10-Day Tour' },
  'happytours':    { path: '/happytours',          name: 'Vietnam Holiday Packages - Multi-Tour' },
  'honeymoon':     { path: '/honeymoon',           name: 'Vietnam Honeymoon Package' },
  'family-tour':   { path: '/family-tour',          name: 'Vietnam Family Tour' },
  'luxury-cruise': { path: '/luxury-cruise',        name: 'Luxury Vietnam Cruise Tour' },
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
  let defaultPage = null;

  for (const [folder, config] of Object.entries(PAGES_CONFIG)) {
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

  // Add sitemap generator
  workerCode += `function generateSitemap(baseUrl) {
  const urls = Object.keys(ROUTES).map(path => {
    return \`  <url>
    <loc>\${baseUrl}\${path === '/' ? '' : path}</loc>
    <changefreq>weekly</changefreq>
    <priority>\${path === '/' ? '1.0' : '0.8'}</priority>
  </url>\`;
  }).join('\\n');

  return \`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
\${urls}
</urlset>\`;
}\n\n`;

  // Add robots.txt generator
  workerCode += `function generateRobotsTxt(baseUrl) {
  return \`User-agent: *
Allow: /

Sitemap: \${baseUrl}/sitemap.xml\`;
}\n\n`;

  // Fetch handler with routing
  workerCode += `// Host-based default page mapping — when a custom subdomain hits "/", serve its dedicated LP
// Avoids needing separate workers per subdomain
const HOST_DEFAULTS = {
  'happytours.myvivatour.com': '/happytours',
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

    // Favicon
    if (pathname === '/favicon.ico') {
      return new Response(null, { status: 204 });
    }

    // Sitemap
    if (pathname === '/sitemap.xml') {
      return new Response(generateSitemap(baseUrl), {
        headers: {
          'Content-Type': 'application/xml;charset=UTF-8',
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
  console.log(`\n🚀 Ready to deploy: npx wrangler deploy`);
}

build();
