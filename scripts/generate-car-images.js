#!/usr/bin/env node
/**
 * Car Image Generation Script
 * 
 * Generates car hero images using Google's Imagen 3 API
 * and uploads them to Vercel Blob storage.
 * 
 * Usage:
 *   node scripts/generate-car-images.js generate <slug>     # Generate image for one car
 *   node scripts/generate-car-images.js generate-all        # Generate for all cars (be careful!)
 *   node scripts/generate-car-images.js upload <slug>       # Upload existing image to Blob
 *   node scripts/generate-car-images.js test                # Test API connection
 *   node scripts/generate-car-images.js list                # List cars needing images
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
        // Remove surrounding quotes if present
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

// Ensure generated-images directory exists
if (!fs.existsSync(GENERATED_IMAGES_DIR)) {
  fs.mkdirSync(GENERATED_IMAGES_DIR, { recursive: true });
}

// =============================================================================
// Environment & Prompt Templates
// =============================================================================

/**
 * Natural environment settings for different car types
 * Each car should feel "at home" in its environment
 */
const ENVIRONMENTS = {
  // German Performance (Porsche, BMW, Audi)
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
  
  // American Muscle & Performance
  american: [
    'empty desert highway at sunset, Monument Valley silhouette in background, Route 66 vibes',
    'dramatic California coastal highway, Pacific Ocean waves crashing, golden hour',
    'abandoned runway at dawn, dramatic sky, raw American power',
    'winding canyon road in Utah, red rock formations, dramatic light',
  ],
  
  // Japanese Performance (JDM)
  japanese: [
    'winding Japanese touge mountain road at dusk, guardrails and forest, Initial D atmosphere',
    'neon-lit Tokyo street at night, rain-wet pavement, urban Japanese aesthetic',
    'scenic Japanese coastal road, cherry blossom trees, Mount Fuji in distance',
    'empty mountain pass in Hakone, mist rolling through valleys, early morning',
  ],
  
  // Italian Exotics
  italian: [
    'sun-drenched Amalfi Coast road, Mediterranean Sea below, Italian Riviera vibes',
    'empty Tuscan countryside road, cypress trees lining the route, golden light',
    'dramatic Alpine pass connecting Italy and Switzerland, snow-capped peaks',
  ],
  
  // British Sports Cars
  british: [
    'rolling English countryside road, stone walls and green hills, moody sky',
    'rain-wet Welsh mountain pass, dramatic clouds, rugged beauty',
    'Scottish Highland road, lochs and mountains, atmospheric lighting',
  ],
  
  // Track-focused cars (any brand)
  track: [
    'pit lane exit of a famous race circuit at sunrise, empty track ahead',
    'sweeping corner of a mountain circuit, tire marks visible, professional setting',
  ],
  
  // Budget/Entry sports cars
  accessible: [
    'scenic mountain road at sunset, accessible adventure vibes',
    'coastal highway with ocean views, weekend getaway atmosphere',
    'empty backroad through wine country, golden afternoon light',
  ],
};

/**
 * Get the best environment for a car based on its characteristics
 */
