#!/usr/bin/env node
/**
 * Sync generated-images/inspiration-log.json into image-library.json
 *
 * This takes the images we generated via generate-inspired-images.js
 * (which already live in Vercel Blob) and registers them in the
 * image library with proper content_tags and recommended_uses so
 * the site can use them.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { carData } from '../data/cars.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const LOG_PATH = path.join(PROJECT_ROOT, 'generated-images', 'inspiration-log.json');
const LIB_PATH = path.join(PROJECT_ROOT, 'image-library.json');

if (!fs.existsSync(LOG_PATH)) {
  console.error('❌ No inspiration-log.json found at', LOG_PATH);
  process.exit(1);
}

if (!fs.existsSync(LIB_PATH)) {
  console.error('❌ No image-library.json found at', LIB_PATH);
  process.exit(1);
}

const logEntries = JSON.parse(fs.readFileSync(LOG_PATH, 'utf-8'));
const library = JSON.parse(fs.readFileSync(LIB_PATH, 'utf-8'));

if (!Array.isArray(library.images)) {
  console.error('❌ image-library.json has no images[] array');
  process.exit(1);
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function extractBrand(name) {
  const brands = [
    'Porsche', 'Ferrari', 'Lamborghini', 'Audi', 'BMW', 'Mercedes',
    'Chevrolet', 'Ford', 'Dodge', 'Nissan', 'Toyota', 'Lexus',
    'Lotus', 'Jaguar', 'Aston Martin', 'Maserati', 'Alfa Romeo',
    'Subaru', 'Mazda', 'Honda', 'Acura', 'Volkswagen', 'Cadillac', 'Tesla',
  ];
  const lower = name.toLowerCase();
  for (const brand of brands) {
    if (lower.includes(brand.toLowerCase())) return brand;
  }
  return 'sports car';
}

function classifyFromType(imageType) {
  switch (imageType) {
    case 'hero':
      return {
        tags: ['3/4-front', 'exterior', 'outdoor', 'hero'],
        uses: ['hero-banner', 'og-social', 'card-thumbnail'],
        quality: 'premium',
      };
    case 'rear':
      return {
        tags: ['3/4-rear', 'exterior', 'outdoor'],
        uses: ['gallery', 'comparison-view'],
        quality: 'premium',
      };
    case 'interior':
      return {
        tags: ['interior', 'cockpit', 'dashboard'],
        uses: ['buying-guide', 'ownership-section', 'gallery'],
        quality: 'premium',
      };
    case 'detail':
      return {
        tags: ['detail', 'close-up'],
        uses: ['thumbnail', 'enthusiast-detail', 'gallery'],
        quality: 'standard',
      };
    case 'action':
      return {
        tags: ['action', 'motion', 'track'],
        uses: ['gallery', 'excitement'],
        quality: 'standard',
      };
    case 'overhead':
      return {
        tags: ['top', 'overhead', 'exterior'],
        uses: ['gallery', 'spec-sheet'],
        quality: 'premium',
      };
    default:
      return {
        tags: [],
        uses: ['gallery'],
        quality: 'standard',
      };
  }
}

function makeRecordFromLog(entry) {
  const { carSlug, carName, imageType, blobUrl } = entry;
  if (!carSlug || !imageType || !blobUrl) return null;

  // Avoid duplicates by blob_url
  if (library.images.some((img) => img.blob_url === blobUrl)) {
    return null;
  }

  const car = carData.find((c) => c.slug === carSlug);
  const year = car ? car.years.split('-')[0] : null;
  const brand = car ? extractBrand(car.name) : extractBrand(carName || '');

  const { tags, uses, quality } = classifyFromType(imageType);

  const tier = car?.tier;
  const category = car?.category?.toLowerCase().replace(/-/g, ' ');

  const contentTags = [
    ...tags,
    ...(tier ? [tier] : []),
    ...(category ? [category] : []),
  ];

  const title = `${carName || carSlug} - ${imageType}`;

  let description;
  switch (imageType) {
    case 'hero':
      description = `${year || ''} ${carName || carSlug} hero shot in scenic outdoor setting, 3/4 front view.`.trim();
      break;
    case 'rear':
      description = `${year || ''} ${carName || carSlug} rear 3/4 view showing taillights, exhaust, and stance.`.trim();
      break;
    case 'interior':
      description = `${year || ''} ${carName || carSlug} interior cockpit view with steering wheel, dash, and center console.`.trim();
      break;
    case 'detail':
      description = `${year || ''} ${carName || carSlug} close-up detail of wheels, brakes, or design element.`.trim();
      break;
    case 'action':
      description = `${year || ''} ${carName || carSlug} in motion with sense of speed and dynamic background.`.trim();
      break;
    case 'overhead':
      description = `${year || ''} ${carName || carSlug} overhead view showing overall shape and roofline.`.trim();
      break;
    default:
      description = `${year || ''} ${carName || carSlug} image (${imageType}).`.trim();
  }

  const altText = `${brand} ${carName || carSlug} ${imageType} view`.trim();

  // Derive blob_path from URL (everything after the public base)
  const base = 'https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com/';
  const blobPath = blobUrl.startsWith(base) ? blobUrl.slice(base.length) : null;

  return {
    id: generateUUID(),
    car_slug: carSlug,
    brand,
    blob_url: blobUrl,
    blob_path: blobPath || `cars/${carSlug}/${imageType}.webp`,
    file_size_bytes: null,
    width: null,
    height: null,
    aspect_ratio: imageType === 'detail' ? '1:1' : '16:9',
    format: 'webp',
    source_type: 'ai-generated',
    source_url: null,
    source_attribution: null,
    license: 'owned',
    title,
    description,
    alt_text: altText,
    content_tags: contentTags,
    recommended_uses: uses,
    quality_tier: quality,
    is_primary: imageType === 'hero',
    ai_prompt: entry.promptGenerated || null,
    ai_model: entry.generationMode === 'reference-guided' ? 'gemini-3-pro-image-preview' : null,
    is_verified: false,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

let created = 0;
let skipped = 0;

for (const entry of logEntries) {
  const record = makeRecordFromLog(entry);
  if (!record) {
    skipped++;
    continue;
  }
  library.images.push(record);
  created++;
}

fs.writeFileSync(LIB_PATH, JSON.stringify(library, null, 2));

console.log('✅ Sync complete');
console.log(`   New records added: ${created}`);
console.log(`   Skipped (existing / missing data): ${skipped}`);
console.log(`   Total images in library: ${library.images.length}`);
