/**
 * Image Library Client
 * 
 * Query images from the car image library.
 * Works with both Supabase (production) and local JSON (development).
 * 
 * Each image has:
 * - id: Unique identifier
 * - car_slug: Associated car
 * - blob_url: Vercel Blob URL
 * - description: What the image shows
 * - content_tags: Searchable tags
 * - recommended_uses: Where the image works best
 * - quality_tier: 'premium' | 'standard' | 'placeholder'
 * - source_type: 'ai-generated' | 'press-room' | 'wikimedia' | etc.
 * - license: 'owned' | 'editorial' | 'cc-by' | etc.
 * - source_attribution: Credit text for non-owned images
 */

import { createClient } from '@supabase/supabase-js';

// =============================================================================
// CONFIGURATION
// =============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Initialize Supabase client (only if credentials available)
let supabase = null;
function getSupabase() {
  if (!supabase && SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabase;
}

// Local library cache (for SSR/fallback)
let localLibraryCache = null;

/**
 * Load local library (for development/fallback)
 */
async function loadLocalLibrary() {
  if (localLibraryCache) return localLibraryCache;
  
  try {
    // Dynamic import for server-side
    if (typeof window === 'undefined') {
      const fs = await import('fs');
      const path = await import('path');
      const libraryPath = path.join(process.cwd(), 'image-library.json');
      
      if (fs.existsSync(libraryPath)) {
        const data = fs.readFileSync(libraryPath, 'utf-8');
        localLibraryCache = JSON.parse(data);
        return localLibraryCache;
      }
    }
  } catch (error) {
    console.warn('[ImageLibrary] Could not load local library:', error.message);
  }
  
  return { images: [] };
}

// =============================================================================
// QUERY FUNCTIONS
// =============================================================================

/**
 * Get all images for a car
 * @param {string} carSlug - Car slug
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of image objects
 */
export async function getCarImages(carSlug, options = {}) {
  const { 
    quality = null,      // Filter by quality tier
    limit = null,        // Max results
    tags = null,         // Filter by tags (array)
  } = options;
  
  const sb = getSupabase();
  
  if (sb) {
    let query = sb
      .from('car_images')
      .select('*')
      .eq('car_slug', carSlug)
      .eq('is_active', true)
      .order('is_primary', { ascending: false })
      .order('display_order', { ascending: true });
    
    if (quality) {
      query = query.eq('quality_tier', quality);
    }
    
    if (tags && tags.length > 0) {
      query = query.contains('content_tags', tags);
    }
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.warn('[ImageLibrary] Supabase error:', error.message);
    } else if (data) {
      return data;
    }
  }
  
  // Fallback to local library
  const library = await loadLocalLibrary();
  let results = library.images.filter(img => 
    img.car_slug === carSlug && img.is_active !== false
  );
  
  if (quality) {
    results = results.filter(img => img.quality_tier === quality);
  }
  
  if (tags && tags.length > 0) {
    results = results.filter(img => 
      tags.some(tag => img.content_tags?.includes(tag))
    );
  }
  
  // Sort by primary first, then display order
  results.sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return (a.display_order || 0) - (b.display_order || 0);
  });
  
  if (limit) {
    results = results.slice(0, limit);
  }
  
  return results;
}

/**
 * Get primary/hero image for a car
 * @param {string} carSlug - Car slug
 * @returns {Promise<Object|null>} Primary image or null
 */
export async function getCarPrimaryImage(carSlug) {
  const images = await getCarImages(carSlug, { limit: 1 });
  return images[0] || null;
}

/**
 * Get images by tag across all cars
 * @param {string} tag - Content tag to search
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of image objects
 */
export async function getImagesByTag(tag, options = {}) {
  const { 
    carSlug = null,
    quality = null,
    limit = 20,
  } = options;
  
  const sb = getSupabase();
  
  if (sb) {
    let query = sb
      .from('car_images')
      .select('*')
      .contains('content_tags', [tag])
      .eq('is_active', true)
      .order('quality_tier', { ascending: false })
      .order('created_at', { ascending: false });
    
    if (carSlug) {
      query = query.eq('car_slug', carSlug);
    }
    
    if (quality) {
      query = query.eq('quality_tier', quality);
    }
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    
    if (!error && data) {
      return data;
    }
  }
  
  // Fallback to local
  const library = await loadLocalLibrary();
  let results = library.images.filter(img => 
    img.content_tags?.includes(tag) && img.is_active !== false
  );
  
  if (carSlug) {
    results = results.filter(img => img.car_slug === carSlug);
  }
  
  if (quality) {
    results = results.filter(img => img.quality_tier === quality);
  }
  
  return results.slice(0, limit);
}

/**
 * Get images for a specific use case
 * @param {string} use - Recommended use (e.g., 'hero-banner', 'gallery')
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of image objects
 */
