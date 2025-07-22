/*
  # Performance Mode Sessions

  1. New Tables
    - `performance_sessions`
      - `id` (uuid, primary key)
      - `setlist_id` (uuid, foreign key to setlists)
      - `leader_id` (uuid, foreign key to users)
      - `current_set_id` (uuid, foreign key to sets)
      - `current_song_id` (uuid, foreign key to songs)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `performance_sessions` table
    - Add policies for authenticated users to read active sessions
    - Add policies for leaders to manage their sessions

  3. Indexes
    - Index on setlist_id for quick lookups
    - Index on is_active for filtering active sessions
</*/

CREATE TABLE IF NOT EXISTS performance_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setlist_id uuid NOT NULL REFERENCES setlists(id) ON DELETE CASCADE,
  leader_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_set_id uuid REFERENCES sets(id) ON DELETE SET NULL,
  current_song_id uuid REFERENCES songs(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE performance_sessions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read active performance sessions"
  ON performance_sessions
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Leaders can manage their performance sessions"
  ON performance_sessions
  FOR ALL
  TO authenticated
  USING (leader_id = (SELECT auth.uid()));

-- Indexes
CREATE INDEX idx_performance_sessions_setlist ON performance_sessions(setlist_id);
CREATE INDEX idx_performance_sessions_active ON performance_sessions(is_active) WHERE is_active = true;
CREATE INDEX idx_performance_sessions_leader ON performance_sessions(leader_id);

-- Updated at trigger
CREATE TRIGGER performance_sessions_updated_at
  BEFORE UPDATE ON performance_sessions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();