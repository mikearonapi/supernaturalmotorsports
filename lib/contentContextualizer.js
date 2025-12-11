/**
 * Content Contextualization Module
 * 
 * Determines whether educational/encyclopedia content is relevant to the user's
 * currently selected car. Returns context labels and messaging to help users
 * understand if content applies to their specific vehicle.
 * 
 * @module lib/contentContextualizer
 */

/**
 * @typedef {Object} ContentMetadata
 * @property {string} [title] - Content title
 * @property {string[]} [topics] - Content topics/tags (e.g., ['turbo', 'boost', 'intercooler'])
 * @property {string[]} [appliesToPowertrainTypes] - Powertrain types this applies to ('naturally-aspirated', 'turbo', 'supercharged', 'twin-turbo', 'hybrid', 'ev')
 * @property {string[]} [appliesToDrivetrains] - Drivetrains this applies to ('RWD', 'AWD', 'FWD')
 * @property {string[]} [appliesToCategories] - Engine layouts this applies to ('Mid-Engine', 'Front-Engine', 'Rear-Engine')
 * @property {string[]} [appliesToBrands] - Specific brands (e.g., ['Porsche', 'BMW'])
 * @property {string[]} [appliesToModels] - Specific model patterns (e.g., ['911', 'Cayman', 'M3'])
 * @property {string[]} [excludesBrands] - Brands this does NOT apply to
 * @property {string[]} [excludesModels] - Models this does NOT apply to
 * @property {boolean} [isUniversal] - If true, applies to all cars
 */

/**
 * @typedef {Object} SelectedCar
 * @property {string} slug
 * @property {string} name
 * @property {string} [make]
 * @property {string} [aspirationType] - 'naturally-aspirated', 'turbo', 'supercharged', 'twin-turbo'
 * @property {string} [drivetrain] - 'RWD', 'AWD', 'FWD'
 * @property {string} [category] - 'Mid-Engine', 'Front-Engine', 'Rear-Engine'
 * @property {string} [engine] - Engine description
 */

/**
 * Context result types
 */
export const ContextType = {
  /** Content is general knowledge, not car-specific */
  GENERAL: 'GENERAL',
  /** Content specifically applies to the user's selected car */
  APPLIES_TO_YOU: 'APPLIES_TO_YOU',
  /** Content does NOT apply to the user's selected car */
  DOES_NOT_APPLY: 'DOES_NOT_APPLY',
  /** No car is selected, so context is unknown */
  NO_CAR_SELECTED: 'NO_CAR_SELECTED',
};

/**
 * @typedef {Object} ContextResult
 * @property {string} type - One of ContextType values
 * @property {string} label - Short display label (e.g., "Applies to Your 718 Cayman")
 * @property {string} [message] - Optional longer explanation
 * @property {string} [variant] - Badge color variant ('general', 'applies', 'notApplies')
 */

/**
 * Detect aspiration type from engine description if not explicitly set
 * @param {string} engine 
 * @returns {string}
 */
function detectAspirationType(engine) {
  if (!engine) return 'unknown';
  const lower = engine.toLowerCase();
  
  if (lower.includes('twin-turbo') || lower.includes('twin turbo') || lower.includes('tt')) {
    return 'twin-turbo';
  }
  if (lower.includes('turbo')) {
    return 'turbo';
  }
  if (lower.includes('supercharged') || lower.includes('sc')) {
    return 'supercharged';
  }
  if (lower.includes('electric') || lower.includes('ev')) {
    return 'ev';
  }
  if (lower.includes('hybrid')) {
    return 'hybrid';
  }
  // Default assumption for most sports cars
  return 'naturally-aspirated';
}

/**
 * Extract make/brand from car name if not provided
 * @param {string} name 
 * @returns {string}
 */
function extractMake(name) {
  if (!name) return '';
  
  const knownMakes = [
    'Porsche', 'BMW', 'Mercedes', 'Audi', 'Chevrolet', 'Ford', 'Dodge',
    'Toyota', 'Nissan', 'Honda', 'Mazda', 'Subaru', 'Lexus', 'Infiniti',
    'Alfa Romeo', 'Lotus', 'McLaren', 'Ferrari', 'Lamborghini', 'Aston Martin',
  ];

  for (const make of knownMakes) {
    if (name.toLowerCase().startsWith(make.toLowerCase())) {
      return make;
    }
  }
  return name.split(' ')[0];
}

