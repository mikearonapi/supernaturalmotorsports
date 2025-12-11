#!/usr/bin/env node
/**
 * External Image Import Script
 * 
 * Import images from manufacturer newsrooms, Wikimedia Commons, and other legitimate sources.
 * Downloads images, uploads to Vercel Blob, and tracks metadata in the library.
 * 
 * Usage:
 *   node scripts/import-external-images.js import <url> --car=<slug> --type=<type> --source=<source>
 *   node scripts/import-external-images.js batch <json-file>
 *   node scripts/import-external-images.js wikimedia <filename> --car=<slug>
 *   node scripts/import-external-images.js newsrooms
 *   node scripts/import-external-images.js status
 * 
 * Examples:
 *   node scripts/import-external-images.js import "https://example.com/car.jpg" --car=porsche-911-gt3 --type=exterior --source=press
 *   node scripts/import-external-images.js wikimedia "Porsche_911_GT3_2022.jpg" --car=porsche-911-gt3
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';
import { carData } from '../data/cars.js';
import imageSize from 'image-size';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Load environment
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

const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const DOWNLOADS_DIR = path.join(PROJECT_ROOT, 'generated-images', 'imports');
const LIBRARY_PATH = path.join(PROJECT_ROOT, 'image-library.json');

// Ensure directories exist
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

// =============================================================================
// IMAGE TYPES & SOURCES
// =============================================================================

const IMAGE_TYPES = {
  exterior: {
    name: 'Exterior',
    description: 'External view of the car',
    tags: ['exterior', 'body'],
    uses: ['gallery', 'hero-alt', 'listing'],
  },
  'exterior-front': {
    name: 'Exterior Front',
    description: 'Front 3/4 or head-on view',
    tags: ['exterior', 'front', 'body'],
    uses: ['gallery', 'comparison'],
  },
  'exterior-rear': {
    name: 'Exterior Rear',
    description: 'Rear 3/4 or tail view',
    tags: ['exterior', 'rear', 'body'],
    uses: ['gallery', 'comparison'],
  },
  'exterior-side': {
    name: 'Exterior Side',
    description: 'Profile/side view',
    tags: ['exterior', 'profile', 'body'],
    uses: ['gallery', 'comparison', 'specs'],
  },
  interior: {
    name: 'Interior',
    description: 'Cabin/cockpit view',
    tags: ['interior', 'cabin', 'cockpit'],
    uses: ['gallery', 'interior-section'],
  },
  'interior-dash': {
    name: 'Dashboard',
    description: 'Dashboard and instrument cluster',
    tags: ['interior', 'dashboard', 'instruments'],
    uses: ['gallery', 'detail'],
  },
  'interior-seats': {
    name: 'Seats',
    description: 'Seat design and materials',
    tags: ['interior', 'seats', 'materials'],
    uses: ['gallery', 'detail'],
  },
  engine: {
    name: 'Engine Bay',
    description: 'Engine compartment view',
    tags: ['engine', 'mechanical', 'powertrain'],
    uses: ['specs', 'technical', 'detail'],
  },
  detail: {
    name: 'Detail',
    description: 'Close-up detail shot',
    tags: ['detail', 'close-up'],
    uses: ['gallery', 'detail-section'],
  },
  action: {
    name: 'Action',
    description: 'Car in motion or on track',
    tags: ['action', 'motion', 'dynamic'],
    uses: ['hero-alt', 'gallery', 'action-section'],
  },
  wheel: {
    name: 'Wheel',
    description: 'Wheel and brake detail',
    tags: ['wheel', 'brake', 'detail'],
    uses: ['gallery', 'specs', 'detail'],
  },
};

const SOURCE_TYPES = {
  press: {
    name: 'Manufacturer Press',
    license: 'editorial',
    attribution: 'Courtesy of {brand}',
    notes: 'Editorial use only - for reviews and informational content',
  },
  wikimedia: {
    name: 'Wikimedia Commons',
    license: 'cc-by-sa',
    attribution: 'Required per license',
    notes: 'Check specific license on each image',
  },
  'wikimedia-cc0': {
    name: 'Wikimedia Commons (Public Domain)',
    license: 'public-domain',
    attribution: 'None required',
    notes: 'No restrictions',
  },
  stock: {
    name: 'Stock Photography',
    license: 'licensed',
    attribution: 'Per license agreement',
    notes: 'Must have valid license',
  },
  owned: {
    name: 'Original/Owned',
    license: 'owned',
    attribution: 'None required',
    notes: 'Full rights owned',
  },
};

// =============================================================================
// DOWNLOAD UTILITIES
// =============================================================================

/**
 * Download a file from URL
 */
