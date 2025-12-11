#!/usr/bin/env node
/**
 * Image Sourcing Guide & Inventory Tool
 * 
 * This script helps identify legitimate sources for car images:
 * 1. Manufacturer Press Rooms (editorial use)
 * 2. Wikimedia Commons (CC licensed)
 * 3. Brand logos (nominative fair use)
 * 
 * LEGAL NOTES:
 * - Press images: Free for editorial/journalistic use (describing/reviewing cars)
 * - Wikimedia: Must check license and provide attribution
 * - Logos: Nominative fair use allows using logos to identify brands
 * - AI-generated: Our current pipeline (good for unique imagery)
 * 
 * Run: node scripts/image-sourcing-guide.js [command]
 */

import { carData } from '../data/cars.js';

// =============================================================================
// MANUFACTURER PRESS ROOM DIRECTORY
// =============================================================================

const PRESS_ROOMS = {
  // German
  porsche: {
    name: 'Porsche',
    pressRoom: 'https://newsroom.porsche.com/en/press-kits.html',
    mediaCenter: 'https://newsroom.porsche.com/en/media-kit.html',
    registration: false,
    notes: 'Excellent high-res images, organized by model',
    models: ['Cayman', 'Boxster', '911', 'Carrera', 'GT4', 'GT3'],
  },
  bmw: {
    name: 'BMW',
    pressRoom: 'https://www.press.bmwgroup.com/global/photo',
    mediaCenter: 'https://www.bmwusanews.com/',
    registration: true,
    notes: 'Free registration required, extensive archive',
    models: ['M2', 'M3', 'M4', 'M5', 'Z4'],
  },
  audi: {
    name: 'Audi',
    pressRoom: 'https://www.audi-mediacenter.com/en/photos',
    mediaCenter: 'https://www.audi-mediacenter.com/en/presskits',
    registration: false,
    notes: 'Well-organized by model and year',
    models: ['R8', 'RS3', 'RS5', 'TT RS', 'RS6', 'RS7'],
  },
  mercedes: {
    name: 'Mercedes-AMG',
    pressRoom: 'https://media.mercedes-benz.com/',
    mediaCenter: 'https://media.mercedes-benz.com/vehicles',
    registration: true,
    notes: 'Includes AMG models',
    models: ['C63 AMG', 'AMG GT'],
  },
  
  // American
  chevrolet: {
    name: 'Chevrolet',
    pressRoom: 'https://media.chevrolet.com/',
    mediaCenter: 'https://media.gm.com/media/us/en/chevrolet/vehicles.html',
    registration: true,
    notes: 'Corvette and Camaro archives',
    models: ['Corvette', 'Camaro'],
  },
  ford: {
    name: 'Ford',
    pressRoom: 'https://media.ford.com/',
    mediaCenter: 'https://media.ford.com/content/fordmedia/fna/us/en/products.html',
    registration: true,
    notes: 'Mustang, GT350, GT500 available',
    models: ['Mustang', 'GT350', 'GT500', 'Shelby'],
  },
  dodge: {
    name: 'Dodge',
    pressRoom: 'https://media.stellantisnorthamerica.com/',
    mediaCenter: 'https://media.stellantisnorthamerica.com/newsroom.do?id=1',
    registration: true,
    notes: 'Viper, Challenger, Charger',
    models: ['Viper', 'Challenger', 'Charger'],
  },
  
  // Japanese
  nissan: {
    name: 'Nissan',
    pressRoom: 'https://usa.nissannews.com/',
    mediaCenter: 'https://usa.nissannews.com/en-US/photos',
    registration: true,
    notes: 'GT-R, 370Z, Z archives',
    models: ['GT-R', '370Z', 'Z'],
  },
  toyota: {
    name: 'Toyota',
    pressRoom: 'https://pressroom.toyota.com/',
    mediaCenter: 'https://pressroom.toyota.com/photos/',
    registration: false,
    notes: 'Supra, GR86 available',
    models: ['Supra', 'GR86', '86'],
  },
  lexus: {
    name: 'Lexus',
    pressRoom: 'https://pressroom.lexus.com/',
    mediaCenter: 'https://pressroom.lexus.com/photos/',
    registration: false,
    notes: 'LC 500, RC F, IS F',
    models: ['LC 500', 'RC F', 'IS F'],
  },
  mazda: {
    name: 'Mazda',
    pressRoom: 'https://insidemazda.mazdausa.com/',
    mediaCenter: 'https://insidemazda.mazdausa.com/press-releases/',
    registration: false,
    notes: 'MX-5 Miata archives',
    models: ['Miata', 'MX-5'],
  },
  subaru: {
    name: 'Subaru',
    pressRoom: 'https://media.subaru.com/',
    mediaCenter: 'https://media.subaru.com/photos',
    registration: true,
    notes: 'BRZ, WRX STI',
    models: ['BRZ', 'WRX', 'STI'],
  },
  honda: {
    name: 'Honda/Acura',
    pressRoom: 'https://hondanews.com/',
    mediaCenter: 'https://hondanews.com/en-US/honda/photos',
    registration: false,
    notes: 'Civic Type R, S2000 (historical), NSX',
    models: ['S2000', 'Civic Type R', 'NSX', 'Integra Type R'],
  },
  
  // Italian
  lamborghini: {
    name: 'Lamborghini',
    pressRoom: 'https://media.lamborghini.com/',
    mediaCenter: 'https://media.lamborghini.com/english',
    registration: true,
    notes: 'Gallardo, Huracan archives',
    models: ['Gallardo', 'Huracan'],
  },
  ferrari: {
    name: 'Ferrari',
    pressRoom: 'https://mediacentre.ferrari.com/',
    mediaCenter: 'https://mediacentre.ferrari.com/',
    registration: true,
    notes: 'Strict usage guidelines',
    models: ['488', 'F430', '458'],
  },
  maserati: {
    name: 'Maserati',
    pressRoom: 'https://media.maserati.com/',
    mediaCenter: 'https://media.maserati.com/',
    registration: true,
    notes: 'GranTurismo archives',
    models: ['GranTurismo', 'Quattroporte'],
  },
  alfaromeo: {
    name: 'Alfa Romeo',
    pressRoom: 'https://media.stellantisnorthamerica.com/',
    mediaCenter: 'https://media.stellantisnorthamerica.com/',
    registration: true,
    notes: '4C, Giulia Quadrifoglio',
    models: ['4C', 'Giulia Quadrifoglio'],
  },
  
  // British
  lotus: {
    name: 'Lotus',
    pressRoom: 'https://media.lotuscars.com/',
    mediaCenter: 'https://media.lotuscars.com/',
    registration: true,
    notes: 'Emira, Evora, Exige',
    models: ['Emira', 'Evora', 'Exige', 'Elise'],
  },
  astonmartin: {
    name: 'Aston Martin',
    pressRoom: 'https://media.astonmartin.com/',
    mediaCenter: 'https://media.astonmartin.com/',
    registration: true,
    notes: 'Vantage, DB series',
    models: ['Vantage', 'DB9', 'DB11'],
  },
  jaguar: {
    name: 'Jaguar',
    pressRoom: 'https://media.jaguar.com/',
    mediaCenter: 'https://media.jaguar.com/',
    registration: true,
    notes: 'F-Type archives',
    models: ['F-Type'],
  },
};

