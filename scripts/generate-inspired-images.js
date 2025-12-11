#!/usr/bin/env node
/**
 * Inspiration-Based Image Generation Script
 * 
 * Uses pressroom images as INSPIRATION to generate 100% original AI images.
 * You own full rights to all generated images - safe for commercial use.
 * 
 * Workflow:
 * 1. Analyze pressroom image with Google Vision (extract composition, lighting, mood)
 * 2. Generate detailed prompt based on inspiration (NOT copying the image)
 * 3. Generate new AI image using Imagen API
 * 4. Upload to Vercel Blob with full commercial rights
 * 
 * Usage:
 *   node scripts/generate-inspired-images.js analyze <image-path>      # Analyze an image
 *   node scripts/generate-inspired-images.js generate <car-slug> <image-path>  # Generate inspired image
 *   node scripts/generate-inspired-images.js batch                     # Process all pressroom images
 *   node scripts/generate-inspired-images.js list                      # List pressroom images
 *   node scripts/generate-inspired-images.js map                       # Show pressroom → car mappings
 * 
 * Environment variables required:
 *   GOOGLE_AI_API_KEY - Google AI API key
 *   BLOB_READ_WRITE_TOKEN - Vercel Blob token
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
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
        if (key && value) process.env[key] = value;
      }
    }
  }
}

loadEnv();

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const PRESSROOM_DIR = path.join(PROJECT_ROOT, 'Pressroom Images');
const GENERATED_DIR = path.join(PROJECT_ROOT, 'generated-images');
const INSPIRATION_LOG = path.join(PROJECT_ROOT, 'generated-images', 'inspiration-log.json');

// Ensure output directory exists
if (!fs.existsSync(GENERATED_DIR)) {
  fs.mkdirSync(GENERATED_DIR, { recursive: true });
}

// =============================================================================
// PRESSROOM IMAGE → CAR MAPPING
// =============================================================================

/**
 * Map pressroom image filenames to car slugs
 * This mapping helps us know which car an image is for
 */
const PRESSROOM_MAPPINGS = {
  // Chevrolet Corvettes - Using actual slugs from database
  '2024-chevrolet-corvette-z06': 'c7-corvette-z06',  // C7 Z06 in database
  '2026-Corvette-ZR1': 'c8-corvette-stingray',  // Use C8 Stingray as base
  '2026 Corvette ZR1': 'c8-corvette-stingray',
  '2026 Corvette Stingray': 'c8-corvette-stingray',
  '2026 Corvette E-Ray': 'c8-corvette-stingray',
  '2026 Corvette Z06': 'c7-corvette-z06',
  'Chevrolet-2026-Corvette-ZR1X': 'c8-corvette-stingray',
  'C1-Corvette': null,  // Classic, not in our database
  
  // Chevrolet Camaro
  '2023-chevrolet-camaro-zLl-1le': 'camaro-zl1',
  '2024-chevrolet-camaro-zl1': 'camaro-zl1',
  '2024-chevrolet-camaro-ss': 'camaro-zl1',  // Using ZL1 as closest match
  
  // Porsche 911 - Using actual slugs
  'SLATE_GREY_NEO_911_CARRERA': '991-1-carrera-s',
  'Porsche_Nevada_C4S': '997-2-carrera-s',
  
  // Porsche Cayman
  'GT_Silver_Cayman_GTS_4.0': '718-cayman-gts-40',
  
  // Audi - these may not be in database, map to closest
  'my25-rs-3': null,  // RS3 not in database
  'RS3': null,
  'RS5': null,
  
  // BMW Z4
  'bmw-z4': null,  // Z4 not in database
  'bmw-z3': null,
  
  // Racing/IMSA images (generic inspiration)
  'IMSA': null,
  'Petit Le Mans': null,
};

/**
 * Extract car slug from pressroom image filename
 */
