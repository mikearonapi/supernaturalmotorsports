#!/usr/bin/env node
/**
 * Image Library Management Script
 * 
 * Central tool for managing the car image library:
 * - Upload images to Vercel Blob with metadata tracking
 * - Generate AI images with descriptions
 * - Import existing images into the library
 * - Query and search the library
 * - Sync with Supabase database
 * 
 * Usage:
 *   node scripts/image-library.js upload <file> --car=<slug> --tags=<tags>
 *   node scripts/image-library.js generate <slug> --style=<style>
 *   node scripts/image-library.js import-existing
 *   node scripts/image-library.js status
 *   node scripts/image-library.js search --tag=<tag> --car=<slug>
 *   node scripts/image-library.js sync
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { carData } from '../data/cars.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Load environment variables
function loadEnv() {
  const envPath = path.join(PROJECT_ROOT, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        let value = valueParts.join('=');
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (key && value) {
          process.env[key] = value;
        }
      }
    }
  }
}

loadEnv();

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Optional flag to enable Supabase image sync once car_images exists
const SUPABASE_IMAGE_SYNC_ENABLED = process.env.SUPABASE_ENABLE_IMAGE_SYNC === 'true';

const GENERATED_IMAGES_DIR = path.join(PROJECT_ROOT, 'generated-images');
const PUBLIC_IMAGES_DIR = path.join(PROJECT_ROOT, 'public/images/cars');
const LOCAL_LIBRARY_FILE = path.join(PROJECT_ROOT, 'image-library.json');

// Initialize Supabase client (optional)
let supabase = null;
let supabaseWarned = false;
function getSupabase() {
  if (!SUPABASE_IMAGE_SYNC_ENABLED) {
    if (!supabaseWarned) {
      console.warn('[ImageLibrary] Supabase image sync disabled. Set SUPABASE_ENABLE_IMAGE_SYNC=true to enable.');
      supabaseWarned = true;
    }
    return null;
  }
  
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    if (!supabaseWarned) {
      console.warn('[ImageLibrary] Supabase env vars not set; skipping image sync.');
      supabaseWarned = true;
    }
    return null;
  }
  
  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  }
  return supabase;
}

// =============================================================================
// LOCAL LIBRARY (fallback when Supabase not available)
// =============================================================================

function loadLocalLibrary() {
  if (fs.existsSync(LOCAL_LIBRARY_FILE)) {
    return JSON.parse(fs.readFileSync(LOCAL_LIBRARY_FILE, 'utf-8'));
  }
  return { images: [], lastUpdated: null };
}

function saveLocalLibrary(library) {
  library.lastUpdated = new Date().toISOString();
  fs.writeFileSync(LOCAL_LIBRARY_FILE, JSON.stringify(library, null, 2));
}

// =============================================================================
// IMAGE STYLE CONFIGURATIONS
// =============================================================================

const IMAGE_STYLES = {
  hero: {
    name: 'Hero Shot',
    description: '3/4 front view in scenic outdoor environment',
    aspectRatio: '16:9',
    imageSize: '2K',
    engine: 'pro',
    tags: ['3/4-front', 'exterior', 'outdoor', 'hero'],
    uses: ['hero-banner', 'og-social', 'card-thumbnail'],
    quality: 'premium',
    generatePrompt: (car, env) => {
      const year = car.years.split('-')[0];
      return `OUTDOOR photograph, NOT in a studio: A ${year} ${car.name} driving on ${env}. The car is shown from a 3/4 front angle, captured while in motion on a real road in a natural outdoor setting. Professional automotive photography, sharp focus, beautiful scenery.`;
    },
  },
  
  rear: {
    name: 'Rear 3/4 View',
    description: 'Rear 3/4 angle showing back design',
    aspectRatio: '16:9',
    imageSize: '2K',
    engine: 'pro',
    tags: ['3/4-rear', 'exterior', 'outdoor'],
    uses: ['gallery', 'comparison-view'],
    quality: 'premium',
    generatePrompt: (car, env) => {
      const year = car.years.split('-')[0];
      return `OUTDOOR automotive photograph: A ${year} ${car.name} shown from a rear 3/4 angle, parked at ${env}. Focus on rear design, taillights, exhaust. Natural lighting, professional photography.`;
    },
  },
  
  interior: {
    name: 'Interior Cockpit',
    description: "Driver's view of cockpit and controls",
    aspectRatio: '16:9',
    imageSize: '2K',
    engine: 'pro',
    tags: ['interior', 'cockpit', 'dashboard'],
    uses: ['buying-guide', 'ownership-section', 'gallery'],
    quality: 'premium',
    generatePrompt: (car) => {
      const year = car.years.split('-')[0];
      return `Interior photograph of a ${year} ${car.name}: Driver's POV showing steering wheel, gauges, center console. Natural daylight. Focus on cockpit design and controls. Professional interior photography.`;
    },
  },
  
  action: {
    name: 'Action Shot',
    description: 'Dynamic motion shot with blur',
    aspectRatio: '16:9',
    imageSize: '1K',
    engine: 'flash',
    tags: ['action', 'motion', 'exterior', 'dynamic'],
    uses: ['hover-effect', 'excitement', 'gallery'],
    quality: 'standard',
    generatePrompt: (car, env) => {
      const year = car.years.split('-')[0];
      return `Dynamic action photograph: A ${year} ${car.name} in motion on ${env}, motion blur on background, panning shot, sense of speed. Professional motorsport photography style.`;
    },
  },
  
  detail: {
    name: 'Detail Close-up',
    description: 'Close-up of wheels, brakes, or engine',
    aspectRatio: '1:1',
    imageSize: '1K',
    engine: 'flash',
    tags: ['detail', 'close-up'],
    uses: ['thumbnail', 'enthusiast-detail', 'gallery'],
    quality: 'standard',
    generatePrompt: (car) => {
      const year = car.years.split('-')[0];
      const focus = getDetailFocus(car);
      return `Close-up detail photograph of a ${year} ${car.name}: ${focus}. Sharp focus, professional photography, natural lighting.`;
    },
  },
  
  profile: {
    name: 'Side Profile',
    description: 'Clean side-on view',
    aspectRatio: '16:9',
    imageSize: '2K',
    engine: 'pro',
    tags: ['side', 'profile', 'exterior'],
    uses: ['comparison-view', 'gallery', 'spec-sheet'],
    quality: 'premium',
    generatePrompt: (car, env) => {
      const year = car.years.split('-')[0];
      return `Side profile photograph: A ${year} ${car.name} shown from direct side view at ${env}. Clean composition showing full vehicle proportions. Professional automotive photography.`;
    },
  },
};

function getDetailFocus(car) {
  const name = car.name.toLowerCase();
  if (name.includes('gt4') || name.includes('gt3') || name.includes('gallardo') || name.includes('r8')) {
    return 'Engine bay detail showing naturally aspirated engine, intake manifold. Clean engine bay';
  }
  if (name.includes('gt350') || name.includes('amg') || name.includes('m5')) {
    return 'Exhaust tips and rear detail, quad exhaust, polished tips';
  }
  return 'Wheel and brake detail, wheel design, brake caliper visible through spokes';
}

// =============================================================================
// ENVIRONMENTS
// =============================================================================

const ENVIRONMENTS = {
  porsche: 'winding Alpine mountain pass at golden hour, snow-capped peaks, European scenery',
  bmw: 'twisting mountain road in the Bavarian Alps, autumn colors, golden hour',
  audi: 'modern European cityscape at dusk, sleek architecture',
  american: 'empty desert highway at sunset, Monument Valley silhouette',
  japanese: 'winding Japanese touge mountain road at dusk, forest backdrop',
  italian: 'sun-drenched Amalfi Coast road, Mediterranean Sea below',
  british: 'rolling English countryside road, stone walls and green hills',
  default: 'scenic winding mountain road at golden hour',
};

function getEnvironment(car) {
  const name = car.name.toLowerCase();
  if (name.includes('cayman') || name.includes('911') || name.includes('boxster')) return ENVIRONMENTS.porsche;
  if (name.includes('m2') || name.includes('m3') || name.includes('m4') || name.includes('m5')) return ENVIRONMENTS.bmw;
  if (name.includes('rs') || name.includes('r8') || name.includes('tt')) return ENVIRONMENTS.audi;
  if (name.includes('corvette') || name.includes('mustang') || name.includes('camaro') || name.includes('viper')) return ENVIRONMENTS.american;
  if (name.includes('supra') || name.includes('370z') || name.includes('gt-r') || name.includes('miata')) return ENVIRONMENTS.japanese;
  if (name.includes('gallardo') || name.includes('maserati') || name.includes('alfa') || name.includes('giulia')) return ENVIRONMENTS.italian;
  if (name.includes('lotus') || name.includes('jaguar') || name.includes('aston')) return ENVIRONMENTS.british;
  return ENVIRONMENTS.default;
}

// =============================================================================
// BRAND EXTRACTION
// =============================================================================

function extractBrand(name) {
  const brandMap = {
    'cayman': 'Porsche', 'carrera': 'Porsche', '911': 'Porsche', 'boxster': 'Porsche',
    'm2': 'BMW', 'm3': 'BMW', 'm4': 'BMW', 'm5': 'BMW', 'z4': 'BMW',
    'r8': 'Audi', 'rs3': 'Audi', 'rs5': 'Audi', 'tt': 'Audi',
    'c63': 'Mercedes-AMG', 'amg': 'Mercedes-AMG',
    'corvette': 'Chevrolet', 'camaro': 'Chevrolet',
    'mustang': 'Ford', 'gt350': 'Ford', 'gt500': 'Ford', 'shelby': 'Ford',
    'viper': 'Dodge', 'challenger': 'Dodge',
    'gt-r': 'Nissan', '370z': 'Nissan',
    'supra': 'Toyota', 'gr86': 'Toyota',
    'lc 500': 'Lexus', 'rc f': 'Lexus',
    'miata': 'Mazda', 'mx-5': 'Mazda',
    'brz': 'Subaru', 'wrx': 'Subaru',
    's2000': 'Honda', 'nsx': 'Acura',
    'gallardo': 'Lamborghini',
    'granturismo': 'Maserati',
    '4c': 'Alfa Romeo', 'giulia': 'Alfa Romeo',
    'emira': 'Lotus', 'evora': 'Lotus',
    'vantage': 'Aston Martin',
    'f-type': 'Jaguar',
  };
  
  const nameLower = name.toLowerCase();
  for (const [key, brand] of Object.entries(brandMap)) {
    if (nameLower.includes(key)) return brand;
  }
  return null;
}

// =============================================================================
// IMAGE GENERATION
// =============================================================================

async function generateImage(prompt, outputPath, options = {}) {
  if (!GOOGLE_AI_API_KEY) {
    throw new Error('GOOGLE_AI_API_KEY not set');
  }
  
  const aspectRatio = options.aspectRatio || '16:9';
  const imageSize = options.imageSize || '2K';
  const engine = options.engine || 'pro';
  
  const modelName = engine === 'flash' ? 'gemini-2.5-flash-image' : 'gemini-3-pro-image-preview';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GOOGLE_AI_API_KEY}`;
  
  console.log(`🎨 Generating with ${engine === 'flash' ? 'Flash' : 'Pro'}...`);
  
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: engine === 'pro' ? { aspectRatio, imageSize } : { aspectRatio }
    }
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error (${response.status}): ${errorText}`);
  }
  
  const result = await response.json();
  const candidates = result.candidates || [];
  if (candidates.length === 0) throw new Error('No candidates in response');
  
  const parts = candidates[0].content?.parts || [];
  const imagePart = parts.find(p => p.inlineData);
  const textPart = parts.find(p => p.text);
  
  if (!imagePart) throw new Error('No image in response');
  
  const imageData = imagePart.inlineData.data;
  const mimeType = imagePart.inlineData.mimeType || 'image/png';
  
  let ext = '.png';
  if (mimeType === 'image/jpeg') ext = '.jpg';
  if (mimeType === 'image/webp') ext = '.webp';
  
  const buffer = Buffer.from(imageData, 'base64');
  const finalPath = outputPath.replace(/\.(webp|png|jpg)$/, ext);
  
  fs.writeFileSync(finalPath, buffer);
  
  // Return metadata about the generated image
  return {
    localPath: finalPath,
    format: ext.slice(1),
    fileSize: buffer.length,
    aiNotes: textPart?.text || null,
  };
}

// =============================================================================
// BLOB UPLOAD
// =============================================================================

async function uploadToBlob(localPath, blobPath) {
  if (!BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN not set');
  }
  
  const { put } = await import('@vercel/blob');
  
  const fileBuffer = fs.readFileSync(localPath);
  const contentType = localPath.endsWith('.webp') ? 'image/webp' : 
                      localPath.endsWith('.jpg') ? 'image/jpeg' : 'image/png';
  
  const blob = await put(blobPath, fileBuffer, {
    access: 'public',
    contentType,
    token: BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  
  return blob.url;
}

// =============================================================================
// LIBRARY OPERATIONS
// =============================================================================

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Create image record with full metadata
 */