function getCarEnvironment(car) {
  const brand = extractBrand(car.name).toLowerCase();
  const slug = car.slug.toLowerCase();
  const name = car.name.toLowerCase();
  
  // Brand-specific environments
  if (brand.includes('porsche') || slug.includes('porsche') || slug.includes('cayman') || slug.includes('boxster') || slug.includes('911')) {
    return ENVIRONMENTS.porsche[Math.floor(Math.random() * ENVIRONMENTS.porsche.length)];
  }
  if (brand.includes('bmw') || slug.includes('bmw') || slug.includes('m2') || slug.includes('m3') || slug.includes('m4')) {
    return ENVIRONMENTS.bmw[Math.floor(Math.random() * ENVIRONMENTS.bmw.length)];
  }
  if (brand.includes('audi') || slug.includes('audi') || slug.includes('rs') || slug.includes('tt')) {
    return ENVIRONMENTS.audi[Math.floor(Math.random() * ENVIRONMENTS.audi.length)];
  }
  if (brand.includes('ferrari') || brand.includes('lamborghini') || brand.includes('maserati') || brand.includes('alfa')) {
    return ENVIRONMENTS.italian[Math.floor(Math.random() * ENVIRONMENTS.italian.length)];
  }
  if (brand.includes('lotus') || brand.includes('aston') || brand.includes('mclaren') || brand.includes('jaguar')) {
    return ENVIRONMENTS.british[Math.floor(Math.random() * ENVIRONMENTS.british.length)];
  }
  
  // American cars
  if (brand.includes('chevrolet') || brand.includes('corvette') || slug.includes('corvette') ||
      brand.includes('ford') || slug.includes('mustang') || slug.includes('camaro') ||
      brand.includes('dodge') || slug.includes('challenger') || slug.includes('charger')) {
    return ENVIRONMENTS.american[Math.floor(Math.random() * ENVIRONMENTS.american.length)];
  }
  
  // Japanese cars
  if (brand.includes('nissan') || brand.includes('toyota') || brand.includes('mazda') ||
      brand.includes('honda') || brand.includes('subaru') || brand.includes('lexus') ||
      slug.includes('370z') || slug.includes('supra') || slug.includes('miata') ||
      slug.includes('wrx') || slug.includes('brz') || slug.includes('86') || slug.includes('nsx')) {
    return ENVIRONMENTS.japanese[Math.floor(Math.random() * ENVIRONMENTS.japanese.length)];
  }
  
  // Tier-based fallbacks
  if (car.tier === 'budget' || car.tier === 'entry') {
    return ENVIRONMENTS.accessible[Math.floor(Math.random() * ENVIRONMENTS.accessible.length)];
  }
  
  // Default to a nice scenic road
  return 'scenic winding mountain road at golden hour, dramatic natural landscape, open road ahead';
}

/**
 * Specific environment overrides for certain cars (for variety and brand-matching)
 */
const CAR_SPECIFIC_ENVIRONMENTS = {
  '718-cayman-gt4': 'sweeping corner of an Alpine mountain pass at golden hour, dramatic peaks towering above, winding road disappearing into the distance, European sports car paradise',
  'c8-corvette-stingray': 'empty desert highway cutting through Monument Valley at sunset, iconic American Southwest landscape, dramatic red rock formations, Route 66 adventure vibes',
  'nissan-370z-nismo': 'winding Japanese touge mountain road at twilight, guardrails along hairpin turns, misty forest backdrop, Initial D atmosphere, authentic JDM setting',
  '911-gt3': 'pit lane exit at the Nürburgring Nordschleife at dawn, empty legendary track ahead, forest-lined circuit, serious performance setting',
  'toyota-supra': 'neon-lit rainy Tokyo street at night, reflections on wet pavement, Japanese urban nightlife, modern meets classic JDM',
  'mazda-miata-mx-5': 'scenic California coastal highway at sunset, Pacific Ocean waves below, top-down driving weather, pure driving joy',
  'ford-mustang-gt': 'straight stretch of empty desert highway at golden hour, vast American landscape, freedom and power',
  'bmw-m2': 'twisting Bavarian mountain road in autumn, colorful foliage, morning mist in valleys, German engineering meets nature',
  'audi-tt-rs': 'modern European cityscape at blue hour, sleek contemporary architecture, sophisticated urban setting',
  'lotus-emira': 'rain-wet British countryside road, dramatic moody sky, rolling green hills, authentic British sports car atmosphere',
};

/**
 * Generate a detailed prompt for a car hero image with natural environment
 * IMPORTANT: Lead with environment, be explicit about OUTDOOR, avoid studio triggers
 */
