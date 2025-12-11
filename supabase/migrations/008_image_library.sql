-- ============================================================================
-- IMAGE LIBRARY TABLE
-- Central repository for all car images with rich metadata
-- Enables flexible image usage across the site based on content descriptions
-- ============================================================================

-- Create enum types for better data integrity
DO $$ BEGIN
  CREATE TYPE image_source_type AS ENUM (
    'ai-generated',     -- Our AI pipeline (Google Imagen)
    'press-room',       -- Manufacturer press images (editorial use)
    'wikimedia',        -- Wikimedia Commons (CC licensed)
    'stock',            -- Paid stock photography
    'user-submitted',   -- Community submissions
    'original'          -- Original photography
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE image_license_type AS ENUM (
    'owned',            -- We own full rights (AI-generated, original)
    'editorial',        -- Editorial use only (press images)
    'cc0',              -- Public domain
    'cc-by',            -- Attribution required
    'cc-by-sa',         -- Attribution + ShareAlike
    'cc-by-nc',         -- Attribution + NonCommercial
    'licensed',         -- Paid license (stock)
    'fair-use'          -- Fair use (logos, etc.)
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- CAR_IMAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS car_images (
  -- Identity
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationship to car (nullable for generic/brand images)
  car_slug TEXT REFERENCES cars(slug) ON DELETE SET NULL,
  brand TEXT,  -- For brand-level images without specific car
  
  -- Storage
  blob_url TEXT NOT NULL,                    -- Vercel Blob URL
  blob_path TEXT NOT NULL,                   -- Path within blob storage
  file_size_bytes INTEGER,
  width INTEGER,
  height INTEGER,
  aspect_ratio TEXT,                         -- '16:9', '1:1', '4:3', etc.
  format TEXT,                               -- 'webp', 'png', 'jpg'
  
  -- Source & Attribution
  source_type image_source_type NOT NULL DEFAULT 'ai-generated',
  source_url TEXT,                           -- Original source URL
  source_attribution TEXT,                   -- Attribution text for CC images
  license image_license_type NOT NULL DEFAULT 'owned',
  photographer TEXT,                         -- Photographer credit if known
  
  -- Content Description (KEY FOR FLEXIBLE USAGE)
  title TEXT,                                -- Short title for the image
  description TEXT NOT NULL,                 -- Detailed description of what's shown
  alt_text TEXT,                             -- Accessibility alt text
  
  -- Content Tags (for querying/filtering)
  -- These help us find the right image for any context
  content_tags TEXT[] DEFAULT '{}',          -- Array of tags
  -- Example tags:
  --   View: 'front', 'rear', 'side', '3/4-front', '3/4-rear', 'top', 'interior'
  --   Type: 'exterior', 'interior', 'engine', 'wheel', 'detail', 'badge'
  --   Style: 'action', 'static', 'studio', 'outdoor', 'night', 'sunset'
  --   Context: 'track', 'street', 'showroom', 'garage', 'mountain', 'coastal'
  --   Quality: 'hero', 'gallery', 'thumbnail', 'og-image'
  
  -- Usage Recommendations
  recommended_uses TEXT[] DEFAULT '{}',      -- Where this image works best
  -- Example uses:
  --   'hero-banner', 'card-thumbnail', 'gallery', 'og-social',
  --   'buying-guide', 'ownership-section', 'comparison-view'
  
  -- Quality & Priority
  quality_tier TEXT DEFAULT 'standard' CHECK (quality_tier IN ('premium', 'standard', 'placeholder')),
  is_primary BOOLEAN DEFAULT false,          -- Primary image for this car
  display_order INTEGER DEFAULT 0,           -- Sort order within car's images
  
  -- AI Generation Metadata (if applicable)
  ai_prompt TEXT,                            -- Prompt used for AI generation
  ai_model TEXT,                             -- Model used (e.g., 'gemini-3-pro-image-preview')
  ai_settings JSONB DEFAULT '{}'::jsonb,     -- Generation settings
  
  -- Verification & Status
  is_verified BOOLEAN DEFAULT false,         -- Manually verified for quality
  is_active BOOLEAN DEFAULT true,            -- Can be shown on site
  needs_review BOOLEAN DEFAULT false,        -- Flagged for review
  review_notes TEXT,
  
  -- Analytics (optional, for tracking popularity)
  view_count INTEGER DEFAULT 0,
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES for efficient querying
-- ============================================================================

-- Primary lookups
CREATE INDEX IF NOT EXISTS idx_car_images_car_slug ON car_images(car_slug);
CREATE INDEX IF NOT EXISTS idx_car_images_brand ON car_images(brand);
CREATE INDEX IF NOT EXISTS idx_car_images_blob_url ON car_images(blob_url);

-- Content-based queries
CREATE INDEX IF NOT EXISTS idx_car_images_content_tags ON car_images USING GIN(content_tags);
CREATE INDEX IF NOT EXISTS idx_car_images_recommended_uses ON car_images USING GIN(recommended_uses);

-- Filtering
CREATE INDEX IF NOT EXISTS idx_car_images_source_type ON car_images(source_type);
CREATE INDEX IF NOT EXISTS idx_car_images_license ON car_images(license);
CREATE INDEX IF NOT EXISTS idx_car_images_quality_tier ON car_images(quality_tier);
CREATE INDEX IF NOT EXISTS idx_car_images_is_primary ON car_images(is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_car_images_is_active ON car_images(is_active) WHERE is_active = true;

-- Compound indexes for common queries
CREATE INDEX IF NOT EXISTS idx_car_images_car_primary 
  ON car_images(car_slug, is_primary, display_order) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_car_images_car_quality 
  ON car_images(car_slug, quality_tier, display_order) 
  WHERE is_active = true;

-- ============================================================================
-- AUTO-UPDATE TIMESTAMP TRIGGER
-- ============================================================================
DROP TRIGGER IF EXISTS update_car_images_updated_at ON car_images;
CREATE TRIGGER update_car_images_updated_at
  BEFORE UPDATE ON car_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get primary image for a car
CREATE OR REPLACE FUNCTION get_car_primary_image(p_car_slug TEXT)
RETURNS TABLE (
  id UUID,
  blob_url TEXT,
  description TEXT,
  alt_text TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT ci.id, ci.blob_url, ci.description, ci.alt_text
  FROM car_images ci
  WHERE ci.car_slug = p_car_slug
    AND ci.is_active = true
    AND ci.is_primary = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Get images for a car by tag
CREATE OR REPLACE FUNCTION get_car_images_by_tag(p_car_slug TEXT, p_tag TEXT)
RETURNS TABLE (
  id UUID,
  blob_url TEXT,
  description TEXT,
  alt_text TEXT,
  quality_tier TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT ci.id, ci.blob_url, ci.description, ci.alt_text, ci.quality_tier
  FROM car_images ci
  WHERE ci.car_slug = p_car_slug
    AND ci.is_active = true
    AND p_tag = ANY(ci.content_tags)
  ORDER BY ci.display_order, ci.quality_tier DESC;
END;
$$ LANGUAGE plpgsql;

-- Get images for a recommended use
CREATE OR REPLACE FUNCTION get_images_for_use(p_use TEXT, p_car_slug TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  car_slug TEXT,
  blob_url TEXT,
  description TEXT,
  alt_text TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT ci.id, ci.car_slug, ci.blob_url, ci.description, ci.alt_text
  FROM car_images ci
  WHERE ci.is_active = true
    AND p_use = ANY(ci.recommended_uses)
    AND (p_car_slug IS NULL OR ci.car_slug = p_car_slug)
  ORDER BY ci.quality_tier DESC, ci.display_order;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- BRAND LOGOS TABLE (Separate for clarity)
-- ============================================================================
CREATE TABLE IF NOT EXISTS brand_logos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_key TEXT UNIQUE NOT NULL,            -- 'porsche', 'bmw', etc.
  brand_name TEXT NOT NULL,                  -- 'Porsche', 'BMW', etc.
  
  -- Logo files
  logo_svg_url TEXT,                         -- SVG logo (preferred)
  logo_png_url TEXT,                         -- PNG fallback
  logo_dark_url TEXT,                        -- Dark mode variant
  
  -- Branding
  primary_color TEXT,                        -- Hex color
  secondary_color TEXT,
  accent_color TEXT,
  
  -- Source & Attribution
  source_url TEXT,                           -- Where we got the logo
  license image_license_type DEFAULT 'fair-use',
  
  -- Brand info
  founded INTEGER,
  headquarters TEXT,
  country TEXT,
  wikipedia_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brand_logos_brand_key ON brand_logos(brand_key);

-- Auto-update timestamp trigger
DROP TRIGGER IF EXISTS update_brand_logos_updated_at ON brand_logos;
CREATE TRIGGER update_brand_logos_updated_at
  BEFORE UPDATE ON brand_logos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SAMPLE DATA COMMENTS (for reference, not executed)
-- ============================================================================
/*
-- Example: AI-generated hero image
INSERT INTO car_images (
  car_slug, blob_url, blob_path, source_type, license,
  description, alt_text, content_tags, recommended_uses,
  quality_tier, is_primary, ai_prompt, ai_model
) VALUES (
  '718-cayman-gt4',
  'https://blob.vercel-storage.com/cars/718-cayman-gt4/hero.webp',
  'cars/718-cayman-gt4/hero.webp',
  'ai-generated',
  'owned',
  '2020 Porsche 718 Cayman GT4 in Guards Red, 3/4 front view, driving on an Alpine mountain pass at golden hour. Snow-capped peaks visible in background, dramatic European scenery.',
  'Red Porsche 718 Cayman GT4 on mountain road',
  ARRAY['3/4-front', 'exterior', 'outdoor', 'action', 'mountain', 'sunset'],
  ARRAY['hero-banner', 'og-social', 'card-thumbnail'],
  'premium',
  true,
  'OUTDOOR photograph: A 2020 718 Cayman GT4 driving on winding Alpine mountain pass...',
  'gemini-3-pro-image-preview'
);

-- Example: Press room interior image
INSERT INTO car_images (
  car_slug, blob_url, blob_path, source_type, license,
  source_url, source_attribution,
  description, alt_text, content_tags, recommended_uses,
  quality_tier
) VALUES (
  '718-cayman-gt4',
  'https://blob.vercel-storage.com/cars/718-cayman-gt4/interior.webp',
  'cars/718-cayman-gt4/interior.webp',
  'press-room',
  'editorial',
  'https://newsroom.porsche.com/...',
  'Image: Porsche AG',
  'Interior of 2020 Porsche 718 Cayman GT4 showing Alcantara steering wheel, GT4-specific gauges, carbon fiber trim, and sport bucket seats.',
  'Porsche 718 Cayman GT4 interior cockpit view',
  ARRAY['interior', 'cockpit', 'dashboard', 'steering-wheel'],
  ARRAY['buying-guide', 'ownership-section', 'gallery'],
  'premium'
);
*/
