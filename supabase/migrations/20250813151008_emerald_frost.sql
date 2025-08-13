/*
  # Create session_participants table for tracking followers

  1. New Tables
    - `session_participants`
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key to performance_sessions)
      - `user_id` (uuid, foreign key to users)
      - `joined_at` (timestamp)
      - `is_active` (boolean, default true)

  2. Security
    - Enable RLS on `session_participants` table
    - Add policies for authenticated users to manage session participation
*/

CREATE TABLE IF NOT EXISTS session_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES performance_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  UNIQUE(session_id, user_id)
);

ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read participants for sessions they can access"
  ON session_participants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM performance_sessions ps
      JOIN setlists s ON s.id = ps.setlist_id
      WHERE ps.id = session_participants.session_id
      AND (s.user_id = (select auth.uid()) OR s.is_public = true OR ps.leader_id = (select auth.uid()))
    )
    OR (select auth.uid()) = user_id
  );

CREATE POLICY "Users can manage their own participation"
  ON session_participants
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Leaders can manage participants in their sessions"
  ON session_participants
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM performance_sessions 
    WHERE performance_sessions.id = session_participants.session_id 
    AND performance_sessions.leader_id = (select auth.uid())
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_session_participants_session_id ON session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_user_id ON session_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_active ON session_participants(is_active) WHERE is_active = true;