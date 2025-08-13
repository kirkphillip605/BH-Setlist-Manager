/*
  # Create leadership_requests table

  1. New Tables
    - `leadership_requests`
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key to performance_sessions)
      - `requesting_user_id` (uuid, foreign key to users)
      - `requesting_user_name` (text, not null)
      - `status` (text, default 'pending')
      - `expires_at` (timestamp, not null)
      - `responded_at` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `leadership_requests` table
    - Add policies for authenticated users to manage leadership requests
*/

CREATE TABLE IF NOT EXISTS leadership_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES performance_sessions(id) ON DELETE CASCADE,
  requesting_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requesting_user_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  expires_at timestamptz NOT NULL,
  responded_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE leadership_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own leadership requests"
  ON leadership_requests
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = requesting_user_id);

CREATE POLICY "Leaders can read leadership requests for their sessions"
  ON leadership_requests
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM performance_sessions 
    WHERE performance_sessions.id = leadership_requests.session_id 
    AND performance_sessions.leader_id = (select auth.uid())
  ));

CREATE POLICY "Authenticated users can insert leadership requests"
  ON leadership_requests
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = requesting_user_id);

CREATE POLICY "Leaders can update leadership requests for their sessions"
  ON leadership_requests
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM performance_sessions 
    WHERE performance_sessions.id = leadership_requests.session_id 
    AND performance_sessions.leader_id = (select auth.uid())
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leadership_requests_session_id ON leadership_requests(session_id);
CREATE INDEX IF NOT EXISTS idx_leadership_requests_requesting_user_id ON leadership_requests(requesting_user_id);
CREATE INDEX IF NOT EXISTS idx_leadership_requests_status ON leadership_requests(status);
CREATE INDEX IF NOT EXISTS idx_leadership_requests_expires_at ON leadership_requests(expires_at);