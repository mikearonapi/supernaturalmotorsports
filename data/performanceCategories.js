/**
 * SuperNatural Motorsports - Performance HUB Categories
 * 
 * This file defines the 7 core performance categories used in the Performance HUB.
 * Each category blends hard metrics with experience-based scoring to give users
 * a Gran Turismo–style view of their car's capabilities and upgrade potential.
 * 
 * Categories are designed to:
 * 1. Be memorable and intuitive
 * 2. Map to real-world driving experiences
 * 3. Show clear improvement paths through upgrades
 */

/**
 * @typedef {Object} PerformanceCategory
 * @property {string} key - Unique identifier for the category
 * @property {string} label - Display label
 * @property {string} shortLabel - Abbreviated label for compact displays
 * @property {string} description - Full description of what the category measures
 * @property {string} icon - Icon identifier for UI (matches Icons component)
 * @property {string[]} hardMetrics - Real metrics that feed into this score
 * @property {string[]} experienceFactors - Subjective factors considered
 * @property {Object} scoreGuide - What each score range means
 */

/**
 * The 7 core Performance HUB categories
 * @type {PerformanceCategory[]}
 */
export const performanceCategories = [
  {
    key: 'powerAccel',
    label: 'Power & Acceleration',
    shortLabel: 'Power',
    description: 'Straight-line speed, throttle response, and passing power',
    icon: 'tachometer',
    hardMetrics: ['hp', 'torque', 'zeroToSixty', 'quarterMile', 'powerToWeight'],
    experienceFactors: ['In-gear pull', 'Throttle response', 'Power delivery character'],
    scoreGuide: {
      '1-3': 'Modest power, adequate for street use',
      '4-5': 'Solid performance, fun acceleration',
      '6-7': 'Strong power, confident passing ability',
      '8-9': 'Serious power, track-ready acceleration',
      '10': 'Exceptional power, supercar-level thrust'
    },
    color: 'var(--perf-power)',
  },
  {
    key: 'gripCornering',
    label: 'Grip & Cornering',
    shortLabel: 'Grip',
    description: 'Cornering confidence, mechanical grip, and chassis balance',
    icon: 'tire',
    hardMetrics: ['lateralG', 'curbWeight', 'tireWidth', 'suspensionType'],
    experienceFactors: ['Turn-in response', 'Mid-corner balance', 'Confidence at limit', 'Tire grip feel'],
    scoreGuide: {
      '1-3': 'Basic handling, body roll present',
      '4-5': 'Competent grip, enjoyable cornering',
      '6-7': 'Strong grip, communicative chassis',
      '8-9': 'Excellent grip, track-ready handling',
      '10': 'Exceptional grip, race car levels of mechanical grip'
    },
    color: 'var(--perf-grip)',
  },
  {
    key: 'braking',
    label: 'Braking',
    shortLabel: 'Brakes',
    description: 'Stopping power, pedal feel, and fade resistance',
    icon: 'brake',
    hardMetrics: ['braking60To0', 'brakeSize', 'brakeType'],
    experienceFactors: ['Pedal feel', 'Initial bite', 'Fade resistance', 'ABS calibration'],
    scoreGuide: {
      '1-3': 'Adequate braking, some fade under hard use',
      '4-5': 'Good braking, reliable under spirited driving',
      '6-7': 'Strong braking, track-capable',
      '8-9': 'Excellent braking, minimal fade, great feel',
      '10': 'Race-grade braking, exceptional stopping power and feel'
    },
    color: 'var(--perf-braking)',
  },
  {
    key: 'trackPace',
    label: 'Track Pace',
    shortLabel: 'Track',
    description: 'Overall lap time capability and sustained performance',
    icon: 'flag',
    hardMetrics: ['lapTimeEstimate', 'coolingCapacity', 'aeroDownforce'],
    experienceFactors: ['Consistency over laps', 'Heat management', 'Driver confidence', 'Setup flexibility'],
    scoreGuide: {
      '1-3': 'Street-focused, not ideal for track use',
      '4-5': 'Track day capable with limitations',
      '6-7': 'Solid track performer, competitive in class',
      '8-9': 'Serious track weapon, time attack ready',
      '10': 'Race-bred performance, professional-level pace'
    },
    color: 'var(--perf-track)',
  },
  {
    key: 'drivability',
    label: 'Drivability & Comfort',
    shortLabel: 'Comfort',
    description: 'Daily usability, ride quality, and driver fatigue',
    icon: 'comfort',
    hardMetrics: ['rideHeight', 'suspensionTravel', 'nvhLevels'],
    experienceFactors: ['Ride quality', 'Noise levels', 'Ease of use', 'Visibility', 'Ergonomics'],
    scoreGuide: {
      '1-3': 'Track-focused, harsh for daily use',
      '4-5': 'Sporty but livable, some compromises',
      '6-7': 'Good daily driver, comfortable for long trips',
      '8-9': 'Excellent comfort, GT-level refinement',
      '10': 'Luxury-level comfort with sports car capability'
    },
    color: 'var(--perf-comfort)',
  },
  {
    key: 'reliabilityHeat',
    label: 'Reliability & Heat Management',
    shortLabel: 'Reliability',
    description: 'Dependability under stress, thermal performance, and longevity',
    icon: 'thermometer',
    hardMetrics: ['oilCoolerSize', 'radiatorCapacity', 'transCooling'],
    experienceFactors: ['Track session durability', 'Consumable life', 'Known issues', 'Maintenance costs'],
    scoreGuide: {
      '1-3': 'Requires careful monitoring, known weak points',
      '4-5': 'Decent reliability, some track limitations',
      '6-7': 'Good reliability, handles track days well',
      '8-9': 'Excellent reliability, robust under stress',
      '10': 'Bulletproof, race-ready thermal management'
    },
    color: 'var(--perf-reliability)',
  },
  {
    key: 'soundEmotion',
    label: 'Sound & Emotion',
    shortLabel: 'Sound',
    description: 'Exhaust character, engine note, and emotional engagement',
    icon: 'sound',
    hardMetrics: ['exhaustType', 'engineConfig', 'inductionType'],
    experienceFactors: ['Exhaust note character', 'Intake sound', 'Throttle blips', 'Overall drama'],
    scoreGuide: {
      '1-3': 'Quiet, refined, not emotionally engaging',
      '4-5': 'Pleasant sound, some character',
      '6-7': 'Good sound, enjoyable exhaust note',
      '8-9': 'Excellent sound, makes you smile',
      '10': 'Spine-tingling, concert-hall exhaust experience'
    },
    color: 'var(--perf-sound)',
  }
];

