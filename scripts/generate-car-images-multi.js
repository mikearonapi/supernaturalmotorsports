#!/usr/bin/env node
/**
 * Multi-Image Car Generation Script
 * 
 * Generates multiple image types per car for site diversity:
 * - hero: Premium 3/4 front scenic (existing pipeline)
 * - rear: Rear 3/4 angle showing back styling
 * - interior: Cockpit/driver's perspective
 * - action: Dynamic motion shot
 * - detail: Engine bay or wheel close-up
 * 
 * Uses Google's Imagen 3 API (Nano Banana Pro/Flash)
 * 
 * Usage:
 *   node scripts/generate-car-images-multi.js status               # Show image coverage
 *   node scripts/generate-car-images-multi.js generate <slug> <type> # Generate one image
 *   node scripts/generate-car-images-multi.js generate-set <slug>  # Generate all types for a car
 *   node scripts/generate-car-images-multi.js batch <type>         # Batch generate one type for all cars
 *   node scripts/generate-car-images-multi.js list-missing <type>  # List cars missing this type
 *   node scripts/generate-car-images-multi.js prompt <slug> <type> # Show prompt for manual generation
 * 
 * Environment variables required:
 *   GOOGLE_AI_API_KEY - Google AI API key
 *   BLOB_READ_WRITE_TOKEN - Vercel Blob token (for uploads)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { carData } from '../data/cars.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Load environment variables from .env.local
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
const GENERATED_IMAGES_DIR = path.join(PROJECT_ROOT, 'generated-images');
const PUBLIC_IMAGES_DIR = path.join(PROJECT_ROOT, 'public/images/cars');

// Ensure directories exist
[GENERATED_IMAGES_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// =============================================================================
// IMAGE TYPE CONFIGURATION
// =============================================================================

/**
 * Image type definitions with prompts, settings, and use cases
 */
const IMAGE_TYPES = {
  hero: {
    name: 'Hero',
    description: 'Premium 3/4 front angle in scenic environment',
    aspectRatio: '16:9',
    imageSize: '2K',
    engine: 'pro',
    useCases: ['Car detail page hero', 'OG/social images', 'Featured cards'],
    generatePrompt: (car, env) => {
      const year = car.years.split('-')[0];
      const brand = extractBrand(car.name);
      const styleHints = getStyleHints(car);
      return `OUTDOOR photograph, NOT in a studio: A ${year} ${car.name} driving on ${env}. The car is shown from a 3/4 front angle, captured while in motion on a real road in a natural outdoor setting. Real sunlight, real sky visible, real landscape in background. This is an ON-LOCATION automotive photo shoot, outdoors in nature, NOT a studio shot. The ${brand} looks ${styleHints}. Professional photography, sharp focus on the car, beautiful natural scenery, aspirational driving destination.`;
    },
  },
  
  rear: {
    name: 'Rear 3/4',
    description: 'Rear 3/4 angle showing back styling, exhaust, and design',
    aspectRatio: '16:9',
    imageSize: '2K',
    engine: 'pro',
    useCases: ['Gallery view', 'Buying guide', 'Design appreciation'],
    generatePrompt: (car, env) => {
      const year = car.years.split('-')[0];
      const brand = extractBrand(car.name);
      return `OUTDOOR automotive photograph: A ${year} ${car.name} shown from a rear 3/4 angle, parked at ${env.replace('driving on', '')}. Focus on the rear design, taillights, exhaust tips, and rear haunches. Natural outdoor lighting, real sky visible. Professional automotive photography showcasing the rear styling of this ${brand}. Sharp focus, dramatic composition highlighting the car's design from behind.`;
    },
  },
  
  interior: {
    name: 'Interior',
    description: "Cockpit view from driver's perspective",
    aspectRatio: '16:9',
    imageSize: '2K',
    engine: 'pro',
    useCases: ['Buying guide tab', 'Ownership section', 'Interior quality showcase'],
    generatePrompt: (car) => {
      const year = car.years.split('-')[0];
      const brand = extractBrand(car.name);
      const interiorStyle = car.tier === 'premium' ? 'luxurious, high-end materials' :
                           car.tier === 'upper-mid' ? 'driver-focused, quality materials' :
                           'sporty, purposeful';
      return `Interior photograph of a ${year} ${car.name}: Driver's POV showing steering wheel, instrument cluster, center console, and dashboard. Natural daylight coming through windows. ${interiorStyle} interior. Focus on the cockpit design, gear shifter, and driving controls. Professional automotive interior photography of this ${brand}. Clean, well-maintained interior in excellent condition.`;
    },
  },
  
  action: {
    name: 'Action',
    description: 'Dynamic motion shot with sense of speed',
    aspectRatio: '16:9',
    imageSize: '1K',
    engine: 'flash', // Faster generation for action shots
    useCases: ['Card hover effects', 'Dynamic galleries', 'Excitement/energy'],
    generatePrompt: (car, env) => {
      const year = car.years.split('-')[0];
      const brand = extractBrand(car.name);
      return `Dynamic action photograph: A ${year} ${car.name} in motion on ${env}, captured with motion blur on the background showing speed. Panning shot technique, car sharp and in focus while surroundings show movement. Dramatic angle, sense of speed and performance. This ${brand} captured at speed, outdoor location, professional motorsport photography style.`;
    },
  },
  
  detail: {
    name: 'Detail',
    description: 'Close-up of engine bay, wheels, or signature detail',
    aspectRatio: '1:1',
    imageSize: '1K',
    engine: 'flash',
    useCases: ['Thumbnail', 'Enthusiast details', 'Technical appreciation'],
    generatePrompt: (car) => {
      const year = car.years.split('-')[0];
      const brand = extractBrand(car.name);
      // Choose detail focus based on car characteristics
      const detailFocus = getDetailFocus(car);
      return `Close-up detail photograph of a ${year} ${car.name}: ${detailFocus}. Sharp focus, professional automotive photography. High quality, clean presentation showing the craftsmanship and engineering of this ${brand}. Natural lighting, detailed shot suitable for enthusiasts.`;
    },
  },
};

