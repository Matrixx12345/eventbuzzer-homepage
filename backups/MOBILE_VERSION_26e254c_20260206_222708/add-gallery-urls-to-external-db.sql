-- Add gallery_urls column to events table in EXTERNAL database
-- This needs to be run on: https://supabase.com/dashboard/project/tfkiyvhfhvkejpljsnrk

-- Run this in the SQL Editor of your external Supabase project

-- Add gallery_urls column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'events'
    AND column_name = 'gallery_urls'
  ) THEN
    ALTER TABLE events ADD COLUMN gallery_urls TEXT[];
    RAISE NOTICE 'Column gallery_urls added successfully';
  ELSE
    RAISE NOTICE 'Column gallery_urls already exists';
  END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'events'
AND column_name IN ('image_url', 'gallery_urls');
