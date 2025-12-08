#!/usr/bin/env node
/**
 * Batch Hero Image Generation with Tracking
 * Generates images for missing cars and tracks progress
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { carData } from '../data/cars.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const TRACKING_FILE = path.join(PROJECT_ROOT, 'hero-image-progress.json');
const IMAGES_DIR = path.join(PROJECT_ROOT, 'public/images/cars');
const GENERATED_DIR = path.join(PROJECT_ROOT, 'generated-images');

// Load tracking data
function loadProgress() {
  if (fs.existsSync(TRACKING_FILE)) {
    return JSON.parse(fs.readFileSync(TRACKING_FILE, 'utf-8'));
  }
  return {
    generated: [],
    failed: [],
    pending: [],
    lastUpdated: null,
    dailyCount: 0,
    dailyDate: null
  };
}

// Save tracking data
function saveProgress(progress) {
  progress.lastUpdated = new Date().toISOString();
  fs.writeFileSync(TRACKING_FILE, JSON.stringify(progress, null, 2));
}

// Get list of cars missing hero images
function getMissingHeroImages() {
  const existingImages = fs.readdirSync(IMAGES_DIR)
    .filter(f => f.endsWith('-hero.png') || f.endsWith('-hero.jpg') || f.endsWith('-hero.webp'))
    .map(f => f.replace(/-hero\.(png|jpg|webp)$/, '').toLowerCase());
  
  const generatedImages = fs.existsSync(GENERATED_DIR) 
    ? fs.readdirSync(GENERATED_DIR)
        .filter(f => f.endsWith('-hero.png') || f.endsWith('-hero.jpg'))
        .map(f => f.replace(/-hero\.(png|jpg)$/, '').toLowerCase())
    : [];
  
  const allImages = new Set([...existingImages, ...generatedImages]);
  
  return carData.filter(car => {
    const slug = car.slug.toLowerCase();
    return !allImages.has(slug);
  });
}

// Display status
function showStatus() {
  const progress = loadProgress();
  const missing = getMissingHeroImages();
  
  const existingCount = fs.readdirSync(IMAGES_DIR)
    .filter(f => f.includes('-hero.')).length;
  
  const generatedCount = fs.existsSync(GENERATED_DIR)
    ? fs.readdirSync(GENERATED_DIR).filter(f => f.includes('-hero.')).length
    : 0;
  
  console.log('\n=== HERO IMAGE GENERATION STATUS ===\n');
  console.log(`Total vehicles in database: ${carData.length}`);
  console.log(`Images in public/images/cars: ${existingCount}`);
  console.log(`Images in generated-images: ${generatedCount}`);
  console.log(`Still missing: ${missing.length}`);
  
  if (progress.dailyDate === new Date().toISOString().split('T')[0]) {
    console.log(`\nToday's generation count: ${progress.dailyCount}/70`);
    console.log(`Remaining quota: ${70 - progress.dailyCount}`);
  } else {
    console.log(`\nToday's generation count: 0/70 (new day)`);
    console.log(`Remaining quota: 70`);
  }
  
  console.log('\n--- MISSING IMAGES ---');
  missing.forEach((car, i) => {
    console.log(`${i + 1}. ${car.name} (${car.slug})`);
  });
  
  if (progress.generated.length > 0) {
    console.log('\n--- RECENTLY GENERATED ---');
    progress.generated.slice(-10).forEach(item => {
      console.log(`✅ ${item.slug} - ${item.timestamp}`);
    });
  }
  
  if (progress.failed.length > 0) {
    console.log('\n--- FAILED (retry needed) ---');
    progress.failed.forEach(item => {
      console.log(`❌ ${item.slug} - ${item.error}`);
    });
  }
}

// Get next batch of cars to generate
function getNextBatch(batchSize = 10) {
  const progress = loadProgress();
  const missing = getMissingHeroImages();
  
  // Filter out recently failed (within last hour) to avoid hammering API
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const recentlyFailed = new Set(
    progress.failed
      .filter(f => f.timestamp > oneHourAgo)
      .map(f => f.slug)
  );
  
  const available = missing.filter(car => !recentlyFailed.has(car.slug));
  
  return available.slice(0, batchSize);
}

// Output slugs for manual generation
function outputBatchSlugs(batchSize = 10) {
  const batch = getNextBatch(batchSize);
  
  console.log(`\n=== NEXT BATCH (${batch.length} cars) ===\n`);
  
  batch.forEach((car, i) => {
    console.log(`# ${i + 1}. ${car.name}`);
    console.log(`node scripts/generate-car-images.js single ${car.slug}`);
    console.log('');
  });
  
  console.log('\n--- BATCH COMMAND ---');
  console.log('Run these sequentially with 5 second delays:');
  console.log('');
  const slugs = batch.map(c => c.slug).join(' ');
  console.log(`SLUGS="${slugs}"`);
  console.log('for slug in $SLUGS; do');
  console.log('  node scripts/generate-car-images.js single $slug');
  console.log('  sleep 5');
  console.log('done');
}

// Main
const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case 'status':
    showStatus();
    break;
  case 'next':
    outputBatchSlugs(parseInt(arg) || 10);
    break;
  case 'mark-done':
    if (arg) {
      const progress = loadProgress();
      progress.generated.push({ slug: arg, timestamp: new Date().toISOString() });
      
      // Update daily count
      const today = new Date().toISOString().split('T')[0];
      if (progress.dailyDate !== today) {
        progress.dailyDate = today;
        progress.dailyCount = 1;
      } else {
        progress.dailyCount++;
      }
      
      saveProgress(progress);
      console.log(`✅ Marked ${arg} as done. Daily count: ${progress.dailyCount}/70`);
    }
    break;
  case 'mark-failed':
    if (arg) {
      const progress = loadProgress();
      progress.failed.push({ slug: arg, timestamp: new Date().toISOString(), error: process.argv[4] || 'Unknown error' });
      saveProgress(progress);
      console.log(`❌ Marked ${arg} as failed`);
    }
    break;
  default:
    console.log(`
Hero Image Batch Generator

Commands:
  status              Show current progress and missing images
  next [count]        Get next batch of slugs to generate (default: 10)
  mark-done <slug>    Mark a car as successfully generated
  mark-failed <slug>  Mark a car as failed

Example workflow:
  1. node scripts/batch-hero-images.js status
  2. node scripts/batch-hero-images.js next 10
  3. Run the generated commands
  4. node scripts/batch-hero-images.js mark-done <slug>
`);
}