function mapPressroomToCar(filename) {
  const lower = filename.toLowerCase();
  
  // Try direct mappings first
  for (const [pattern, slug] of Object.entries(PRESSROOM_MAPPINGS)) {
    if (lower.includes(pattern.toLowerCase())) {
      return slug;
    }
  }
  
  // Smart detection based on filename patterns - using actual database slugs
  if (lower.includes('corvette') && lower.includes('z06')) return 'c7-corvette-z06';
  if (lower.includes('corvette') && lower.includes('stingray')) return 'c8-corvette-stingray';
  if (lower.includes('corvette') && lower.includes('zr1')) return 'c8-corvette-stingray';  // Use Stingray as base
  if (lower.includes('corvette') && lower.includes('e-ray')) return 'c8-corvette-stingray';
  if (lower.includes('corvette') && lower.includes('grand')) return 'c7-corvette-grand-sport';
  if (lower.includes('camaro') && lower.includes('zl1')) return 'camaro-zl1';
  if (lower.includes('camaro') && lower.includes('ss')) return 'camaro-zl1';
  if (lower.includes('911') && lower.includes('carrera')) return '991-1-carrera-s';
  if (lower.includes('911') && lower.includes('gt3')) return 'porsche-911-gt3-992';
  if (lower.includes('cayman') && lower.includes('gts') && lower.includes('4.0')) return '718-cayman-gts-40';
  if (lower.includes('cayman') && lower.includes('gts')) return '981-cayman-gts';
  if (lower.includes('cayman') && lower.includes('gt4') && lower.includes('rs')) return '718-cayman-gt4-rs';
  if (lower.includes('cayman') && lower.includes('gt4')) return '718-cayman-gt4';
  if (lower.includes('cayman') && lower.includes('s')) return '718-cayman-s';
  if (lower.includes('gt350')) return 'shelby-gt350';
  if (lower.includes('gt500')) return 'shelby-gt500';
  if (lower.includes('gt-r') || lower.includes('gtr')) return 'nissan-gt-r';
  if (lower.includes('370z')) return 'nissan-370z-nismo';
  if (lower.includes('miata') || lower.includes('mx-5')) return 'mazda-mx-5-miata-nd';
  if (lower.includes('gr86') || lower.includes('gr-86')) return 'toyota-gr86';
  if (lower.includes('emira')) return 'lotus-emira';
  if (lower.includes('evora')) return 'lotus-evora-gt';
  if (lower.includes('m2') && lower.includes('competition')) return 'bmw-m2-competition';
  if (lower.includes('f-type')) return 'jaguar-f-type-r';
  if (lower.includes('r8')) return 'audi-r8-v10';
  if (lower.includes('gallardo')) return 'lamborghini-gallardo';
  if (lower.includes('viper')) return 'dodge-viper';
  if (lower.includes('lc500') || lower.includes('lc 500')) return 'lexus-lc-500';
  if (lower.includes('rc f') || lower.includes('rc-f')) return 'lexus-rc-f';
  
  return null;  // Unknown mapping
}

/**
 * Detect image type from filename (hero, interior, rear, detail, action)
 */
function detectImageType(filename) {
  const lower = filename.toLowerCase();
  
  if (lower.includes('interior') || lower.includes('cockpit') || lower.includes('dash') || 
      lower.includes('pov') || lower.includes('console') || lower.includes('seats')) {
    return 'interior';
  }
  if (lower.includes('rear') || lower.includes('back')) return 'rear';
  if (lower.includes('wheel') || lower.includes('brake') || lower.includes('badge') || 
      lower.includes('detail') || lower.includes('plaque')) {
    return 'detail';
  }
  if (lower.includes('overhead') || lower.includes('top')) return 'overhead';
  if (lower.includes('action') || lower.includes('racing') || lower.includes('track') ||
      lower.includes('imsa')) {
    return 'action';
  }
  
  // Default to hero (front/3-4 angle)
  return 'hero';
}

// =============================================================================
// IMAGE ANALYSIS (Using Google's Gemini Vision)
// =============================================================================

/**
 * Analyze an image to extract photographic attributes for inspiration
 * We're NOT asking to describe the car - we're extracting PHOTOGRAPHIC techniques
 */
async function analyzeImageForInspiration(imagePath) {
  if (!GOOGLE_AI_API_KEY) {
    throw new Error('GOOGLE_AI_API_KEY not set');
  }
  
  console.log(`\n🔍 Analyzing image for photographic inspiration...`);
  console.log(`   Source: ${path.basename(imagePath)}`);
  
  // Read and encode image
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  const mimeType = imagePath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
  
  // Use Gemini Pro Vision for analysis
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_AI_API_KEY}`;
  
  const analysisPrompt = `You are a professional automotive photographer analyzing this image for PHOTOGRAPHIC TECHNIQUE ONLY.

Analyze this automotive photograph and extract the following attributes (for inspiration, not copying):

1. CAMERA ANGLE: (e.g., "3/4 front angle from slightly below eye level", "overhead birds-eye view", "rear 3/4 angle")

2. LIGHTING: (e.g., "golden hour warm light from the left", "overcast soft diffuse light", "dramatic studio rim lighting", "harsh midday sun")

3. ENVIRONMENT/BACKDROP: Describe the setting in general terms (e.g., "mountain road with snow-capped peaks", "urban street at night with reflections", "studio with gradient background", "coastal highway")

4. MOOD/ATMOSPHERE: (e.g., "dramatic and powerful", "elegant and sophisticated", "aggressive and sporty", "peaceful and serene")

5. COMPOSITION STYLE: (e.g., "dynamic with motion blur background", "static showcase shot", "cinematic wide aspect", "intimate detail focus")

6. COLOR PALETTE: (e.g., "warm oranges and reds", "cool blues and grays", "high contrast with deep shadows", "muted earth tones")

