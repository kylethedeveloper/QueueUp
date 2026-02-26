-- Add cooldown_minutes and timezone to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS cooldown_minutes INT DEFAULT 30;
ALTER TABLE events ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York';

-- Update the create_reservation function to check for duplicate reservations
CREATE OR REPLACE FUNCTION create_reservation(
  p_timeslot_id UUID,
  p_user_name TEXT,
  p_user_email TEXT
) RETURNS SETOF reservations AS $$
DECLARE
  v_current_count INT;
  v_max INT;
  v_event_id UUID;
  v_cooldown INT;
  v_recent_count INT;
BEGIN
  -- Lock the timeslot row to prevent race conditions
  SELECT max_reservations, event_id INTO v_max, v_event_id
  FROM timeslots WHERE id = p_timeslot_id FOR UPDATE;
  
  IF v_max IS NULL THEN
    RAISE EXCEPTION 'Timeslot not found';
  END IF;
  
  -- Check cooldown: same email + same event within cooldown window
  SELECT COALESCE(e.cooldown_minutes, 30) INTO v_cooldown
  FROM events e WHERE e.id = v_event_id;

  SELECT COUNT(*) INTO v_recent_count
  FROM reservations r
  JOIN timeslots t ON t.id = r.timeslot_id
  WHERE t.event_id = v_event_id
    AND r.user_email = p_user_email
    AND r.status = 'confirmed'
    AND r.created_at > now() - (v_cooldown || ' minutes')::interval;

  IF v_recent_count > 0 THEN
    RAISE EXCEPTION 'You already have a reservation for this event. Please wait % minutes before making another.', v_cooldown;
  END IF;
  
  -- Check capacity
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
