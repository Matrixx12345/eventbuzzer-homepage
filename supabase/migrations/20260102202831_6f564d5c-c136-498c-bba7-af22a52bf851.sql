-- Drop existing RESTRICTIVE policies
DROP POLICY IF EXISTS "Admins can insert vibe overrides" ON event_vibe_overrides;
DROP POLICY IF EXISTS "Admins can update vibe overrides" ON event_vibe_overrides;
DROP POLICY IF EXISTS "Admins can delete vibe overrides" ON event_vibe_overrides;

-- Create new PERMISSIVE policies for authenticated users
CREATE POLICY "Authenticated users can insert vibe overrides"
ON event_vibe_overrides
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update vibe overrides"
ON event_vibe_overrides
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete vibe overrides"
ON event_vibe_overrides
FOR DELETE
TO authenticated
USING (true);