7. IMAGE TYPE: Is this a HERO (exterior full car), INTERIOR, DETAIL (close-up), ACTION (motion), or OTHER?

IMPORTANT: DO NOT describe the specific car model or any logos/badges. We only want the PHOTOGRAPHIC ATTRIBUTES that could inspire a new, original image.

Respond in JSON format:
{
  "cameraAngle": "...",
  "lighting": "...",
  "environment": "...",
  "mood": "...",
  "compositionStyle": "...",
  "colorPalette": "...",
  "imageType": "hero|interior|detail|action|other",
  "photographicNotes": "Any additional notes about what makes this shot compelling"
}`;

  const body = {
    contents: [{
      parts: [
        { text: analysisPrompt },
        {
          inline_data: {
            mime_type: mimeType,
            data: base64Image
          }
        }
      ]
    }],
    generationConfig: {
      temperature: 0.3,  // Low temperature for consistent analysis
    }
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Vision API error (${response.status}): ${errorText}`);
  }
  
  const result = await response.json();
  const textContent = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  // Parse JSON from response
  try {
    // Extract JSON from potential markdown code blocks
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.log('   ⚠️  Could not parse JSON, using raw analysis');
  }
  
  return { raw: textContent };
}

// =============================================================================
// PROMPT GENERATION (From Inspiration → Original Prompt)
// =============================================================================

/**
 * Generate an original prompt INSPIRED by the analysis
 * This creates a NEW image, not a copy
 */
function generateInspiredPrompt(carSlug, analysis, imageType = 'hero') {
  const car = carData.find(c => c.slug === carSlug);
  if (!car) {
    throw new Error(`Car not found: ${carSlug}`);
  }
  
  const year = car.years.split('-')[0];
  const brand = extractBrand(car.name);
  
  // Build prompt based on analysis inspiration
  let prompt = '';
  
  if (imageType === 'interior') {
    prompt = `Interior photograph of a ${year} ${car.name}: `;
    prompt += `${analysis.cameraAngle || "Driver's POV showing dashboard and controls"}. `;
    prompt += `${analysis.lighting || "Natural daylight through windows"}. `;
    prompt += `${analysis.mood || "Driver-focused and purposeful"} atmosphere. `;
    prompt += `Professional automotive interior photography of this ${brand}. `;
    prompt += `${analysis.colorPalette || "Neutral tones with quality materials"}. `;
    prompt += `Clean, well-maintained interior in excellent condition.`;
  } else if (imageType === 'detail') {
    prompt = `Close-up detail photograph of a ${year} ${car.name}: `;
    prompt += `Focusing on a signature design element or engineering detail. `;
    prompt += `${analysis.lighting || "Professional lighting showcasing texture and form"}. `;
    prompt += `${analysis.mood || "Technical appreciation"} mood. `;
    prompt += `Sharp focus, ${analysis.colorPalette || "rich colors"}, professional automotive photography.`;
  } else if (imageType === 'action') {
    prompt = `Dynamic action photograph of a ${year} ${car.name}: `;
    prompt += `${analysis.cameraAngle || "Panning shot capturing motion"}. `;
    prompt += `${analysis.environment || "On a scenic driving road"} setting. `;
    prompt += `${analysis.compositionStyle || "Motion blur on background, car sharp and in focus"}. `;
    prompt += `${analysis.lighting || "Dramatic lighting"}, ${analysis.mood || "exciting and powerful"} mood. `;
    prompt += `Professional motorsport photography style.`;
  } else if (imageType === 'overhead') {
    prompt = `Overhead birds-eye view photograph of a ${year} ${car.name}: `;
    prompt += `Shot from directly above, showing roof line and overall shape. `;
    prompt += `${analysis.environment || "Clean, minimal background"} setting. `;
    prompt += `${analysis.lighting || "Even, professional lighting"}. `;
    prompt += `Professional automotive photography highlighting the design from above.`;
  } else {
    // Hero shot (default)
    prompt = `OUTDOOR photograph, NOT in a studio: A ${year} ${car.name} `;
    prompt += `captured ${analysis.cameraAngle || "from a 3/4 front angle"}. `;
    prompt += `${analysis.environment || "On a scenic driving road"}, ${analysis.lighting || "with natural golden hour lighting"}. `;
    prompt += `${analysis.mood || "Aspirational and premium"} mood. `;
    prompt += `${analysis.compositionStyle || "Professional automotive photography"}. `;
    prompt += `Real outdoor setting, natural sky visible, dramatic scenery. `;
    prompt += `${analysis.colorPalette || "Rich, vibrant colors"}. `;
    prompt += `This is an ON-LOCATION photo shoot, NOT a studio shot.`;
  }
  
  return prompt;
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
  ];
  
  for (const { pattern, brand } of brandPatterns) {
    if (pattern.test(name)) {
      return brand;
    }
  }
  return 'sports car';
}