function generateCarPrompt(car) {
  const year = car.years.split('-')[0];
  const brand = extractBrand(car.name);
  
  // Get environment - use specific override if available, otherwise generate
  const environment = CAR_SPECIFIC_ENVIRONMENTS[car.slug] || getCarEnvironment(car);
  
  // Determine style based on tier
  let styleHints = '';
  if (car.tier === 'premium') {
    styleHints = 'exotic and premium';
  } else if (car.tier === 'upper-mid') {
    styleHints = 'powerful and dynamic';
  } else if (car.tier === 'mid') {
    styleHints = 'sporty and well-balanced';
  } else {
    styleHints = 'approachable and fun';
  }
  
  // Lead with environment to ensure outdoor shot, explicitly avoid studio
  return `OUTDOOR photograph, NOT in a studio: A ${year} ${car.name} driving on ${environment}. The car is shown from a 3/4 front angle, captured while in motion on a real road in a natural outdoor setting. Real sunlight, real sky visible, real landscape in background. This is an ON-LOCATION automotive photo shoot, outdoors in nature, NOT a studio shot. The ${brand} looks ${styleHints}. Professional photography, sharp focus on the car, beautiful natural scenery, aspirational driving destination.`;
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
    { pattern: /Gallardo/i, brand: 'Lamborghini' },
    { pattern: /Emira|Evora/i, brand: 'Lotus' },
    { pattern: /M2|M4|M240/i, brand: 'BMW' },
    { pattern: /C63|AMG/i, brand: 'Mercedes-AMG' },
    { pattern: /F-Type/i, brand: 'Jaguar' },
    { pattern: /Vantage/i, brand: 'Aston Martin' },
    { pattern: /GranTurismo/i, brand: 'Maserati' },
    { pattern: /4C/i, brand: 'Alfa Romeo' },
    { pattern: /Viper/i, brand: 'Dodge' },
    { pattern: /Challenger/i, brand: 'Dodge' },
    { pattern: /Genesis/i, brand: 'Genesis' },
    { pattern: /RC F|LC 500/i, brand: 'Lexus' },
  ];
  
  for (const { pattern, brand } of brandPatterns) {
    if (pattern.test(name)) {
      return brand;
    }
  }
  return 'sports car';
}

// =============================================================================
// Google Gemini Image Generation API
// =============================================================================

/**
 * Generate an image using Google's Nano Banana Pro (gemini-3-pro-image-preview)
 * This is the advanced model with high quality output up to 4K
 */
async function generateImageWithNanoBananaPro(prompt, outputPath, options = {}) {
  if (!GOOGLE_AI_API_KEY) {
    throw new Error('GOOGLE_AI_API_KEY not set in environment');
  }
  
  const aspectRatio = options.aspectRatio || '16:9';
  const imageSize = options.imageSize || '2K';  // 1K, 2K, or 4K
  
  console.log('🍌 Generating image with Nano Banana Pro (gemini-3-pro-image-preview)...');
  console.log(`   Prompt: ${prompt.substring(0, 100)}...`);
  console.log(`   Aspect Ratio: ${aspectRatio}, Size: ${imageSize}`);
  
  const modelName = 'gemini-3-pro-image-preview';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GOOGLE_AI_API_KEY}`;
  
  const body = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: {
        aspectRatio: aspectRatio,
        imageSize: imageSize
      }
    }
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Nano Banana Pro API error (${response.status}): ${errorText}`);
  }
  
  const result = await response.json();
  
  // Extract image from response
  const candidates = result.candidates || [];
  if (candidates.length === 0) {
    throw new Error('No candidates in response');
  }
  
  const parts = candidates[0].content?.parts || [];
  const imagePart = parts.find(p => p.inlineData);
  const textPart = parts.find(p => p.text);
  
  if (textPart) {
    console.log(`   Model notes: ${textPart.text.substring(0, 200)}...`);
  }
  
  if (!imagePart) {
    throw new Error('No image in response. The model may have refused or encountered an issue.');
  }
  
  const imageData = imagePart.inlineData.data;
  const mimeType = imagePart.inlineData.mimeType || 'image/png';
  
  let ext = '.png';
  if (mimeType === 'image/jpeg') ext = '.jpg';
  if (mimeType === 'image/webp') ext = '.webp';
  
  const buffer = Buffer.from(imageData, 'base64');
  const finalPath = outputPath.endsWith('.webp') ? outputPath.replace('.webp', ext) : outputPath;
  
  fs.writeFileSync(finalPath, buffer);
  console.log(`✅ Image saved to: ${finalPath}`);
  
  return finalPath;
}

