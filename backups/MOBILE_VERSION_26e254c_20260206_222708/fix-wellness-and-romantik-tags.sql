-- Fix Wellness & Romantik Tags - Remove Incorrect Tagging
-- Run this in Supabase SQL Editor

-- 1. Remove "romantik" from Zentrum Paul Klee (piano = architect, not music)
UPDATE events
SET tags = array_remove(tags, 'romantik')
WHERE title ILIKE '%Paul Klee%'
  AND tags && ARRAY['romantik'];

-- 2. Remove "wellness" from concerts/music events (not wellness related)
UPDATE events
SET tags = array_remove(tags, 'wellness')
WHERE (
  title ILIKE '%Linkin Park%'
  OR title ILIKE '%Helene Fischer%'
  OR title ILIKE '%Jazz%Club%'
  OR title ILIKE '%Comedy%'
  OR title ILIKE '%Concert%'
  OR title ILIKE '%Konzert%'
  OR title ILIKE '%Musical%'
  OR title ILIKE '%Oper%'
  OR title ILIKE '%Theater%'
  OR title ILIKE '%Festival%'
  OR title ILIKE '%Band%'
)
AND tags && ARRAY['wellness'];

-- 3. Remove "wellness" from transportation/infrastructure
UPDATE events
SET tags = array_remove(tags, 'wellness')
WHERE (
  title ILIKE '%Bahnhof%'
  OR title ILIKE '%Station%'
  OR title ILIKE '%Train%'
  OR title ILIKE '%Bus%'
)
AND tags && ARRAY['wellness'];

-- 4. Remove "wellness" from regular city tours/sightseeing
UPDATE events
SET tags = array_remove(tags, 'wellness')
WHERE (
  title ILIKE '%Altstadt%'
  OR title ILIKE '%Old Town%'
  OR title ILIKE '%City Tour%'
  OR title ILIKE '%Stadtrundgang%'
  OR title ILIKE '%Stadtführung%'
)
AND tags && ARRAY['wellness'];

-- 5. Remove "wellness" from museums (unless spa/wellness museum)
UPDATE events
SET tags = array_remove(tags, 'wellness')
WHERE (
  title ILIKE '%Museum%'
  OR title ILIKE '%Zentrum%'
  OR title ILIKE '%Galerie%'
)
AND tags && ARRAY['wellness']
AND title NOT ILIKE '%Wellness%'
AND title NOT ILIKE '%Spa%'
AND title NOT ILIKE '%Therme%';

-- 6. Remove "wellness" from regular hiking/outdoor (keep only if spa/wellness related)
UPDATE events
SET tags = array_remove(tags, 'wellness')
WHERE (
  title ILIKE '%Wanderung%'
  OR title ILIKE '%Hiking%'
  OR title ILIKE '%Trail%'
  OR title ILIKE '%Gipfel%'
  OR title ILIKE '%Berg%'
)
AND tags && ARRAY['wellness']
AND title NOT ILIKE '%Wellness%'
AND title NOT ILIKE '%Spa%'
AND title NOT ILIKE '%Therme%'
AND description NOT ILIKE '%Wellness%'
AND description NOT ILIKE '%Spa%'
AND description NOT ILIKE '%Therme%';

-- 7. Rename "elite" to "must-see" in all events
UPDATE events
SET tags = array_replace(tags, 'elite', 'must-see')
WHERE tags && ARRAY['elite'];

-- Verify the changes
SELECT
  'romantik_paul_klee' as check_type,
  COUNT(*) as count
FROM events
WHERE title ILIKE '%Paul Klee%'
  AND tags && ARRAY['romantik']

UNION ALL

SELECT
  'wellness_concerts' as check_type,
  COUNT(*) as count
FROM events
WHERE (
  title ILIKE '%Linkin Park%'
  OR title ILIKE '%Helene Fischer%'
  OR title ILIKE '%Concert%'
  OR title ILIKE '%Konzert%'
)
AND tags && ARRAY['wellness']

UNION ALL

SELECT
  'wellness_remaining' as check_type,
  COUNT(*) as count
FROM events
WHERE tags && ARRAY['wellness']

UNION ALL

SELECT
  'must_see_total' as check_type,
  COUNT(*) as count
FROM events
WHERE tags && ARRAY['must-see']

UNION ALL

SELECT
  'elite_remaining' as check_type,
  COUNT(*) as count
FROM events
WHERE tags && ARRAY['elite'];