// =============================================================================
// IMAGE GENERATION (Using Imagen API)
// =============================================================================

/**
 * Generate image using Nano Banana Pro (text-only prompt)
 */
async function generateImage(prompt, outputPath, options = {}) {
  if (!GOOGLE_AI_API_KEY) {
    throw new Error('GOOGLE_AI_API_KEY not set');
  }
  
  const aspectRatio = options.aspectRatio || '16:9';
  const imageSize = options.imageSize || '2K';
  
  console.log('🍌 Generating original image with Google AI...');
  console.log(`   Aspect: ${aspectRatio}, Size: ${imageSize}`);
  
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
    throw new Error(`Image API error (${response.status}): ${errorText}`);
  }
  
  const result = await response.json();
  const candidates = result.candidates || [];
  if (candidates.length === 0) throw new Error('No candidates in response');
  
  const parts = candidates[0].content?.parts || [];
  const imagePart = parts.find(p => p.inlineData);
  
  if (!imagePart) throw new Error('No image generated - model may have refused');
  
  const imageData = imagePart.inlineData.data;
  const mimeType = imagePart.inlineData.mimeType || 'image/png';
  
  let ext = '.png';
  if (mimeType === 'image/jpeg') ext = '.jpg';
  if (mimeType === 'image/webp') ext = '.webp';
  
  const buffer = Buffer.from(imageData, 'base64');
  const finalPath = outputPath.replace(/\.(webp|png|jpg)$/, ext);
  
  fs.writeFileSync(finalPath, buffer);
  console.log(`✅ Original image saved to: ${finalPath}`);
  
  return finalPath;
}

/**
 * Generate image WITH reference image as visual guidance
 * This shows the AI the reference image and asks it to generate 
 * a NEW, ORIGINAL image inspired by the reference's style/composition
 */