/**
 * Alternative: Generate using Nano Banana (gemini-2.5-flash-image)
 * Faster but lower quality than Pro
 */
async function generateImageWithNanoBanana(prompt, outputPath, options = {}) {
  if (!GOOGLE_AI_API_KEY) {
    throw new Error('GOOGLE_AI_API_KEY not set in environment');
  }
  
  const aspectRatio = options.aspectRatio || '16:9';
  
  console.log('🍌 Generating image with Nano Banana (gemini-2.5-flash-image)...');
  console.log(`   Prompt: ${prompt.substring(0, 100)}...`);
  console.log(`   Aspect Ratio: ${aspectRatio}`);
  
  const modelName = 'gemini-2.5-flash-image';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GOOGLE_AI_API_KEY}`;
  
  const body = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: {
        aspectRatio: aspectRatio
      }
    }
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Nano Banana API error (${response.status}): ${errorText}`);
  }
  
  const result = await response.json();
  
  // Extract image from response
  const candidates = result.candidates || [];
  if (candidates.length === 0) {
    throw new Error('No candidates in response');
  }
  
  const parts = candidates[0].content?.parts || [];
  const imagePart = parts.find(p => p.inlineData);
  const textPart = parts.find(p => p.text);
  
  if (textPart) {
    console.log(`   Model notes: ${textPart.text.substring(0, 200)}...`);
  }
  
  if (!imagePart) {
    throw new Error('No image in response');
  }
  
  const imageData = imagePart.inlineData.data;
  const mimeType = imagePart.inlineData.mimeType || 'image/png';
  
  let ext = '.png';
  if (mimeType === 'image/jpeg') ext = '.jpg';
  if (mimeType === 'image/webp') ext = '.webp';
  
  const buffer = Buffer.from(imageData, 'base64');
  const finalPath = outputPath.endsWith('.webp') ? outputPath.replace('.webp', ext) : outputPath;
  
  fs.writeFileSync(finalPath, buffer);
  console.log(`✅ Image saved to: ${finalPath}`);
  
  return finalPath;
}

// =============================================================================
// Vercel Blob Upload
// =============================================================================

/**
 * Upload an image to Vercel Blob
 */
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
// Commands
// =============================================================================

/**
 * Test API connection
 */
async function testConnection() {
  console.log('\n🧪 Testing Google AI API connection...\n');
  
  if (!GOOGLE_AI_API_KEY) {
    console.error('❌ GOOGLE_AI_API_KEY not found in environment');
    return false;
  }
  
  console.log('✅ GOOGLE_AI_API_KEY is set');
  console.log(`   Key starts with: ${GOOGLE_AI_API_KEY.substring(0, 10)}...`);
  
  // Try Nano Banana Pro (gemini-3-pro-image-preview)
  try {
    const testPrompt = 'A simple red sports car on white background, minimal, clean, professional automotive photography';
    const testPath = path.join(GENERATED_IMAGES_DIR, 'test-nano-banana-pro.png');
    
    console.log('\n📸 Attempting to generate a test image with Nano Banana Pro...');
    await generateImageWithNanoBananaPro(testPrompt, testPath, { aspectRatio: '16:9', imageSize: '1K' });
    
    console.log('\n✅ Nano Banana Pro API connection successful!');
    console.log(`   Check: ${testPath}`);
    return true;
  } catch (error) {
    console.error(`\n❌ Nano Banana Pro test failed: ${error.message}`);
    
    // Try Nano Banana (Flash) as fallback
    console.log('\n🔄 Trying Nano Banana (gemini-2.5-flash-image) as alternative...');
    try {
      const testPrompt = 'A simple red sports car on white background, minimal, clean';
      const testPath = path.join(GENERATED_IMAGES_DIR, 'test-nano-banana-flash.png');
      await generateImageWithNanoBanana(testPrompt, testPath, { aspectRatio: '16:9' });
      console.log('\n✅ Nano Banana (Flash) API works! Use --engine=flash flag.');
      return true;
    } catch (flashError) {
      console.error(`❌ Nano Banana (Flash) also failed: ${flashError.message}`);
      return false;
    }
  }
}

