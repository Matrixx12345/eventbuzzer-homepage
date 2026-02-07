-- Drop existing admin policies
DROP POLICY IF EXISTS "Admin can insert vibe overrides" ON event_vibe_overrides;
DROP POLICY IF EXISTS "Admin can update vibe overrides" ON event_vibe_overrides;
DROP POLICY IF EXISTS "Admin can delete vibe overrides" ON event_vibe_overrides;

-- Create case-insensitive admin policies
CREATE POLICY "Admin can insert vibe overrides"
ON event_vibe_overrides
FOR INSERT
TO authenticated
WITH CHECK (LOWER(auth.jwt() ->> 'email') = 'jennifer_str@icloud.com');

CREATE POLICY "Admin can update vibe overrides"
ON event_vibe_overrides
FOR UPDATE
TO authenticated
USING (LOWER(auth.jwt() ->> 'email') = 'jennifer_str@icloud.com')
WITH CHECK (LOWER(auth.jwt() ->> 'email') = 'jennifer_str@icloud.com');

CREATE POLICY "Admin can delete vibe overrides"
ON event_vibe_overrides
FOR DELETE
TO authenticated
USING (LOWER(auth.jwt() ->> 'email') = 'jennifer_str@icloud.com');