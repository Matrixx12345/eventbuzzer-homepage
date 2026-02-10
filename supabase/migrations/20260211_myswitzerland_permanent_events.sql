-- Migration: MySwitzerland Events as Permanent/Recurring
-- Date: 2026-02-11
-- Purpose: Mark MySwitzerland events as permanent/recurring to prevent SEO damage from old dates

-- Add recurring event fields if they don't exist
ALTER TABLE events
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recurring_pattern TEXT CHECK (recurring_pattern IN ('yearly', 'monthly', 'weekly', 'seasonal')),
ADD COLUMN IF NOT EXISTS available_months INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7,8,9,10,11,12],
ADD COLUMN IF NOT EXISTS next_occurrence_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS next_occurrence_end TIMESTAMPTZ;

-- Add comments for documentation
COMMENT ON COLUMN events.is_recurring IS 'Whether this event is recurring (true) or one-time/permanent (false)';
COMMENT ON COLUMN events.recurring_pattern IS 'Pattern for recurring events: yearly, monthly, weekly, seasonal';
COMMENT ON COLUMN events.available_months IS 'Months when event is available (1-12). Used for seasonal events.';
COMMENT ON COLUMN events.next_occurrence_start IS 'Projected start date for next occurrence (recurring events only)';
COMMENT ON COLUMN events.next_occurrence_end IS 'Projected end date for next occurrence (recurring events only)';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_is_recurring ON events(is_recurring);
CREATE INDEX IF NOT EXISTS idx_events_recurring_pattern ON events(recurring_pattern);
CREATE INDEX IF NOT EXISTS idx_events_available_months ON events USING GIN (available_months);

-- Mark all existing MySwitzerland events as permanent (remove old dates)
-- CRITICAL: This prevents SEO damage from stale dates
UPDATE events
SET
  is_recurring = false,
  recurring_pattern = NULL,
  available_months = ARRAY[1,2,3,4,5,6,7,8,9,10,11,12],
  start_date = NULL,  -- CRITICAL: Remove old dates that kill SEO
  end_date = NULL
WHERE external_id LIKE 'mys_%';

-- Mark known winter seasonal events (Nov-Mar)
UPDATE events
SET
  is_recurring = true,
  recurring_pattern = 'seasonal',
  available_months = ARRAY[11,12,1,2,3]
WHERE external_id LIKE 'mys_%'
  AND (
    title ILIKE '%ski%'
    OR title ILIKE '%snowboard%'
    OR title ILIKE '%schneeschuh%'
    OR title ILIKE '%wintersport%'
    OR title ILIKE '%langlauf%'
    OR title ILIKE '%schlitten%'
    OR title ILIKE '%skipiste%'
    OR title ILIKE '%winterwandern%'
  );

-- Mark summer seasonal events (May-Sep)
UPDATE events
SET
  is_recurring = true,
  recurring_pattern = 'seasonal',
  available_months = ARRAY[5,6,7,8,9]
WHERE external_id LIKE 'mys_%'
  AND (
    title ILIKE '%sommerbahn%'
    OR title ILIKE '%sommerrodelbahn%'
    OR title ILIKE '%seilbahn sommer%'
    OR title ILIKE '%freibad%'
    OR title ILIKE '%strandbad%'
  );

-- Mark weekly recurring events
UPDATE events
SET
  is_recurring = true,
  recurring_pattern = 'weekly',
  available_months = ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]
WHERE external_id LIKE 'mys_%'
  AND (
    title ILIKE '%wochenmarkt%'
    OR title ILIKE '%weekly market%'
    OR title ILIKE '%jeden montag%'
    OR title ILIKE '%jeden dienstag%'
    OR title ILIKE '%jeden mittwoch%'
    OR title ILIKE '%jeden donnerstag%'
    OR title ILIKE '%jeden freitag%'
    OR title ILIKE '%jeden samstag%'
    OR title ILIKE '%jeden sonntag%'
  );

-- Verification: Count MySwitzerland events by type
-- Run manually: SELECT is_recurring, recurring_pattern, COUNT(*) FROM events WHERE external_id LIKE 'mys_%' GROUP BY is_recurring, recurring_pattern;