/**
 * Get detail focus based on car characteristics
 */
function getDetailFocus(car) {
  const name = car.name.toLowerCase();
  const slug = car.slug.toLowerCase();
  
  // Naturally aspirated engines - show engine bay
  if (name.includes('gt4') || name.includes('gt3') || slug.includes('gt4') || slug.includes('gt3') ||
      name.includes('m3 e46') || name.includes('m3 e92') || name.includes('gallardo') ||
      name.includes('r8') || name.includes('viper') || name.includes('lt1') || name.includes('lt4')) {
    return 'Engine bay detail showing the naturally aspirated engine, intake manifold, and engine cover. Clean engine bay with visible performance components';
  }
  
  // Exhaust-focused cars
  if (name.includes('gt350') || name.includes('gt500') || name.includes('amg') || name.includes('m5')) {
    return 'Exhaust tips and rear detail, showing the quad exhaust or performance exhaust system. Polished tips with visible exhaust design';
  }
  
  // Brake-focused (track cars)
  if (name.includes('competition') || name.includes('z06') || name.includes('zl1') || 
      name.includes('gt4') || name.includes('gt3') || name.includes('1le')) {
    return 'Brake caliper and wheel detail showing the large brake rotors, colored calipers (if equipped), and performance wheel design through the spokes';
  }
  
  // Default to wheel/brake detail
  return 'Wheel and brake detail showing the wheel design, brake caliper visible through spokes, and tire sidewall. Performance wheel with quality brake components';
}

// =============================================================================
// ENVIRONMENT CONFIGURATION (same as hero pipeline)
// =============================================================================