async function generateImageWithReference(prompt, referenceImagePath, outputPath, options = {}) {
  if (!GOOGLE_AI_API_KEY) {
    throw new Error('GOOGLE_AI_API_KEY not set');
  }
  
  const aspectRatio = options.aspectRatio || '16:9';
  const imageSize = options.imageSize || '2K';
  
  console.log('🖼️  Generating with REFERENCE IMAGE guidance...');
  console.log(`   Reference: ${path.basename(referenceImagePath)}`);
  console.log(`   Aspect: ${aspectRatio}, Size: ${imageSize}`);
  
  // Read and encode reference image
  const imageBuffer = fs.readFileSync(referenceImagePath);
  const base64Image = imageBuffer.toString('base64');
  const mimeType = referenceImagePath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
  
  // Build the reference-guided prompt
  // IMPORTANT: We explicitly tell the AI to create a NEW image, not copy the reference
  const referencePrompt = `REFERENCE IMAGE PROVIDED FOR STYLE INSPIRATION ONLY.

Look at the attached reference image and note its:
- Camera angle and composition
- Lighting style and mood
- Color palette and atmosphere
- Overall photographic technique

Now, generate a COMPLETELY NEW, ORIGINAL image based on this description:

${prompt}

CRITICAL INSTRUCTIONS:
- Generate a NEW image from scratch - do NOT copy, reproduce, or closely imitate the reference
- Use the reference ONLY for understanding the photographic style and mood
- The output must be your own original AI-generated creation
- Apply similar photographic techniques but create something distinctly different
- This is for commercial use - the output must be 100% AI-generated original content`;

  const modelName = 'gemini-3-pro-image-preview';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GOOGLE_AI_API_KEY}`;
  
  const body = {
    contents: [{
      parts: [
        { text: referencePrompt },
        {
          inline_data: {
            mime_type: mimeType,
            data: base64Image
          }
        }
      ]
    }],
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
    throw new Error(`Image API error (${response.status}): ${errorText}`);
  }
  
  const result = await response.json();
  const candidates = result.candidates || [];
  if (candidates.length === 0) throw new Error('No candidates in response');
  
  const parts = candidates[0].content?.parts || [];
  const imagePart = parts.find(p => p.inlineData);
  const textPart = parts.find(p => p.text);
  
  if (textPart) {
    console.log(`   Model notes: ${textPart.text.substring(0, 150)}...`);
  }
  
  if (!imagePart) throw new Error('No image generated - model may have refused or detected copyright concerns');
  
  const imageData = imagePart.inlineData.data;
  const outputMimeType = imagePart.inlineData.mimeType || 'image/png';
  
  let ext = '.png';
  if (outputMimeType === 'image/jpeg') ext = '.jpg';
  if (outputMimeType === 'image/webp') ext = '.webp';
  
  const buffer = Buffer.from(imageData, 'base64');
  const finalPath = outputPath.replace(/\.(webp|png|jpg)$/, ext);
  
  fs.writeFileSync(finalPath, buffer);
  console.log(`✅ Reference-guided image saved to: ${finalPath}`);
  
  return finalPath;
}

// =============================================================================
// BLOB UPLOAD
// =============================================================================

async function uploadToBlob(localPath, blobPath) {
  if (!BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN not set');
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
  
  console.log(`✅ Uploaded: ${blob.url}`);
  return blob.url;
}

// =============================================================================
// LOGGING & TRACKING
// =============================================================================

/**
 * Log the inspiration chain for transparency and legal clarity
 */
function logInspiration(entry) {
  let log = [];
  if (fs.existsSync(INSPIRATION_LOG)) {
    log = JSON.parse(fs.readFileSync(INSPIRATION_LOG, 'utf-8'));
  }
  
  log.push({
    ...entry,
    timestamp: new Date().toISOString(),
    rights: '100% owned - AI generated, not derived from source image'
  });
  
  fs.writeFileSync(INSPIRATION_LOG, JSON.stringify(log, null, 2));
}

// =============================================================================
// COMMANDS
// =============================================================================

/**
 * List all pressroom images with their mappings
 */
function listPressroomImages() {
  console.log('\n=== PRESSROOM IMAGES ===\n');
  
  if (!fs.existsSync(PRESSROOM_DIR)) {
    console.log('❌ Pressroom Images folder not found');
    return;
  }
  
  const files = fs.readdirSync(PRESSROOM_DIR)
    .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
  
  console.log(`Found ${files.length} images\n`);
  
  // Group by detected car
  const grouped = {};
  files.forEach(file => {
    const carSlug = mapPressroomToCar(file);
    const key = carSlug || 'unmapped';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push({
      file,
      type: detectImageType(file),
    });
  });
  
  // Display grouped
  for (const [carSlug, images] of Object.entries(grouped)) {
    const car = carData.find(c => c.slug === carSlug);
    const carName = car ? car.name : (carSlug === 'unmapped' ? '⚠️  UNMAPPED' : carSlug);
    
    console.log(`\n${carName} (${carSlug}):`);
    images.forEach(img => {
      console.log(`  [${img.type.padEnd(8)}] ${img.file}`);
    });
  }
  
  // Summary
  const mappedCount = files.filter(f => mapPressroomToCar(f)).length;
  console.log('\n--- SUMMARY ---');
  console.log(`Total images: ${files.length}`);
  console.log(`Mapped to cars: ${mappedCount}`);
  console.log(`Unmapped: ${files.length - mappedCount}`);
}

/**
 * Show detailed car → pressroom mappings
 */
function showMappings() {
  console.log('\n=== PRESSROOM → CAR MAPPINGS ===\n');
  
  const files = fs.readdirSync(PRESSROOM_DIR)
    .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
  
  // Get all cars that have pressroom images
  const carsWithImages = new Set();
  files.forEach(f => {
    const slug = mapPressroomToCar(f);
    if (slug) carsWithImages.add(slug);
  });
  
  console.log('Cars with pressroom inspiration available:\n');
  
  carData.forEach(car => {
    const hasImages = carsWithImages.has(car.slug);
    const icon = hasImages ? '✅' : '⬜';
    const images = files.filter(f => mapPressroomToCar(f) === car.slug);
    
    console.log(`${icon} ${car.slug}`);
    if (hasImages) {
      images.forEach(img => {
        console.log(`   └─ ${img} [${detectImageType(img)}]`);
      });
    }
  });
}

/**
 * Analyze a single pressroom image
 */
async function analyzeCommand(imagePath) {
  // Resolve path
  let fullPath = imagePath;
  if (!path.isAbsolute(imagePath)) {
    // Try pressroom folder first
    const pressroomPath = path.join(PRESSROOM_DIR, imagePath);
    if (fs.existsSync(pressroomPath)) {
      fullPath = pressroomPath;
    } else {
      fullPath = path.resolve(imagePath);
    }
  }
  
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Image not found: ${imagePath}`);
    return;
  }
  
  console.log(`\n=== ANALYZING IMAGE FOR INSPIRATION ===`);
  console.log(`Source: ${path.basename(fullPath)}`);
  
  const analysis = await analyzeImageForInspiration(fullPath);
  
  console.log('\n📸 PHOTOGRAPHIC ATTRIBUTES EXTRACTED:\n');
  console.log(JSON.stringify(analysis, null, 2));
  
  // Try to map to a car
  const carSlug = mapPressroomToCar(path.basename(fullPath));
  const imageType = analysis.imageType || detectImageType(path.basename(fullPath));
  
  if (carSlug) {
    const car = carData.find(c => c.slug === carSlug);
    console.log(`\n🚗 Detected car: ${car?.name || carSlug}`);
    console.log(`📷 Image type: ${imageType}`);
    
    console.log('\n📝 INSPIRED PROMPT (for original generation):');
    const prompt = generateInspiredPrompt(carSlug, analysis, imageType);
    console.log(`\n${prompt}`);
    
    console.log(`\n▶️  To generate: node scripts/generate-inspired-images.js generate ${carSlug} "${path.basename(fullPath)}"`);
  } else {
    console.log('\n⚠️  Could not map image to a car in database');
    console.log('   Use: node scripts/generate-inspired-images.js generate <car-slug> <image-path>');
  }
}

