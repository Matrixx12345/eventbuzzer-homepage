-- Create storage bucket for event images
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true);

-- Allow public read access to all images
CREATE POLICY "Public read access for event images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'event-images');

-- Allow authenticated users to upload images (for admin use)
CREATE POLICY "Authenticated users can upload event images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'event-images');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update event images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'event-images');

-- Allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete event images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'event-images');