/**
 * SuperNatural Motorsports - Upgrade Education Data
 * 
 * Comprehensive information about car upgrades for educational purposes.
 * This allows users to learn about modifications without selecting a specific car.
 */

/**
 * Upgrade categories with descriptions
 */
export const upgradeCategories = {
  power: {
    key: 'power',
    name: 'Power & Engine',
    icon: 'bolt',
    description: 'Upgrades that increase horsepower, torque, and throttle response. These modifications help your engine breathe better, burn fuel more efficiently, and produce more power.',
    color: '#e74c3c',
  },
  exhaust: {
    key: 'exhaust',
    name: 'Exhaust & Sound',
    icon: 'sound',
    description: 'Exhaust modifications improve flow, reduce restriction, and change your car\'s voice. From subtle tone improvements to aggressive race notes.',
    color: '#9b59b6',
  },
  suspension: {
    key: 'suspension',
    name: 'Suspension & Handling',
    icon: 'car',
    description: 'Suspension upgrades transform how your car handles corners, responds to driver input, and manages weight transfer. The foundation of any serious build.',
    color: '#3498db',
  },
  brakes: {
    key: 'brakes',
    name: 'Brakes & Stopping',
    icon: 'brake',
    description: 'Brake upgrades improve stopping power, fade resistance, and pedal feel. Critical for track use and spirited driving.',
    color: '#f39c12',
  },
  wheels: {
    key: 'wheels',
    name: 'Wheels & Tires',
    icon: 'tire',
    description: 'The only thing connecting your car to the road. Quality wheels and tires are often the single biggest performance upgrade you can make.',
    color: '#2ecc71',
  },
  cooling: {
    key: 'cooling',
    name: 'Cooling & Reliability',
    icon: 'thermometer',
    description: 'Keep your engine, transmission, and brakes running cool under stress. Essential for track days and hot climates.',
    color: '#1abc9c',
  },
  aero: {
    key: 'aero',
    name: 'Aerodynamics',
    icon: 'wind',
    description: 'Aerodynamic upgrades create downforce and improve high-speed stability. From subtle improvements to full race aero.',
    color: '#34495e',
  },
  electronics: {
    key: 'electronics',
    name: 'Electronics & Tuning',
    icon: 'chip',
    description: 'ECU tuning and electronic modifications unlock hidden potential in modern cars. Often the best bang-for-buck power upgrade.',
    color: '#e67e22',
  },
};

/**
 * Individual upgrade details with comprehensive information
 */
