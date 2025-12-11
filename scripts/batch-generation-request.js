#!/usr/bin/env node
/**
 * Batch generation of 30 additional inspired images.
 *
 * Uses specific Pressroom images as STYLE inspiration only, and generates
 * 100% original AI images for cars that already exist in data/cars.js.
 *
 * Run locally from project root:
 *   node scripts/batch-generation-request.js
 */

import { generateCommand } from './generate-inspired-images.js';

const TASKS = [
  // ---------------------------------------------------------------------------
  // OVERHEAD STYLES (6)
  // ---------------------------------------------------------------------------
  { carSlug: 'nissan-gt-r',                   file: 'Chevrolet-2026-Corvette-ZR1X-Overhead.jpg' },
  { carSlug: 'bmw-m3-e92',                    file: '2026 Corvette ZR1 Overhead.jpg' },
  { carSlug: 'lotus-elise-s2',                file: 'Chevrolet-2026-Corvette-ZR1X-Top-View.jpg' },
  { carSlug: 'mercedes-amg-c63-w205',        file: 'Chevrolet-2026-Corvette-ZR1X-Blade-Silver-Metallic-Hood-Top-View.jpg' },
  { carSlug: 'dodge-challenger-hellcat',     file: '2026 Corvette Stingray Overhead Dash.jpg' },
  { carSlug: 'acura-integra-type-r-dc2',     file: 'Chevrolet-2026-Corvette-ZR1X-Overhead.jpg' },

  // ---------------------------------------------------------------------------
  // REAR 3/4 / ROAD (6)
  // ---------------------------------------------------------------------------
  { carSlug: 'volkswagen-golf-r-mk7',        file: 'Original-14444-02-my25-rs-3-exterior-rear-profile.jpg' },
  { carSlug: 'ford-focus-rs',                file: 'PCNA25_1024_fine.jpg' },
  { carSlug: 'bmw-m5-e39',                   file: 'PCNA25_1342_fine.jpg' },
  { carSlug: 'porsche-911-turbo-997-2',      file: 'PCNA25_1343_fine.jpg' },
  { carSlug: 'c7-corvette-grand-sport',      file: '2026 Corvette ZR1 Silver .jpg' },
  { carSlug: 'toyota-86-scion-frs',          file: 'Chevrolet-2026-Corvette-ZR1X-Rear-Elevated.jpg' },

  // ---------------------------------------------------------------------------
  // DETAIL / ENGINE / HARDWARE (6)
  // ---------------------------------------------------------------------------
  { carSlug: 'chevrolet-corvette-c6-z06',    file: 'Original-7820-RS56.jpg' },
  { carSlug: 'lotus-evora-gt',               file: 'Chevrolet-2026-Corvette-ZR1X-Wheel-and-Brake.jpg' },
  { carSlug: 'bmw-m5-f90-competition',       file: '2026 Corvette ZR1 Wheel and Brake Package.jpg' },
  { carSlug: 'honda-civic-type-r-fk8',       file: '2026-Corvette-ZR1X-Quail-Silver-Limited-Edition-Wheel.jpg' },
  { carSlug: 'porsche-911-turbo-997-1',      file: '2026-Corvette-ZR1X-Quail-Silver-Limited-Edition-Plaque.jpg' },
  { carSlug: 'mercedes-amg-e63s-w213',       file: 'Chevrolet-2026-Corvette-ZR1X-Badge.jpg' },

  // ---------------------------------------------------------------------------
  // TRUE ACTION / ON-TRACK (6)
  // ---------------------------------------------------------------------------
  { carSlug: 'porsche-911-gt3-996',          file: '20250802_IMSA-02199-ct-3.jpg' },
  { carSlug: 'porsche-911-gt3-997',          file: 'PCNA25_0798_fine.jpg' },
  { carSlug: 'camaro-ss-1le',                file: 'Chevrolet-Corvette Sweep GTD PRO Championships at Petit Le Mans-1.jpg' },
  { carSlug: 'mitsubishi-lancer-evo-x',      file: 'PCNA25_1426_fine.jpg' },
  { carSlug: 'subaru-brz-zd8',               file: 'PCNA25_1342_fine.jpg' },
  { carSlug: 'maserati-granturismo',         file: 'PCNA25_1343_fine.jpg' },

  // ---------------------------------------------------------------------------
  // INTERIORS / POV / COCKPIT (6)
  // ---------------------------------------------------------------------------
  { carSlug: 'c8-corvette-stingray',         file: 'Chevrolet-2026-Corvette-ZR1X-Interior-Santorini-Blue.jpg' },
  { carSlug: 'bmw-m3-f80',                   file: 'Chevrolet-2026-Corvette-ZR1X-Interior-Seats.jpg' },
  { carSlug: 'tesla-model-3-performance',    file: '2026 Corvette Stingray Driver POV.jpg' },
  { carSlug: 'lexus-lc-500',                 file: '2026 Corvette ZR1 Driver POV.jpg' },
  { carSlug: 'audi-rs5-b9',                  file: '2026 Corvette Z06 Passenger POV.jpg' },
  { carSlug: 'mazda-mx-5-miata-nd',          file: '2026 Corvette E-Ray Screens.jpg' },
];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log('🚀 Starting batch generation of 30 inspired images...');
  console.log(`📋 Tasks: ${TASKS.length}`);

  let successCount = 0;
  let failCount = 0;

  for (const task of TASKS) {
    console.log('\n==============================================================================');
    console.log(`📸 Reference: ${task.file}`);
    console.log(`🚗 Car: ${task.carSlug}`);
    console.log('==============================================================================');

    try {
      const result = await generateCommand(task.carSlug, task.file, {
        useReference: true,
        skipUpload: false,
      });

      if (result && result.success) {
        successCount += 1;
        console.log(`✅ Success: ${task.carSlug} (${result.imageType})`);
      } else {
        failCount += 1;
        console.error(`❌ Failed for ${task.carSlug}: ${result?.error || 'Unknown error'}`);
      }
    } catch (error) {
      failCount += 1;
      console.error(`❌ Exception for ${task.carSlug}: ${error.message}`);
    }

    // Gentle delay to reduce risk of API rate limits
    await delay(2000);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ BATCH COMPLETE');
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log('='.repeat(60));
}

run().catch((err) => {
  console.error('❌ Batch run failed:', err);
  process.exit(1);
});
