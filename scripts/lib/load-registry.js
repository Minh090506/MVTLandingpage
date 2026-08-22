'use strict';

// Single source of truth for the landing-page registry.
//
// Reads data/landing-pages.json and returns it as an object keyed by slug:
//   { [slug]: { path, isDefault?, name, canonicalHost?, redirectTo?, ... } }
//
// Used by BOTH build.js (to generate worker.js) and
// scripts/validate-landing-pages.js (to run the CI parity checks), so the two
// never drift. The registry MUST be an object keyed by slug — not an array —
// because build.js and the validator index entries by folder name.
//
// The registry path is resolved relative to this file (repo root is two levels
// up: scripts/lib/ -> repo root) so it works both in the real repo and inside
// the validator's temp sandbox, which copies this file to
// <tempRoot>/scripts/lib/ and the data to <tempRoot>/data/.

const fs = require('fs');
const path = require('path');

const REGISTRY_PATH = path.resolve(__dirname, '..', '..', 'data', 'landing-pages.json');

/**
 * Load and validate the landing-page registry.
 * @param {string} [registryPath] Override path (defaults to data/landing-pages.json).
 * @returns {Object<string, object>} registry keyed by slug.
 * @throws {Error} if the file is missing, not valid JSON, not an object keyed by
 *   slug, or an entry is missing its required `path`.
 */
function loadRegistry(registryPath = REGISTRY_PATH) {
  let raw;
  try {
    raw = fs.readFileSync(registryPath, 'utf-8');
  } catch (err) {
    throw new Error(`Landing-page registry not found at ${registryPath}: ${err.message}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Landing-page registry is not valid JSON (${registryPath}): ${err.message}`);
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    const shape = Array.isArray(parsed) ? 'an array' : typeof parsed;
    throw new Error(`Landing-page registry must be an object keyed by slug, got ${shape}`);
  }

  for (const [slug, entry] of Object.entries(parsed)) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error(`Registry entry "${slug}" must be an object`);
    }
    if (typeof entry.path !== 'string' || entry.path.length === 0) {
      throw new Error(`Registry entry "${slug}" is missing a non-empty string "path"`);
    }
  }

  return parsed;
}

module.exports = { loadRegistry, REGISTRY_PATH };