export const upgradeDetails = {
  // ============================================================================
  // POWER & ENGINE
  // ============================================================================
  'cold-air-intake': {
    key: 'cold-air-intake',
    name: 'Cold Air Intake (CAI)',
    category: 'power',
    shortDescription: 'Replaces restrictive factory airbox with free-flowing intake',
    fullDescription: `A cold air intake replaces your car's stock airbox with a larger, less restrictive system that draws cooler air from outside the engine bay. Cold air is denser, meaning more oxygen molecules per gulp, which allows for more efficient combustion and more power.`,
    howItWorks: 'The factory airbox is designed with noise reduction and emissions as priorities. A CAI prioritizes airflow, using a high-flow filter and smooth tubing to deliver cooler, denser air to your engine.',
    expectedGains: {
      hp: '5-15 hp',
      torque: '5-10 lb-ft',
      note: 'Gains vary significantly by car. Turbocharged cars often see larger gains.',
    },
    cost: {
      range: '$200 - $500',
      low: 200,
      high: 500,
    },
    difficulty: 'Easy',
    installTime: '30-60 minutes',
    pros: [
      'Improved throttle response',
      'Better engine sound (more intake growl)',
      'Usually bolt-on, no permanent modifications',
      'Often improves fuel economy slightly',
    ],
    cons: [
      'May void warranty if dealership is strict',
      'Some designs can draw in hot air, reducing benefits',
      'Filter requires cleaning/replacement',
      'Minimal gains without supporting mods or tune',
    ],
    bestFor: ['All cars', 'First modification for enthusiasts'],
    worksWellWith: ['ECU tune', 'Exhaust upgrades', 'Throttle body upgrade'],
    considerations: 'Look for designs that actually draw cold air from outside the engine bay. Some "short ram" intakes actually pull hot air and can hurt performance.',
  },

  'high-flow-air-filter': {
    key: 'high-flow-air-filter',
    name: 'High-Flow Air Filter',
    category: 'power',
    shortDescription: 'Drop-in replacement filter with better flow than stock',
    fullDescription: `A high-flow air filter is a direct replacement for your factory filter that allows more air to pass through while still filtering contaminants. Brands like K&N and AEM offer reusable filters that can be cleaned and re-oiled.`,
    howItWorks: 'Stock paper filters prioritize filtration over flow. High-flow filters use oiled cotton or foam media that allows more air through while still capturing harmful particles.',
    expectedGains: {
      hp: '1-5 hp',
      torque: '2-5 lb-ft',
      note: 'Modest gains, but improves airflow for other mods.',
    },
    cost: {
      range: '$40 - $80',
      low: 40,
      high: 80,
    },
    difficulty: 'Very Easy',
    installTime: '5-10 minutes',
    pros: [
      'Cheapest power modification',
      'Reusable - never buy filters again',
      'No check engine lights',
      'Zero warranty concerns',
    ],
    cons: [
      'Minimal power gains alone',
      'Requires periodic cleaning and re-oiling',
      'Over-oiling can contaminate MAF sensor',
    ],
    bestFor: ['Budget builds', 'First-time modifiers'],
    worksWellWith: ['Any modification'],
    considerations: 'Don\'t over-oil the filter - excess oil can contaminate your MAF sensor and cause issues.',
  },

  'throttle-body': {
    key: 'throttle-body',
    name: 'Throttle Body Upgrade',
    category: 'power',
    shortDescription: 'Larger throttle body for improved high-RPM airflow',
    fullDescription: `An upgraded throttle body has a larger bore diameter than stock, allowing more air to enter the engine at wide-open throttle. This is most beneficial on cars that are already modified and need more air.`,
    howItWorks: 'The throttle body controls how much air enters your engine. A larger bore means more air can flow at full throttle, supporting additional power from other modifications.',
    expectedGains: {
      hp: '5-15 hp (with supporting mods)',
      torque: '5-10 lb-ft',
      note: 'Benefits increase when combined with intake, exhaust, and tune.',
    },
    cost: {
      range: '$250 - $600',
      low: 250,
      high: 600,
    },
    difficulty: 'Moderate',
    installTime: '1-2 hours',
    pros: [
      'Sharper throttle response',
      'Supports high-power builds',
      'Usually bolt-on installation',
    ],
    cons: [
      'Limited gains on stock engines',
      'May require ECU tune for best results',
      'Not worth it as a standalone mod',
    ],
    bestFor: ['Cars with other bolt-ons', 'High-RPM builds'],
    worksWellWith: ['Cold air intake', 'Ported intake manifold', 'ECU tune'],
    considerations: 'On a stock engine, the throttle body is rarely the restriction. This mod shines when combined with other airflow improvements.',
  },

  // ============================================================================
  // EXHAUST & SOUND
  // ============================================================================
  'cat-back-exhaust': {
    key: 'cat-back-exhaust',
    name: 'Cat-Back Exhaust System',
    category: 'exhaust',
    shortDescription: 'Complete exhaust from catalytic converter back, improved flow and sound',
    fullDescription: `A cat-back exhaust replaces everything from the catalytic converter to the tailpipe. This includes the mid-pipe, resonator (or resonator delete), muffler, and tips. It's the most popular exhaust modification because it significantly improves sound while adding some power.`,
    howItWorks: 'Stock exhausts are designed for noise reduction first, flow second. Cat-backs use larger diameter piping and less restrictive mufflers to reduce back pressure while giving your car a more aggressive voice.',
    expectedGains: {
      hp: '5-15 hp',
      torque: '5-10 lb-ft',
      note: 'Sound improvement is the main benefit. Power gains are modest on naturally aspirated cars.',
    },
    cost: {
      range: '$500 - $2,000',
      low: 500,
      high: 2000,
    },
    difficulty: 'Moderate',
    installTime: '2-4 hours',
    pros: [
      'Significant sound improvement',
      'Legal in all 50 states (keeps catalytic converter)',
      'Usually bolt-on installation',
      'Weight reduction from lighter materials',
    ],
    cons: [
      'Can be droney on highway if poorly designed',
      'Some systems are too loud for daily driving',
      'Quality varies significantly by brand',
    ],
    bestFor: ['All enthusiasts', 'Daily drivers who want better sound'],
    worksWellWith: ['Headers/downpipe', 'ECU tune', 'Intake'],
    considerations: 'Research sound clips before buying! What sounds great on YouTube might be too loud or droney in person. Valved exhausts offer the best of both worlds.',
  },

  'downpipe': {
    key: 'downpipe',
    name: 'Downpipe (Turbocharged Cars)',
    category: 'exhaust',
    shortDescription: 'Larger diameter pipe from turbo to exhaust, major power gains',
    fullDescription: `On turbocharged cars, the downpipe connects the turbocharger to the rest of the exhaust. The stock downpipe is often very restrictive. An upgraded downpipe with a high-flow catalytic converter (or catless for track use) is one of the best power mods for turbo cars.`,
    howItWorks: 'The turbocharger is driven by exhaust gases. Any restriction after the turbo (like a small downpipe) creates back pressure that the turbo has to fight against. A larger, smoother downpipe lets exhaust gases exit faster, allowing the turbo to spool quicker and make more power.',
    expectedGains: {
      hp: '25-50 hp (with tune)',
      torque: '40-60 lb-ft (with tune)',
      note: 'One of the best mods for turbocharged cars. Requires tune for full benefit.',
    },
    cost: {
      range: '$300 - $1,000',
      low: 300,
      high: 1000,
    },
    difficulty: 'Moderate to Hard',
    installTime: '2-4 hours',
    pros: [
      'Significant power gains on turbo cars',
      'Faster turbo spool',
      'Deeper exhaust note',
    ],
    cons: [
      'Catless versions are not street legal',
      'May throw check engine light without tune',
      'Installation can be difficult (tight spaces)',
    ],
    bestFor: ['Turbocharged cars only'],
    worksWellWith: ['ECU tune (required)', 'Intake', 'Intercooler'],
    considerations: 'A downpipe without a tune will throw a check engine light and won\'t realize full gains. Budget for both together.',
  },

  'resonator-delete': {
    key: 'resonator-delete',
    name: 'Resonator Delete',
    category: 'exhaust',
    shortDescription: 'Removes resonator for louder, more aggressive sound',
    fullDescription: `A resonator delete removes the resonator from your exhaust and replaces it with a straight pipe. The resonator's job is to cancel out certain frequencies - removing it makes the exhaust louder and often raspier.`,
    howItWorks: 'Resonators are tuned chambers that cancel specific sound frequencies. Removing them lets those frequencies through, changing the exhaust tone and increasing volume.',
    expectedGains: {
      hp: '0-5 hp',
      torque: '0-5 lb-ft',
      note: 'This is primarily a sound modification. Power gains are minimal.',
    },
    cost: {
      range: '$50 - $200',
      low: 50,
      high: 200,
    },
    difficulty: 'Easy',
    installTime: '1 hour',
    pros: [
      'Very affordable',
      'Louder, more aggressive sound',
      'Reversible if you don\'t like it',
      'Slight weight reduction',
    ],
    cons: [
      'Can add drone at highway speeds',
      'May make exhaust too loud or raspy',
      'Minimal performance benefit',
    ],
    bestFor: ['Budget sound improvement', 'Track cars'],
    worksWellWith: ['Muffler delete', 'Cat-back exhaust'],
    considerations: 'Try this before committing to a full exhaust system. It\'s cheap and reversible, so you can test if you like a louder car.',
  },

  // ============================================================================
  // ELECTRONICS & TUNING
  // ============================================================================
  'ecu-tune': {
    key: 'ecu-tune',
    name: 'ECU Tune (Remap)',
    category: 'electronics',
    shortDescription: 'Optimizes engine computer for more power and better response',
    fullDescription: `An ECU tune modifies the software in your car's engine computer to optimize fuel delivery, ignition timing, boost pressure (on turbo cars), and other parameters. It's often called "the best bang for your buck" because it unlocks power the factory left on the table.`,
    howItWorks: 'Factory tunes are conservative to account for poor fuel quality, extreme temperatures, and minimal maintenance. A performance tune assumes you\'ll use good fuel and maintain your car, allowing more aggressive timing and fueling.',
    expectedGains: {
      hp: '15-30 hp (NA) / 40-100+ hp (turbo)',
      torque: '15-30 lb-ft (NA) / 50-100+ lb-ft (turbo)',
      note: 'Gains vary by platform. Turbocharged cars see dramatic improvements.',
    },
    cost: {
      range: '$400 - $1,500',
      low: 400,
      high: 1500,
    },
    difficulty: 'N/A (professional service)',
    installTime: '1-3 hours',
    pros: [
      'Significant power gains',
      'Improved throttle response',
      'Can improve fuel economy',
      'Removes factory limiters',
      'Can be reverted to stock',
    ],
    cons: [
      'Will void powertrain warranty',
      'Requires premium fuel on most tunes',
      'Bad tunes can damage engine',
      'Some states have emissions concerns',
    ],
    bestFor: ['Best first mod for turbo cars', 'Great value for all cars'],
    worksWellWith: ['All bolt-ons (intake, exhaust, downpipe)'],
    considerations: 'Only use reputable tuners with experience on your platform. Cheap tunes can be dangerous. Expect to pay more for quality.',
  },

  'piggyback-tune': {
    key: 'piggyback-tune',
    name: 'Piggyback Tuner',
    category: 'electronics',
    shortDescription: 'Plug-and-play device that modifies ECU signals',
    fullDescription: `A piggyback tuner intercepts and modifies signals going to and from the ECU without permanently changing the ECU itself. Popular options include JB4, Burger Motorsports, and similar devices. They're great for people who want gains without voiding warranty.`,
    howItWorks: 'Instead of rewriting the ECU software, piggybacks intercept sensor signals (like boost pressure or fuel maps) and modify them on the fly. The ECU thinks it\'s seeing normal values while the engine gets optimized parameters.',
    expectedGains: {
      hp: '30-60 hp (turbo cars)',
      torque: '40-80 lb-ft (turbo cars)',
      note: 'Most effective on turbocharged cars. NA benefits are minimal.',
    },
    cost: {
      range: '$400 - $700',
      low: 400,
      high: 700,
    },
    difficulty: 'Easy',
    installTime: '30-60 minutes',
    pros: [
      'Plug-and-play installation',
      'Undetectable by dealership',
      'Can be removed before service',
      'Good power gains',
    ],
    cons: [
      'Less customization than full tune',
      'Turbo cars only for significant gains',
      'Still technically warranty-voiding if caught',
    ],
    bestFor: ['Leased vehicles', 'Warranty-conscious owners', 'DIY enthusiasts'],
    worksWellWith: ['Downpipe', 'Intake', 'Intercooler'],
    considerations: 'Popular for BMW, VW/Audi, and other European turbo cars. Remove before dealer service to avoid detection.',
  },

  'hpfp-upgrade': {
    key: 'hpfp-upgrade',
    name: 'High-Pressure Fuel Pump (HPFP)',
    category: 'electronics',
    shortDescription: 'Upgraded fuel pump for more fueling capacity',
    fullDescription: `On direct-injection turbo cars, the high-pressure fuel pump is often the limiting factor for power. An upgraded HPFP can deliver more fuel at higher pressures, supporting bigger turbos and more aggressive tunes.`,
    howItWorks: 'Direct injection engines need extremely high fuel pressure (2,000+ PSI). The stock pump is sized for factory power levels. Upgraded internals allow higher flow and pressure to match increased air from turbo upgrades.',
    expectedGains: {
      hp: 'Enables 50-150+ additional hp with supporting mods',
      torque: 'Varies with tune',
      note: 'This is a supporting mod - it enables other upgrades to work.',
    },
    cost: {
      range: '$300 - $800',
      low: 300,
      high: 800,
    },
    difficulty: 'Moderate',
    installTime: '2-4 hours',
    pros: [
      'Removes fueling limitation',
      'Required for high-power builds',
      'Usually bolt-on',
    ],
    cons: [
      'No gains on its own',
      'Only needed for aggressive builds',
      'Platform-specific parts',
    ],
    bestFor: ['High-power turbo builds', 'E85 conversions'],
    worksWellWith: ['Upgraded turbo', 'Aggressive tune', 'E85 fuel'],
    considerations: 'You don\'t need this for basic bolt-ons. It\'s for builds exceeding 400-500+ hp on most platforms.',
  },

  // ============================================================================
  // SUSPENSION & HANDLING
  // ============================================================================
  'lowering-springs': {
    key: 'lowering-springs',
    name: 'Lowering Springs',
    category: 'suspension',
    shortDescription: 'Drops ride height and stiffens suspension affordably',
    fullDescription: `Lowering springs replace your stock springs with shorter, stiffer springs that lower the car 1-2 inches. This lowers the center of gravity, improves appearance, and provides modest handling improvements.`,
    howItWorks: 'Shorter springs compress less, so the car sits lower. Stiffer spring rates reduce body roll and improve turn-in response. The lower center of gravity improves cornering ability.',
    expectedGains: {
      hp: 'N/A',
      handling: 'Moderate improvement',
      note: 'Primarily an appearance and handling mod. Expect 10-20% stiffer ride.',
    },
    cost: {
      range: '$200 - $500',
      low: 200,
      high: 500,
    },
    difficulty: 'Moderate',
    installTime: '2-4 hours (with spring compressor)',
    pros: [
      'Affordable handling improvement',
      'Better appearance',
      'Lower center of gravity',
      'Works with stock shocks (initially)',
    ],
    cons: [
      'Accelerates stock shock wear',
      'Fixed drop - no adjustability',
      'Can be too stiff for daily driving',
      'May cause rubbing with wrong wheel setup',
    ],
    bestFor: ['Budget builds', 'Appearance-focused builds'],
    worksWellWith: ['Upgraded shocks/struts', 'Sway bars'],
    considerations: 'Quality matters. Cheap springs can sag over time. Plan to replace shocks within 20-30k miles.',
  },

  'coilovers': {
    key: 'coilovers',
    name: 'Coilovers',
    category: 'suspension',
    shortDescription: 'Complete adjustable suspension system',
    fullDescription: `Coilovers are complete shock and spring assemblies that allow adjustment of ride height and (on better units) damping. They're the gold standard for anyone serious about handling because they let you dial in the exact setup you want.`,
    howItWorks: 'Coilovers use a threaded body that allows ride height adjustment. Better units add adjustable damping (how fast the shock compresses and rebounds). This lets you tune the suspension for street comfort or track performance.',
    expectedGains: {
      hp: 'N/A',
      handling: 'Significant improvement',
      note: 'Transform handling characteristics. Worth the investment for serious drivers.',
    },
    cost: {
      range: '$1,000 - $5,000+',
      low: 1000,
      high: 5000,
    },
    difficulty: 'Moderate',
    installTime: '4-8 hours',
    pros: [
      'Adjustable ride height',
      'Adjustable damping (on quality units)',
      'Dramatic handling improvement',
      'Corner balance capability',
      'Long service life on quality units',
    ],
    cons: [
      'Expensive for quality units',
      'Cheap coilovers can be worse than stock',
      'Requires alignment after install',
      'Learning curve to dial in',
    ],
    bestFor: ['Track enthusiasts', 'Serious handling builds'],
    worksWellWith: ['Sway bars', 'Control arms', 'Chassis bracing'],
    considerations: 'Don\'t cheap out here. $500 coilovers are usually worse than stock. Budget $1,500+ for quality street units, $3,000+ for track-capable.',
  },

  'sway-bars': {
    key: 'sway-bars',
    name: 'Sway Bars (Anti-Roll Bars)',
    category: 'suspension',
    shortDescription: 'Reduces body roll for flatter cornering',
    fullDescription: `Upgraded sway bars are stiffer than stock and reduce body roll in corners. Adjustable sway bars let you fine-tune handling balance between understeer and oversteer.`,
    howItWorks: 'Sway bars connect the left and right suspension. When you corner and the body rolls, the bar twists and pushes back, reducing roll. Stiffer bars = less roll. Adjustability lets you tune front-to-rear balance.',
    expectedGains: {
      hp: 'N/A',
      handling: 'Moderate to significant improvement',
      note: 'One of the best handling mods for the money. Changes driving feel noticeably.',
    },
    cost: {
      range: '$200 - $600 per axle',
      low: 400,
      high: 1200,
    },
    difficulty: 'Moderate',
    installTime: '2-4 hours per bar',
    pros: [
      'Significant handling improvement',
      'Adjustable balance (adjustable bars)',
      'Works with stock or upgraded suspension',
      'Relatively affordable',
    ],
    cons: [
      'Can make ride slightly harsher',
      'Too stiff can upset handling',
      'Requires understanding of balance to tune',
    ],
    bestFor: ['Canyon carvers', 'Track day enthusiasts'],
    worksWellWith: ['Coilovers', 'End links', 'Performance alignment'],
    considerations: 'Start with rear bar only if your car understeers, or front + rear if balanced. Don\'t go too aggressive on street cars.',
  },

  // ============================================================================
  // BRAKES
  // ============================================================================
  'brake-pads': {
    key: 'brake-pads',
    name: 'Performance Brake Pads',
    category: 'brakes',
    shortDescription: 'Better stopping power and heat resistance',
    fullDescription: `Upgraded brake pads use different friction materials than stock pads to provide more bite, better heat resistance, or both. They range from mild street upgrades to full race compounds.`,
    howItWorks: 'Brake pads create friction against the rotor to slow the car. Different friction materials have different characteristics - some bite harder, some handle heat better, some dust less.',
    expectedGains: {
      stopping: '10-30% shorter stopping distances',
      fadeResistance: 'Significant improvement on track pads',
      note: 'Match pad compound to your use case. Track pads can be dangerous on cold streets.',
    },
    cost: {
      range: '$100 - $400',
      low: 100,
      high: 400,
    },
    difficulty: 'Easy to Moderate',
    installTime: '1-2 hours',
    pros: [
      'Improved stopping power',
      'Better pedal feel',
      'Fade resistance for spirited driving',
      'Easy DIY installation',
    ],
    cons: [
      'High-performance pads may squeal',
      'Some compounds dust heavily',
      'Track pads don\'t work well cold',
      'Shorter lifespan than stock',
    ],
    bestFor: ['All enthusiasts', 'Track day participants'],
    worksWellWith: ['Upgraded rotors', 'High-temp brake fluid', 'Stainless brake lines'],
    considerations: 'Match compound to use. Street/track pads offer best compromise. Pure track pads can be dangerous on cold morning commutes.',
  },

  'big-brake-kit': {
    key: 'big-brake-kit',
    name: 'Big Brake Kit (BBK)',
    category: 'brakes',
    shortDescription: 'Larger rotors and calipers for maximum stopping power',
    fullDescription: `A big brake kit replaces your stock brakes with larger rotors and multi-piston calipers. This dramatically improves stopping power, heat capacity, and brake feel - essential for track use or high-power builds.`,
    howItWorks: 'Larger rotors provide more leverage for stopping, more mass to absorb heat, and more surface area for cooling. Multi-piston calipers provide more even pad pressure for better feel and performance.',
    expectedGains: {
      stopping: '20-40% shorter stopping distances',
      fadeResistance: 'Dramatic improvement',
      note: 'Transforms braking from good to exceptional. Required for serious track cars.',
    },
    cost: {
      range: '$2,000 - $6,000+',
      low: 2000,
      high: 6000,
    },
    difficulty: 'Moderate to Hard',
    installTime: '4-8 hours',
    pros: [
      'Dramatically improved stopping power',
      'Excellent heat capacity for track use',
      'Great pedal feel',
      'Looks impressive behind wheels',
    ],
    cons: [
      'Expensive',
      'May require larger wheels to fit',
      'Overkill for street-only use',
      'Heavier than stock on some kits',
    ],
    bestFor: ['Track cars', 'High-power builds', 'Heavy braking use'],
    worksWellWith: ['Track brake pads', 'High-temp fluid', 'Brake cooling ducts'],
    considerations: 'Check wheel clearance before buying. Most BBKs require 18"+ wheels. Quality kits from Brembo, StopTech, AP Racing are worth the money.',
  },

  'brake-fluid': {
    key: 'brake-fluid',
    name: 'High-Temperature Brake Fluid',
    category: 'brakes',
    shortDescription: 'Prevents brake fade from boiling fluid',
    fullDescription: `High-temperature brake fluid has a higher boiling point than standard DOT 3/4 fluid. When brake fluid boils, you lose pedal pressure and braking ability. This is critical for track use.`,
    howItWorks: 'Brake fluid transmits pedal pressure to the calipers. When it gets too hot, it boils and creates air bubbles. Air is compressible, so your pedal goes soft and brakes fail. High-temp fluid resists this.',
    expectedGains: {
      boilingPoint: '450-600°F vs 300-400°F stock',
      fadeResistance: 'Significant improvement',
      note: 'Essential for track days. The difference between stopping and not stopping.',
    },
    cost: {
      range: '$20 - $50 per bottle',
      low: 20,
      high: 50,
    },
    difficulty: 'Easy to Moderate',
    installTime: '30-60 minutes',
    pros: [
      'Prevents dangerous brake fade',
      'Cheap insurance for track days',
      'Easy DIY with brake bleeding kit',
    ],
    cons: [
      'Needs changing more frequently than stock',
      'Absorbs moisture over time (hygroscopic)',
      'Some racing fluids not street-legal',
    ],
    bestFor: ['Track day participants', 'Mountain road drivers'],
    worksWellWith: ['Stainless brake lines', 'Performance pads'],
    considerations: 'Flush annually or before track events. Castrol SRF and Motul RBF 660 are popular choices.',
  },

  // ============================================================================
  // WHEELS & TIRES
  // ============================================================================
  'performance-tires': {
    key: 'performance-tires',
    name: 'Performance Summer Tires',
    category: 'wheels',
    shortDescription: 'Stickier compound for significantly improved grip',
    fullDescription: `Performance summer tires use softer, stickier rubber compounds and more aggressive tread patterns than all-season tires. They provide dramatically better grip but sacrifice tread life and cold-weather performance.`,
    howItWorks: 'Softer rubber compounds conform better to the road surface, creating more grip. The trade-off is faster wear and poor cold-weather performance (the rubber hardens when cold).',
    expectedGains: {
      grip: '20-40% improvement over all-seasons',
      handling: 'Transforms car feel',
      note: 'Often the single biggest handling upgrade you can make. Don\'t underestimate tire quality.',
    },
    cost: {
      range: '$600 - $1,500 for a set',
      low: 600,
      high: 1500,
    },
    difficulty: 'Requires tire shop',
    installTime: '1 hour',
    pros: [
      'Dramatic grip improvement',
      'Better steering feel',
      'Shorter stopping distances',
      'Improved cornering speed',
    ],
    cons: [
      'Shorter tread life than all-seasons',
      'Poor in cold weather (< 40°F)',
      'Cannot be used in snow',
      'Higher cost per mile',
    ],
    bestFor: ['All enthusiasts in warm climates', 'Summer-only drivers'],
    worksWellWith: ['Any handling modification'],
    considerations: 'The #1 handling upgrade. Good tires on a stock car beat mediocre tires on a modified car every time.',
  },

  '200tw-tires': {
    key: '200tw-tires',
    name: '200TW Track Tires',
    category: 'wheels',
    shortDescription: 'Semi-slick tires for maximum track grip',
    fullDescription: `200 treadwear (200TW) tires are the stickiest street-legal tires available. They have minimal tread pattern and extremely soft compounds designed for autocross and track days. Popular choices include RE-71R, RT660, and Yoko A052.`,
    howItWorks: 'The treadwear rating indicates relative tire life - lower numbers mean softer, stickier compounds. 200TW is the minimum for street legality while maximizing grip.',
    expectedGains: {
      grip: '50-100% improvement over all-seasons',
      lapTimes: '2-5 seconds per lap on most tracks',
      note: 'The ultimate in street-legal grip. Transform your car\'s track performance.',
    },
    cost: {
      range: '$800 - $1,600 for a set',
      low: 800,
      high: 1600,
    },
    difficulty: 'Requires tire shop',
    installTime: '1 hour',
    pros: [
      'Maximum street-legal grip',
      'Dramatically faster lap times',
      'Better turn-in and feedback',
    ],
    cons: [
      'Very short tread life (5-15k miles)',
      'Loud on highway',
      'Expensive per mile',
      'Poor wet performance when worn',
    ],
    bestFor: ['Track day enthusiasts', 'Autocross competitors'],
    worksWellWith: ['Suspension upgrades', 'Brake upgrades', 'Alignment setup'],
    considerations: 'Many people run these only for track days and swap to street tires for daily driving.',
  },

  'lightweight-wheels': {
    key: 'lightweight-wheels',
    name: 'Lightweight Wheels',
    category: 'wheels',
    shortDescription: 'Reduces unsprung and rotational mass for better handling',
    fullDescription: `Lightweight wheels reduce unsprung mass (weight the suspension has to control) and rotational mass (weight the engine has to spin up). This improves acceleration, braking, and suspension response.`,
    howItWorks: 'Less weight at the wheels means the suspension can react faster to bumps, the brakes don\'t have to slow as much mass, and the engine doesn\'t work as hard to accelerate the wheels.',
    expectedGains: {
      handling: 'Noticeable improvement',
      acceleration: 'Slight improvement',
      note: 'Feels like you added power and upgraded suspension. Transformation in feel.',
    },
    cost: {
      range: '$1,500 - $4,000 for a set',
      low: 1500,
      high: 4000,
    },
    difficulty: 'Requires tire shop',
    installTime: '1-2 hours',
    pros: [
      'Better acceleration and braking',
      'Improved suspension response',
      'Better steering feel',
      'Looks great',
    ],
    cons: [
      'Expensive for quality',
      'More prone to damage than steel/heavy wheels',
      'May not fit big brake kits',
    ],
    bestFor: ['Track enthusiasts', 'Handling-focused builds'],
    worksWellWith: ['Performance tires', 'Suspension upgrades', 'Big brake kits'],
    considerations: 'Quality matters. Cheap lightweight wheels can bend or crack. Brands like Enkei, Apex, Titan7 offer strength with weight savings.',
  },

  // ============================================================================
  // COOLING
  // ============================================================================
  'oil-cooler': {
    key: 'oil-cooler',
    name: 'Oil Cooler',
    category: 'cooling',
    shortDescription: 'Keeps oil temperature in check during hard driving',
    fullDescription: `An oil cooler is a radiator for your engine oil. During track days or spirited driving, oil temperatures can exceed safe limits, reducing lubrication and accelerating wear. An oil cooler keeps temps in check.`,
    howItWorks: 'Hot oil from the engine passes through a heat exchanger (like a small radiator) mounted in the airflow, usually in front of the main radiator or in the bumper.',
    expectedGains: {
      oilTemp: '20-40°F reduction under load',
      reliability: 'Significant for track use',
      note: 'No power gains, but critical for engine longevity under stress.',
    },
    cost: {
      range: '$500 - $1,500',
      low: 500,
      high: 1500,
    },
    difficulty: 'Moderate to Hard',
    installTime: '4-8 hours',
    pros: [
      'Essential for track reliability',
      'Protects engine during hard use',
      'Maintains oil viscosity',
    ],
    cons: [
      'No performance gains directly',
      'Complex installation',
      'Takes up front bumper space',
    ],
    bestFor: ['Track day enthusiasts', 'Hot climate owners'],
    worksWellWith: ['Transmission cooler', 'Upgraded radiator'],
    considerations: 'Check your oil temps before buying. If you\'re not seeing 250°F+ at the track, you may not need this.',
  },

  'intercooler': {
    key: 'intercooler',
    name: 'Upgraded Intercooler (Turbo Cars)',
    category: 'cooling',
    shortDescription: 'Better cooling for turbo charge air, more consistent power',
    fullDescription: `On turbocharged cars, the intercooler cools compressed air from the turbo before it enters the engine. Cooler air is denser and makes more power. An upgraded intercooler provides better cooling and maintains power during hard driving.`,
    howItWorks: 'Turbochargers heat air during compression (physics). Hot air is less dense and makes less power. The intercooler is a heat exchanger that cools this air. A bigger, more efficient one keeps air cooler.',
    expectedGains: {
      hp: '10-25 hp (by maintaining power)',
      consistency: 'Eliminates heat soak',
      note: 'Won\'t make more peak power, but maintains it consistently.',
    },
    cost: {
      range: '$500 - $2,000',
      low: 500,
      high: 2000,
    },
    difficulty: 'Moderate',
    installTime: '3-6 hours',
    pros: [
      'Consistent power on hot days',
      'Eliminates heat soak between runs',
      'Can support more boost safely',
    ],
    cons: [
      'No gains at peak (only sustained)',
      'Can increase turbo lag slightly',
      'May require bumper modification',
    ],
    bestFor: ['Track-focused turbo cars', 'Hot climate turbo owners'],
    worksWellWith: ['ECU tune', 'Downpipe', 'Intake'],
    considerations: 'If your car feels slower after a few hard pulls, you need this. Heat soak is the enemy.',
  },
};

/**
 * Get upgrades by category
 */
export function getUpgradesByCategory(categoryKey) {
  return Object.values(upgradeDetails).filter(u => u.category === categoryKey);
}

/**
 * Get all categories with their upgrades
 */
export function getAllUpgradesGrouped() {
  const grouped = {};
  Object.keys(upgradeCategories).forEach(catKey => {
    grouped[catKey] = {
      ...upgradeCategories[catKey],
      upgrades: getUpgradesByCategory(catKey),
    };
  });
  return grouped;
}

/**
 * Get a single upgrade by key
 */
export function getUpgradeDetail(key) {
  return upgradeDetails[key] || null;
}

export default upgradeDetails;

