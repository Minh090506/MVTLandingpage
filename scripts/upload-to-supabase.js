#!/usr/bin/env node
/**
 * MVT Supabase Image Uploader
 * ============================
 * Automatically uploads images from pages/*/images/ to Supabase Storage.
 *
 * Usage:
 *   node scripts/upload-to-supabase.js
 *
 * Environment variables required:
 *   SUPABASE_URL         - Your Supabase project URL
 *   SUPABASE_SERVICE_KEY - Service role key (NOT anon key)
 *
 * Image structure expected:
 *   pages/escape/images/hero.jpg      → landing-images/escape/hero.jpg
 *   pages/honeymoon/images/banner.jpg → landing-images/honeymoon/banner.jpg
 *
 * Also uploads from:
 *   images/                           → landing-images/shared/
 *   upload-ready/                     → landing-images/ (preserving structure)
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET_NAME = 'landing-images';
const ROOT_DIR = path.join(__dirname, '..');

// Supported image extensions
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif', '.avif']);

// MIME type mapping
const MIME_TYPES = {
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.webp': 'image/webp',
  '.svg':  'image/svg+xml',
  '.gif':  'image/gif',
  '.avif': 'image/avif',
};

function validateEnv() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing environment variables:');
    if (!SUPABASE_URL) console.error('   - SUPABASE_URL');
    if (!SUPABASE_SERVICE_KEY) console.error('   - SUPABASE_SERVICE_KEY');
    console.error('\nSet them in GitHub Secrets or .env file');
    process.exit(1);
  }
}

function findImages(dir, basePath = '') {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      results.push(...findImages(fullPath, relativePath));
    } else if (IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      results.push({ fullPath, relativePath });
    }
  }
  return results;
}

async function uploadImage(supabase, localPath, storagePath) {
  const ext = path.extname(localPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const fileBuffer = fs.readFileSync(localPath);

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, fileBuffer, {
      contentType,
      upsert: true, // Overwrite if exists
    });

  if (error) {
    console.error(`  ✗ ${storagePath}: ${error.message}`);
    return false;
  }
  console.log(`  ✓ ${storagePath} (${(fileBuffer.length / 1024).toFixed(1)} KB)`);
  return true;
}

async function main() {
  validateEnv();

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  console.log('📸 MVT Supabase Image Uploader');
  console.log('==============================\n');

  let totalUploaded = 0;
  let totalFailed = 0;

  // 1. Upload images from each landing page subfolder
  const pagesDir = path.join(ROOT_DIR, 'pages');
  if (fs.existsSync(pagesDir)) {
    const pageDirs = fs.readdirSync(pagesDir, { withFileTypes: true })
      .filter(d => d.isDirectory());

    for (const pageDir of pageDirs) {
      const imagesDir = path.join(pagesDir, pageDir.name, 'images');
      const images = findImages(imagesDir);

      if (images.length > 0) {
        console.log(`\n📁 pages/${pageDir.name}/images/ (${images.length} files)`);
        for (const img of images) {
          const storagePath = `${pageDir.name}/${img.relativePath}`;
          const success = await uploadImage(supabase, img.fullPath, storagePath);
          if (success) totalUploaded++; else totalFailed++;
        }
      }
    }
  }

  // 2. Upload shared images
  const sharedImagesDir = path.join(ROOT_DIR, 'images');
  const sharedImages = findImages(sharedImagesDir);
  if (sharedImages.length > 0) {
    console.log(`\n📁 images/ (${sharedImages.length} shared files)`);
    for (const img of sharedImages) {
      const storagePath = `shared/${img.relativePath}`;
      const success = await uploadImage(supabase, img.fullPath, storagePath);
      if (success) totalUploaded++; else totalFailed++;
    }
  }

  // 3. Upload from upload-ready/
  const uploadReadyDir = path.join(ROOT_DIR, 'upload-ready');
  const uploadReadyImages = findImages(uploadReadyDir);
  if (uploadReadyImages.length > 0) {
    console.log(`\n📁 upload-ready/ (${uploadReadyImages.length} files)`);
    for (const img of uploadReadyImages) {
      const success = await uploadImage(supabase, img.fullPath, img.relativePath);
      if (success) totalUploaded++; else totalFailed++;
    }
  }

  // Summary
  console.log('\n==============================');
  console.log(`✅ Uploaded: ${totalUploaded}`);
  if (totalFailed > 0) console.log(`❌ Failed: ${totalFailed}`);
  console.log(`📦 Bucket: ${BUCKET_NAME}`);
  console.log(`🔗 CDN: ${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
