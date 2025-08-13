/*
  # Update session_participants table with user name for notifications

  1. Performance Enhancement
    - Add index for better participant queries
    - Ensure proper cleanup of inactive participants

  2. Real-time Updates
    - Optimize queries for real-time participant tracking
    - Add participant join/leave event handling
*/

-- Add index for faster participant queries
CREATE INDEX IF NOT EXISTS idx_session_participants_session_active ON session_participants(session_id, is_active) WHERE is_active = true;

-- Function to auto-cleanup expired leadership requests
CREATE OR REPLACE FUNCTION cleanup_expired_leadership_requests()
RETURNS void AS $$
BEGIN
  -- Mark expired pending requests as expired
  UPDATE leadership_requests
  SET status = 'expired'
  WHERE status = 'pending' 
  AND expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to handle session cleanup
CREATE OR REPLACE FUNCTION cleanup_inactive_sessions()
RETURNS void AS $$
BEGIN
  -- Clean up participants from inactive sessions
  UPDATE session_participants 
  SET is_active = false
  WHERE session_id IN (
    SELECT id FROM performance_sessions 
    WHERE is_active = false
  ) AND is_active = true;
  
  -- Clean up expired leadership requests
  PERFORM cleanup_expired_leadership_requests();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;