/**
 * Generate image for a specific car
 */
async function generateForCar(slug, engine = 'pro') {
  const car = carData.find(c => c.slug === slug);
  if (!car) {
    console.error(`❌ Car not found: ${slug}`);
    console.log('\nAvailable slugs:');
    carData.forEach(c => console.log(`  - ${c.slug}`));
    return null;
  }
  
  console.log(`\n🚗 Generating image for: ${car.name} (${car.years})`);
  console.log(`   Tier: ${car.tier}, Category: ${car.category}`);
  
  const prompt = generateCarPrompt(car);
  console.log(`\n📝 Prompt:\n   ${prompt}\n`);
  
  const outputFilename = `${slug}-hero.png`;
  const outputPath = path.join(GENERATED_IMAGES_DIR, outputFilename);
  
  // Use 2K resolution for high-quality hero images
  const imageOptions = { aspectRatio: '16:9', imageSize: '2K' };
  
  try {
    let finalPath;
    if (engine === 'flash') {
      finalPath = await generateImageWithNanoBanana(prompt, outputPath, imageOptions);
    } else {
      // Default to Nano Banana Pro for best quality
      finalPath = await generateImageWithNanoBananaPro(prompt, outputPath, imageOptions);
    }
    
    console.log(`\n🎉 Success! Image saved to: ${finalPath}`);
    console.log(`\n📋 Next steps:`);
    console.log(`   1. Review the image at: ${finalPath}`);
    console.log(`   2. Convert to WebP if needed (for optimization)`);
    console.log(`   3. Upload to Blob: node scripts/generate-car-images.js upload ${slug}`);
    
    return finalPath;
  } catch (error) {
    console.error(`\n❌ Generation failed: ${error.message}`);
    return null;
  }
}

/**
 * Upload existing image to Blob
 */
async function uploadCarImage(slug) {
  // Look for the image in generated-images folder
  const possibleFiles = [
    `${slug}-hero.webp`,
    `${slug}-hero.png`,
    `${slug}-hero.jpg`,
  ];
  
  let localPath = null;
  for (const filename of possibleFiles) {
    const fullPath = path.join(GENERATED_IMAGES_DIR, filename);
    if (fs.existsSync(fullPath)) {
      localPath = fullPath;
      break;
    }
  }
  
  if (!localPath) {
    console.error(`❌ No image found for ${slug} in generated-images/`);
    console.log(`   Expected one of: ${possibleFiles.join(', ')}`);
    return null;
  }
  
  const blobPath = `cars/${slug}/hero.webp`;
  
  try {
    const url = await uploadToBlob(localPath, blobPath);
    console.log(`\n🎉 Upload complete!`);
    console.log(`   Blob URL: ${url}`);
    console.log(`\n📋 Next step: Update Supabase 'cars' table`);
    console.log(`   Set image_hero_url = '${url}' WHERE slug = '${slug}'`);
    return url;
  } catch (error) {
    console.error(`\n❌ Upload failed: ${error.message}`);
    return null;
  }
}

/**
 * List cars that need images
 */
function listCars() {
  console.log('\n📋 Cars in database:\n');
  
  const tiers = ['premium', 'upper-mid', 'mid', 'budget'];
  
  for (const tier of tiers) {
    const tierCars = carData.filter(c => c.tier === tier);
    console.log(`\n=== ${tier.toUpperCase()} (${tierCars.length} cars) ===`);
    for (const car of tierCars) {
      const hasImage = car.imageHeroUrl ? '✅' : '⬜';
      console.log(`  ${hasImage} ${car.slug} - ${car.name} (${car.years})`);
    }
  }
  
  console.log(`\n\nTotal: ${carData.length} cars`);
}

/**
 * Generate and upload image for a car (combined workflow)
 */