export async function getImagesForUse(use, options = {}) {
  const { 
    carSlug = null,
    limit = 20,
  } = options;
  
  const sb = getSupabase();
  
  if (sb) {
    let query = sb
      .from('car_images')
      .select('*')
      .contains('recommended_uses', [use])
      .eq('is_active', true)
      .order('quality_tier', { ascending: false });
    
    if (carSlug) {
      query = query.eq('car_slug', carSlug);
    }
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    
    if (!error && data) {
      return data;
    }
  }
  
  // Fallback to local
  const library = await loadLocalLibrary();
  let results = library.images.filter(img => 
    img.recommended_uses?.includes(use) && img.is_active !== false
  );
  
  if (carSlug) {
    results = results.filter(img => img.car_slug === carSlug);
  }
  
  return results.slice(0, limit);
}

/**
 * Get image by ID
 * @param {string} id - Image UUID
 * @returns {Promise<Object|null>} Image object or null
 */
export async function getImageById(id) {
  const sb = getSupabase();
  
  if (sb) {
    const { data, error } = await sb
      .from('car_images')
      .select('*')
      .eq('id', id)
      .single();
    
    if (!error && data) {
      return data;
    }
  }
  
  // Fallback to local
  const library = await loadLocalLibrary();
  return library.images.find(img => img.id === id) || null;
}

/**
 * Search images by description text
 * @param {string} searchText - Text to search in descriptions
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of matching images
 */
export async function searchImages(searchText, options = {}) {
  const { limit = 20 } = options;
  const searchLower = searchText.toLowerCase();
  
  const sb = getSupabase();
  
  if (sb) {
    // Use Supabase full-text search if available
    const { data, error } = await sb
      .from('car_images')
      .select('*')
      .or(`description.ilike.%${searchText}%,title.ilike.%${searchText}%`)
      .eq('is_active', true)
      .limit(limit);
    
    if (!error && data) {
      return data;
    }
  }
  
  // Fallback to local search
  const library = await loadLocalLibrary();
  const results = library.images.filter(img => {
    if (img.is_active === false) return false;
    
    const desc = (img.description || '').toLowerCase();
    const title = (img.title || '').toLowerCase();
    const tags = (img.content_tags || []).join(' ').toLowerCase();
    
    return desc.includes(searchLower) || 
           title.includes(searchLower) || 
           tags.includes(searchLower);
  });
  
  return results.slice(0, limit);
}

/**
 * Get library statistics
 * @returns {Promise<Object>} Statistics object
 */
export async function getLibraryStats() {
  const sb = getSupabase();
  
  if (sb) {
    const { data, error } = await sb
      .from('car_images')
      .select('car_slug, source_type, quality_tier, content_tags')
      .eq('is_active', true);
    
    if (!error && data) {
      return computeStats(data);
    }
  }
  
  const library = await loadLocalLibrary();
  return computeStats(library.images.filter(img => img.is_active !== false));
}

function computeStats(images) {
  const stats = {
    totalImages: images.length,
    bySource: {},
    byQuality: {},
    carsWithImages: new Set(),
    commonTags: {},
  };
  
  images.forEach(img => {
    // By source
    stats.bySource[img.source_type] = (stats.bySource[img.source_type] || 0) + 1;
    
    // By quality
    stats.byQuality[img.quality_tier] = (stats.byQuality[img.quality_tier] || 0) + 1;
    
    // Unique cars
    if (img.car_slug) {
      stats.carsWithImages.add(img.car_slug);
    }
    
    // Tag frequency
    (img.content_tags || []).forEach(tag => {
      stats.commonTags[tag] = (stats.commonTags[tag] || 0) + 1;
    });
  });
  
  stats.uniqueCars = stats.carsWithImages.size;
  delete stats.carsWithImages;
  
  // Sort tags by frequency
  stats.topTags = Object.entries(stats.commonTags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([tag, count]) => ({ tag, count }));
  delete stats.commonTags;
  
  return stats;
}

// =============================================================================
// ATTRIBUTION & LICENSE HELPERS
// =============================================================================

/**
 * License display names and requirements
 */
const LICENSE_INFO = {
  'owned': {
    name: 'Owned',
    requiresCredit: false,
    description: 'Original or AI-generated content',
  },
  'public-domain': {
    name: 'Public Domain',
    requiresCredit: false,
    description: 'Free to use, no restrictions',
  },
  'cc0': {
    name: 'CC0 (Public Domain)',
    requiresCredit: false,
    description: 'Free to use, no restrictions',
  },
  'cc-by': {
    name: 'CC BY',
    requiresCredit: true,
    description: 'Credit required',
  },
  'cc-by-sa': {
    name: 'CC BY-SA',
    requiresCredit: true,
    description: 'Credit required, share-alike',
  },
  'editorial': {
    name: 'Editorial Use',
    requiresCredit: true,
    description: 'Press/manufacturer images for editorial use',
  },
};

/**
 * Check if an image requires attribution
 * @param {Object} image - Image object
 * @returns {boolean} True if credit must be displayed
 */