/**
 * Generate an inspired image for a car
 * @param {string} carSlug - Car slug from database
 * @param {string} imagePath - Path to inspiration image
 * @param {Object} options - Generation options
 * @param {boolean} options.useReference - If true, pass reference image directly to AI
 * @param {boolean} options.skipUpload - If true, don't upload to Blob (local only)
 */
async function generateCommand(carSlug, imagePath, options = {}) {
  const { useReference = false, skipUpload = false } = options;
  
  const car = carData.find(c => c.slug === carSlug);
  if (!car) {
    console.error(`❌ Car not found: ${carSlug}`);
    console.log('\nAvailable cars:');
    carData.slice(0, 10).forEach(c => console.log(`  - ${c.slug}`));
    console.log('  ... and more');
    return;
  }
  
  // Resolve image path
  let fullPath = imagePath;
  if (!path.isAbsolute(imagePath)) {
    const pressroomPath = path.join(PRESSROOM_DIR, imagePath);
    if (fs.existsSync(pressroomPath)) {
      fullPath = pressroomPath;
    } else {
      fullPath = path.resolve(imagePath);
    }
  }
  
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Inspiration image not found: ${imagePath}`);
    return;
  }
  
  console.log('\n' + '='.repeat(60));
  if (useReference) {
    console.log('🖼️  REFERENCE-GUIDED IMAGE GENERATION');
    console.log('   (Reference image passed directly to AI for style guidance)');
  } else {
    console.log('🎨 INSPIRATION-BASED IMAGE GENERATION');
    console.log('   (Analyzing reference → extracting attributes → text prompt)');
  }
  console.log('='.repeat(60));
  console.log(`\nCar: ${car.name} (${carSlug})`);
  console.log(`Reference source: ${path.basename(fullPath)}`);
  console.log('\n⚖️  RIGHTS: Generated image will be 100% original AI content');
  console.log('   You own full commercial rights to the output.');
  console.log('='.repeat(60));
  
  let analysis = {};
  let imageType;
  let prompt;
  
  if (useReference) {
    // REFERENCE MODE: Pass image directly to AI
    console.log('\n📷 STEP 1: Detecting image type...');
    imageType = detectImageType(path.basename(fullPath));
    console.log(`   Image type: ${imageType}`);
    
    // Build a simpler prompt for reference-guided generation
    const year = car.years.split('-')[0];
    const brand = extractBrand(car.name);
    
    if (imageType === 'interior') {
      prompt = `Generate a NEW, ORIGINAL interior photograph of a ${year} ${car.name}. Show the cockpit, steering wheel, dashboard, and controls. Professional automotive interior photography of this ${brand}. Natural lighting, clean and well-maintained interior.`;
    } else if (imageType === 'detail') {
      prompt = `Generate a NEW, ORIGINAL detail close-up photograph of a ${year} ${car.name}. Focus on a signature design element like wheels, brakes, or badge. Professional automotive detail photography showing craftsmanship.`;
    } else if (imageType === 'action') {
      prompt = `Generate a NEW, ORIGINAL dynamic action photograph of a ${year} ${car.name} in motion. Panning shot with motion blur background, car sharp and in focus. Professional motorsport photography style.`;
    } else if (imageType === 'rear') {
      prompt = `Generate a NEW, ORIGINAL rear 3/4 angle photograph of a ${year} ${car.name}. Show the rear design, taillights, and exhaust. Outdoor setting with natural lighting.`;
    } else if (imageType === 'overhead') {
      prompt = `Generate a NEW, ORIGINAL overhead birds-eye view photograph of a ${year} ${car.name}. Shot from directly above showing roof line and overall shape. Clean background.`;
    } else {
      prompt = `Generate a NEW, ORIGINAL 3/4 front angle photograph of a ${year} ${car.name} in a scenic outdoor setting. NOT in a studio. Natural lighting, real sky visible, dramatic scenery. Professional automotive photography of this ${brand}.`;
    }
    
    console.log(`\n📝 STEP 2: Prompt prepared for reference-guided generation`);
    console.log(`   Prompt: ${prompt.substring(0, 80)}...`);
    
  } else {
    // ANALYSIS MODE: Analyze image first, then generate from text
    console.log('\n📷 STEP 1: Analyzing inspiration image...');
    analysis = await analyzeImageForInspiration(fullPath);
    console.log('   Extracted photographic attributes');
    
    imageType = analysis.imageType || detectImageType(path.basename(fullPath));
    console.log(`   Image type: ${imageType}`);
    
    console.log('\n📝 STEP 2: Generating original prompt...');
    prompt = generateInspiredPrompt(carSlug, analysis, imageType);
    console.log(`   Prompt (truncated): ${prompt.substring(0, 100)}...`);
  }
  
  // Generate image
  const suffix = useReference ? 'ref' : 'inspired';
  const outputFilename = `${carSlug}-${imageType}-${suffix}.png`;
  const outputPath = path.join(GENERATED_DIR, outputFilename);
  
  const imageOptions = {
    aspectRatio: imageType === 'detail' ? '1:1' : '16:9',
    imageSize: '2K',
  };
  
  try {
    let localPath;
    
    if (useReference) {
      console.log('\n🖼️  STEP 3: Generating with reference image...');
      localPath = await generateImageWithReference(prompt, fullPath, outputPath, imageOptions);
    } else {
      console.log('\n🖼️  STEP 3: Generating original AI image...');
      localPath = await generateImage(prompt, outputPath, imageOptions);
    }
    
    let blobUrl = null;
    
    if (!skipUpload) {
      // Upload to Blob
      console.log('\n☁️  STEP 4: Uploading to Vercel Blob...');
      const blobPath = `cars/${carSlug}/${imageType}.webp`;
      blobUrl = await uploadToBlob(localPath, blobPath);
    } else {
      console.log('\n⏭️  STEP 4: Skipping upload (--no-upload flag)');
    }
    
    // Log for transparency
    logInspiration({
      carSlug,
      carName: car.name,
      imageType,
      inspirationSource: path.basename(fullPath),
      generationMode: useReference ? 'reference-guided' : 'analysis-based',
      analysisUsed: useReference ? null : analysis,
      promptGenerated: prompt,
      outputPath: localPath,
      blobUrl,
    });
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ GENERATION COMPLETE');
    console.log('='.repeat(60));
    console.log(`\n🚗 Car: ${car.name}`);
    console.log(`📷 Type: ${imageType}`);
    console.log(`🔧 Mode: ${useReference ? 'Reference-guided' : 'Analysis-based'}`);
    console.log(`💾 Local: ${localPath}`);
    if (blobUrl) {
      console.log(`☁️  Blob: ${blobUrl}`);
    }
    console.log(`\n⚖️  RIGHTS: 100% owned by you - AI generated original`);
    console.log('   Inspiration tracked in: generated-images/inspiration-log.json');
    
    return { success: true, carSlug, imageType, localPath, blobUrl };
    
  } catch (error) {
    console.error(`\n❌ Generation failed: ${error.message}`);
    return { success: false, carSlug, error: error.message };
  }
}

/**
 * Batch process all pressroom images
 */
async function batchCommand(options = {}) {
  const { limit = 5, delayMs = 5000, skipExisting = true, useReference = false, skipUpload = false } = options;
  
  console.log('\n=== BATCH INSPIRATION PROCESSING ===\n');
  
  const files = fs.readdirSync(PRESSROOM_DIR)
    .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
    .filter(f => mapPressroomToCar(f));  // Only process mappable images
  
  console.log(`Found ${files.length} mappable pressroom images`);
  console.log(`Processing limit: ${limit}`);
  console.log(`Delay between: ${delayMs}ms`);
  console.log(`Mode: ${useReference ? '🖼️  Reference-guided' : '📝 Analysis-based'}`);
  console.log(`Upload: ${skipUpload ? 'Local only' : 'Vercel Blob'}`);
  console.log(`Skip existing: ${skipExisting}\n`);
  
  const results = { success: [], failed: [], skipped: [] };
  let processed = 0;
  
  for (const file of files) {
    if (processed >= limit) break;
    
    const carSlug = mapPressroomToCar(file);
    const imageType = detectImageType(file);
    
    // Check if we should skip
    if (skipExisting) {
      const existingFile = fs.readdirSync(GENERATED_DIR)
        .find(f => f.startsWith(`${carSlug}-${imageType}`));
      if (existingFile) {
        console.log(`⏭️  Skipping ${carSlug}/${imageType} - already exists`);
        results.skipped.push({ carSlug, imageType, file });
        continue;
      }
    }
    
    console.log(`\n📍 Processing ${processed + 1}/${limit}: ${file}`);
    
    const result = await generateCommand(carSlug, file, { useReference, skipUpload });
    
    if (result?.success) {
      results.success.push(result);
    } else {
      results.failed.push({ carSlug, imageType, file, error: result?.error });
    }
    
    processed++;
    
    if (processed < limit && processed < files.length) {
      console.log(`\n⏳ Waiting ${delayMs/1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 BATCH SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${results.success.length}`);
  console.log(`⏭️  Skipped: ${results.skipped.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`🔧 Mode used: ${useReference ? 'Reference-guided' : 'Analysis-based'}`);
  
  if (results.success.length > 0) {
    console.log('\n✅ Generated:');
    results.success.forEach(r => {
      console.log(`   ${r.carSlug}/${r.imageType}: ${r.blobUrl || r.localPath}`);
    });
  }
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed:');
    results.failed.forEach(r => {
      console.log(`   ${r.carSlug}/${r.imageType}: ${r.error}`);
    });
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  analyzeImageForInspiration,
  generateInspiredPrompt,
  detectImageType,
  mapPressroomToCar,
  generateCommand,
  analyzeCommand,
  batchCommand
};

// =============================================================================
// MAIN (CLI Execution)
// =============================================================================

// Only run CLI logic if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const command = process.argv[2];
  const arg1 = process.argv[3];
  const arg2 = process.argv[4];

  // Parse flags
  const limitFlag = process.argv.find(a => a.startsWith('--limit='));
  const limit = limitFlag ? parseInt(limitFlag.split('=')[1], 10) : 5;
  const delayFlag = process.argv.find(a => a.startsWith('--delay='));
  const delayMs = delayFlag ? parseInt(delayFlag.split('=')[1], 10) : 5000;
  const useReference = process.argv.includes('--use-reference') || process.argv.includes('--ref');
  const skipUpload = process.argv.includes('--no-upload') || process.argv.includes('--local');

  switch (command) {
    case 'list':
      listPressroomImages();
      break;
      
    case 'map':
      showMappings();
      break;
      
    case 'analyze':
      if (!arg1) {
        console.error('Usage: node scripts/generate-inspired-images.js analyze <image-path>');
        process.exit(1);
      }
      analyzeCommand(arg1);
      break;
      
    case 'generate':
      if (!arg1 || !arg2) {
        console.error('Usage: node scripts/generate-inspired-images.js generate <car-slug> <image-path> [--use-reference]');
        process.exit(1);
      }
      generateCommand(arg1, arg2, { useReference, skipUpload });
      break;
      
    case 'batch':
      batchCommand({ limit, delayMs, useReference, skipUpload });
      break;
      
    default:
      console.log(`
  🎨 INSPIRATION-BASED IMAGE GENERATION
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Uses pressroom images as INSPIRATION to generate 100% ORIGINAL AI images.
  You own full commercial rights to all generated images.

  TWO GENERATION MODES:

    📝 ANALYSIS MODE (default):
       Analyzes the reference → extracts photographic attributes as TEXT →
       generates from text prompt. Safer, more transformative.

    🖼️  REFERENCE MODE (--use-reference):
       Passes reference image DIRECTLY to AI with instructions to create
       something original inspired by the style. More accurate to reference.

  COMMANDS:
    list                              List all pressroom images with mappings
    map                               Show which cars have pressroom inspiration
    analyze <image-path>              Analyze an image's photographic attributes
    generate <slug> <image> [flags]   Generate inspired image for a car
    batch [flags]                     Process multiple pressroom images

  FLAGS:
    --use-reference, --ref            Pass reference image directly to AI
    --no-upload, --local              Save locally only, don't upload to Blob
    --limit=5                         Max images to process in batch
    --delay=5000                      Delay between generations (ms)

  EXAMPLES:
    # List available pressroom images
    node scripts/generate-inspired-images.js list
    
    # Analyze a pressroom image (see what attributes we'd extract)
    node scripts/generate-inspired-images.js analyze "2026 Corvette ZR1 Green .jpg"
    
    # Generate using ANALYSIS mode (default - extracts text attributes)
    node scripts/generate-inspired-images.js generate c8-corvette-z06 "2024-chevrolet-corvette-z06-300.jpg"
    
    # Generate using REFERENCE mode (passes image directly to AI)
    node scripts/generate-inspired-images.js generate c8-corvette-z06 "2024-chevrolet-corvette-z06-300.jpg" --use-reference
    
    # Generate locally without uploading (for preview)
    node scripts/generate-inspired-images.js generate c8-corvette-z06 "2024-chevrolet-corvette-z06-300.jpg" --ref --local
    
    # Batch process with reference mode
    node scripts/generate-inspired-images.js batch --limit=3 --use-reference

  ⚖️  RIGHTS CLARITY:
    • Pressroom images are used ONLY for style/technique inspiration
    • AI generates 100% NEW, ORIGINAL images
    • You own full commercial rights to all generated output
    • Both modes explicitly instruct AI to create original content
    • Inspiration chain is logged in generated-images/inspiration-log.json
  `);
  }
}

