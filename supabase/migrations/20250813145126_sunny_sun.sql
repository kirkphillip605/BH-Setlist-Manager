/*
  # Create performance_sessions table

  1. New Tables
    - `performance_sessions`
      - `id` (uuid, primary key)
      - `setlist_id` (uuid, foreign key to setlists)
      - `leader_id` (uuid, foreign key to users)
      - `current_set_id` (uuid, foreign key to sets)
      - `current_song_id` (uuid, foreign key to songs)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `performance_sessions` table
    - Add policies for authenticated users to manage performance sessions
*/

CREATE TABLE IF NOT EXISTS performance_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setlist_id uuid NOT NULL REFERENCES setlists(id) ON DELETE CASCADE,
  leader_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_set_id uuid REFERENCES sets(id) ON DELETE SET NULL,
  current_song_id uuid REFERENCES songs(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE performance_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read performance sessions for setlists they can access"
  ON performance_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM setlists
      WHERE setlists.id = performance_sessions.setlist_id
      AND (setlists.user_id = (select auth.uid()) OR setlists.is_public = true)
    )
  );

CREATE POLICY "Leaders can manage their own performance sessions"
  ON performance_sessions
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = leader_id);

CREATE POLICY "Authenticated users can create performance sessions"
  ON performance_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = leader_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_performance_sessions_setlist_id ON performance_sessions(setlist_id);
CREATE INDEX IF NOT EXISTS idx_performance_sessions_leader_id ON performance_sessions(leader_id);
CREATE INDEX IF NOT EXISTS idx_performance_sessions_active ON performance_sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_performance_sessions_current_set ON performance_sessions(current_set_id);
CREATE INDEX IF NOT EXISTS idx_performance_sessions_current_song ON performance_sessions(current_song_id);