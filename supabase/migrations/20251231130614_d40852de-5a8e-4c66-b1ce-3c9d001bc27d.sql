-- Add vibe_label and gallery_urls to events table
-- vibe_label: manual override for labels like "Must-See", "Geheimtipp", "Trending", "Neu"
-- gallery_urls: array of additional image URLs for the gallery slider

-- Note: This needs to be run on the EXTERNAL database (tfkiyvhfhvkejpljsnrk)
-- since that's where the events table lives

-- For Lovable Cloud, we'll create a local reference table for vibe overrides
-- that can be synced or used as fallback

CREATE TABLE IF NOT EXISTS public.event_vibe_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT NOT NULL UNIQUE,
  vibe_label TEXT CHECK (vibe_label IN ('must-see', 'geheimtipp', 'trending', 'neu')),
  vibe_level INTEGER CHECK (vibe_level >= 1 AND vibe_level <= 3) DEFAULT 2,
  gallery_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_vibe_overrides ENABLE ROW LEVEL SECURITY;

-- Public read access (everyone can see vibe labels)
CREATE POLICY "Anyone can view vibe overrides"
ON public.event_vibe_overrides
FOR SELECT
USING (true);

-- Only authenticated admins can modify (we'll check for admin role later)
CREATE POLICY "Admins can insert vibe overrides"
ON public.event_vibe_overrides
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update vibe overrides"
ON public.event_vibe_overrides
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete vibe overrides"
ON public.event_vibe_overrides
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Create trigger for updated_at
CREATE TRIGGER update_event_vibe_overrides_updated_at
BEFORE UPDATE ON public.event_vibe_overrides
FOR EACH ROW
EXECUTE FUNCTION public.update_profiles_updated_at();

-- Add index for fast lookup
CREATE INDEX idx_event_vibe_overrides_external_id ON public.event_vibe_overrides(external_id);