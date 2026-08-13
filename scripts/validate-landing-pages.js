#!/usr/bin/env node

// CI validation gate for MVT landing pages.
//
// Redirect-stub rule: a page is exempt from tracking checks when its
// PAGES_CONFIG entry has redirectTo, or when its HTML is under 2,000 bytes and
// contains a clear redirect/placeholder signal (301, meta refresh,
// window.location.replace, location.href, or "coming soon"). Metadata, image
// reference, and remote asset checks still apply to redirect stubs.

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const PAGES_DIR = path.join(REPO_ROOT, 'pages');
const BUILD_FILE = path.join(REPO_ROOT, 'build.js');
const CDN_PREFIX = 'https://tnwelgvypmhhksqwnfmr.supabase.co/storage/v1/object/public/landing-images/';
const REMOTE_CONCURRENCY = 8;
const REMOTE_TIMEOUT_MS = 10_000;
// Transient CDN/network hiccups: up to 3 tries (1 initial + 2 retries).
// Happy path stays 1 request/URL; backoff only runs between failed retries.
const REMOTE_MAX_ATTEMPTS = 3;
const REMOTE_RETRY_BACKOFF_MS = [300, 900];

// Page-level IDs that must appear in live HTML.
// GA4 G-2R0EJ2LBJ5 is delivered via GTM only (no direct gtag/js?id=G-… — that
// endpoint 404s for this property). Do not require the measurement ID string
// in HTML or pages will be forced to re-introduce a dead loader.
const TRACKING_IDS = {
  gtm: 'GTM-KRFGX69D',
  googleAds: 'AW-17709107883',
  googleAdsLabel: 'Wq0ECKXBmfsbEKuVrvxB',
  metaPixel: '531880273071891',
};

function parseArgs(argv) {
  const known = new Set(['--json', '--skip-remote', '--help']);
  const unknown = argv.filter((arg) => !known.has(arg));

  if (unknown.length > 0) {
    throw new Error(`Unknown option(s): ${unknown.join(', ')}`);
  }

  return {
    json: argv.includes('--json'),
    skipRemote: argv.includes('--skip-remote'),
    help: argv.includes('--help'),
  };
}

function printHelp() {
  process.stdout.write([
    'Usage: node scripts/validate-landing-pages.js [options]',
    '',
    'Options:',
    '  --skip-remote  Skip Supabase CDN HEAD checks (for offline development)',
    '  --json         Emit only a machine-readable JSON report',
    '  --help         Show this help',
    '',
  ].join('\n'));
}

function extractObjectLiteral(source, variableName) {
  const declaration = new RegExp(`\\bconst\\s+${variableName}\\s*=`).exec(source);
  if (!declaration) {
    throw new Error(`Could not find const ${variableName} in build.js`);
  }

  const start = source.indexOf('{', declaration.index + declaration[0].length);
  if (start === -1) {
    throw new Error(`Could not find the opening brace for ${variableName}`);
  }

  let depth = 0;
  let state = 'code';
  let escaped = false;

  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (state === 'line-comment') {
      if (char === '\n') state = 'code';
      continue;
    }

    if (state === 'block-comment') {
      if (char === '*' && next === '/') {
        state = 'code';
        index += 1;
      }
      continue;
    }

    if (state === 'single-quote' || state === 'double-quote' || state === 'template') {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (
        (state === 'single-quote' && char === "'") ||
        (state === 'double-quote' && char === '"') ||
        (state === 'template' && char === '`')
      ) {
        state = 'code';
      }
      continue;
    }

    if (char === '/' && next === '/') {
      state = 'line-comment';
      index += 1;
      continue;
    }
    if (char === '/' && next === '*') {
      state = 'block-comment';
      index += 1;
      continue;
    }
    if (char === "'") {
      state = 'single-quote';
      continue;
    }
    if (char === '"') {
      state = 'double-quote';
      continue;
    }
    if (char === '`') {
      state = 'template';
      continue;
    }

    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }

  throw new Error(`Could not find the closing brace for ${variableName}`);
}

function loadPagesConfig(buildSource) {
  const literal = extractObjectLiteral(buildSource, 'PAGES_CONFIG');
  const config = vm.runInNewContext(`(${literal})`, Object.create(null), { timeout: 1_000 });

  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error('PAGES_CONFIG did not evaluate to an object');
  }

  return config;
}

function listDiskPages() {
  if (!fs.existsSync(PAGES_DIR)) return [];

  return fs.readdirSync(PAGES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => fs.existsSync(path.join(PAGES_DIR, name, 'index.html')))
    .sort();
}

