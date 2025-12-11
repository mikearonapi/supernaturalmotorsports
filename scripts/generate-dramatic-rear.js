#!/usr/bin/env node
/**
 * Generate dramatic dark silhouette shots for premium cars
 * Two styles:
 *   - rear: Tail light bar glowing in darkness
 *   - side: Rim lighting tracing body lines
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Load env
const envPath = path.join(PROJECT_ROOT, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      let value = valueParts.join('=');
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (key && value) process.env[key] = value;
    }
  }
}

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
const GENERATED_DIR = path.join(PROJECT_ROOT, 'generated-images');

/**
 * Generate dramatic rear shot with glowing tail lights
 */
async function generateDramaticRear(carName, carSlug) {
  const prompt = `Dramatic automotive photograph: Rear view of a ${carName} at night, almost completely in silhouette against a dark blue-black background. The ONLY light source is the car's illuminated rear tail light bar - a glowing red/orange horizontal LED light strip spanning the width of the rear. The car's silhouette shows a large rear wing/spoiler visible against the dark sky. Extremely dark, moody, cinematic atmosphere. The glowing tail light is the hero of the image, creating a dramatic focal point. Professional automotive photography, studio-quality lighting effect but feeling like night. NO other light sources, just the tail light bar glowing in the darkness. Premium, mysterious, powerful mood.`;
  
  console.log('\n🌙 Generating dramatic REAR shot...');
  console.log('   Car:', carName);
  console.log('   Style: Silhouette + glowing tail light bar\n');
  
  return generateImage(prompt, `${carSlug}-dramatic-rear`);
}

/**
 * Generate dramatic side profile with rim/edge lighting
 */
async function generateDramaticSide(carName, carSlug) {
  const prompt = `Dramatic automotive photograph: Perfect side profile view of a ${carName} in almost complete darkness. The car is lit ONLY by subtle rim lighting (edge lighting) that traces along the roofline, hood, and body contours - creating a thin white/silver highlight line that reveals the car's silhouette shape. The background is pure black or very dark gradient. The car sits on a reflective dark surface showing a subtle reflection. Extremely minimal lighting - just enough rim light to trace the body lines and reveal the iconic shape. Large rear wing/spoiler visible in silhouette. Moody, mysterious, premium automotive photography. Studio lighting technique but feels like a dramatic reveal. The rim lighting should trace the curves and highlight the aggressive stance.`;
  
  console.log('\n✨ Generating dramatic SIDE profile...');
  console.log('   Car:', carName);
  console.log('   Style: Rim lighting tracing body lines\n');
  
  return generateImage(prompt, `${carSlug}-dramatic-side`);
}

/**
 * Core image generation function
 */
async function generateImage(prompt, filename) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${GOOGLE_AI_API_KEY}`;
  
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: { aspectRatio: '16:9', imageSize: '2K' }
    }
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error: ${errorText}`);
  }
  
  const result = await response.json();
  const parts = result.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find(p => p.inlineData);
  
  if (!imagePart) throw new Error('No image generated');
  
  const buffer = Buffer.from(imagePart.inlineData.data, 'base64');
  const ext = imagePart.inlineData.mimeType === 'image/jpeg' ? '.jpg' : '.png';
  const outputPath = path.join(GENERATED_DIR, `${filename}${ext}`);
  
  fs.writeFileSync(outputPath, buffer);
  console.log('✅ Saved:', outputPath);
  return outputPath;
}

// Premium cars that would look great with this treatment
const PREMIUM_CARS = [
  { name: 'Porsche 718 Cayman GT4', slug: '718-cayman-gt4' },
  { name: 'Porsche 911 GT3', slug: 'porsche-911-gt3-992' },
  { name: 'Porsche 718 Cayman GT4 RS', slug: '718-cayman-gt4-rs' },
  { name: 'Chevrolet Corvette C7 Z06', slug: 'c7-corvette-z06' },
  { name: 'Chevrolet Corvette C8 Stingray', slug: 'c8-corvette-stingray' },
  { name: 'Ford Shelby GT500', slug: 'shelby-gt500' },
  { name: 'Nissan GT-R', slug: 'nissan-gt-r' },
  { name: 'Lamborghini Gallardo', slug: 'lamborghini-gallardo' },
  { name: 'Chevrolet Camaro ZL1', slug: 'camaro-zl1' },
  { name: 'Audi R8 V10', slug: 'audi-r8-v10' },
  { name: 'Dodge Viper', slug: 'dodge-viper' },
  { name: 'Ford Shelby GT350', slug: 'shelby-gt350' },
];

const styleArg = process.argv[2];  // 'rear', 'side', or 'both'
const carArg = process.argv[3];    // specific car slug or 'all'

async function runGeneration() {
  const style = styleArg || 'both';
  const target = carArg || 'all';
  
  const carsToProcess = target === 'all' 
    ? PREMIUM_CARS 
    : PREMIUM_CARS.filter(c => c.slug === target);
  
  if (carsToProcess.length === 0) {
    console.log(`Car not found. Available: ${PREMIUM_CARS.map(c => c.slug).join(', ')}`);
    return;
  }
  
  console.log(`\n🎬 DRAMATIC IMAGE GENERATION`);
  console.log(`   Style: ${style}`);
  console.log(`   Cars: ${carsToProcess.length}`);
  console.log('='.repeat(50));
  
  for (const car of carsToProcess) {
    try {
      if (style === 'rear' || style === 'both') {
        await generateDramaticRear(car.name, car.slug);
        await new Promise(r => setTimeout(r, 3000));
      }
      
      if (style === 'side' || style === 'both') {
        await generateDramaticSide(car.name, car.slug);
        await new Promise(r => setTimeout(r, 3000));
      }
      
      console.log(`   ✅ Done: ${car.name}\n`);
      
    } catch (e) {
      console.error(`   ❌ Failed for ${car.slug}: ${e.message}`);
    }
  }
  
  console.log('\n🎉 Generation complete!');
}

// Show help or run
if (styleArg === 'help' || styleArg === '--help') {
  console.log(`
🎬 DRAMATIC CAR IMAGE GENERATOR

Usage:
  node scripts/generate-dramatic-rear.js <style> [car-slug]

Styles:
  rear    Tail light bar glowing in darkness
  side    Rim lighting tracing body lines  
  both    Generate both styles (default)

Examples:
  node scripts/generate-dramatic-rear.js both all              # All styles, all cars
  node scripts/generate-dramatic-rear.js rear 718-cayman-gt4   # Rear only for GT4
  node scripts/generate-dramatic-rear.js side all              # Side profile for all cars
  node scripts/generate-dramatic-rear.js both shelby-gt500     # Both styles for GT500

Available cars:
  ${PREMIUM_CARS.map(c => c.slug).join('\n  ')}
`);
} else {
  runGeneration();
}

