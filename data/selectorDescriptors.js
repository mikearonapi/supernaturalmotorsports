/**
 * Selector Descriptors
 * 
 * Descriptive text and guidance for each preference slider in the Car Selector.
 * Helps users understand what each priority means and how it affects results.
 * 
 * @module data/selectorDescriptors
 */

/**
 * Priority descriptors - explains what each preference slider controls
 * and provides guidance at different slider positions
 */
export const priorityDescriptors = {
  sound: {
    label: 'Sound',
    shortDescription: 'How important is exhaust note and engine sound?',
    fullDescription: 'Emphasizes cars known for their exhaust note, engine character, and overall auditory experience.',
    levels: {
      0: "Sound doesn't matter to me",
      0.5: "Nice to have, but not essential",
      1: "I appreciate a good sound, but it's not crucial",
      1.5: "Sound is pretty important to me",
      2: "Sound is a key part of the driving experience",
      2.5: "I want a car that sounds incredible",
      3: "Sound is everything - I want the best exhaust note possible",
    },
    tips: [
      "V8s and flat-6s typically score highest for sound",
      "Consider aftermarket exhaust options for any car",
      "Track days often allow louder exhausts than street driving",
    ],
    examples: {
      high: ['Ford Mustang GT', 'Porsche 911 GT3', 'Lexus RC F'],
      low: ['Tesla Model 3', 'Porsche Taycan'],
    },
  },

  track: {
    label: 'Track Capability',
    shortDescription: 'How important is raw track performance?',
    fullDescription: 'Prioritizes lap times, handling balance, brake performance, and cooling capacity for sustained driving.',
    levels: {
      0: "I won't be tracking this car",
      0.5: "Maybe one or two track days a year",
      1: "Occasional track use",
      1.5: "Regular track days",
      2: "Track performance is a priority",
      2.5: "I want a serious track weapon",
      3: "Track performance is my #1 priority",
    },
    tips: [
      "Consider cooling upgrades for regular track use",
      "Track cars often have stiffer suspension = less comfort",
      "Brake pad compound matters more than rotor size",
    ],
    examples: {
      high: ['Porsche 718 Cayman GT4', 'Chevrolet Corvette Z06', 'BMW M2 CS'],
      low: ['Ford Mustang EcoBoost', 'Mazda MX-5 Miata'],
    },
  },

  value: {
    label: 'Value',
    shortDescription: 'How important is price-to-performance ratio?',
    fullDescription: 'Weighs performance capabilities against purchase price, maintenance costs, and depreciation.',
    levels: {
      0: "Budget is no concern",
      0.5: "I want quality, price is secondary",
      1: "Balanced approach to value",
      1.5: "I want good value for money",
      2: "Value is very important to me",
      2.5: "I'm looking for the best bang for buck",
      3: "Maximum performance per dollar is my goal",
    },
    tips: [
      "American muscle often offers best HP per dollar",
      "Factor in insurance and fuel costs",
      "Some cars depreciate less than others",
    ],
    examples: {
      high: ['Chevrolet Camaro SS', 'Ford Mustang GT', 'Subaru WRX'],
      low: ['Porsche 911 Turbo S', 'BMW M5'],
    },
  },

  reliability: {
    label: 'Reliability',
    shortDescription: 'How important is dependability?',
    fullDescription: 'Considers expected maintenance costs, known issues, parts availability, and long-term ownership experience.',
    levels: {
      0: "I accept higher maintenance costs",
      0.5: "Some maintenance is fine",
      1: "Average reliability is acceptable",
      1.5: "I prefer fewer surprises",
      2: "Reliability is important to me",
      2.5: "I want a bulletproof car",
      3: "Maximum reliability - I need to trust my car",
    },
    tips: [
      "Japanese cars often lead in reliability",
      "Consider certified pre-owned for warranty coverage",
      "Some 'unreliable' cars are fine with preventive maintenance",
    ],
    examples: {
      high: ['Toyota Supra', 'Mazda MX-5', 'Lexus RC F'],
      low: ['Alfa Romeo Giulia', 'Maserati GranTurismo'],
    },
  },

  driverFun: {
    label: 'Driver Engagement',
    shortDescription: 'How important is driving feel and engagement?',
    fullDescription: 'Emphasizes steering feel, chassis balance, manual transmission availability, and overall driving enjoyment regardless of speed.',
    levels: {
      0: "Comfort over engagement",
      0.5: "Nice steering feel is appreciated",
      1: "I enjoy a connected driving experience",
      1.5: "Driver engagement matters a lot",
      2: "I want to feel every input",
      2.5: "Pure driving feel is essential",
      3: "Maximum driver engagement - an analog experience",
    },
    tips: [
      "Smaller, lighter cars often feel more engaging",
      "Manual transmissions typically score higher",
      "Hydraulic steering > electric power steering",
    ],
    examples: {
      high: ['Mazda MX-5', 'Porsche Cayman', 'Lotus Elise'],
      low: ['Mercedes-AMG GT', 'Nissan GT-R'],
    },
  },

  aftermarket: {
    label: 'Aftermarket Support',
    shortDescription: 'How important is modification potential?',
    fullDescription: 'Considers parts availability, tuning support, community knowledge, and overall moddability of the platform.',
    levels: {
      0: "I'll keep it stock",
      0.5: "Maybe some cosmetic mods",
      1: "Light modifications possible",
      1.5: "I'd like to modify it somewhat",
      2: "Good mod support is important",
      2.5: "I want extensive tuning options",
      3: "I'm planning to build a project car",
    },
    tips: [
      "Popular platforms have more aftermarket options",
      "American and Japanese cars often lead in aftermarket",
      "Consider turbo cars for easier power gains",
    ],
    examples: {
      high: ['Subaru WRX STI', 'Ford Mustang GT', 'Nissan 370Z'],
      low: ['McLaren 570S', 'Ferrari 488'],
    },
  },

  interior: {
    label: 'Interior Quality',
    shortDescription: 'How important are interior materials and comfort?',
    fullDescription: 'Weighs material quality, ergonomics, technology features, and overall cabin experience.',
    levels: {
      0: "Function over form - basic is fine",
      0.5: "Decent interior is nice",
      1: "Good enough quality",
      1.5: "I'd like a nice interior",
      2: "Interior quality matters to me",
      2.5: "Premium interior is expected",
      3: "Luxury-level interior is a must",
    },
    tips: [
      "German cars typically excel in interior quality",
      "Consider wear and tear on sport seats",
      "Technology can make or break daily usability",
    ],
    examples: {
      high: ['BMW M4', 'Mercedes-AMG C63', 'Audi RS5'],
      low: ['Subaru BRZ', 'Ford Mustang Shelby GT350'],
    },
  },
};

