#!/usr/bin/env node
/**
 * Analyze AI image coverage per car based on generated-images/inspiration-log.json
 *
 * Outputs:
 * - Per-car counts by imageType (hero, rear, interior, detail, action, overhead)
 * - Cars with good variety
 * - Cars with gaps (no hero, or missing secondary types)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const LOG_PATH = path.join(PROJECT_ROOT, 'generated-images', 'inspiration-log.json');

if (!fs.existsSync(LOG_PATH)) {
  console.error('❌ No inspiration-log.json found at', LOG_PATH);
  process.exit(1);
}

/** @typedef {{ carSlug:string, carName:string, imageType:string }} LogEntry */

/** @type {LogEntry[]} */
const entries = JSON.parse(fs.readFileSync(LOG_PATH, 'utf-8'));

// Aggregate by carSlug
const byCar = new Map();

for (const entry of entries) {
  const { carSlug, carName, imageType } = entry;
  if (!carSlug || !imageType) continue;

  if (!byCar.has(carSlug)) {
    byCar.set(carSlug, {
      carSlug,
      carName,
      counts: { hero: 0, rear: 0, interior: 0, detail: 0, action: 0, overhead: 0 },
      types: new Set(),
      total: 0,
    });
  }
  const rec = byCar.get(carSlug);
  if (rec.counts[imageType] !== undefined) {
    rec.counts[imageType] += 1;
  }
  rec.types.add(imageType);
  rec.total += 1;
}

// Desired types for variety
const desiredTypes = ['hero', 'rear', 'interior', 'detail', 'action', 'overhead'];

const carsArr = Array.from(byCar.values()).sort((a, b) => a.carSlug.localeCompare(b.carSlug));

const wellCovered = [];
const mediumCovered = [];
const minimal = [];

for (const car of carsArr) {
  const typeCount = car.types.size;
  const hasHero = car.counts.hero > 0;

  if (typeCount >= 3 && hasHero) {
    wellCovered.push(car);
  } else if (typeCount === 2 || (typeCount >= 2 && !hasHero)) {
    mediumCovered.push(car);
  } else {
    minimal.push(car);
  }
}

function fmtTypes(car) {
  return desiredTypes
    .map(t => `${t}:${car.counts[t]}`)
    .filter(s => !s.endsWith(':0'))
    .join(', ');
}

console.log('=== IMAGE COVERAGE SUMMARY (from inspiration-log.json) ===\n');
console.log(`Total cars with at least one generated image: ${carsArr.length}`);
console.log();

console.log('--- WELL-COVERED CARS (>=3 image types including hero) ---');
for (const car of wellCovered) {
  console.log(`- ${car.carSlug} (${car.carName}) -> ${fmtTypes(car)}`);
}
console.log();

console.log('--- MEDIUM-COVERED CARS (2 image types) ---');
for (const car of mediumCovered) {
  console.log(`- ${car.carSlug} (${car.carName}) -> ${fmtTypes(car)}`);
}
console.log();

console.log('--- MINIMAL-COVERED CARS (1 image type) ---');
for (const car of minimal) {
  console.log(`- ${car.carSlug} (${car.carName}) -> ${fmtTypes(car)}`);
}
console.log();

console.log('--- CARS WITH NO HERO IMAGE IN LOG (but at least one other type) ---');
for (const car of carsArr.filter(c => c.counts.hero === 0)) {
  console.log(`- ${car.carSlug} (${car.carName}) -> ${fmtTypes(car)}`);
}

console.log();
console.log('Desired types per car:', desiredTypes.join(', '));