const ENVIRONMENTS = {
  porsche: [
    'winding Alpine mountain pass at golden hour, snow-capped peaks in distance, dramatic European scenery',
    'empty Nürburgring Nordschleife corner with forest in background, early morning mist',
    'scenic coastal road in the Swiss Alps, crystal blue lake below, dramatic cliffs',
  ],
  bmw: [
    'twisting mountain road in the Bavarian Alps, autumn colors, golden hour lighting',
    'empty European highway at dawn, rolling hills and farmland',
    'dramatic cliffside coastal road overlooking the Mediterranean Sea',
  ],
  audi: [
    'modern European cityscape at dusk, sleek architecture, urban sophistication',
    'scenic Austrian mountain pass, dramatic peaks, morning light',
    'rain-wet European boulevard at night, city lights reflecting on pavement',
  ],
  american: [
    'empty desert highway at sunset, Monument Valley silhouette in background, Route 66 vibes',
    'dramatic California coastal highway, Pacific Ocean waves crashing, golden hour',
    'abandoned runway at dawn, dramatic sky, raw American power',
    'winding canyon road in Utah, red rock formations, dramatic light',
  ],
  japanese: [
    'winding Japanese touge mountain road at dusk, guardrails and forest, Initial D atmosphere',
    'neon-lit Tokyo street at night, rain-wet pavement, urban Japanese aesthetic',
    'scenic Japanese coastal road, cherry blossom trees, Mount Fuji in distance',
    'empty mountain pass in Hakone, mist rolling through valleys, early morning',
  ],
  italian: [
    'sun-drenched Amalfi Coast road, Mediterranean Sea below, Italian Riviera vibes',
    'empty Tuscan countryside road, cypress trees lining the route, golden light',
    'dramatic Alpine pass connecting Italy and Switzerland, snow-capped peaks',
  ],
  british: [
    'rolling English countryside road, stone walls and green hills, moody sky',
    'rain-wet Welsh mountain pass, dramatic clouds, rugged beauty',
    'Scottish Highland road, lochs and mountains, atmospheric lighting',
  ],
  track: [
    'pit lane exit of a famous race circuit at sunrise, empty track ahead',
    'sweeping corner of a mountain circuit, tire marks visible, professional setting',
  ],
  accessible: [
    'scenic mountain road at sunset, accessible adventure vibes',
    'coastal highway with ocean views, weekend getaway atmosphere',
    'empty backroad through wine country, golden afternoon light',
  ],
};

/**
 * Get appropriate environment for a car
 */
function getCarEnvironment(car) {
  const brand = extractBrand(car.name).toLowerCase();
  const slug = car.slug.toLowerCase();
  
  if (brand.includes('porsche') || slug.includes('cayman') || slug.includes('boxster') || slug.includes('911')) {
    return ENVIRONMENTS.porsche[Math.floor(Math.random() * ENVIRONMENTS.porsche.length)];
  }
  if (brand.includes('bmw') || slug.includes('m2') || slug.includes('m3') || slug.includes('m4')) {
    return ENVIRONMENTS.bmw[Math.floor(Math.random() * ENVIRONMENTS.bmw.length)];
  }
  if (brand.includes('audi') || slug.includes('rs') || slug.includes('tt')) {
    return ENVIRONMENTS.audi[Math.floor(Math.random() * ENVIRONMENTS.audi.length)];
  }
  if (brand.includes('ferrari') || brand.includes('lamborghini') || brand.includes('maserati') || brand.includes('alfa')) {
    return ENVIRONMENTS.italian[Math.floor(Math.random() * ENVIRONMENTS.italian.length)];
  }
  if (brand.includes('lotus') || brand.includes('aston') || brand.includes('mclaren') || brand.includes('jaguar')) {
    return ENVIRONMENTS.british[Math.floor(Math.random() * ENVIRONMENTS.british.length)];
  }
  if (brand.includes('chevrolet') || brand.includes('corvette') || slug.includes('corvette') ||
      brand.includes('ford') || slug.includes('mustang') || slug.includes('camaro') ||
      brand.includes('dodge') || slug.includes('challenger') || slug.includes('charger')) {
    return ENVIRONMENTS.american[Math.floor(Math.random() * ENVIRONMENTS.american.length)];
  }
  if (brand.includes('nissan') || brand.includes('toyota') || brand.includes('mazda') ||
      brand.includes('honda') || brand.includes('subaru') || brand.includes('lexus')) {
    return ENVIRONMENTS.japanese[Math.floor(Math.random() * ENVIRONMENTS.japanese.length)];
  }
  if (car.tier === 'budget' || car.tier === 'entry') {
    return ENVIRONMENTS.accessible[Math.floor(Math.random() * ENVIRONMENTS.accessible.length)];
  }
  
  return 'scenic winding mountain road at golden hour, dramatic natural landscape, open road ahead';
}

