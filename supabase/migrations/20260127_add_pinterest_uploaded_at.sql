-- Add pinterest_uploaded_at column to events table
-- This tracks when an event was uploaded to Pinterest

ALTER TABLE events
ADD COLUMN IF NOT EXISTS pinterest_uploaded_at TIMESTAMPTZ;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_events_pinterest_uploaded_at
ON events(pinterest_uploaded_at);

-- Comment
COMMENT ON COLUMN events.pinterest_uploaded_at IS 'Timestamp when this event was uploaded to Pinterest via CSV bulk upload';