// =============================================================================
// WIKIMEDIA COMMONS CATEGORIES
// =============================================================================

const WIKIMEDIA_CATEGORIES = {
  // By Brand
  porsche: 'https://commons.wikimedia.org/wiki/Category:Porsche_automobiles',
  bmw: 'https://commons.wikimedia.org/wiki/Category:BMW_automobiles',
  audi: 'https://commons.wikimedia.org/wiki/Category:Audi_automobiles',
  mercedes: 'https://commons.wikimedia.org/wiki/Category:Mercedes-Benz_automobiles',
  chevrolet: 'https://commons.wikimedia.org/wiki/Category:Chevrolet_automobiles',
  ford: 'https://commons.wikimedia.org/wiki/Category:Ford_automobiles',
  nissan: 'https://commons.wikimedia.org/wiki/Category:Nissan_automobiles',
  toyota: 'https://commons.wikimedia.org/wiki/Category:Toyota_automobiles',
  lamborghini: 'https://commons.wikimedia.org/wiki/Category:Lamborghini_automobiles',
  lotus: 'https://commons.wikimedia.org/wiki/Category:Lotus_automobiles',
  
  // Specific Models (high-quality collections)
  'corvette': 'https://commons.wikimedia.org/wiki/Category:Chevrolet_Corvette',
  'corvette-c7': 'https://commons.wikimedia.org/wiki/Category:Chevrolet_Corvette_C7',
  'corvette-c8': 'https://commons.wikimedia.org/wiki/Category:Chevrolet_Corvette_C8',
  'bmw-m3': 'https://commons.wikimedia.org/wiki/Category:BMW_M3',
  'bmw-m4': 'https://commons.wikimedia.org/wiki/Category:BMW_M4',
  'porsche-911': 'https://commons.wikimedia.org/wiki/Category:Porsche_911',
  'porsche-cayman': 'https://commons.wikimedia.org/wiki/Category:Porsche_Cayman',
  'nissan-gtr': 'https://commons.wikimedia.org/wiki/Category:Nissan_GT-R',
  'ford-mustang': 'https://commons.wikimedia.org/wiki/Category:Ford_Mustang',
  
  // By View Type (useful for specific shots)
  'porsche-side': 'https://commons.wikimedia.org/wiki/Category:Side_views_of_Porsche_automobiles',
  'porsche-rear': 'https://commons.wikimedia.org/wiki/Category:Rear_views_of_Porsche_automobiles',
  'porsche-front': 'https://commons.wikimedia.org/wiki/Category:Front_views_of_Porsche_automobiles',
  
  // General
  'sports-cars': 'https://commons.wikimedia.org/wiki/Category:Sports_automobiles',
  'valued-images': 'https://commons.wikimedia.org/wiki/Commons:Valued_images_by_topic/Objects/Transport_and_vehicles/Automobiles',
};