async function downloadImage(url, outputPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const request = protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'image/*,*/*',
      },
    }, (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        downloadImage(response.headers.location, outputPath).then(resolve).catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
        return;
      }
      
      const fileStream = fs.createWriteStream(outputPath);
      response.pipe(fileStream);
      
      fileStream.on('finish', () => {
        fileStream.close();
        resolve(outputPath);
      });
      
      fileStream.on('error', (err) => {
        fs.unlink(outputPath, () => {});
        reject(err);
      });
    });
    
    request.on('error', reject);
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Download timeout'));
    });
  });
}

/**
 * Get image format from URL or content-type
 */
function getImageFormat(url) {
  const ext = path.extname(url).toLowerCase().split('?')[0];
  if (['.jpg', '.jpeg'].includes(ext)) return 'jpeg';
  if (ext === '.png') return 'png';
  if (ext === '.webp') return 'webp';
  if (ext === '.gif') return 'gif';
  return 'jpeg'; // default
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
  const ext = path.extname(localPath).toLowerCase();
  const contentType = ext === '.webp' ? 'image/webp' : 
                      ext === '.png' ? 'image/png' : 
                      ext === '.gif' ? 'image/gif' : 'image/jpeg';
  
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
// LIBRARY MANAGEMENT
// =============================================================================

function loadLibrary() {
  if (fs.existsSync(LIBRARY_PATH)) {
    return JSON.parse(fs.readFileSync(LIBRARY_PATH, 'utf-8'));
  }
  return { version: '1.0', lastUpdated: new Date().toISOString(), images: [] };
}

function saveLibrary(library) {
  library.lastUpdated = new Date().toISOString();
  fs.writeFileSync(LIBRARY_PATH, JSON.stringify(library, null, 2));
}

function generateId() {
  return `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Create a standardized image record
 */
function createImageRecord(options) {
  const {
    carSlug,
    brand,
    blobUrl,
    blobPath,
    sourceType,
    sourceUrl,
    license,
    attribution,
    title,
    description,
    altText,
    contentTags = [],
    recommendedUses = [],
    qualityTier = 'standard',
    isPrimary = false,
    format,
    width,
    height,
    fileSize,
    aspectRatio,
    photographer,
    notes,
  } = options;
  
  return {
    id: generateId(),
    car_slug: carSlug,
    brand: brand || (carSlug ? carSlug.split('-')[0] : null),
    blob_url: blobUrl,
    blob_path: blobPath,
    source_type: sourceType,
    source_url: sourceUrl || null,
    license: license || 'unknown',
    attribution: attribution || null,
    title: title || `${carSlug} image`,
    description: description || '',
    alt_text: altText || title || `${carSlug} image`,
    content_tags: contentTags,
    recommended_uses: recommendedUses,
    quality_tier: qualityTier,
    is_primary: isPrimary,
    format: format || 'jpeg',
    width: width || null,
    height: height || null,
    file_size: fileSize || null,
    aspect_ratio: aspectRatio || null,
    photographer: photographer || null,
    notes: notes || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// =============================================================================
// IMPORT FUNCTIONS
// =============================================================================

/**
 * Import a single image from URL
 */
async function importImage(url, options = {}) {
  const {
    carSlug,
    type = 'exterior',
    source = 'press',
    title,
    description,
    attribution,
    quality = 'standard',
    photographer,
    notes,
  } = options;
  
  // Validate car
  const car = carData.find(c => c.slug === carSlug);
  if (!car) {
    throw new Error(`Car not found: ${carSlug}`);
  }
  
  const typeInfo = IMAGE_TYPES[type] || IMAGE_TYPES.exterior;
  const sourceInfo = SOURCE_TYPES[source] || SOURCE_TYPES.press;
  
  console.log(`\n📥 Importing image for ${car.name}...`);
  console.log(`   URL: ${url}`);
  console.log(`   Type: ${typeInfo.name}`);
  console.log(`   Source: ${sourceInfo.name}`);
  
  // Download
  const format = getImageFormat(url);
  const timestamp = Date.now();
  const localFilename = `${carSlug}-${type}-${timestamp}.${format === 'jpeg' ? 'jpg' : format}`;
  const localPath = path.join(DOWNLOADS_DIR, localFilename);
  
  console.log(`\n⬇️  Downloading...`);
  await downloadImage(url, localPath);
  
  const stats = fs.statSync(localPath);
  console.log(`   Downloaded: ${(stats.size / 1024).toFixed(1)} KB`);
  
  // Get image dimensions
  let width = null;
  let height = null;
  let aspectRatio = null;
  try {
    const dimensions = imageSize(localPath);
    width = dimensions.width;
    height = dimensions.height;
    if (width && height) {
      // Calculate common aspect ratios
      const ratio = width / height;
      if (Math.abs(ratio - 16/9) < 0.1) aspectRatio = '16:9';
      else if (Math.abs(ratio - 4/3) < 0.1) aspectRatio = '4:3';
      else if (Math.abs(ratio - 3/2) < 0.1) aspectRatio = '3:2';
      else if (Math.abs(ratio - 1) < 0.1) aspectRatio = '1:1';
      else aspectRatio = `${width}:${height}`;
      console.log(`   Dimensions: ${width}x${height} (${aspectRatio})`);
    }
  } catch (dimErr) {
    console.log(`   ⚠️  Could not read dimensions: ${dimErr.message}`);
  }
  
  // Upload to Blob
  const blobPath = `cars/${carSlug}/${type}-${timestamp}.${format === 'jpeg' ? 'jpg' : format}`;
  console.log(`\n☁️  Uploading to Vercel Blob...`);
  const blobUrl = await uploadToBlob(localPath, blobPath);
  console.log(`   Uploaded: ${blobUrl}`);
  
  // Determine brand from car name
  const brandMatch = car.name.match(/^(\w+)/);
  const brand = brandMatch ? brandMatch[1].toLowerCase() : carSlug.split('-')[0];
  
  // Create library record
  const record = createImageRecord({
    carSlug,
    brand,
    blobUrl,
    blobPath,
    sourceType: source,
    sourceUrl: url,
    license: sourceInfo.license,
    attribution: attribution || sourceInfo.attribution.replace('{brand}', car.name.split(' ')[0]),
    title: title || `${car.name} - ${typeInfo.name}`,
    description: description || `${typeInfo.description} of ${car.name}`,
    altText: `${car.name} ${typeInfo.name.toLowerCase()}`,
    contentTags: [...typeInfo.tags, source],
    recommendedUses: typeInfo.uses,
    qualityTier: quality,
    isPrimary: false,
    format,
    width,
    height,
    aspectRatio,
    fileSize: stats.size,
    photographer,
    notes,
  });
  
  // Save to library
  const library = loadLibrary();
  library.images.push(record);
  saveLibrary(library);
  
  console.log(`\n✅ Import complete!`);
  console.log(`   ID: ${record.id}`);
  console.log(`   Blob URL: ${blobUrl}`);
  
  return record;
}

/**
 * Import from Wikimedia Commons
 */
async function importWikimedia(filename, options = {}) {
  const { carSlug, type = 'exterior', license = 'cc-by-sa' } = options;
  
  // Construct Wikimedia direct URL
  // Format: https://upload.wikimedia.org/wikipedia/commons/X/XX/Filename.jpg
  // We need to use the API to get the actual URL
  const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url|user|extmetadata&format=json`;
  
  console.log(`\n🌐 Fetching Wikimedia info for: ${filename}`);
  
  const response = await fetch(apiUrl);
  const data = await response.json();
  
  const pages = data.query.pages;
  const pageId = Object.keys(pages)[0];
  
  if (pageId === '-1') {
    throw new Error(`Wikimedia file not found: ${filename}`);
  }
  
  const imageInfo = pages[pageId].imageinfo?.[0];
  if (!imageInfo) {
    throw new Error(`No image info found for: ${filename}`);
  }
  
  const imageUrl = imageInfo.url;
  const photographer = imageInfo.user;
  const metadata = imageInfo.extmetadata || {};
  
  // Extract license info
  const licenseShortName = metadata.LicenseShortName?.value || license;
  const attribution = metadata.Attribution?.value || 
                     metadata.Artist?.value || 
                     `Photo by ${photographer} via Wikimedia Commons`;
  
  console.log(`   Image URL: ${imageUrl}`);
  console.log(`   Photographer: ${photographer}`);
  console.log(`   License: ${licenseShortName}`);
  
  // Determine actual license type
  let licenseType = 'cc-by-sa';
  if (licenseShortName.toLowerCase().includes('cc0') || licenseShortName.toLowerCase().includes('public domain')) {
    licenseType = 'public-domain';
  } else if (licenseShortName.toLowerCase().includes('cc by-sa')) {
    licenseType = 'cc-by-sa';
  } else if (licenseShortName.toLowerCase().includes('cc by')) {
    licenseType = 'cc-by';
  }
  
  return importImage(imageUrl, {
    ...options,
    carSlug,
    type,
    source: licenseType === 'public-domain' ? 'wikimedia-cc0' : 'wikimedia',
    attribution: attribution.replace(/<[^>]*>/g, ''), // Strip HTML
    photographer,
    notes: `Wikimedia Commons - License: ${licenseShortName}`,
  });
}

/**
 * Batch import from JSON file
 */
async function batchImport(jsonFile) {
  const filePath = path.resolve(jsonFile);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  const imports = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  console.log(`\n📦 Batch importing ${imports.length} images...\n`);
  
  const results = { success: [], failed: [] };
  
  for (const item of imports) {
    try {
      if (item.wikimedia) {
        await importWikimedia(item.wikimedia, item);
      } else if (item.url) {
        await importImage(item.url, item);
      } else {
        throw new Error('No url or wikimedia specified');
      }
      results.success.push(item);
      
      // Delay between imports to be respectful
      await new Promise(r => setTimeout(r, 1000));
    } catch (error) {
      console.error(`\n❌ Failed: ${item.url || item.wikimedia}: ${error.message}`);
      results.failed.push({ ...item, error: error.message });
    }
  }
  
  console.log(`\n📊 Batch import complete:`);
  console.log(`   Success: ${results.success.length}`);
  console.log(`   Failed: ${results.failed.length}`);
  
  return results;
}

/**
 * Search Wikimedia Commons for car images
 */
async function searchWikimedia(carName, limit = 10) {
  const searchQuery = `${carName} car`;
  const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&srnamespace=6&srlimit=${limit}&format=json`;
  
  console.log(`\n🔍 Searching Wikimedia Commons for: "${carName}"\n`);
  
  const response = await fetch(apiUrl);
  const data = await response.json();
  
  const results = data.query?.search || [];
  
  if (results.length === 0) {
    console.log('   No results found. Try different search terms.');
    return [];
  }
  
  console.log(`Found ${results.length} results:\n`);
  
  const validResults = [];
  
  for (const result of results) {
    const title = result.title.replace('File:', '');
    const ext = title.split('.').pop().toLowerCase();
    
    // Only include actual images
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) continue;
    
    // Get image info
    const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(result.title)}&prop=imageinfo&iiprop=url|extmetadata&format=json`;
    const infoResponse = await fetch(infoUrl);
    const infoData = await infoResponse.json();
    
    const pages = infoData.query?.pages || {};
    const pageId = Object.keys(pages)[0];
    const imageInfo = pages[pageId]?.imageinfo?.[0];
    
    if (!imageInfo) continue;
    
    const license = imageInfo.extmetadata?.LicenseShortName?.value || 'Unknown';
    const thumbUrl = imageInfo.url.replace(/\/commons\//, '/commons/thumb/') + '/400px-' + title;
    
    validResults.push({
      filename: title,
      license,
      url: imageInfo.url,
      thumbUrl,
    });
    
    console.log(`📷 ${title}`);
    console.log(`   License: ${license}`);
    console.log(`   Preview: https://commons.wikimedia.org/wiki/File:${encodeURIComponent(title)}`);
    console.log('');
  }
  
  if (validResults.length > 0) {
    console.log('💡 To import an image, run:');
    console.log(`   node scripts/import-external-images.js wikimedia "<filename>" --car=<car-slug> --type=exterior\n`);
  }
  
  return validResults;
}

/**
 * Show press room information
 */
function showNewsrooms() {
  console.log('\n📰 MANUFACTURER PRESS ROOMS\n');
  console.log('These are legitimate sources for editorial car images:\n');
  
  const PRESS_ROOMS = {
    porsche: { url: 'https://newsroom.porsche.com/en/press-kits.html', reg: false },
    bmw: { url: 'https://www.press.bmwgroup.com/global/photo', reg: true },
    audi: { url: 'https://www.audi-mediacenter.com/en/photos', reg: false },
    mercedes: { url: 'https://media.mercedes-benz.com/', reg: true },
    chevrolet: { url: 'https://media.chevrolet.com/', reg: true },
    ford: { url: 'https://media.ford.com/', reg: true },
    dodge: { url: 'https://media.stellantisnorthamerica.com/', reg: true },
    nissan: { url: 'https://usa.nissannews.com/', reg: true },
    toyota: { url: 'https://pressroom.toyota.com/', reg: false },
    lexus: { url: 'https://pressroom.lexus.com/', reg: false },
    mazda: { url: 'https://insidemazda.mazdausa.com/', reg: false },
    subaru: { url: 'https://media.subaru.com/', reg: true },
    honda: { url: 'https://hondanews.com/', reg: false },
    lamborghini: { url: 'https://media.lamborghini.com/', reg: true },
    ferrari: { url: 'https://mediacentre.ferrari.com/', reg: true },
    mclaren: { url: 'https://media.mclaren.com/', reg: true },
    astonmartin: { url: 'https://media.astonmartin.com/', reg: true },
    lotus: { url: 'https://media.lotuscars.com/', reg: true },
    jaguar: { url: 'https://media.jaguarlandrover.com/', reg: true },
    alpine: { url: 'https://media.renaultgroup.com/', reg: true },
  };
  
  // Get brands in our database
  const ourBrands = new Set();
  carData.forEach(car => {
    const brand = car.name.split(' ')[0].toLowerCase();
    ourBrands.add(brand);
  });
  
  for (const [brand, info] of Object.entries(PRESS_ROOMS)) {
    const hasOurCars = ourBrands.has(brand);
    const marker = hasOurCars ? '🚗' : '  ';
    const regNote = info.reg ? '(registration required)' : '(open access)';
    console.log(`${marker} ${brand.toUpperCase()}`);
    console.log(`   ${info.url}`);
    console.log(`   ${regNote}\n`);
  }
  
  console.log('\n💡 TIPS:');
  console.log('• 🚗 marks brands we have cars for');
  console.log('• Press images are FREE for editorial use (reviews, comparisons, etc.)');
  console.log('• Most require registration but access is free for media');
  console.log('• Download high-res versions when available');
  console.log('• Always note the source for proper attribution\n');
}

/**
 * Show library status
 */
function showStatus() {
  const library = loadLibrary();
  
  // Count by source type
  const bySource = {};
  const byCar = {};
  const byType = {};
  
  library.images.forEach(img => {
    bySource[img.source_type] = (bySource[img.source_type] || 0) + 1;
    if (img.car_slug) {
      byCar[img.car_slug] = (byCar[img.car_slug] || 0) + 1;
    }
    img.content_tags?.forEach(tag => {
      if (Object.keys(IMAGE_TYPES).includes(tag)) {
        byType[tag] = (byType[tag] || 0) + 1;
      }
    });
  });
  
  const externalImages = library.images.filter(img => 
    img.source_type && !['ai-generated', 'owned'].includes(img.source_type)
  );
  
  console.log('\n📊 IMAGE LIBRARY STATUS\n');
  console.log(`Total images: ${library.images.length}`);
  console.log(`External/sourced images: ${externalImages.length}`);
  
  console.log('\n📸 BY SOURCE:');
  Object.entries(bySource).sort((a, b) => b[1] - a[1]).forEach(([source, count]) => {
    console.log(`   ${source}: ${count}`);
  });
  
  console.log('\n🖼️  BY TYPE:');
  Object.entries(byType).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`);
  });
  
  // Cars with most images
  const carsWithMultiple = Object.entries(byCar)
    .filter(([_, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  if (carsWithMultiple.length > 0) {
    console.log('\n🚗 CARS WITH MOST IMAGES:');
    carsWithMultiple.forEach(([slug, count]) => {
      console.log(`   ${slug}: ${count} images`);
    });
  }
  
  // Cars without external images
  const carsWithExternal = new Set(externalImages.map(img => img.car_slug).filter(Boolean));
  const carsWithoutExternal = carData.filter(car => !carsWithExternal.has(car.slug));
  
  console.log(`\n🎯 OPPORTUNITIES:`);
  console.log(`   Cars without external images: ${carsWithoutExternal.length}/${carData.length}`);
  
  if (carsWithoutExternal.length > 0 && carsWithoutExternal.length <= 20) {
    console.log('   Could add press/Wikimedia images for:');
    carsWithoutExternal.slice(0, 10).forEach(car => {
      console.log(`     - ${car.name} (${car.slug})`);
    });
  }
}

/**
 * Create example batch file
 */
function createExampleBatch() {
  const example = [
    {
      "url": "https://example.com/porsche-911-front.jpg",
      "carSlug": "porsche-911-gt3",
      "type": "exterior-front",
      "source": "press",
      "title": "Porsche 911 GT3 Front View",
      "description": "Official press photo - front 3/4 view"
    },
    {
      "wikimedia": "2022_Porsche_911_GT3.jpg",
      "carSlug": "porsche-911-gt3",
      "type": "exterior",
      "title": "Porsche 911 GT3 Side View"
    }
  ];
  
  const examplePath = path.join(PROJECT_ROOT, 'image-imports-example.json');
  fs.writeFileSync(examplePath, JSON.stringify(example, null, 2));
  
  console.log(`\n📝 Created example batch file: image-imports-example.json`);
  console.log('\nEdit this file with your image URLs and run:');
  console.log('  node scripts/import-external-images.js batch image-imports-example.json\n');
}

// =============================================================================
// CLI
// =============================================================================

function showHelp() {
  console.log(`
📷 External Image Import Tool

Commands:
  import <url>              Import a single image from URL
    --car=<slug>            Car slug (required)
    --type=<type>           Image type: ${Object.keys(IMAGE_TYPES).join(', ')}
    --source=<source>       Source: ${Object.keys(SOURCE_TYPES).join(', ')}
    --title="..."           Custom title
    --description="..."     Custom description
    --quality=<tier>        Quality: premium, standard
    
  wikimedia <filename>      Import from Wikimedia Commons
    --car=<slug>            Car slug (required)
    --type=<type>           Image type
    
  batch <json-file>         Batch import from JSON file
  
  search "<car name>"       Search Wikimedia Commons for images
    --limit=<n>             Number of results (default: 10)
  
  newsrooms                 List manufacturer press rooms
  
  status                    Show library status
  
  example                   Create example batch import file

Examples:
  node scripts/import-external-images.js import "https://newsroom.porsche.com/image.jpg" --car=porsche-911-gt3 --type=exterior-front --source=press
  
  node scripts/import-external-images.js wikimedia "Porsche_911_GT3_RS.jpg" --car=porsche-911-gt3-rs --type=exterior
  
  node scripts/import-external-images.js batch my-imports.json
`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  // Parse flags
  const flags = {};
  const positional = [];
  
  for (const arg of args.slice(1)) {
    if (arg.startsWith('--')) {
      const [key, ...valueParts] = arg.slice(2).split('=');
      flags[key] = valueParts.join('=') || true;
    } else {
      positional.push(arg);
    }
  }
  
  try {
    switch (command) {
      case 'import':
        if (!positional[0]) throw new Error('URL required');
        if (!flags.car) throw new Error('--car=<slug> required');
        await importImage(positional[0], {
          carSlug: flags.car,
          type: flags.type || 'exterior',
          source: flags.source || 'press',
          title: flags.title,
          description: flags.description,
          quality: flags.quality || 'standard',
          photographer: flags.photographer,
        });
        break;
        
      case 'wikimedia':
        if (!positional[0]) throw new Error('Wikimedia filename required');
        if (!flags.car) throw new Error('--car=<slug> required');
        await importWikimedia(positional[0], {
          carSlug: flags.car,
          type: flags.type || 'exterior',
        });
        break;
        
      case 'batch':
        if (!positional[0]) throw new Error('JSON file path required');
        await batchImport(positional[0]);
        break;
        
      case 'newsrooms':
        showNewsrooms();
        break;
        
      case 'status':
        showStatus();
        break;
        
      case 'example':
        createExampleBatch();
        break;
      
      case 'search':
        if (!positional[0]) throw new Error('Search term required');
        await searchWikimedia(positional.join(' '), parseInt(flags.limit) || 10);
        break;
        
      case 'help':
      case '--help':
      case '-h':
        showHelp();
        break;
        
      default:
        showHelp();
    }
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