export function requiresAttribution(image) {
  if (!image) return false;
  const license = image.license || 'unknown';
  const licenseInfo = LICENSE_INFO[license];
  return licenseInfo?.requiresCredit ?? false;
}

/**
 * Get formatted attribution string for an image
 * Returns null if no attribution required
 * @param {Object} image - Image object
 * @param {Object} options - Formatting options
 * @returns {string|null} Attribution string or null
 */
export function getAttributionText(image, options = {}) {
  if (!image || !requiresAttribution(image)) {
    return null;
  }
  
  const {
    includeLink = false,
    format = 'short', // 'short' | 'full' | 'html'
  } = options;
  
  const photographer = image.attribution || image.photographer || 'Unknown';
  const license = image.license || 'Unknown';
  const licenseDisplay = LICENSE_INFO[license]?.name || license.toUpperCase();
  const source = image.source_url;
  
  // Determine source name
  let sourceName = 'Wikimedia Commons';
  if (image.source_type === 'press') {
    sourceName = 'Manufacturer Press';
  }
  
  if (format === 'short') {
    return `Photo: ${photographer}`;
  }
  
  if (format === 'full') {
    return `Photo by ${photographer} via ${sourceName} (${licenseDisplay})`;
  }
  
  if (format === 'html' && source) {
    return `Photo by ${photographer} via <a href="${source}" target="_blank" rel="noopener">${sourceName}</a> (${licenseDisplay})`;
  }
  
  return `Photo by ${photographer} (${licenseDisplay})`;
}

/**
 * Get attribution data object for component rendering
 * @param {Object} image - Image object
 * @returns {Object|null} Attribution data or null
 */
export function getAttributionData(image) {
  if (!image || !requiresAttribution(image)) {
    return null;
  }
  
  return {
    photographer: image.attribution || image.photographer || 'Unknown',
    license: image.license,
    licenseName: LICENSE_INFO[image.license]?.name || image.license,
    sourceUrl: image.source_url,
    sourceType: image.source_type,
    notes: image.notes,
  };
}

/**
 * Get all images that require attribution (for credits page)
 * @returns {Promise<Array>} Array of images requiring credit
 */
export async function getImagesRequiringAttribution() {
  const library = await loadLocalLibrary();
  return library.images.filter(img => requiresAttribution(img));
}

// =============================================================================
// HELPER FOR COMPONENT USAGE
// =============================================================================

/**
 * Get image data for a car with fallbacks
 * Returns the best available image with metadata
 * @param {Object} car - Car object with slug
 * @param {string} preferredUse - Preferred use case
 * @returns {Promise<Object>} Image data with url, description, attribution
 */
export async function getImageForCar(car, preferredUse = 'hero-banner') {
  if (!car?.slug) {
    return {
      url: null,
      description: null,
      altText: car?.name || 'Sports car',
      attribution: null,
      isPlaceholder: true,
    };
  }
  
  // Try to get from library first
  const images = await getImagesForUse(preferredUse, { carSlug: car.slug, limit: 1 });
  
  if (images.length > 0) {
    const img = images[0];
    return {
      id: img.id,
      url: img.blob_url,
      description: img.description,
      altText: img.alt_text || img.description,
      // Attribution data for credit display
      requiresAttribution: requiresAttribution(img),
      attribution: getAttributionData(img),
      attributionText: getAttributionText(img, { format: 'full' }),
      license: img.license,
      sourceType: img.source_type,
      tags: img.content_tags,
      isPlaceholder: false,
    };
  }
  
  // Fallback to any image for this car
  const anyImage = await getCarPrimaryImage(car.slug);
  
  if (anyImage) {
    return {
      id: anyImage.id,
      url: anyImage.blob_url,
      description: anyImage.description,
      altText: anyImage.alt_text || anyImage.description,
      // Attribution data for credit display
      requiresAttribution: requiresAttribution(anyImage),
      attribution: getAttributionData(anyImage),
      attributionText: getAttributionText(anyImage, { format: 'full' }),
      license: anyImage.license,
      sourceType: anyImage.source_type,
      tags: anyImage.content_tags,
      isPlaceholder: false,
    };
  }
  
  // Legacy fallback to car's imageHeroUrl
  if (car.imageHeroUrl) {
    return {
      url: car.imageHeroUrl,
      description: `${car.name} hero image`,
      altText: car.name,
      attribution: null,
      isPlaceholder: false,
    };
  }
  
  // Final fallback to local file
  return {
    url: `/images/cars/${car.slug}-hero.png`,
    description: `${car.name} hero image`,
    altText: car.name,
    attribution: null,
    isPlaceholder: false,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  getCarImages,
  getCarPrimaryImage,
  getImagesByTag,
  getImagesForUse,
  getImageById,
  searchImages,
  getLibraryStats,
  getImageForCar,
  // Attribution helpers
  requiresAttribution,
  getAttributionText,
  getAttributionData,
  getImagesRequiringAttribution,
};