// =============================================================================
// BRAND LOGO SOURCES
// =============================================================================

const LOGO_SOURCES = {
  // Wikipedia/Wikimedia (often have SVG logos)
  wikipedia: {
    description: 'Wikipedia brand pages often have SVG logos under fair use',
    example: 'https://en.wikipedia.org/wiki/Porsche',
    notes: 'Check individual file license - many are trademarked but usable for identification',
  },
  
  // Brand Guidelines (official sources)
  brandGuidelines: {
    description: 'Some brands publish official logo files in their brand guidelines',
    notes: 'These are typically for partner use but show official versions',
  },
  
  // SimpleIcons (for tech-style logos)
  simpleIcons: {
    url: 'https://simpleicons.org/',
    description: 'Clean SVG icons for many brands',
    notes: 'Good for UI elements, check trademark usage',
  },
};

// =============================================================================
// IMAGE STRATEGY RECOMMENDATIONS
// =============================================================================

const IMAGE_STRATEGY = {
  hero: {
    recommended: 'AI-generated (current pipeline)',
    rationale: 'Unique, consistent style, no attribution needed',
    alternative: 'Manufacturer press images (with editorial use disclaimer)',
  },
  
  rear: {
    recommended: 'AI-generated',
    rationale: 'Consistent with hero style',
    alternative: 'Wikimedia Commons (CC-BY or CC0)',
  },
  
  interior: {
    recommended: 'Manufacturer press images',
    rationale: 'Interior shots require accuracy - official images best',
    alternative: 'AI-generated (with disclaimer)',
  },
  
  detail: {
    recommended: 'Manufacturer press images or Wikimedia',
    rationale: 'Technical accuracy important for enthusiasts',
    alternative: 'AI-generated',
  },
  
  action: {
    recommended: 'AI-generated',
    rationale: 'Dynamic shots benefit from artistic interpretation',
    alternative: 'Wikimedia Commons motorsport categories',
  },
  
  logos: {
    recommended: 'Official SVG from Wikipedia/brand sites',
    rationale: 'Nominative fair use for brand identification',
    notes: 'Keep original proportions, don\'t modify',
  },
};

// =============================================================================
// COMMANDS
// =============================================================================

function extractBrand(name) {
  const brandMap = {
    'cayman': 'porsche', 'carrera': 'porsche', '911': 'porsche', 'boxster': 'porsche',
    'gt4': 'porsche', 'gt3': 'porsche',
    'm2': 'bmw', 'm3': 'bmw', 'm4': 'bmw', 'm5': 'bmw', 'z4': 'bmw',
    'r8': 'audi', 'rs3': 'audi', 'rs5': 'audi', 'tt': 'audi',
    'c63': 'mercedes', 'amg': 'mercedes',
    'corvette': 'chevrolet', 'camaro': 'chevrolet',
    'mustang': 'ford', 'gt350': 'ford', 'gt500': 'ford', 'shelby': 'ford',
    'viper': 'dodge', 'challenger': 'dodge',
    'gt-r': 'nissan', 'gtr': 'nissan', '370z': 'nissan',
    'supra': 'toyota', 'gr86': 'toyota', '86': 'toyota',
    'lc 500': 'lexus', 'rc f': 'lexus', 'is f': 'lexus',
    'miata': 'mazda', 'mx-5': 'mazda',
    'brz': 'subaru', 'wrx': 'subaru',
    's2000': 'honda', 'nsx': 'honda', 'integra': 'honda',
    'gallardo': 'lamborghini', 'huracan': 'lamborghini',
    'granturismo': 'maserati',
    '4c': 'alfaromeo', 'giulia': 'alfaromeo',
    'emira': 'lotus', 'evora': 'lotus', 'exige': 'lotus', 'elise': 'lotus',
    'vantage': 'astonmartin', 'db': 'astonmartin',
    'f-type': 'jaguar',
  };
  
  const nameLower = name.toLowerCase();
  for (const [key, brand] of Object.entries(brandMap)) {
    if (nameLower.includes(key)) {
      return brand;
    }
  }
  return null;
}

