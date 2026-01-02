-- Drop existing policies for INSERT, UPDATE, DELETE
DROP POLICY IF EXISTS "Authenticated users can insert vibe overrides" ON event_vibe_overrides;
DROP POLICY IF EXISTS "Authenticated users can update vibe overrides" ON event_vibe_overrides;
DROP POLICY IF EXISTS "Authenticated users can delete vibe overrides" ON event_vibe_overrides;

-- Create admin-only policies (only Jennifer_str@icloud.com can modify)
CREATE POLICY "Admin can insert vibe overrides"
ON event_vibe_overrides
FOR INSERT
TO authenticated
WITH CHECK (auth.jwt() ->> 'email' = 'Jennifer_str@icloud.com');

CREATE POLICY "Admin can update vibe overrides"
ON event_vibe_overrides
FOR UPDATE
TO authenticated
USING (auth.jwt() ->> 'email' = 'Jennifer_str@icloud.com')
WITH CHECK (auth.jwt() ->> 'email' = 'Jennifer_str@icloud.com');

CREATE POLICY "Admin can delete vibe overrides"
ON event_vibe_overrides
FOR DELETE
TO authenticated
USING (auth.jwt() ->> 'email' = 'Jennifer_str@icloud.com');