/**
 * Extract brand from car name
 */
function extractBrand(name) {
  const brandPatterns = [
    { pattern: /Cayman|Carrera|911|Boxster|GT4|GT3/i, brand: 'Porsche' },
    { pattern: /Corvette/i, brand: 'Chevrolet' },
    { pattern: /Camaro/i, brand: 'Chevrolet' },
    { pattern: /Mustang|GT350|GT500|Shelby/i, brand: 'Ford' },
    { pattern: /GT-R/i, brand: 'Nissan' },
    { pattern: /370Z|350Z/i, brand: 'Nissan' },
    { pattern: /Supra|GR86|86/i, brand: 'Toyota' },
    { pattern: /BRZ/i, brand: 'Subaru' },
    { pattern: /Miata|MX-5/i, brand: 'Mazda' },
    { pattern: /S2000/i, brand: 'Honda' },
    { pattern: /R8/i, brand: 'Audi' },
    { pattern: /RS3|RS5|TT RS/i, brand: 'Audi' },
    { pattern: /Gallardo/i, brand: 'Lamborghini' },
    { pattern: /Emira|Evora/i, brand: 'Lotus' },
    { pattern: /M2|M3|M4|M5|Z4/i, brand: 'BMW' },
    { pattern: /C63|AMG/i, brand: 'Mercedes-AMG' },
    { pattern: /F-Type/i, brand: 'Jaguar' },
    { pattern: /Vantage/i, brand: 'Aston Martin' },
    { pattern: /GranTurismo/i, brand: 'Maserati' },
    { pattern: /4C|Giulia/i, brand: 'Alfa Romeo' },
    { pattern: /Viper/i, brand: 'Dodge' },
    { pattern: /Challenger/i, brand: 'Dodge' },
    { pattern: /Genesis|G70/i, brand: 'Genesis' },
    { pattern: /RC F|LC 500|IS F/i, brand: 'Lexus' },
    { pattern: /Integra Type R|NSX/i, brand: 'Acura' },
  ];
  
  for (const { pattern, brand } of brandPatterns) {
    if (pattern.test(name)) {
      return brand;
    }
  }
  return 'sports car';
}

/**
 * Get style hints based on car tier
 */
function getStyleHints(car) {
  if (car.tier === 'premium') return 'exotic and premium';
  if (car.tier === 'upper-mid') return 'powerful and dynamic';
  if (car.tier === 'mid') return 'sporty and well-balanced';
  return 'approachable and fun';
}

// =============================================================================
// IMAGE GENERATION API
// =============================================================================

/**
 * Generate image using Nano Banana Pro (gemini-3-pro-image-preview)
 */
