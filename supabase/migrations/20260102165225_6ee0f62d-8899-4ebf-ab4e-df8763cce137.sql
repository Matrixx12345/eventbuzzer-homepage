-- Add buzz_boost column to event_vibe_overrides table
-- This is a multiplier (e.g., 1.5 = 50% boost, 2.0 = double the buzz)
ALTER TABLE public.event_vibe_overrides 
ADD COLUMN buzz_boost numeric DEFAULT 1.0;

-- Add comment for clarity
COMMENT ON COLUMN public.event_vibe_overrides.buzz_boost IS 'Multiplier for buzz score. 1.0 = no change, 1.5 = 50% boost, etc.';