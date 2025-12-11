#!/usr/bin/env node
/**
 * Analyze image coverage using image-library.json (local mirror of car_images).
 *
 * Classifies each image into a coarse type based on content_tags:
 *   hero, rear, interior, detail, action, overhead, other
 * and reports per-car counts + variety.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const LIB_PATH = path.join(PROJECT_ROOT, 'image-library.json');

if (!fs.existsSync(LIB_PATH)) {
  console.error('❌ image-library.json not found at', LIB_PATH);
  process.exit(1);
}

const { images } = JSON.parse(fs.readFileSync(LIB_PATH, 'utf-8'));

function classifyType(img) {
  const tags = img.content_tags || [];
  const has = (t) => tags.includes(t);

  if (has('interior') || has('cockpit') || has('dashboard')) return 'interior';
  if (has('3/4-rear') || has('rear')) return 'rear';
  if (has('top') || has('overhead')) return 'overhead';
  if (has('detail') || has('engine') || has('wheel') || has('badge')) return 'detail';
  if (has('action') || has('motion')) return 'action';
  if (has('hero') || has('3/4-front')) return 'hero';
  return 'other';
}

const byCar = new Map();

for (const img of images) {
  const slug = img.car_slug || 'unassigned';
  const type = classifyType(img);

  if (!byCar.has(slug)) {
    byCar.set(slug, {
      carSlug: slug,
      counts: { hero: 0, rear: 0, interior: 0, detail: 0, action: 0, overhead: 0, other: 0 },
      total: 0,
      primaryCount: 0,
    });
  }
  const rec = byCar.get(slug);
  if (rec.counts[type] != null) rec.counts[type] += 1; else rec.counts.other += 1;
  rec.total += 1;
  if (img.is_primary) rec.primaryCount += 1;
}

const desiredTypes = ['hero', 'rear', 'interior', 'detail', 'action', 'overhead'];

const carsArr = Array.from(byCar.values())
  .filter(c => c.carSlug !== 'unassigned')
  .sort((a, b) => a.carSlug.localeCompare(b.carSlug));

function fmtTypes(rec) {
  return desiredTypes
    .map(t => `${t}:${rec.counts[t]}`)
    .filter(s => !s.endsWith(':0'))
    .join(', ');
}

console.log('=== IMAGE LIBRARY COVERAGE (image-library.json) ===\n');
console.log(`Total cars represented in library: ${carsArr.length}`);
console.log();

console.log('Sample (first 15 cars):');
for (const rec of carsArr.slice(0, 15)) {
  console.log(`- ${rec.carSlug} -> total:${rec.total}, ${fmtTypes(rec)}`);
}

// Cars with only hero
const heroOnly = carsArr.filter(c => c.counts.hero > 0 && desiredTypes.every(t => t === 'hero' || c.counts[t] === 0));

console.log('\n--- CARS WITH ONLY HERO IMAGES IN LIBRARY ---');
for (const rec of heroOnly) {
  console.log(`- ${rec.carSlug} -> hero:${rec.counts.hero}`);
}

const withNoInterior = carsArr.filter(c => c.counts.interior === 0);
const withNoAction = carsArr.filter(c => c.counts.action === 0);
const withNoDetail = carsArr.filter(c => c.counts.detail === 0);
const withNoRear = carsArr.filter(c => c.counts.rear === 0);

console.log(`\nCars with NO interior image: ${withNoInterior.length}`);
console.log(`Cars with NO action image: ${withNoAction.length}`);
console.log(`Cars with NO detail image: ${withNoDetail.length}`);
console.log(`Cars with NO rear image: ${withNoRear.length}`);