/**
 * Show press room sources for our cars
 */
function showSources() {
  console.log('\n' + '='.repeat(70));
  console.log('🖼️  IMAGE SOURCING GUIDE FOR SPORTS CAR ADVISORY');
  console.log('='.repeat(70));
  
  console.log('\n## RECOMMENDED IMAGE STRATEGY\n');
  Object.entries(IMAGE_STRATEGY).forEach(([type, strategy]) => {
    console.log(`${type.toUpperCase()}:`);
    console.log(`  ✓ Recommended: ${strategy.recommended}`);
    console.log(`  → Rationale: ${strategy.rationale}`);
    if (strategy.alternative) {
      console.log(`  ○ Alternative: ${strategy.alternative}`);
    }
    console.log('');
  });
  
  console.log('\n## MANUFACTURER PRESS ROOMS\n');
  console.log('These provide FREE images for editorial/journalistic use:\n');
  
  // Group cars by brand and show relevant press rooms
  const brandCounts = {};
  carData.forEach(car => {
    const brand = extractBrand(car.name);
    if (brand) {
      brandCounts[brand] = (brandCounts[brand] || 0) + 1;
    }
  });
  
  Object.entries(PRESS_ROOMS)
    .filter(([key]) => brandCounts[key])
    .sort((a, b) => (brandCounts[b[0]] || 0) - (brandCounts[a[0]] || 0))
    .forEach(([key, info]) => {
      console.log(`${info.name} (${brandCounts[key]} cars in database)`);
      console.log(`  📷 Press Room: ${info.pressRoom}`);
      console.log(`  🔑 Registration: ${info.registration ? 'Required (free)' : 'Not required'}`);
      console.log(`  📝 ${info.notes}`);
      console.log('');
    });
}

/**
 * Show Wikimedia sources for a specific car
 */
function showWikimediaSources(slug) {
  const car = carData.find(c => c.slug === slug);
  if (!car) {
    console.error(`❌ Car not found: ${slug}`);
    return;
  }
  
  console.log(`\n## WIKIMEDIA COMMONS SOURCES FOR: ${car.name}\n`);
  
  const brand = extractBrand(car.name);
  if (brand && WIKIMEDIA_CATEGORIES[brand]) {
    console.log(`Brand Category: ${WIKIMEDIA_CATEGORIES[brand]}`);
  }
  
  // Check for specific model categories
  const modelKeys = Object.keys(WIKIMEDIA_CATEGORIES).filter(key => {
    const carLower = car.name.toLowerCase();
    return carLower.includes(key.replace('-', ' ')) || 
           carLower.includes(key.replace('-', ''));
  });
  
  if (modelKeys.length > 0) {
    console.log('\nSpecific Model Categories:');
    modelKeys.forEach(key => {
      console.log(`  ${key}: ${WIKIMEDIA_CATEGORIES[key]}`);
    });
  }
  
  console.log('\n⚠️  ATTRIBUTION REQUIREMENTS:');
  console.log('  - Check license on each image (CC-BY, CC-BY-SA, CC0)');
  console.log('  - CC-BY: Must credit author');
  console.log('  - CC-BY-SA: Must credit author AND share under same license');
  console.log('  - CC0: No attribution required (public domain)');
}

/**
 * Generate inventory of cars and their potential sources
 */
