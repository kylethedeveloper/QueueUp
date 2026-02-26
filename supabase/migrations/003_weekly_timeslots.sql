-- Migration: Convert timeslots from date-specific to weekly schedule templates
-- Schema changes only — all business logic lives in the app code.

-- 1. Drop old timeslot timestamp columns, add weekly schedule columns
ALTER TABLE timeslots
  DROP COLUMN IF EXISTS start_time,
  DROP COLUMN IF EXISTS end_time;

ALTER TABLE timeslots
  ADD COLUMN day_of_week INT NOT NULL DEFAULT 1,
  ADD COLUMN start_time TIME NOT NULL DEFAULT '08:00',
  ADD COLUMN end_time TIME NOT NULL DEFAULT '09:00';

-- 2. Add reservation_date to reservations
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS reservation_date DATE;

-- 3. Index for fast reservation lookups per timeslot + date
CREATE INDEX IF NOT EXISTS idx_reservations_timeslot_date
  ON reservations(timeslot_id, reservation_date) WHERE status = 'confirmed';

-- 4. Drop old RPC functions (logic moved to app code)
DROP FUNCTION IF EXISTS create_reservation(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS create_reservation(UUID, TEXT, TEXT, DATE);
DROP FUNCTION IF EXISTS get_timeslots_with_counts(UUID);
DROP FUNCTION IF EXISTS get_timeslot_instances(UUID, DATE, DATE);