function createImageRecord(options) {
  const {
    carSlug,
    blobUrl,
    blobPath,
    sourceType = 'ai-generated',
    license = 'owned',
    title,
    description,
    altText,
    contentTags = [],
    recommendedUses = [],
    qualityTier = 'standard',
    isPrimary = false,
    aiPrompt = null,
    aiModel = null,
    sourceUrl = null,
    sourceAttribution = null,
    format = 'png',
    fileSize = null,
    width = null,
    height = null,
    aspectRatio = '16:9',
  } = options;
  
  return {
    id: generateUUID(),
    car_slug: carSlug,
    brand: carSlug ? extractBrand(carData.find(c => c.slug === carSlug)?.name || '') : null,
    blob_url: blobUrl,
    blob_path: blobPath,
    file_size_bytes: fileSize,
    width,
    height,
    aspect_ratio: aspectRatio,
    format,
    source_type: sourceType,
    source_url: sourceUrl,
    source_attribution: sourceAttribution,
    license,
    title,
    description,
    alt_text: altText || description,
    content_tags: contentTags,
    recommended_uses: recommendedUses,
    quality_tier: qualityTier,
    is_primary: isPrimary,
    ai_prompt: aiPrompt,
    ai_model: aiModel,
    is_verified: false,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Generate and upload image with full metadata tracking
 */
async function generateAndTrackImage(carSlug, style = 'hero') {
  const car = carData.find(c => c.slug === carSlug);
  if (!car) {
    throw new Error(`Car not found: ${carSlug}`);
  }
  
  const styleConfig = IMAGE_STYLES[style];
  if (!styleConfig) {
    throw new Error(`Unknown style: ${style}. Available: ${Object.keys(IMAGE_STYLES).join(', ')}`);
  }
  
  console.log(`\n📸 Generating ${styleConfig.name} for ${car.name}...`);
  
  const env = getEnvironment(car);
  const prompt = styleConfig.generatePrompt(car, env);
  
  console.log(`📝 Prompt: ${prompt.substring(0, 100)}...`);
  
  // Generate image
  const localPath = path.join(GENERATED_IMAGES_DIR, `${carSlug}-${style}.png`);
  if (!fs.existsSync(GENERATED_IMAGES_DIR)) {
    fs.mkdirSync(GENERATED_IMAGES_DIR, { recursive: true });
  }
  
  const genResult = await generateImage(prompt, localPath, {
    aspectRatio: styleConfig.aspectRatio,
    imageSize: styleConfig.imageSize,
    engine: styleConfig.engine,
  });
  
  console.log(`✅ Generated: ${genResult.localPath}`);
  
  // Upload to Blob
  const blobPath = `cars/${carSlug}/${style}.webp`;
  const blobUrl = await uploadToBlob(genResult.localPath, blobPath);
  
  console.log(`☁️  Uploaded: ${blobUrl}`);
  
  // Create metadata record
  const year = car.years.split('-')[0];
  const brand = extractBrand(car.name);
  
  const description = generateDescription(car, style, styleConfig);
  const isPrimary = style === 'hero';
  
  const record = createImageRecord({
    carSlug,
    blobUrl,
    blobPath,
    sourceType: 'ai-generated',
    license: 'owned',
    title: `${car.name} - ${styleConfig.name}`,
    description,
    altText: `${brand || ''} ${car.name} ${styleConfig.description}`.trim(),
    contentTags: [...styleConfig.tags, car.tier, car.category.toLowerCase().replace('-', ' ')],
    recommendedUses: styleConfig.uses,
    qualityTier: styleConfig.quality,
    isPrimary,
    aiPrompt: prompt,
    aiModel: styleConfig.engine === 'flash' ? 'gemini-2.5-flash-image' : 'gemini-3-pro-image-preview',
    format: genResult.format,
    fileSize: genResult.fileSize,
    aspectRatio: styleConfig.aspectRatio,
  });
  
  // Save to local library
  const library = loadLocalLibrary();
  
  // Remove existing image with same car_slug and style tags
  library.images = library.images.filter(img => 
    !(img.car_slug === carSlug && img.content_tags.includes(style))
  );
  
  library.images.push(record);
  saveLocalLibrary(library);
  
  console.log(`📚 Recorded in library: ${record.id}`);
  
  // Sync to Supabase if available
  const sb = getSupabase();
  if (sb) {
    try {
      const { error } = await sb.from('car_images').upsert(record, { onConflict: 'id' });
      if (error) {
        console.warn(`⚠️  Supabase sync failed: ${error.message}`);
      } else {
        console.log(`🔄 Synced to Supabase`);
      }
    } catch (e) {
      console.warn(`⚠️  Supabase sync error: ${e.message}`);
    }
  }
  
  return record;
}

function generateDescription(car, style, styleConfig) {
  const year = car.years.split('-')[0];
  const brand = extractBrand(car.name) || '';
  
  switch (style) {
    case 'hero':
      return `${year} ${car.name} in ${styleConfig.description}. ${brand} sports car captured on scenic mountain road with dramatic lighting.`;
    case 'rear':
      return `${year} ${car.name} shown from rear 3/4 angle. View of taillights, exhaust system, and rear design details.`;
    case 'interior':
      return `Interior cockpit view of ${year} ${car.name}. Dashboard, steering wheel, gauges, and center console visible.`;
    case 'action':
      return `${year} ${car.name} in motion with dynamic blur effect. Panning shot capturing speed and performance.`;
    case 'detail':
      return `Close-up detail shot of ${year} ${car.name}. ${getDetailFocus(car).split('.')[0]}.`;
    case 'profile':
      return `Side profile view of ${year} ${car.name}. Clean composition showing full vehicle proportions.`;
    default:
      return `${year} ${car.name} - ${styleConfig.description}`;
  }
}

// =============================================================================
// IMPORT EXISTING IMAGES
// =============================================================================

async function importExistingImages() {
  console.log('\n📥 Importing existing images into library...\n');
  
  const library = loadLocalLibrary();
  let imported = 0;
  let skipped = 0;
  let noImage = 0;
  
  // Import from car data's imageHeroUrl (Vercel Blob URLs)
  for (const car of carData) {
    // Check if already in library
    const exists = library.images.some(img => 
      img.car_slug === car.slug && img.content_tags.includes('hero')
    );
    
    if (exists) {
      skipped++;
      continue;
    }
    
    // Check for Vercel Blob URL first
    if (car.imageHeroUrl) {
      const record = createImageRecord({
        carSlug: car.slug,
        blobUrl: car.imageHeroUrl,
        blobPath: `cars/${car.slug}/hero.webp`,
        sourceType: 'ai-generated',
        license: 'owned',
        title: `${car.name} - Hero Shot`,
        description: generateHeroDescription(car),
        altText: `${extractBrand(car.name) || ''} ${car.name} - 3/4 front view`.trim(),
        contentTags: ['3/4-front', 'exterior', 'outdoor', 'hero', car.tier, car.category.toLowerCase().replace('-', ' ')],
        recommendedUses: ['hero-banner', 'og-social', 'card-thumbnail'],
        qualityTier: 'premium',
        isPrimary: true,
        format: 'webp',
        aspectRatio: '16:9',
      });
      
      library.images.push(record);
      imported++;
      console.log(`✅ Imported: ${car.name}`);
      continue;
    }
    
    // Fallback to local file
    const localFile = `${car.slug}-hero.png`;
    const localPath = path.join(PUBLIC_IMAGES_DIR, localFile);
    
    if (fs.existsSync(localPath)) {
      const stats = fs.statSync(localPath);
      
      const record = createImageRecord({
        carSlug: car.slug,
        blobUrl: `/images/cars/${localFile}`,
        blobPath: `cars/${car.slug}/hero.png`,
        sourceType: 'ai-generated',
        license: 'owned',
        title: `${car.name} - Hero Shot`,
        description: generateHeroDescription(car),
        altText: `${extractBrand(car.name) || ''} ${car.name} hero image`.trim(),
        contentTags: ['3/4-front', 'exterior', 'outdoor', 'hero', car.tier],
        recommendedUses: ['hero-banner', 'og-social', 'card-thumbnail'],
        qualityTier: 'premium',
        isPrimary: true,
        format: 'png',
        fileSize: stats.size,
        aspectRatio: '16:9',
      });
      
      library.images.push(record);
      imported++;
      console.log(`✅ Imported (local): ${car.name}`);
    } else {
      noImage++;
      console.log(`⚠️  No image found: ${car.name}`);
    }
  }
  
  saveLocalLibrary(library);
  
  console.log(`\n📊 Import complete:`);
  console.log(`   Imported: ${imported}`);
  console.log(`   Skipped (already exists): ${skipped}`);
  console.log(`   No image found: ${noImage}`);
  console.log(`   Total in library: ${library.images.length}`);
}

/**
 * Import page-level images into the library
 * Uses Vercel Blob URLs as the source of truth
 */
async function importPageImages() {
  console.log('\n📥 Importing page images into library (from Vercel Blob)...\n');
  
  const library = loadLocalLibrary();
  let imported = 0;
  let skipped = 0;
  
  const BLOB_BASE = 'https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com';
  
  // Page images with their Vercel Blob paths (source of truth)
  const PAGE_IMAGES = {
    'home-hero': {
      blobPath: 'pages/home/hero.webp',
      title: 'Home Page Hero',
      description: 'Sunday morning mountain drive, sports car on scenic winding road at golden hour. Captures the weekend warrior spirit.',
      tags: ['hero', 'outdoor', 'scenic', 'mountain', 'action'],
      uses: ['hero-banner', 'og-social'],
      aspectRatio: '16:9',
      quality: 'premium',
    },
    'home-value': {
      blobPath: 'pages/home/value-section.webp',
      title: 'Home Value Section',
      description: 'Enthusiast in home garage working on sports car. DIY maintenance and weekend project vibes.',
      tags: ['garage', 'lifestyle', 'diy', 'maintenance'],
      uses: ['value-section', 'about'],
      aspectRatio: '16:9',
      quality: 'standard',
    },
    'home-feature': {
      blobPath: 'pages/home/feature-car.webp',
      title: 'Home Featured Car',
      description: 'Sports car at scenic overlook, golden hour lighting. Aspirational weekend drive destination.',
      tags: ['outdoor', 'scenic', 'overlook', 'sunset'],
      uses: ['feature-section', 'highlight'],
      aspectRatio: '16:9',
      quality: 'standard',
    },
    'advisory-hero': {
      blobPath: 'pages/advisory/hero.webp',
      title: 'Car Selector Hero',
      description: 'Cars and coffee meet with diverse sports cars. Community gathering of enthusiasts.',
      tags: ['hero', 'community', 'cars-and-coffee', 'lifestyle'],
      uses: ['hero-banner', 'car-selector'],
      aspectRatio: '16:9',
      quality: 'premium',
    },
    'performance-hero': {
      blobPath: 'pages/performance/hero.webp',
      title: 'Performance Hub Hero',
      description: 'Track day or canyon carving scene. Performance driving in action.',
      tags: ['hero', 'track', 'action', 'performance'],
      uses: ['hero-banner', 'performance'],
      aspectRatio: '16:9',
      quality: 'premium',
    },
    'services-hero': {
      blobPath: 'pages/services/hero.webp',
      title: 'Services Hero',
      description: 'Friendly independent shop environment. Professional but approachable service setting.',
      tags: ['hero', 'shop', 'service', 'professional'],
      uses: ['hero-banner', 'services'],
      aspectRatio: '16:9',
      quality: 'premium',
    },
    'services-workshop': {
      blobPath: 'pages/services/workshop.webp',
      title: 'Services Workshop',
      description: 'Owner and mechanic collaborating. Professional service consultation.',
      tags: ['workshop', 'service', 'professional', 'collaboration'],
      uses: ['services', 'workshop'],
      aspectRatio: '16:9',
      quality: 'standard',
    },
    'contact-hero': {
      blobPath: 'pages/contact/hero.webp',
      title: 'Contact Hero',
      description: 'Welcoming garage with sports car at dusk. Inviting atmosphere for contact page.',
      tags: ['hero', 'garage', 'warm', 'contact'],
      uses: ['hero-banner', 'contact'],
      aspectRatio: '16:9',
      quality: 'premium',
    },
    'upgrades-hero': {
      blobPath: 'pages/upgrades/hero.webp',
      title: 'Upgrades Hero',
      description: 'Aftermarket parts on workbench. Upgrade and modification preparation.',
      tags: ['hero', 'upgrades', 'parts', 'workshop'],
      uses: ['hero-banner', 'upgrades'],
      aspectRatio: '16:9',
      quality: 'premium',
    },
    'upgrades-garage': {
      blobPath: 'pages/upgrades/garage.webp',
      title: 'Upgrades Garage',
      description: 'DIY project in home garage. Enthusiast working on modifications.',
      tags: ['garage', 'diy', 'upgrades', 'workshop'],
      uses: ['upgrades', 'diy-section'],
      aspectRatio: '16:9',
      quality: 'standard',
    },
    // Shared/atmospheric images
    'engine-bay': {
      blobPath: 'shared/engine-bay.webp',
      title: 'Engine Bay Detail',
      description: 'Clean V8 or flat-6 engine bay. Performance engine detail shot.',
      tags: ['detail', 'engine', 'mechanical', 'technical'],
      uses: ['detail-shot', 'enthusiast'],
      aspectRatio: '16:9',
      quality: 'standard',
    },
    'brake-detail': {
      blobPath: 'shared/brake-detail.webp',
      title: 'Brake Detail',
      description: 'Upgraded brake system close-up. Big brake kit with slotted rotors.',
      tags: ['detail', 'brakes', 'mechanical', 'upgrade'],
      uses: ['detail-shot', 'upgrade-section'],
      aspectRatio: '1:1',
      quality: 'standard',
    },
    'wheel-detail': {
      blobPath: 'shared/wheel-detail.webp',
      title: 'Wheel Detail',
      description: 'Quality aftermarket wheel with visible brake caliper. Wheel and brake detail.',
      tags: ['detail', 'wheel', 'brakes'],
      uses: ['detail-shot', 'upgrade-section'],
      aspectRatio: '1:1',
      quality: 'standard',
    },
    'cockpit-view': {
      blobPath: 'shared/cockpit-view.webp',
      title: 'Cockpit View',
      description: "Driver POV, hands on steering wheel. First-person driving perspective.",
      tags: ['interior', 'cockpit', 'pov', 'driving'],
      uses: ['interior', 'experience'],
      aspectRatio: '16:9',
      quality: 'standard',
    },
    'exhaust-tips': {
      blobPath: 'shared/exhaust-tips.webp',
      title: 'Exhaust Tips',
      description: 'Aftermarket exhaust detail. Performance exhaust tips close-up.',
      tags: ['detail', 'exhaust', 'mechanical'],
      uses: ['detail-shot', 'upgrade-section'],
      aspectRatio: '16:9',
      quality: 'standard',
    },
    'suspension-setup': {
      blobPath: 'shared/suspension-setup.webp',
      title: 'Suspension Setup',
      description: 'Coilover visible through wheel well. Suspension upgrade detail.',
      tags: ['detail', 'suspension', 'mechanical', 'upgrade'],
      uses: ['detail-shot', 'upgrade-section'],
      aspectRatio: '16:9',
      quality: 'standard',
    },
    'garage-mood': {
      blobPath: 'shared/garage-mood.webp',
      title: 'Garage Mood',
      description: 'Moody home garage at dusk. Atmospheric enthusiast garage scene.',
      tags: ['garage', 'mood', 'atmosphere', 'lifestyle'],
      uses: ['atmosphere', 'background'],
      aspectRatio: '16:9',
      quality: 'standard',
    },
    'cars-and-coffee': {
      blobPath: 'shared/cars-and-coffee.webp',
      title: 'Cars and Coffee',
      description: 'Casual car meet community gathering. Enthusiasts with diverse sports cars.',
      tags: ['community', 'lifestyle', 'cars-and-coffee', 'social'],
      uses: ['community', 'lifestyle'],
      aspectRatio: '16:9',
      quality: 'standard',
    },
    'canyon-road': {
      blobPath: 'shared/canyon-road.webp',
      title: 'Canyon Road',
      description: 'Empty winding driving road through canyon. Perfect driving road scenery.',
      tags: ['scenic', 'road', 'canyon', 'driving'],
      uses: ['background', 'atmosphere'],
      aspectRatio: '16:9',
      quality: 'standard',
    },
    'track-day-fun': {
      blobPath: 'shared/track-day-fun.webp',
      title: 'Track Day Fun',
      description: 'Amateur track day scene. Enthusiast track event atmosphere.',
      tags: ['track', 'action', 'motorsport', 'fun'],
      uses: ['track', 'performance'],
      aspectRatio: '16:9',
      quality: 'standard',
    },
    'sunset-drive': {
      blobPath: 'shared/sunset-drive.webp',
      title: 'Sunset Drive',
      description: 'Car silhouette at sunset. Atmospheric end-of-day driving scene.',
      tags: ['sunset', 'silhouette', 'mood', 'atmosphere'],
      uses: ['atmosphere', 'background'],
      aspectRatio: '16:9',
      quality: 'standard',
    },
  };
  
  for (const [key, meta] of Object.entries(PAGE_IMAGES)) {
    // Check if already in library
    const exists = library.images.some(img => 
      img.blob_path === meta.blobPath || img.title === meta.title
    );
    
    if (exists) {
      skipped++;
      continue;
    }
    
    const blobUrl = `${BLOB_BASE}/${meta.blobPath}`;
    
    const record = createImageRecord({
      carSlug: null,  // Not car-specific
      blobUrl: blobUrl,
      blobPath: meta.blobPath,
      sourceType: 'ai-generated',
      license: 'owned',
      title: meta.title,
      description: meta.description,
      altText: meta.title,
      contentTags: [...meta.tags, 'page-image'],
      recommendedUses: meta.uses,
      qualityTier: meta.quality,
      isPrimary: false,
      format: 'webp',
      aspectRatio: meta.aspectRatio,
    });
    
    library.images.push(record);
    imported++;
    console.log(`✅ Imported: ${meta.title}`);
    console.log(`   URL: ${blobUrl}`);
  }
  
  saveLocalLibrary(library);
  
  console.log(`\n📊 Page images import complete:`);
  console.log(`   Imported: ${imported}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total in library: ${library.images.length}`);
}

function generateHeroDescription(car) {
  const year = car.years.split('-')[0];
  const brand = extractBrand(car.name) || '';
  const env = getEnvironment(car);
  
  // Generate a rich description based on car characteristics
  let desc = `${year} ${car.name}`;
  
  if (brand) {
    desc += ` (${brand})`;
  }
  
  desc += ` shown from 3/4 front angle in scenic outdoor setting.`;
  
  // Add context based on brand/type
  if (car.category === 'Mid-Engine') {
    desc += ` Mid-engine sports car with dramatic proportions.`;
  } else if (car.category === 'Rear-Engine') {
    desc += ` Rear-engine layout showcasing classic design.`;
  }
  
  if (car.tier === 'premium') {
    desc += ` Premium exotic captured at golden hour.`;
  } else if (car.tier === 'budget') {
    desc += ` Accessible sports car on scenic backroad.`;
  }
  
  return desc;
}

// =============================================================================
// STATUS & SEARCH
// =============================================================================

function showStatus() {
  const library = loadLocalLibrary();
  
  console.log('\n' + '='.repeat(70));
  console.log('📚 IMAGE LIBRARY STATUS');
  console.log('='.repeat(70));
  
  console.log(`\nTotal images: ${library.images.length}`);
  console.log(`Last updated: ${library.lastUpdated || 'Never'}`);
  
  // By source type
  const bySource = {};
  library.images.forEach(img => {
    bySource[img.source_type] = (bySource[img.source_type] || 0) + 1;
  });
  
  console.log('\nBy Source:');
  Object.entries(bySource).forEach(([source, count]) => {
    console.log(`  ${source}: ${count}`);
  });
  
  // By quality
  const byQuality = {};
  library.images.forEach(img => {
    byQuality[img.quality_tier] = (byQuality[img.quality_tier] || 0) + 1;
  });
  
  console.log('\nBy Quality:');
  Object.entries(byQuality).forEach(([quality, count]) => {
    console.log(`  ${quality}: ${count}`);
  });
  
  // Coverage by style
  const styles = Object.keys(IMAGE_STYLES);
  console.log('\nCoverage by Style:');
  
  styles.forEach(style => {
    const carsWithStyle = new Set(
      library.images
        .filter(img => img.content_tags.includes(style))
        .map(img => img.car_slug)
    );
    const pct = ((carsWithStyle.size / carData.length) * 100).toFixed(1);
    const bar = '█'.repeat(Math.floor(pct / 5)) + '░'.repeat(20 - Math.floor(pct / 5));
    console.log(`  ${style.padEnd(10)} ${bar} ${pct}% (${carsWithStyle.size}/${carData.length})`);
  });
  
  // Cars with most images
  const carImageCounts = {};
  library.images.forEach(img => {
    if (img.car_slug) {
      carImageCounts[img.car_slug] = (carImageCounts[img.car_slug] || 0) + 1;
    }
  });
  
  const topCars = Object.entries(carImageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  if (topCars.length > 0) {
    console.log('\nTop Cars by Image Count:');
    topCars.forEach(([slug, count]) => {
      const car = carData.find(c => c.slug === slug);
      console.log(`  ${count} images: ${car?.name || slug}`);
    });
  }
  
  // Cars with no images
  const carsWithImages = new Set(Object.keys(carImageCounts));
  const carsWithoutImages = carData.filter(c => !carsWithImages.has(c.slug));
  
  console.log(`\nCars without images: ${carsWithoutImages.length}`);
  if (carsWithoutImages.length > 0 && carsWithoutImages.length <= 10) {
    carsWithoutImages.forEach(car => {
      console.log(`  - ${car.name}`);
    });
  }
}

function searchLibrary(options = {}) {
  const library = loadLocalLibrary();
  let results = library.images;
  
  if (options.car) {
    results = results.filter(img => img.car_slug === options.car);
  }
  
  if (options.tag) {
    results = results.filter(img => img.content_tags.includes(options.tag));
  }
  
  if (options.use) {
    results = results.filter(img => img.recommended_uses.includes(options.use));
  }
  
  if (options.source) {
    results = results.filter(img => img.source_type === options.source);
  }
  
  if (options.quality) {
    results = results.filter(img => img.quality_tier === options.quality);
  }
  
  console.log(`\n🔍 Found ${results.length} images:\n`);
  
  results.forEach(img => {
    console.log(`ID: ${img.id}`);
    console.log(`   Car: ${img.car_slug || 'N/A'}`);
    console.log(`   Title: ${img.title}`);
    console.log(`   URL: ${img.blob_url}`);
    console.log(`   Tags: ${img.content_tags.join(', ')}`);
    console.log(`   Uses: ${img.recommended_uses.join(', ')}`);
    console.log(`   Description: ${img.description.substring(0, 100)}...`);
    console.log('');
  });
  
  return results;
}

// =============================================================================
// BATCH OPERATIONS
// =============================================================================

async function batchGenerate(style, options = {}) {
  const { limit = 5, delay = 5000 } = options;
  
  const styleConfig = IMAGE_STYLES[style];
  if (!styleConfig) {
    console.error(`Unknown style: ${style}`);
    return;
  }
  
  const library = loadLocalLibrary();
  
  // Find cars missing this style
  const carsWithStyle = new Set(
    library.images
      .filter(img => img.content_tags.includes(style))
      .map(img => img.car_slug)
  );
  
  const carsToProcess = carData
    .filter(car => !carsWithStyle.has(car.slug))
    .slice(0, limit);
  
  console.log(`\n📦 Batch generating "${style}" for ${carsToProcess.length} cars...\n`);
  
  const results = { success: [], failed: [] };
  
  for (let i = 0; i < carsToProcess.length; i++) {
    const car = carsToProcess[i];
    console.log(`\n[${i + 1}/${carsToProcess.length}] ${car.name}`);
    
    try {
      const record = await generateAndTrackImage(car.slug, style);
      results.success.push(record);
    } catch (error) {
      console.error(`❌ Failed: ${error.message}`);
      results.failed.push({ slug: car.slug, error: error.message });
    }
    
    if (i < carsToProcess.length - 1) {
      console.log(`⏳ Waiting ${delay/1000}s...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 BATCH COMPLETE');
  console.log('='.repeat(60));
  console.log(`✅ Success: ${results.success.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  
  if (results.failed.length > 0) {
    console.log('\nFailed:');
    results.failed.forEach(f => console.log(`  - ${f.slug}: ${f.error}`));
  }
}

// =============================================================================
// SYNC TO SUPABASE
// =============================================================================

async function syncToSupabase() {
  const sb = getSupabase();
  if (!sb) {
    console.error('❌ Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    return;
  }
  
  const library = loadLocalLibrary();
  
  console.log(`\n🔄 Syncing ${library.images.length} images to Supabase...\n`);
  
  let synced = 0;
  let failed = 0;
  
  for (const img of library.images) {
    const { error } = await sb.from('car_images').upsert(img, { onConflict: 'id' });
    
    if (error) {
      console.error(`❌ ${img.car_slug}: ${error.message}`);
      failed++;
    } else {
      synced++;
    }
  }
  
  console.log(`\n✅ Synced: ${synced}`);
  console.log(`❌ Failed: ${failed}`);
}

// =============================================================================
// MAIN
// =============================================================================

const command = process.argv[2];
const arg1 = process.argv[3];

// Parse flags
const flags = {};
process.argv.slice(3).forEach(arg => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    flags[key] = value || true;
  }
});

switch (command) {
  case 'generate':
    if (!arg1) {
      console.error('Usage: node scripts/image-library.js generate <slug> --style=<style>');
      console.log(`       Styles: ${Object.keys(IMAGE_STYLES).join(', ')}`);
      process.exit(1);
    }
    generateAndTrackImage(arg1, flags.style || 'hero');
    break;
    
  case 'batch':
    if (!arg1) {
      console.error('Usage: node scripts/image-library.js batch <style> --limit=5 --delay=5000');
      process.exit(1);
    }
    batchGenerate(arg1, { 
      limit: parseInt(flags.limit) || 5, 
      delay: parseInt(flags.delay) || 5000 
    });
    break;
    
  case 'import-existing':
    importExistingImages();
    break;
    
  case 'import-pages':
    importPageImages();
    break;
    
  case 'import-all':
    await importExistingImages();
    await importPageImages();
    break;
    
  case 'status':
    showStatus();
    break;
    
  case 'search':
    searchLibrary(flags);
    break;
    
  case 'sync':
    syncToSupabase();
    break;
    
  case 'get':
    if (!arg1) {
      console.error('Usage: node scripts/image-library.js get <image-id>');
      process.exit(1);
    }
    const library = loadLocalLibrary();
    const img = library.images.find(i => i.id === arg1);
    if (img) {
      console.log(JSON.stringify(img, null, 2));
    } else {
      console.error('Image not found');
    }
    break;
    
  default:
    console.log(`
📚 Image Library Management
━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMMANDS:
  generate <slug>           Generate and track a single image
    --style=hero            Style: hero, rear, interior, action, detail, profile
    
  batch <style>             Generate style for multiple cars
    --limit=5               Max cars to process
    --delay=5000            Delay between generations (ms)
    
  import-existing           Import existing images into library
  
  status                    Show library statistics
  
  search                    Search the library
    --car=<slug>            Filter by car
    --tag=<tag>             Filter by content tag
    --use=<use>             Filter by recommended use
    --source=<source>       Filter by source type
    --quality=<quality>     Filter by quality tier
    
  sync                      Sync local library to Supabase
  
  get <id>                  Get full details for an image

EXAMPLES:
  node scripts/image-library.js status
  node scripts/image-library.js import-existing
  node scripts/image-library.js generate 718-cayman-gt4 --style=rear
  node scripts/image-library.js batch hero --limit=10
  node scripts/image-library.js search --tag=interior --quality=premium
`);
}