function generateInventory() {
  console.log('\n' + '='.repeat(70));
  console.log('📋 CAR IMAGE SOURCE INVENTORY');
  console.log('='.repeat(70) + '\n');
  
  const inventory = carData.map(car => {
    const brand = extractBrand(car.name);
    const pressRoom = brand ? PRESS_ROOMS[brand] : null;
    
    return {
      slug: car.slug,
      name: car.name,
      brand: pressRoom?.name || 'Unknown',
      pressRoom: pressRoom?.pressRoom || 'N/A',
      wikimedia: brand ? WIKIMEDIA_CATEGORIES[brand] || 'Search needed' : 'N/A',
      registration: pressRoom?.registration ? 'Yes' : 'No',
    };
  });
  
  // Group by brand
  const byBrand = {};
  inventory.forEach(item => {
    if (!byBrand[item.brand]) {
      byBrand[item.brand] = [];
    }
    byBrand[item.brand].push(item);
  });
  
  Object.entries(byBrand)
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([brand, cars]) => {
      const info = Object.values(PRESS_ROOMS).find(p => p.name === brand);
      console.log(`\n## ${brand} (${cars.length} cars)`);
      if (info) {
        console.log(`   Press Room: ${info.pressRoom}`);
        console.log(`   Registration: ${info.registration ? 'Required' : 'Open'}`);
      }
      console.log('   Cars:');
      cars.forEach(car => {
        console.log(`     - ${car.name} (${car.slug})`);
      });
    });
    
  // Summary
  const withPressRoom = inventory.filter(i => i.pressRoom !== 'N/A').length;
  console.log('\n' + '-'.repeat(70));
  console.log(`\n📊 SUMMARY:`);
  console.log(`   Total cars: ${inventory.length}`);
  console.log(`   With known press room: ${withPressRoom}`);
  console.log(`   Need manual search: ${inventory.length - withPressRoom}`);
}

/**
 * Show legal usage guidelines
 */
function showLegalGuidelines() {
  console.log('\n' + '='.repeat(70));
  console.log('⚖️  LEGAL IMAGE USAGE GUIDELINES');
  console.log('='.repeat(70));
  
  console.log(`
## 1. MANUFACTURER PRESS IMAGES

✓ ALLOWED (Editorial Use):
  - Reviewing/discussing the vehicle
  - News articles about the brand
  - Comparison articles
  - Buyer's guides and advice
  - Educational content

✗ NOT ALLOWED (Without Permission):
  - Implying endorsement by the manufacturer
  - Commercial advertising (selling something else)
  - Modifying images to misrepresent the vehicle
  - Claiming ownership of the images

📝 BEST PRACTICE:
  - Include "Image: [Brand Name]" or "Photo courtesy of [Brand]"
  - Link to press room if possible
  - Don't crop out watermarks

## 2. WIKIMEDIA COMMONS

Check the license on EACH image:

CC0 (Public Domain):
  ✓ Use freely, no attribution required

CC-BY (Attribution):
  ✓ Free to use
  ⚠️ MUST credit: "Photo by [Author Name]" or similar

CC-BY-SA (Attribution-ShareAlike):
  ✓ Free to use
  ⚠️ MUST credit author
  ⚠️ If you modify, must use same license

## 3. BRAND LOGOS

Nominative Fair Use allows using logos to:
  ✓ Identify the brand you're discussing
  ✓ Show which car belongs to which manufacturer
  ✓ Create comparison charts

⚠️ Don't:
  - Modify the logo
  - Imply endorsement
  - Use as your own branding

## 4. AI-GENERATED IMAGES (Current Pipeline)

✓ You own the rights
✓ No attribution needed
✓ Unique to your site
⚠️ May not be 100% accurate to real cars
⚠️ Some platforms have usage restrictions

## RECOMMENDED HYBRID APPROACH

1. HERO IMAGES: AI-generated (unique, consistent style)
2. INTERIOR SHOTS: Press images (accuracy matters)
3. DETAIL SHOTS: Press images or Wikimedia (technical accuracy)
4. ACTION SHOTS: AI-generated (artistic freedom)
5. LOGOS: Official SVG from Wikipedia (nominative fair use)
`);
}

// =============================================================================
// MAIN
// =============================================================================

const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case 'sources':
    showSources();
    break;
    
  case 'wikimedia':
    if (arg) {
      showWikimediaSources(arg);
    } else {
      console.log('Usage: node scripts/image-sourcing-guide.js wikimedia <slug>');
    }
    break;
    
  case 'inventory':
    generateInventory();
    break;
    
  case 'legal':
    showLegalGuidelines();
    break;
    
  default:
    console.log(`
🖼️  Image Sourcing Guide
━━━━━━━━━━━━━━━━━━━━━━━━

Commands:
  sources              Show press rooms and recommended sources
  inventory            Generate car-by-brand image source inventory
  wikimedia <slug>     Show Wikimedia sources for a specific car
  legal                Show legal usage guidelines

Examples:
  node scripts/image-sourcing-guide.js sources
  node scripts/image-sourcing-guide.js inventory
  node scripts/image-sourcing-guide.js wikimedia 718-cayman-gt4
  node scripts/image-sourcing-guide.js legal

This tool helps you find legitimate, legal image sources for your cars.
`);
}