async function generateImageWithPro(prompt, outputPath, options = {}) {
  if (!GOOGLE_AI_API_KEY) {
    throw new Error('GOOGLE_AI_API_KEY not set in environment');
  }
  
  const aspectRatio = options.aspectRatio || '16:9';
  const imageSize = options.imageSize || '2K';
  
  console.log('🍌 Generating image with Nano Banana Pro...');
  console.log(`   Aspect Ratio: ${aspectRatio}, Size: ${imageSize}`);
  
  const modelName = 'gemini-3-pro-image-preview';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GOOGLE_AI_API_KEY}`;
  
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: { aspectRatio, imageSize }
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
  
  if (!imagePart) throw new Error('No image in response');
  
  const imageData = imagePart.inlineData.data;
  const mimeType = imagePart.inlineData.mimeType || 'image/png';
  
  let ext = '.png';
  if (mimeType === 'image/jpeg') ext = '.jpg';
  if (mimeType === 'image/webp') ext = '.webp';
  
  const buffer = Buffer.from(imageData, 'base64');
  const finalPath = outputPath.replace(/\.(webp|png|jpg)$/, ext);
  
  fs.writeFileSync(finalPath, buffer);
  console.log(`✅ Image saved to: ${finalPath}`);
  
  return finalPath;
}

/**
 * Generate image using Nano Banana Flash (faster, lower quality)
 */
async function generateImageWithFlash(prompt, outputPath, options = {}) {
  if (!GOOGLE_AI_API_KEY) {
    throw new Error('GOOGLE_AI_API_KEY not set in environment');
  }
  
  const aspectRatio = options.aspectRatio || '16:9';
  
  console.log('⚡ Generating image with Nano Banana Flash...');
  console.log(`   Aspect Ratio: ${aspectRatio}`);
  
  const modelName = 'gemini-2.5-flash-image';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GOOGLE_AI_API_KEY}`;
  
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: { aspectRatio }
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
  
  if (!imagePart) throw new Error('No image in response');
  
  const imageData = imagePart.inlineData.data;
  const mimeType = imagePart.inlineData.mimeType || 'image/png';
  
  let ext = '.png';
  if (mimeType === 'image/jpeg') ext = '.jpg';
  if (mimeType === 'image/webp') ext = '.webp';
  
  const buffer = Buffer.from(imageData, 'base64');
  const finalPath = outputPath.replace(/\.(webp|png|jpg)$/, ext);
  
  fs.writeFileSync(finalPath, buffer);
  console.log(`✅ Image saved to: ${finalPath}`);
  
  return finalPath;
}

// =============================================================================
// BLOB UPLOAD
// =============================================================================

async function uploadToBlob(localPath, blobPath) {
  if (!BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN not set in environment');
  }
  
  console.log(`☁️  Uploading to Vercel Blob: ${blobPath}`);
  
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
  
  console.log(`✅ Uploaded to: ${blob.url}`);
  return blob.url;
}

// =============================================================================
// COMMANDS
// =============================================================================

/**
 * Show image coverage status
 */
function showStatus() {
  console.log('\n=== CAR IMAGE COVERAGE STATUS ===\n');
  
  const imageTypes = Object.keys(IMAGE_TYPES);
  const coverage = {};
  
  // Initialize coverage tracking
  imageTypes.forEach(type => {
    coverage[type] = { existing: 0, missing: 0, cars: [] };
  });
  
  // Check each car
  carData.forEach(car => {
    imageTypes.forEach(type => {
      const filename = `${car.slug}-${type}`;
      const existsPublic = fs.readdirSync(PUBLIC_IMAGES_DIR)
        .some(f => f.startsWith(filename));
      const existsGenerated = fs.existsSync(GENERATED_IMAGES_DIR) && 
        fs.readdirSync(GENERATED_IMAGES_DIR).some(f => f.startsWith(filename));
      
      if (existsPublic || existsGenerated) {
        coverage[type].existing++;
      } else {
        coverage[type].missing++;
        coverage[type].cars.push(car.slug);
      }
    });
  });
  
  // Display summary
  console.log(`Total cars in database: ${carData.length}\n`);
  
  console.log('Image Type Coverage:');
  console.log('─'.repeat(60));
  
  imageTypes.forEach(type => {
    const config = IMAGE_TYPES[type];
    const pct = ((coverage[type].existing / carData.length) * 100).toFixed(1);
    const bar = '█'.repeat(Math.floor(pct / 5)) + '░'.repeat(20 - Math.floor(pct / 5));
    console.log(`\n${config.name.padEnd(12)} ${bar} ${pct}%`);
    console.log(`             ${coverage[type].existing}/${carData.length} cars (${coverage[type].missing} missing)`);
    console.log(`             Use cases: ${config.useCases.join(', ')}`);
  });
  
  // Show recommended next steps
  console.log('\n' + '─'.repeat(60));
  console.log('\n📋 RECOMMENDED GENERATION ORDER:\n');
  
  const priority = ['hero', 'rear', 'interior', 'action', 'detail'];
  priority.forEach((type, i) => {
    if (coverage[type].missing > 0) {
      console.log(`${i + 1}. Generate ${coverage[type].missing} missing "${type}" images`);
      console.log(`   node scripts/generate-car-images-multi.js batch ${type}`);
    }
  });
}

