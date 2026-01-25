-- Check if gallery_urls column exists in events table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'events'
  AND column_name = 'gallery_urls';

-- Also show all image-related columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'events'
  AND column_name LIKE '%image%';