function copyBuildInputs(tempRoot, diskPages) {
  fs.copyFileSync(BUILD_FILE, path.join(tempRoot, 'build.js'));

  for (const pageName of diskPages) {
    const targetDir = path.join(tempRoot, 'pages', pageName);
    fs.mkdirSync(targetDir, { recursive: true });
    fs.copyFileSync(
      path.join(PAGES_DIR, pageName, 'index.html'),
      path.join(targetDir, 'index.html')
    );
  }

  const dataDir = path.join(REPO_ROOT, 'data');
  if (fs.existsSync(dataDir)) {
    fs.cpSync(dataDir, path.join(tempRoot, 'data'), { recursive: true });
  }

  const workerModulesDir = path.join(REPO_ROOT, 'worker-modules');
  if (fs.existsSync(workerModulesDir)) {
    fs.cpSync(workerModulesDir, path.join(tempRoot, 'worker-modules'), { recursive: true });
  }
}

function runBuildCheck(diskPages) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'mvt-landing-validator-'));
  const result = {
    ok: false,
    exitCode: null,
    output: '',
    syntaxOk: false,
    syntaxError: null,
  };

  try {
    copyBuildInputs(tempRoot, diskPages);

    const build = spawnSync(process.execPath, ['build.js'], {
      cwd: tempRoot,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
      timeout: 120_000,
    });

    result.exitCode = build.status;
    result.output = [build.stdout, build.stderr].filter(Boolean).join('\n').trim();

    if (build.error) {
      result.output = [result.output, build.error.message].filter(Boolean).join('\n');
      return result;
    }

    if (build.status !== 0) return result;

    const generatedWorker = path.join(tempRoot, 'worker.js');
    if (!fs.existsSync(generatedWorker)) {
      result.syntaxError = 'build.js exited successfully but did not create worker.js';
      return result;
    }

    const workerSource = fs.readFileSync(generatedWorker, 'utf8');
    const syntax = spawnSync(process.execPath, ['--input-type=module', '--check'], {
      input: workerSource,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
      timeout: 30_000,
    });

    result.syntaxOk = syntax.status === 0 && !syntax.error;
    if (!result.syntaxOk) {
      result.syntaxError = [syntax.stdout, syntax.stderr, syntax.error && syntax.error.message]
        .filter(Boolean)
        .join('\n')
        .trim();
    }
    result.ok = result.syntaxOk;
    return result;
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

function getAttribute(tag, attributeName) {
  const pattern = new RegExp(
    `\\b${attributeName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    'i'
  );
  const match = pattern.exec(tag);
  return match ? (match[1] ?? match[2] ?? match[3] ?? '').trim() : null;
}

function checkMetadata(html) {
  const titleMatch = /<title\b[^>]*>([\s\S]*?)<\/title\s*>/i.exec(html);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : '';

  let description = '';
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    if ((getAttribute(match[0], 'name') || '').toLowerCase() === 'description') {
      description = getAttribute(match[0], 'content') || '';
      break;
    }
  }

  let canonical = '';
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const rel = (getAttribute(match[0], 'rel') || '').toLowerCase().split(/\s+/);
    if (rel.includes('canonical')) {
      canonical = getAttribute(match[0], 'href') || '';
      break;
    }
  }

  return {
    title: { present: Boolean(title), value: title },
    description: { present: Boolean(description), value: description },
    canonical: { present: Boolean(canonical), value: canonical },
  };
}

function lineNumberAt(text, index) {
  return text.slice(0, index).split('\n').length;
}

function findRelativeImageReferences(html) {
  const patterns = [
    { type: 'src', regex: /\bsrc\s*=\s*["']\s*images\//gi },
    { type: 'css-url', regex: /url\(\s*["']?\s*images\//gi },
  ];
  const matches = [];

  for (const { type, regex } of patterns) {
    for (const match of html.matchAll(regex)) {
      matches.push({ type, line: lineNumberAt(html, match.index), match: match[0] });
    }
  }

  return matches.sort((a, b) => a.line - b.line);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findCdnUrls(html) {
  const pattern = new RegExp(`${escapeRegExp(CDN_PREFIX)}[^\\s"'<>\\)]+`, 'g');
  return [...new Set(html.match(pattern) || [])].sort();
}

function isRedirectStub(html, config) {
  if (config && typeof config.redirectTo === 'string' && config.redirectTo.trim()) return true;

  const isSmall = Buffer.byteLength(html, 'utf8') < 2_000;
  const hasStubSignal = /(?:\b301\b|window\.location\.replace\s*\(|\blocation\.href\s*=|http-equiv\s*=\s*["']?refresh|coming\s+soon)/i.test(html);
  return isSmall && hasStubSignal;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** True for flaky failures worth retrying — not permanent 4xx path/auth errors. */
function isTransientHeadFailure(result) {
  if (!result || result.ok) return false;
  if (result.status === null) return true; // timeout / network / AbortError
  if (result.status === 429) return true;
  if (result.status >= 500 && result.status <= 599) return true;
  return false;
}

async function headUrlOnce(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REMOTE_TIMEOUT_MS);

  try {
    const response = await globalThis.fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'MVT-Landing-Page-Validator/1.0' },
    });

    return {
      url,
      ok: response.status === 200,
      status: response.status,
      finalUrl: response.url,
      error: response.status === 200 ? null : `Expected HTTP 200, received ${response.status}`,
    };
  } catch (error) {
    return {
      url,
      ok: false,
      status: null,
      finalUrl: null,
      error: error.name === 'AbortError'
        ? `HEAD request timed out after ${REMOTE_TIMEOUT_MS / 1_000}s`
        : error.message,
    };
  } finally {
    clearTimeout(timer);
  }
}

async function headUrl(url) {
  let lastResult = null;
  let attempts = 0;

  for (let attempt = 1; attempt <= REMOTE_MAX_ATTEMPTS; attempt += 1) {
    attempts = attempt;
    lastResult = await headUrlOnce(url);

    if (lastResult.ok) {
      return { ...lastResult, attempts };
    }

    const canRetry = isTransientHeadFailure(lastResult) && attempt < REMOTE_MAX_ATTEMPTS;
    if (!canRetry) break;

    const backoffMs = REMOTE_RETRY_BACKOFF_MS[attempt - 1] ?? REMOTE_RETRY_BACKOFF_MS[REMOTE_RETRY_BACKOFF_MS.length - 1];
    await sleep(backoffMs);
  }

  const attemptLabel = attempts === 1 ? '1 attempt' : `${attempts} attempts`;
  return {
    ...lastResult,
    attempts,
    error: lastResult.error
      ? `${lastResult.error} (after ${attemptLabel})`
      : `HEAD request failed (after ${attemptLabel})`,
  };
}

async function checkRemoteUrls(urls) {
  const results = new Array(urls.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < urls.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await headUrl(urls[index]);
    }
  }

  const workerCount = Math.min(REMOTE_CONCURRENCY, urls.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

function addError(report, group, message, page = null, details = null) {
  report.errors.push({ group, page, message, details });
}

function renderHumanReport(report) {
  const lines = [
    'MVT Landing Page Validation',
    '===========================',
    `${report.build.ok ? 'PASS' : 'FAIL'}  build.js and generated worker.js syntax`,
    `${report.registration.ok ? 'PASS' : 'FAIL'}  PAGES_CONFIG registration (${report.registration.registeredPages.length} registered, ${report.registration.diskPages.length} on disk)`,
    '',
    'Page checks:',
  ];

  for (const page of report.pages) {
    const suffix = page.redirectStub ? ' (redirect stub; tracking skipped)' : '';
    lines.push(`  ${page.ok ? 'PASS' : 'FAIL'}  ${page.name}${suffix}`);
  }

  lines.push('');
  if (report.remote.skipped) {
    lines.push(`SKIP  remote Supabase checks (${report.remote.total} URL(s); --skip-remote)`);
  } else {
    lines.push(`${report.remote.ok ? 'PASS' : 'FAIL'}  remote Supabase checks (${report.remote.checked}/${report.remote.total} URL(s))`);
  }

  if (report.errors.length > 0) {
    lines.push('', `Failures (${report.errors.length}):`);
    const groups = new Map();
    for (const error of report.errors) {
      if (!groups.has(error.group)) groups.set(error.group, []);
      groups.get(error.group).push(error);
    }

    for (const [group, errors] of groups) {
      lines.push(`  [${group}]`);
      for (const error of errors) {
        const pagePrefix = error.page ? `${error.page}: ` : '';
        lines.push(`    - ${pagePrefix}${error.message}`);
        if (typeof error.details === 'string' && error.details.trim()) {
          for (const detailLine of error.details.trim().split('\n')) {
            lines.push(`      ${detailLine}`);
          }
        }
      }
    }
  }

  lines.push('', `${report.ok ? 'PASS' : 'FAIL'}: ${report.summary.pages} page(s), ${report.summary.errors} error(s)`);
  return `${lines.join('\n')}\n`;
}

async function validate(options) {
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    ok: false,
    options: { skipRemote: options.skipRemote },
    summary: { pages: 0, redirectStubs: 0, supabaseUrls: 0, errors: 0 },
    build: null,
    registration: null,
    pages: [],
    remote: { skipped: options.skipRemote, total: 0, checked: 0, ok: true, failures: [] },
    errors: [],
  };

  const buildSource = fs.readFileSync(BUILD_FILE, 'utf8');
  let pagesConfig = {};
  try {
    pagesConfig = loadPagesConfig(buildSource);
  } catch (error) {
    addError(report, 'Registration', error.message);
  }

  const diskPages = listDiskPages();
  const registeredPages = Object.keys(pagesConfig).sort();
  const missingOnDisk = registeredPages.filter(
    (name) => !fs.existsSync(path.join(PAGES_DIR, name, 'index.html'))
  );
  const unregisteredOnDisk = diskPages.filter((name) => !pagesConfig[name]);

  report.registration = {
    ok: missingOnDisk.length === 0 && unregisteredOnDisk.length === 0 && report.errors.length === 0,
    registeredPages,
    diskPages,
    missingOnDisk,
    unregisteredOnDisk,
  };

  for (const name of missingOnDisk) {
    addError(report, 'Registration', 'registered in PAGES_CONFIG but pages/<name>/index.html is missing', name);
  }
  for (const name of unregisteredOnDisk) {
    addError(report, 'Registration', 'pages/<name>/index.html exists but the page is not registered in PAGES_CONFIG', name);
  }
  report.registration.ok = missingOnDisk.length === 0 && unregisteredOnDisk.length === 0 &&
    !report.errors.some((error) => error.group === 'Registration');

  report.build = runBuildCheck(diskPages);
  if (report.build.exitCode !== 0) {
    addError(report, 'Build', `node build.js exited with code ${report.build.exitCode ?? 'unknown'}`, null, report.build.output);
  } else if (!report.build.syntaxOk) {
    addError(report, 'Build', 'generated worker.js failed Node module syntax check', null, report.build.syntaxError);
  }

  const urlPages = new Map();
  for (const name of diskPages) {
    const file = path.join(PAGES_DIR, name, 'index.html');
    const html = fs.readFileSync(file, 'utf8');
    const redirectStub = isRedirectStub(html, pagesConfig[name]);
    const metadata = checkMetadata(html);
    const relativeImageReferences = findRelativeImageReferences(html);
    const tracking = Object.fromEntries(
      Object.entries(TRACKING_IDS).map(([key, id]) => [key, { id, present: html.includes(id) }])
    );
    const cdnUrls = findCdnUrls(html);
    const pageErrors = [];

    for (const [field, value] of Object.entries(metadata)) {
      if (!value.present) pageErrors.push(`missing or empty ${field}`);
    }
    if (!redirectStub) {
      for (const value of Object.values(tracking)) {
        if (!value.present) pageErrors.push(`missing tracking ID ${value.id}`);
      }
    }
    for (const reference of relativeImageReferences) {
      pageErrors.push(`relative image reference at line ${reference.line}: ${reference.match}`);
    }

    for (const message of pageErrors) addError(report, 'Page checks', message, name);
    for (const url of cdnUrls) {
      if (!urlPages.has(url)) urlPages.set(url, []);
      urlPages.get(url).push(name);
    }

    report.pages.push({
      name,
      file: path.relative(REPO_ROOT, file),
      bytes: Buffer.byteLength(html, 'utf8'),
      registered: Boolean(pagesConfig[name]),
      redirectStub,
      ok: pageErrors.length === 0,
      metadata,
      tracking: { skipped: redirectStub, ids: tracking },
      relativeImageReferences,
      supabaseUrls: cdnUrls,
      errors: pageErrors,
    });
  }

  const urls = [...urlPages.keys()].sort();
  report.remote.total = urls.length;

  if (!options.skipRemote && urls.length > 0) {
    const remoteResults = await checkRemoteUrls(urls);
    report.remote.checked = remoteResults.length;
    report.remote.failures = remoteResults
      .filter((result) => !result.ok)
      .map((result) => ({ ...result, pages: urlPages.get(result.url) }));
    report.remote.ok = report.remote.failures.length === 0;

    for (const failure of report.remote.failures) {
      addError(
        report,
        'Remote assets',
        `${failure.error}: ${failure.url}`,
        failure.pages.join(', '),
        failure
      );
    }
  }

  report.summary.pages = report.pages.length;
  report.summary.redirectStubs = report.pages.filter((page) => page.redirectStub).length;
  report.summary.supabaseUrls = urls.length;
  report.summary.errors = report.errors.length;
  report.ok = report.errors.length === 0;
  return report;
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error.message}\nUse --help for usage.\n`);
    process.exitCode = 2;
    return;
  }

  if (options.help) {
    printHelp();
    return;
  }

  try {
    const report = await validate(options);
    process.stdout.write(options.json
      ? `${JSON.stringify(report, null, 2)}\n`
      : renderHumanReport(report));
    process.exitCode = report.ok ? 0 : 1;
  } catch (error) {
    if (options.json) {
      process.stdout.write(`${JSON.stringify({
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        ok: false,
        fatalError: error.stack || error.message,
      }, null, 2)}\n`);
    } else {
      process.stderr.write(`Validator failed unexpectedly:\n${error.stack || error.message}\n`);
    }
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  headUrl,
  headUrlOnce,
  isTransientHeadFailure,
  REMOTE_MAX_ATTEMPTS,
  REMOTE_TIMEOUT_MS,
  REMOTE_RETRY_BACKOFF_MS,
};