/**
 * Get a short display name for the car
 * @param {SelectedCar} car 
 * @returns {string}
 */
function getCarShortName(car) {
  if (!car) return '';
  
  // If name is short enough, use it
  if (car.name && car.name.length <= 20) {
    return car.name;
  }
  
  // Try to extract a shorter version
  const name = car.name || '';
  const make = car.make || extractMake(name);
  
  // Remove make from start if present
  let shortName = name;
  if (name.toLowerCase().startsWith(make.toLowerCase())) {
    shortName = name.substring(make.length).trim();
  }
  
  // Return shortened name
  return shortName || name;
}

/**
 * Check if arrays have any overlapping elements (case-insensitive)
 * @param {string[]} arr1 
 * @param {string[]} arr2 
 * @returns {boolean}
 */
function hasOverlap(arr1, arr2) {
  if (!arr1 || !arr2) return false;
  const set1 = new Set(arr1.map(s => s.toLowerCase()));
  return arr2.some(s => set1.has(s.toLowerCase()));
}

/**
 * Check if a string matches any pattern in an array (case-insensitive, partial match)
 * @param {string} str 
 * @param {string[]} patterns 
 * @returns {boolean}
 */
function matchesAnyPattern(str, patterns) {
  if (!str || !patterns) return false;
  const lower = str.toLowerCase();
  return patterns.some(p => lower.includes(p.toLowerCase()));
}

/**
 * Determine the context of content relative to a selected car
 * 
 * @param {ContentMetadata} metadata - Content metadata/frontmatter
 * @param {SelectedCar|null} selectedCar - Currently selected car (or null)
 * @returns {ContextResult}
 */
export function getContentContext(metadata, selectedCar) {
  // No car selected - return neutral
  if (!selectedCar) {
    return {
      type: ContextType.NO_CAR_SELECTED,
      label: 'General Knowledge',
      message: 'Select a car to see if this applies to your vehicle.',
      variant: 'general',
    };
  }

  // Universal content applies to everyone
  if (metadata.isUniversal) {
    return {
      type: ContextType.GENERAL,
      label: 'Universal',
      message: 'This applies to all vehicles.',
      variant: 'general',
    };
  }

  const carName = getCarShortName(selectedCar);
  const carMake = selectedCar.make || extractMake(selectedCar.name);
  const carAspiration = selectedCar.aspirationType || detectAspirationType(selectedCar.engine);

  // Check for explicit exclusions first
  if (metadata.excludesBrands && matchesAnyPattern(carMake, metadata.excludesBrands)) {
    return {
      type: ContextType.DOES_NOT_APPLY,
      label: `Doesn't Apply to ${carName}`,
      message: `This content doesn't typically apply to ${carMake} vehicles.`,
      variant: 'notApplies',
    };
  }

  if (metadata.excludesModels && matchesAnyPattern(selectedCar.name, metadata.excludesModels)) {
    return {
      type: ContextType.DOES_NOT_APPLY,
      label: `Doesn't Apply to ${carName}`,
      message: `This content doesn't typically apply to your specific model.`,
      variant: 'notApplies',
    };
  }

  // Check powertrain type match
  if (metadata.appliesToPowertrainTypes && metadata.appliesToPowertrainTypes.length > 0) {
    const applies = metadata.appliesToPowertrainTypes.some(
      type => type.toLowerCase() === carAspiration.toLowerCase()
    );
    
    if (!applies) {
      return {
        type: ContextType.DOES_NOT_APPLY,
        label: `Doesn't Apply to ${carName}`,
        message: `This content is for ${metadata.appliesToPowertrainTypes.join('/')} engines. Your car has a ${carAspiration} engine.`,
        variant: 'notApplies',
      };
    }
  }

  // Check drivetrain match
  if (metadata.appliesToDrivetrains && metadata.appliesToDrivetrains.length > 0) {
    if (selectedCar.drivetrain && !hasOverlap([selectedCar.drivetrain], metadata.appliesToDrivetrains)) {
      return {
        type: ContextType.DOES_NOT_APPLY,
        label: `Doesn't Apply to ${carName}`,
        message: `This content is for ${metadata.appliesToDrivetrains.join('/')} vehicles. Your car is ${selectedCar.drivetrain}.`,
        variant: 'notApplies',
      };
    }
  }

  // Check category/layout match
  if (metadata.appliesToCategories && metadata.appliesToCategories.length > 0) {
    if (selectedCar.category && !hasOverlap([selectedCar.category], metadata.appliesToCategories)) {
      return {
        type: ContextType.DOES_NOT_APPLY,
        label: `Doesn't Apply to ${carName}`,
        message: `This content is for ${metadata.appliesToCategories.join('/')} cars. Your car is ${selectedCar.category}.`,
        variant: 'notApplies',
      };
    }
  }

  // Check for brand/model specific content
  const matchesBrand = metadata.appliesToBrands && matchesAnyPattern(carMake, metadata.appliesToBrands);
  const matchesModel = metadata.appliesToModels && matchesAnyPattern(selectedCar.name, metadata.appliesToModels);
  
  // If content specifies brands/models, check if we match
  if (metadata.appliesToBrands || metadata.appliesToModels) {
    if (matchesBrand || matchesModel) {
      return {
        type: ContextType.APPLIES_TO_YOU,
        label: `Applies to Your ${carName}`,
        message: `This content is relevant to your specific vehicle.`,
        variant: 'applies',
      };
    }
    
    // Content is for specific cars but not this one
    return {
      type: ContextType.DOES_NOT_APPLY,
      label: `Doesn't Apply to ${carName}`,
      message: 'This content is for specific models.',
      variant: 'notApplies',
    };
  }

  // Check if powertrain matches (if specified in metadata)
  if (metadata.appliesToPowertrainTypes && metadata.appliesToPowertrainTypes.length > 0) {
    // We already checked for non-match above, so if we're here, it matches
    return {
      type: ContextType.APPLIES_TO_YOU,
      label: `Applies to Your ${carName}`,
      message: `This content is relevant to ${carAspiration} engines like yours.`,
      variant: 'applies',
    };
  }

  // No specific constraints - it's general knowledge
  return {
    type: ContextType.GENERAL,
    label: 'General Knowledge',
    message: 'This is general automotive knowledge.',
    variant: 'general',
  };
}

