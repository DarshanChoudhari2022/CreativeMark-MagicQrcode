-- Add social and contact fields to locations table
-- This enables the "Digital Business Card" features

ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add comment for documentation
COMMENT ON COLUMN locations.website_url IS 'Business website URL';
COMMENT ON COLUMN locations.instagram_url IS 'Instagram profile URL';
COMMENT ON COLUMN locations.facebook_url IS 'Facebook page URL';
COMMENT ON COLUMN locations.phone_number IS 'Business contact number';
COMMENT ON COLUMN locations.email IS 'Business contact email';
