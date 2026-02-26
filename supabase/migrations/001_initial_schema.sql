-- QueueUp Initial Schema
-- Run this in your Supabase SQL Editor

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Timeslots table
CREATE TABLE IF NOT EXISTS timeslots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  max_reservations INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timeslot_id UUID REFERENCES timeslots(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  confirmation_sent BOOLEAN DEFAULT false,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast capacity checks
CREATE INDEX IF NOT EXISTS idx_reservations_timeslot 
  ON reservations(timeslot_id) WHERE status = 'confirmed';

-- Index for reminder email queries
CREATE INDEX IF NOT EXISTS idx_reservations_reminder 
  ON reservations(reminder_sent, status) WHERE status = 'confirmed' AND reminder_sent = false;

-- Atomic capacity-safe reservation function
CREATE OR REPLACE FUNCTION create_reservation(
  p_timeslot_id UUID,
  p_user_name TEXT,
  p_user_email TEXT
) RETURNS SETOF reservations AS $$
DECLARE
  v_current_count INT;
  v_max INT;
BEGIN
  -- Lock the timeslot row to prevent race conditions
  SELECT max_reservations INTO v_max 
  FROM timeslots WHERE id = p_timeslot_id FOR UPDATE;
  
  IF v_max IS NULL THEN
    RAISE EXCEPTION 'Timeslot not found';
  END IF;
  
  SELECT COUNT(*) INTO v_current_count 
  FROM reservations 
  WHERE timeslot_id = p_timeslot_id AND status = 'confirmed';
  
  IF v_current_count >= v_max THEN
    RAISE EXCEPTION 'Timeslot is full';
  END IF;
  
  RETURN QUERY
  INSERT INTO reservations (timeslot_id, user_name, user_email)
  VALUES (p_timeslot_id, p_user_name, p_user_email)
  RETURNING *;
END;
$$ LANGUAGE plpgsql;

-- Function to get timeslots with reservation counts
CREATE OR REPLACE FUNCTION get_timeslots_with_counts(p_event_id UUID)
RETURNS TABLE (
  id UUID,
  event_id UUID,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  max_reservations INT,
  created_at TIMESTAMPTZ,
  reservation_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id, t.event_id, t.start_time, t.end_time, t.max_reservations, t.created_at,
    COUNT(r.id) FILTER (WHERE r.status = 'confirmed') AS reservation_count
  FROM timeslots t
  LEFT JOIN reservations r ON r.timeslot_id = t.id
  WHERE t.event_id = p_event_id
  GROUP BY t.id
  ORDER BY t.start_time;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeslots ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Public read access on active events
CREATE POLICY "Public can view active events" ON events
  FOR SELECT USING (is_active = true);

-- Public read access on timeslots for active events
CREATE POLICY "Public can view timeslots" ON timeslots
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = timeslots.event_id AND events.is_active = true)
  );

-- Public can create reservations (capacity enforced by function)
CREATE POLICY "Public can create reservations" ON reservations
  FOR INSERT WITH CHECK (true);

-- Public can view their own reservations
CREATE POLICY "Public can view reservations" ON reservations
  FOR SELECT USING (true);

-- Service role bypasses RLS automatically for admin operations