/**
 * Generate a personalized "In Your Case" message based on content and car
 * 
 * @param {ContentMetadata} metadata 
 * @param {SelectedCar|null} selectedCar 
 * @returns {string|null} - Returns null if no personalization is needed
 */
export function getPersonalizedMessage(metadata, selectedCar) {
  if (!selectedCar || !metadata.topics) {
    return null;
  }

  const carName = getCarShortName(selectedCar);
  const carAspiration = selectedCar.aspirationType || detectAspirationType(selectedCar.engine);
  
  // Generate contextual messages based on topics
  const topics = metadata.topics.map(t => t.toLowerCase());
  
  if (topics.includes('turbo') || topics.includes('boost') || topics.includes('turbocharged')) {
    if (carAspiration === 'naturally-aspirated') {
      return `Your ${carName} is naturally aspirated, so this turbo content doesn't directly apply—but it's great background knowledge if you're considering forced induction.`;
    }
    if (carAspiration === 'turbo' || carAspiration === 'twin-turbo') {
      return `Your ${carName} has a turbocharged engine, so these concepts directly apply to your car.`;
    }
  }

  if (topics.includes('supercharger') || topics.includes('supercharged')) {
    if (carAspiration === 'supercharged') {
      return `Your ${carName} is supercharged, so this content is directly relevant to your setup.`;
    }
    if (carAspiration === 'naturally-aspirated') {
      return `Your ${carName} is naturally aspirated. Supercharging is a popular upgrade path for NA engines.`;
    }
  }

  if (topics.includes('exhaust') || topics.includes('headers')) {
    return `Exhaust modifications are popular for the ${carName}—check model-specific forums for proven setups.`;
  }

  if (topics.includes('suspension') || topics.includes('coilovers')) {
    return `Suspension upgrades can transform how your ${carName} handles, both on track and street.`;
  }

  if (topics.includes('brake') || topics.includes('brakes') || topics.includes('braking')) {
    return `Brake upgrades are essential for track use. Your ${carName}'s OEM brakes are a good starting point.`;
  }

  return null;
}

/**
 * Batch process multiple content items for contextualization
 * Useful for filtering/sorting content lists
 * 
 * @param {Array<{id: string, metadata: ContentMetadata}>} contentItems 
 * @param {SelectedCar|null} selectedCar 
 * @returns {Array<{id: string, context: ContextResult}>}
 */
export function getContentContextBatch(contentItems, selectedCar) {
  return contentItems.map(item => ({
    id: item.id,
    context: getContentContext(item.metadata, selectedCar),
  }));
}