/**
 * Generate a single image for a car
 */
async function generateImage(slug, type) {
  const car = carData.find(c => c.slug === slug);
  if (!car) {
    console.error(`❌ Car not found: ${slug}`);
    return null;
  }
  
  const config = IMAGE_TYPES[type];
  if (!config) {
    console.error(`❌ Unknown image type: ${type}`);
    console.log(`   Available types: ${Object.keys(IMAGE_TYPES).join(', ')}`);
    return null;
  }
  
  console.log(`\n🚗 Generating ${config.name} image for: ${car.name}`);
  console.log(`   Type: ${type}, Engine: ${config.engine}`);
  
  const env = getCarEnvironment(car);
  const prompt = config.generatePrompt(car, env);
  
  console.log(`\n📝 Prompt:\n   ${prompt.substring(0, 150)}...\n`);
  
  const outputPath = path.join(GENERATED_IMAGES_DIR, `${slug}-${type}.png`);
  const imageOptions = { 
    aspectRatio: config.aspectRatio, 
    imageSize: config.imageSize 
  };
  
  try {
    const generateFn = config.engine === 'flash' ? generateImageWithFlash : generateImageWithPro;
    const localPath = await generateFn(prompt, outputPath, imageOptions);
    
    console.log(`\n🎉 Generated: ${localPath}`);
    
    // Upload to Blob
    const blobPath = `cars/${slug}/${type}.webp`;
    const blobUrl = await uploadToBlob(localPath, blobPath);
    
    console.log(`\n📋 File naming:`);
    console.log(`   Local: ${localPath}`);
    console.log(`   Blob:  ${blobUrl}`);
    
    return { success: true, slug, type, localPath, blobUrl };
  } catch (error) {
    console.error(`\n❌ Generation failed: ${error.message}`);
    return { success: false, slug, type, error: error.message };
  }
}

/**
 * Generate all image types for a single car
 */
