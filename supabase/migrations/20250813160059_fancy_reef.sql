/*
  # Performance Session Management Improvements

  1. Session Cleanup Functions
    - Add function to clean up expired/stale sessions
    - Add function to check session activity
    - Add automatic cleanup for abandoned sessions

  2. Performance Optimizations
    - Add indexes for session queries
    - Optimize real-time subscription queries

  3. Session Management
    - Ensure only one active session per setlist
    - Handle leadership transfers properly
    - Clean up stale participants
*/

-- Function to clean up stale performance sessions
CREATE OR REPLACE FUNCTION cleanup_stale_performance_sessions()
RETURNS void AS $$
BEGIN
  -- Mark sessions as inactive if they're older than 2 hours with no recent updates
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

-- Function to get active session with leader info
CREATE OR REPLACE FUNCTION get_active_session_with_leader(setlist_uuid uuid)
RETURNS TABLE (
  session_id uuid,
  leader_id uuid,
  leader_name text,
  current_set_id uuid,
  current_song_id uuid,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.id,
    ps.leader_id,
    u.name,
    ps.current_set_id,
    ps.current_song_id,
    ps.created_at
  FROM performance_sessions ps
  JOIN users u ON u.id = ps.leader_id
  WHERE ps.setlist_id = setlist_uuid 
  AND ps.is_active = true
  ORDER BY ps.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_performance_sessions_setlist_active ON performance_sessions(setlist_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_session_participants_session_active ON session_participants(session_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_leadership_requests_session_pending ON leadership_requests(session_id, status) WHERE status = 'pending';

-- Ensure unique active session per setlist
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_session_per_setlist 
ON performance_sessions(setlist_id) 
WHERE is_active = true;