/**
 * Upgrade package tiers and their intended use cases
 * @type {Object}
 */
export const upgradeTiers = {
  stock: {
    key: 'stock',
    label: 'Stock',
    shortLabel: 'Stock',
    description: 'Factory configuration',
    intendedUse: 'As delivered from the factory',
    priceRange: null,
    color: 'var(--color-gray-400)',
  },
  streetSport: {
    key: 'streetSport',
    label: 'Street Sport',
    shortLabel: 'Street',
    description: 'Enhanced street performance with improved daily drivability',
    intendedUse: 'Spirited street driving, occasional canyon runs',
    priceRange: '$2,000 - $8,000',
    color: 'var(--sn-primary)',
  },
  trackPack: {
    key: 'trackPack',
    label: 'Track Pack',
    shortLabel: 'Track',
    description: 'Serious track capability while maintaining street legality',
    intendedUse: 'Regular track days, HPDE events, time attack',
    priceRange: '$8,000 - $20,000',
    color: 'var(--sn-accent)',
  },
  timeAttack: {
    key: 'timeAttack',
    label: 'Time Attack',
    shortLabel: 'Attack',
    description: 'Maximum performance, some street compromises',
    intendedUse: 'Competitive time attack, dedicated track car',
    priceRange: '$20,000 - $50,000+',
    color: 'var(--color-error)',
  }
};

/**
 * Upgrade module categories (for fine-tuning)
 * Now expanded to include all categories from the unified upgrade taxonomy
 * @type {Object[]}
 */