async function generateSet(slug, delayMs = 3000) {
  const car = carData.find(c => c.slug === slug);
  if (!car) {
    console.error(`❌ Car not found: ${slug}`);
    return;
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚗 GENERATING FULL IMAGE SET FOR: ${car.name}`);
  console.log(`${'='.repeat(60)}\n`);
  
  const types = Object.keys(IMAGE_TYPES);
  const results = [];
  
  for (let i = 0; i < types.length; i++) {
    const type = types[i];
    console.log(`\n📍 Progress: ${i + 1}/${types.length} - ${type}`);
    
    const result = await generateImage(slug, type);
    results.push(result);
    
    if (i < types.length - 1) {
      console.log(`\n⏳ Waiting ${delayMs/1000}s before next image...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 GENERATION SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r?.success);
  const failed = results.filter(r => !r?.success);
  
  console.log(`✅ Successful: ${successful.length}/${types.length}`);
  console.log(`❌ Failed: ${failed.length}/${types.length}`);
  
  if (successful.length > 0) {
    console.log('\n✅ Generated images:');
    successful.forEach(r => {
      console.log(`   ${r.type}: ${r.blobUrl}`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed:');
    failed.forEach(r => {
      console.log(`   ${r?.type || 'unknown'}: ${r?.error || 'Unknown error'}`);
    });
  }
}

/**
 * List cars missing a specific image type
 */
function listMissing(type) {
  if (!IMAGE_TYPES[type]) {
    console.error(`❌ Unknown image type: ${type}`);
    console.log(`   Available types: ${Object.keys(IMAGE_TYPES).join(', ')}`);
    return;
  }
  
  const missing = carData.filter(car => {
    const filename = `${car.slug}-${type}`;
    const existsPublic = fs.readdirSync(PUBLIC_IMAGES_DIR)
      .some(f => f.startsWith(filename));
    const existsGenerated = fs.existsSync(GENERATED_IMAGES_DIR) && 
      fs.readdirSync(GENERATED_IMAGES_DIR).some(f => f.startsWith(filename));
    return !existsPublic && !existsGenerated;
  });
  
  console.log(`\n=== CARS MISSING "${type.toUpperCase()}" IMAGES ===\n`);
  console.log(`Total missing: ${missing.length}/${carData.length}\n`);
  
  // Group by tier
  const tiers = ['premium', 'upper-mid', 'mid', 'budget'];
  tiers.forEach(tier => {
    const tierCars = missing.filter(c => c.tier === tier);
    if (tierCars.length > 0) {
      console.log(`\n${tier.toUpperCase()} (${tierCars.length}):`);
      tierCars.forEach(car => {
        console.log(`  - ${car.slug}`);
      });
    }
  });
  
  // Output batch command
  if (missing.length > 0) {
    console.log('\n--- BATCH COMMAND ---');
    const slugs = missing.slice(0, 10).map(c => c.slug).join(' ');
    console.log(`\nFirst 10 cars:`);
    console.log(`SLUGS="${slugs}"`);
    console.log('for slug in $SLUGS; do');
    console.log(`  node scripts/generate-car-images-multi.js generate $slug ${type}`);
    console.log('  sleep 5');
    console.log('done');
  }
}

/**
 * Show prompt for manual generation
 */
function showPrompt(slug, type) {
  const car = carData.find(c => c.slug === slug);
  if (!car) {
    console.error(`❌ Car not found: ${slug}`);
    return;
  }
  
  const config = IMAGE_TYPES[type];
  if (!config) {
    console.error(`❌ Unknown image type: ${type}`);
    return;
  }
  
  const env = getCarEnvironment(car);
  const prompt = config.generatePrompt(car, env);
  
  console.log(`\n📝 Prompt for ${car.name} (${type}):\n`);
  console.log(prompt);
  console.log(`\n📁 File naming:`);
  console.log(`   Local: generated-images/${slug}-${type}.png`);
  console.log(`   Blob:  cars/${slug}/${type}.webp`);
  console.log(`\n⚙️  Settings: ${config.aspectRatio}, ${config.imageSize}, ${config.engine}`);
}

/**
 * Batch generate a specific type for all cars missing it
 */
async function batchGenerate(type, delayMs = 5000, limit = 10) {
  if (!IMAGE_TYPES[type]) {
    console.error(`❌ Unknown image type: ${type}`);
    return;
  }
  
  const missing = carData.filter(car => {
    const filename = `${car.slug}-${type}`;
    const existsPublic = fs.readdirSync(PUBLIC_IMAGES_DIR)
      .some(f => f.startsWith(filename));
    const existsGenerated = fs.existsSync(GENERATED_IMAGES_DIR) && 
      fs.readdirSync(GENERATED_IMAGES_DIR).some(f => f.startsWith(filename));
    return !existsPublic && !existsGenerated;
  });
  
  const batch = missing.slice(0, limit);
  
  console.log(`\n=== BATCH GENERATING "${type.toUpperCase()}" IMAGES ===\n`);
  console.log(`Missing: ${missing.length}, Generating: ${batch.length} (limit: ${limit})`);
  console.log(`Delay: ${delayMs}ms between generations\n`);
  
  const results = { success: [], failed: [] };
  
  for (let i = 0; i < batch.length; i++) {
    const car = batch[i];
    console.log(`\n📍 Progress: ${i + 1}/${batch.length}`);
    
    const result = await generateImage(car.slug, type);
    
    if (result?.success) {
      results.success.push(result);
    } else {
      results.failed.push(result || { slug: car.slug, type, error: 'Unknown' });
    }
    
    if (i < batch.length - 1) {
      console.log(`\n⏳ Waiting ${delayMs/1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 BATCH SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${results.success.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⏳ Remaining: ${missing.length - batch.length}`);
  
  if (results.success.length > 0) {
    console.log('\n✅ Generated:');
    results.success.forEach(r => {
      console.log(`   ${r.slug}: ${r.blobUrl}`);
    });
  }
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed:');
    results.failed.forEach(r => {
      console.log(`   ${r.slug}: ${r.error}`);
    });
  }
}

// =============================================================================
// MAIN
// =============================================================================

const command = process.argv[2];
const arg1 = process.argv[3];
const arg2 = process.argv[4];
const limitFlag = process.argv.find(a => a.startsWith('--limit='));
const limit = limitFlag ? parseInt(limitFlag.split('=')[1], 10) : 10;
const delayFlag = process.argv.find(a => a.startsWith('--delay='));
const delayMs = delayFlag ? parseInt(delayFlag.split('=')[1], 10) : 5000;

switch (command) {
  case 'status':
    showStatus();
    break;
    
  case 'generate':
    if (!arg1 || !arg2) {
      console.error('Usage: node scripts/generate-car-images-multi.js generate <slug> <type>');
      console.log(`       Available types: ${Object.keys(IMAGE_TYPES).join(', ')}`);
      process.exit(1);
    }
    generateImage(arg1, arg2);
    break;
    
  case 'generate-set':
    if (!arg1) {
      console.error('Usage: node scripts/generate-car-images-multi.js generate-set <slug>');
      process.exit(1);
    }
    generateSet(arg1, delayMs);
    break;
    
  case 'batch':
    if (!arg1) {
      console.error('Usage: node scripts/generate-car-images-multi.js batch <type> [--limit=10] [--delay=5000]');
      console.log(`       Available types: ${Object.keys(IMAGE_TYPES).join(', ')}`);
      process.exit(1);
    }
    batchGenerate(arg1, delayMs, limit);
    break;
    
  case 'list-missing':
    if (!arg1) {
      console.error('Usage: node scripts/generate-car-images-multi.js list-missing <type>');
      console.log(`       Available types: ${Object.keys(IMAGE_TYPES).join(', ')}`);
      process.exit(1);
    }
    listMissing(arg1);
    break;
    
  case 'prompt':
    if (!arg1 || !arg2) {
      console.error('Usage: node scripts/generate-car-images-multi.js prompt <slug> <type>');
      process.exit(1);
    }
    showPrompt(arg1, arg2);
    break;
    
  default:
    console.log(`
🖼️  Multi-Image Car Generation Script
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMAGE TYPES:
  hero      Premium 3/4 front scenic (Pro, 2K, 16:9)
  rear      Rear 3/4 angle (Pro, 2K, 16:9)
  interior  Cockpit/driver view (Pro, 2K, 16:9)
  action    Dynamic motion shot (Flash, 1K, 16:9)
  detail    Engine/wheel close-up (Flash, 1K, 1:1)

COMMANDS:
  status                      Show image coverage for all cars
  generate <slug> <type>      Generate one image
  generate-set <slug>         Generate all 5 types for a car
  batch <type>                Batch generate type for missing cars
  list-missing <type>         List cars missing this image type
  prompt <slug> <type>        Show prompt for manual generation

OPTIONS:
  --limit=10                  Max cars for batch (default: 10)
  --delay=5000                Delay between generations in ms

EXAMPLES:
  node scripts/generate-car-images-multi.js status
  node scripts/generate-car-images-multi.js generate 718-cayman-gt4 rear
  node scripts/generate-car-images-multi.js generate-set bmw-m2-competition
  node scripts/generate-car-images-multi.js batch interior --limit=5
  node scripts/generate-car-images-multi.js list-missing action

FILE NAMING CONVENTION:
  Local:  generated-images/{slug}-{type}.png
  Public: public/images/cars/{slug}-{type}.png
  Blob:   cars/{slug}/{type}.webp
`);
}
