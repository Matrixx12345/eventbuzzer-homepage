-- Fix Mistwetter Tags - Remove from Events that shouldn't have it
-- Run this in Supabase SQL Editor

-- Events to remove "mistwetter" tag from:
-- 1. Jungfraujoch - Top of Europe
-- 2. Gletscherwelt Bettmerhorn
-- 3. Hallwilersee
-- 4. Park beim Richard Wagner Museum

-- Update events - remove "mistwetter" from tags array
UPDATE events
SET tags = array_remove(tags, 'mistwetter')
WHERE
  title ILIKE '%Jungfraujoch%'
  OR title ILIKE '%Top of Europe%'
  OR title ILIKE '%Bettmerhorn%'
  OR title ILIKE '%Gletscherwelt Bettmerhorn%'
  OR title ILIKE '%Hallwilersee%'
  OR (title ILIKE '%Park%' AND title ILIKE '%Richard Wagner%')
  OR (title ILIKE '%Richard Wagner Museum%' AND (title ILIKE '%Park%' OR description ILIKE '%Park%'));

-- Verify the changes
SELECT
  title,
  venue_name,
  location,
  tags
FROM events
WHERE
  title ILIKE '%Jungfraujoch%'
  OR title ILIKE '%Bettmerhorn%'
  OR title ILIKE '%Hallwilersee%'
  OR (title ILIKE '%Richard Wagner%' AND (title ILIKE '%Park%' OR description ILIKE '%Park%'))
ORDER BY title;