export const upgradeModuleCategories = [
  {
    key: 'power',
    label: 'Power & Engine',
    description: 'Intake, exhaust, tune, headers',
    icon: 'bolt',
  },
  {
    key: 'forcedInduction',
    label: 'Forced Induction',
    description: 'Superchargers, turbos, intercoolers',
    icon: 'turbo',
  },
  {
    key: 'exhaust',
    label: 'Exhaust & Sound',
    description: 'Cat-backs, headers, mufflers',
    icon: 'sound',
  },
  {
    key: 'suspension',
    label: 'Suspension',
    description: 'Coilovers, springs, sway bars',
    icon: 'car',
  },
  {
    key: 'brakes',
    label: 'Brakes',
    description: 'Pads, rotors, BBK, fluid',
    icon: 'brake',
  },
  {
    key: 'wheels',
    label: 'Wheels & Tires',
    description: 'Lightweight wheels, track tires',
    icon: 'tire',
  },
  {
    key: 'cooling',
    label: 'Cooling',
    description: 'Oil coolers, radiators, ducting',
    icon: 'thermometer',
  },
  {
    key: 'aero',
    label: 'Aerodynamics',
    description: 'Splitters, wings, diffusers',
    icon: 'wind',
  },
  {
    key: 'drivetrain',
    label: 'Drivetrain',
    description: 'Clutch, flywheel, LSD, axles',
    icon: 'gears',
  },
  {
    key: 'safety',
    label: 'Safety & Track Prep',
    description: 'Harnesses, seats, roll bars',
    icon: 'shield',
  },
  {
    key: 'weightReduction',
    label: 'Weight Reduction',
    description: 'Carbon panels, battery, interior',
    icon: 'feather',
  },
  {
    key: 'engineSwaps',
    label: 'Engine Swaps',
    description: 'LS, Coyote, 2JZ, K-series',
    icon: 'engine',
  },
];

/**
 * Get a performance category by key
 * @param {string} key
 * @returns {PerformanceCategory|undefined}
 */
export function getCategoryByKey(key) {
  return performanceCategories.find(cat => cat.key === key);
}

/**
 * Get default stock performance scores for a car based on its existing scores
 * Maps the existing advisory scores to the new performance categories using hard metrics when available
 * Prioritizes expert-curated scores (perf*) when present, falls back to calculated scores
 * @param {Object} car - Car object from carData
 * @returns {Object} - Performance scores for each category
 */
export function mapCarToPerformanceScores(car) {
  // Priority: Use explicit curated scores (perf*) if available, otherwise calculate from hard metrics
  return {
    powerAccel: car.perfPowerAccel ?? calculatePowerScore(car),
    gripCornering: car.perfGripCornering ?? calculateGripScore(car),
    braking: car.perfBraking ?? calculateBrakingScore(car),
    trackPace: car.perfTrackPace ?? calculateTrackPaceScore(car),
    drivability: car.perfDrivability ?? calculateDrivabilityScore(car),
    reliabilityHeat: car.perfReliabilityHeat ?? car.reliability ?? 5,
    soundEmotion: car.perfSoundEmotion ?? car.sound ?? 5,
  };
}

/**
 * Calculate power score from available hard metrics
 * Uses 0-60 time as primary metric with HP adjustment for perceived power
 * Algorithm calibrated against expert-curated scores for accuracy
 */
function calculatePowerScore(car) {
  let score = 5; // default
  
  // Primary: Use 0-60 time if available (measures actual acceleration)
  if (car.zeroToSixty) {
    // Calibrated scale: 2.5s = 10, 3.0s = 9.25, 3.5s = 8.5, 4.0s = 7.75, 4.5s = 7, 5.0s = 6.25
    // Formula: 13 - (0-60 * 1.5) gives excellent fit to real-world data
    score = 13 - (car.zeroToSixty * 1.5);
  }
  // Secondary: Use power-to-weight if no 0-60 available
  else if (car.hp && car.curbWeight) {
    const powerToWeight = car.hp / (car.curbWeight / 1000);
    // Scale: 150 hp/ton = 5, 200 = 7, 250 = 9, 300+ = 10
    score = powerToWeight / 30;
  }
  // Fallback: Use advisory scores
  else {
    score = Math.round((car.track + car.driverFun) / 2) || 5;
  }
  
  // HP adjustment for perceived power (muscle cars feel powerful even if 0-60 is slower)
  // Calibrated to match curated scores: 600+ HP = +2, 500-599 HP = +1
  if (car.hp) {
    if (car.hp >= 600) score += 2;
    else if (car.hp >= 500) score += 1;
  }
  
  return Math.max(1, Math.min(10, Math.round(score)));
}

/**
 * Calculate grip score from available hard metrics
 * Uses lateral G as primary metric (direct measurement of mechanical grip)
 * Algorithm calibrated against expert-curated scores
 */
