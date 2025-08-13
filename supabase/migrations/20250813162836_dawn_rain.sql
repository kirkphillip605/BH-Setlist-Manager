/*
  # Performance Session Management System

  1. Session Management Functions
    - Function to cleanup stale sessions automatically
    - Function to check leader activity status
    - Function to ensure only one active session per setlist

  2. Automatic Cleanup
    - Sessions older than 2 hours are automatically marked inactive
    - Participants in inactive sessions are marked inactive
    - Orphaned participants are cleaned up

  3. Constraints and Indexes
    - Unique constraint for one active session per setlist
    - Optimized indexes for real-time queries
    - Performance optimizations for session lookups
*/

-- Function to cleanup stale performance sessions
CREATE OR REPLACE FUNCTION cleanup_stale_performance_sessions()
RETURNS void AS $$
BEGIN
  -- Mark sessions as inactive if they're older than 2 hours
  UPDATE performance_sessions 
  SET is_active = false
  WHERE is_active = true 
  AND created_at < now() - interval '2 hours';
  
  -- Clean up participants from inactive sessions
  UPDATE session_participants 
  SET is_active = false
  WHERE session_id IN (
    SELECT id FROM performance_sessions 
    WHERE is_active = false
  ) AND is_active = true;
  
  -- Clean up expired leadership requests
  UPDATE leadership_requests
  SET status = 'expired'
  WHERE status = 'pending' 
  AND expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a leader is still active
CREATE OR REPLACE FUNCTION is_leader_active(leader_uuid uuid, session_uuid uuid)
RETURNS boolean AS $$
DECLARE
  participant_activity timestamptz;
  session_age interval;
BEGIN
  -- Check if leader is in session participants
  SELECT joined_at INTO participant_activity
  FROM session_participants
  WHERE session_id = session_uuid 
  AND user_id = leader_uuid 
  AND is_active = true;
  
  -- If leader is in participants, check recent activity (within 10 minutes)
  IF participant_activity IS NOT NULL THEN
    RETURN participant_activity > now() - interval '10 minutes';
  END IF;
  
  -- If leader is not in participants, check session age
  SELECT now() - created_at INTO session_age
  FROM performance_sessions
  WHERE id = session_uuid;
  
  -- Consider leader active if session is less than 10 minutes old
  RETURN session_age < interval '10 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to ensure only one active session per setlist
CREATE OR REPLACE FUNCTION ensure_single_active_session(setlist_uuid uuid, new_leader_uuid uuid)
RETURNS uuid AS $$
DECLARE
  existing_session_id uuid;
  existing_leader_id uuid;
  leader_is_active boolean;
BEGIN
  -- Find existing active session for this setlist
  SELECT id, leader_id INTO existing_session_id, existing_leader_id
  FROM performance_sessions
  WHERE setlist_id = setlist_uuid AND is_active = true
  LIMIT 1;
  
  IF existing_session_id IS NOT NULL THEN
    -- Check if existing leader is still active
    SELECT is_leader_active(existing_leader_id, existing_session_id) INTO leader_is_active;
    
    IF NOT leader_is_active OR existing_leader_id = new_leader_uuid THEN
      -- Leader is inactive or same user, can reuse/update session
      UPDATE performance_sessions
      SET leader_id = new_leader_uuid,
          created_at = now()
      WHERE id = existing_session_id;
      
      RETURN existing_session_id;
    ELSE
      -- Active leader exists, return existing session
      RETURN existing_session_id;
    END IF;
  END IF;
  
  -- No existing session, can create new one
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_performance_sessions_setlist_active 
ON performance_sessions(setlist_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_session_participants_session_active 
ON session_participants(session_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_leadership_requests_session_pending 
ON leadership_requests(session_id, status) WHERE status = 'pending';

-- Create unique constraint to ensure only one active session per setlist
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_session_per_setlist 
ON performance_sessions(setlist_id) 
WHERE is_active = true;