async function generateAndUploadCar(slug, engine = 'pro', skipIfExists = true) {
  const car = carData.find(c => c.slug === slug);
  if (!car) {
    console.error(`❌ Car not found: ${slug}`);
    return { success: false, slug, error: 'Car not found' };
  }
  
  // Check if image already exists locally
  const possibleFiles = [
    `${slug}-hero.webp`,
    `${slug}-hero.png`,
    `${slug}-hero.jpg`,
  ];
  
  let existingPath = null;
  for (const filename of possibleFiles) {
    const fullPath = path.join(GENERATED_IMAGES_DIR, filename);
    if (fs.existsSync(fullPath)) {
      existingPath = fullPath;
      break;
    }
  }
  
  if (existingPath && skipIfExists) {
    console.log(`⏭️  Skipping ${slug} - image already exists at ${existingPath}`);
    return { success: true, slug, skipped: true };
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚗 Processing: ${car.name} (${car.years})`);
  console.log(`   Tier: ${car.tier}, Category: ${car.category}`);
  console.log(`${'='.repeat(60)}`);
  
  // Generate image
  const prompt = generateCarPrompt(car);
  console.log(`\n📝 Prompt (truncated):\n   ${prompt.substring(0, 150)}...\n`);
  
  const outputFilename = `${slug}-hero.png`;
  const outputPath = path.join(GENERATED_IMAGES_DIR, outputFilename);
  
  const imageOptions = { aspectRatio: '16:9', imageSize: '2K' };
  
  try {
    let finalPath;
    if (engine === 'flash') {
      finalPath = await generateImageWithNanoBanana(prompt, outputPath, imageOptions);
    } else {
      finalPath = await generateImageWithNanoBananaPro(prompt, outputPath, imageOptions);
    }
    
    console.log(`✅ Generated: ${finalPath}`);
    
    // Upload to Blob
    const blobPath = `cars/${slug}/hero.webp`;
    const blobUrl = await uploadToBlob(finalPath, blobPath);
    
    console.log(`☁️  Uploaded: ${blobUrl}`);
    
    return { success: true, slug, localPath: finalPath, blobUrl };
    
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
    return { success: false, slug, error: error.message };
  }
}

/**
 * Batch generate images for all cars without images
 */
async function batchGenerate(slugsToSkip = [], engine = 'pro', delayMs = 5000) {
  console.log('\n🔄 Starting batch image generation...\n');
  
  // Cars that already have images in the database (skip these)
  const carsWithImages = new Set([
    '718-cayman-gt4',
    'c8-corvette-stingray', 
    'nissan-370z-nismo',
    ...slugsToSkip
  ]);
  
  const carsToProcess = carData.filter(car => !carsWithImages.has(car.slug));
  
  console.log(`📊 Stats:`);
  console.log(`   Total cars: ${carData.length}`);
  console.log(`   Already have images: ${carsWithImages.size}`);
  console.log(`   To generate: ${carsToProcess.length}`);
  console.log(`   Delay between generations: ${delayMs}ms`);
  console.log(`   Engine: ${engine}\n`);
  
  const results = {
    success: [],
    failed: [],
    skipped: [],
  };
  
  for (let i = 0; i < carsToProcess.length; i++) {
    const car = carsToProcess[i];
    console.log(`\n📍 Progress: ${i + 1}/${carsToProcess.length}`);
    
    const result = await generateAndUploadCar(car.slug, engine, true);
    
    if (result.skipped) {
      results.skipped.push(result);
    } else if (result.success) {
      results.success.push(result);
    } else {
      results.failed.push(result);
    }
    
    // Delay between API calls to avoid rate limiting
    if (i < carsToProcess.length - 1) {
      console.log(`⏳ Waiting ${delayMs/1000}s before next generation...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 BATCH GENERATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${results.success.length}`);
  console.log(`⏭️  Skipped (already exists): ${results.skipped.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed cars:');
    for (const fail of results.failed) {
      console.log(`   - ${fail.slug}: ${fail.error}`);
    }
  }
  
  if (results.success.length > 0) {
    console.log('\n✅ Successfully generated:');
    for (const success of results.success) {
      console.log(`   - ${success.slug}: ${success.blobUrl}`);
    }
    
    console.log('\n📋 Update Supabase with these URLs:');
    console.log('UPDATE cars SET image_hero_url = CASE slug');
    for (const success of results.success) {
      console.log(`  WHEN '${success.slug}' THEN '${success.blobUrl}'`);
    }
    console.log('END WHERE slug IN (');
    console.log(results.success.map(s => `  '${s.slug}'`).join(',\n'));
    console.log(');');
  }
  
  return results;
}

/**
 * Generate a single car image and upload (for testing)
 */
async function generateSingle(slug, engine = 'pro') {
  const result = await generateAndUploadCar(slug, engine, false);
  
  if (result.success && result.blobUrl) {
    console.log(`\n📋 Update Supabase:`);
    console.log(`UPDATE cars SET image_hero_url = '${result.blobUrl}' WHERE slug = '${slug}';`);
  }
  
  return result;
}

/**
 * Show prompt for a car (for manual generation)
 */
function showPrompt(slug) {
  const car = carData.find(c => c.slug === slug);
  if (!car) {
    console.error(`❌ Car not found: ${slug}`);
    return;
  }
  
  console.log(`\n📝 Prompt for ${car.name}:\n`);
  console.log(generateCarPrompt(car));
  console.log(`\n📁 Save as: generated-images/${slug}-hero.webp`);
  console.log(`☁️  Blob path: cars/${slug}/hero.webp`);
}

// =============================================================================
// Main
// =============================================================================

const command = process.argv[2];
const arg = process.argv[3];
const engineFlag = process.argv.find(a => a.startsWith('--engine='));
const engine = engineFlag ? engineFlag.split('=')[1] : 'pro';
const delayFlag = process.argv.find(a => a.startsWith('--delay='));
const delayMs = delayFlag ? parseInt(delayFlag.split('=')[1], 10) : 5000;

switch (command) {
  case 'test':
    testConnection();
    break;
    
  case 'generate':
    if (!arg) {
      console.error('Usage: node scripts/generate-car-images.js generate <slug>');
      console.log('       Add --engine=flash to use Nano Banana (faster, lower quality)');
      process.exit(1);
    }
    generateForCar(arg, engine);
    break;
    
  case 'single':
    if (!arg) {
      console.error('Usage: node scripts/generate-car-images.js single <slug>');
      process.exit(1);
    }
    generateSingle(arg, engine);
    break;
    
  case 'batch':
    batchGenerate([], engine, delayMs);
    break;
    
  case 'upload':
    if (!arg) {
      console.error('Usage: node scripts/generate-car-images.js upload <slug>');
      process.exit(1);
    }
    uploadCarImage(arg);
    break;
    
  case 'list':
    listCars();
    break;
    
  case 'prompt':
    if (!arg) {
      console.error('Usage: node scripts/generate-car-images.js prompt <slug>');
      process.exit(1);
    }
    showPrompt(arg);
    break;
    
  default:
    console.log(`
🚗 Car Image Generation Script - Using Google Nano Banana Pro

Usage:
  node scripts/generate-car-images.js <command> [args]

Commands:
  test                    Test Google AI API connection
  generate <slug>         Generate hero image (save locally only)
  single <slug>           Generate + upload single car (full workflow)
  batch                   Generate + upload ALL cars without images
  upload <slug>           Upload existing local image to Vercel Blob
  list                    List all cars and their image status
  prompt <slug>           Show the prompt for manual generation

Options:
  --engine=pro            Use Nano Banana Pro / gemini-3-pro-image-preview (default, best quality)
  --engine=flash          Use Nano Banana / gemini-2.5-flash-image (faster, lower quality)
  --delay=5000            Delay between batch generations in ms (default: 5000)

Examples:
  node scripts/generate-car-images.js test
  node scripts/generate-car-images.js single 718-cayman-gts-40
  node scripts/generate-car-images.js batch --engine=pro --delay=5000
  node scripts/generate-car-images.js list

Workflow (single car):
  1. Run 'single <slug>' to generate and upload
  2. Copy the UPDATE SQL and run in Supabase

Workflow (batch):
  1. Run 'batch' to generate all remaining cars
  2. Copy the UPDATE SQL from output and run in Supabase
  3. Note: This will take ~3 minutes per car with default delay
`);
}