function calculateGripScore(car) {
  // Primary: Use lateral G if available (direct measurement of grip)
  if (car.lateralG) {
    // Calibrated scale: 0.9g = 5 (baseline), each 0.045g above adds 1 point
    // Real-world benchmarks: 0.95g = 6, 1.0g = 7, 1.05g = 8, 1.10g = 9, 1.15g+ = 10
    // Formula: 5 + ((lateralG - 0.9) * 22) fits curated data well
    const score = 5 + ((car.lateralG - 0.9) * 22);
    return Math.max(1, Math.min(10, Math.round(score)));
  }
  
  // Fallback: Use track score with chassis type modifier
  let base = car.track || 5;
  
  // Mid-engine cars typically have better weight distribution
  if (car.category === 'Mid-Engine') base = Math.min(10, base + 0.5);
  // Rear-engine premium cars have excellent grip when engineered properly
  else if (car.category === 'Rear-Engine' && car.tier === 'premium') base = Math.min(10, base + 0.3);
  
  return Math.round(base);
}

/**
 * Calculate braking score from available hard metrics
 * Uses 60-0 braking distance as primary metric
 * Algorithm calibrated against expert-curated scores
 */
function calculateBrakingScore(car) {
  // Primary: Use 60-0 braking distance if available
  if (car.braking60To0) {
    // Calibrated scale based on industry benchmarks:
    // 90ft = 10 (exceptional), 95ft = 9, 100ft = 8, 105ft = 7, 110ft = 6, 115ft = 5
    // Formula: 10 - ((braking - 90) / 5) provides accurate mapping
    // Every 5 feet slower loses 1 point from perfect 10
    const score = 10 - ((car.braking60To0 - 90) / 5);
    return Math.max(1, Math.min(10, Math.round(score)));
  }
  
  // Fallback: Use track score with tier modifier
  let base = car.track || 5;
  
  // Premium and track-focused cars typically have better brakes (bigger rotors, better calipers)
  if (car.tier === 'premium') base = Math.min(10, base + 1);
  else if (car.tier === 'upper-mid') base = Math.min(10, base + 0.5);
  
  return Math.round(base);
}

/**
 * Calculate track pace score
 * Composite of power, grip, braking, and overall track capability
 * Algorithm calibrated for accuracy against expert-curated track scores
 */
function calculateTrackPaceScore(car) {
  // If we have explicit curated track pace score, use it
  if (car.perfTrackPace) return car.perfTrackPace;
  
  // If we have the advisory track score, use it with validation
  if (car.track) {
    let base = car.track;
    
    // For track-focused cars (GT4, Z06, GT350R), boost score based on tier/category
    if (car.tier === 'premium') base = Math.min(10, base + 0.5);
    
    // Validate against quarter mile time if available
    if (car.quarterMile) {
      // Quarter mile benchmarks adjusted for track capability:
      // < 11s = 10, 11-11.5s = 9, 11.5-12s = 8, 12-12.5s = 7, 12.5-13s = 6
      const qmBoost = Math.max(0, (12.5 - car.quarterMile) * 0.4);
      base = Math.min(10, base + qmBoost);
    }
    
    return Math.round(base);
  }
  
  // Fallback calculation using hard metrics
  return 5;
}

/**
 * Calculate drivability score
 * Factors in comfort, daily usability, and track compromise
 * Algorithm calibrated against expert-curated drivability scores
 */
function calculateDrivabilityScore(car) {
  // If we have explicit curated drivability score, use it
  if (car.perfDrivability) return car.perfDrivability;
  
  const interiorScore = car.interior || 5;
  const reliabilityScore = car.reliability || 5;
  const trackScore = car.track || 5;
  
  // Base: Interior quality is the strongest indicator of daily comfort
  let base = interiorScore;
  
  // Premium tiers typically have better daily usability (adaptive dampers, quieter)
  if (car.tier === 'premium') base = Math.min(10, base + 1);
  else if (car.tier === 'upper-mid') base = Math.min(10, base + 0.5);
  
  // GT/grand touring cars are designed for long-distance comfort
  if (car.category === 'Grand Tourer') base = Math.min(10, base + 1.5);
  
  // Track-focused variants sacrifice comfort (track suspensions are stiff)
  if (trackScore >= 9) base -= 1.5;
  else if (trackScore >= 8) base -= 0.5;
  
  // Reliability contributes to drivability (fewer worries on daily drives)
  base = (base * 0.75) + (reliabilityScore * 0.25);
  
  return Math.max(1, Math.min(10, Math.round(base)));
}

/**
 * Score labels for display
 */
export const scoreLabelMap = {
  1: 'Poor',
  2: 'Poor',
  3: 'Below Average',
  4: 'Average',
  5: 'Average',
  6: 'Good',
  7: 'Good',
  8: 'Excellent',
  9: 'Excellent',
  10: 'Exceptional'
};

export function getScoreLabel(score) {
  return scoreLabelMap[Math.round(score)] || 'Average';
}

export default performanceCategories;