/**
 * Get descriptor text for a specific weight value
 * @param {string} key - Priority key (e.g., 'sound', 'track')
 * @param {number} value - Current slider value (0-3)
 * @returns {string} - Descriptor text for this value
 */
export function getDescriptorForValue(key, value) {
  const descriptor = priorityDescriptors[key];
  if (!descriptor) return '';

  // Find the closest matching level
  const levels = Object.keys(descriptor.levels)
    .map(Number)
    .sort((a, b) => a - b);
  
  const closestLevel = levels.reduce((prev, curr) => 
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
  );

  return descriptor.levels[closestLevel];
}

/**
 * Get all descriptor data for a priority
 * @param {string} key - Priority key
 * @returns {Object|null}
 */
export function getDescriptor(key) {
  return priorityDescriptors[key] || null;
}

/**
 * Priority badge labels based on weight
 * @param {number} weight - Slider value (0-3)
 * @returns {string}
 */
export function getPriorityBadgeLabel(weight) {
  if (weight === 0) return 'Off';
  if (weight <= 0.5) return 'Low';
  if (weight <= 1) return 'Medium';
  if (weight <= 1.5) return 'High';
  if (weight <= 2) return 'Very High';
  if (weight <= 2.5) return 'Critical';
  return 'Maximum';
}

export default priorityDescriptors;
