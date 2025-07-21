/*
  # Create songs table

  1. New Tables
    - `songs`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `original_artist` (varchar(255), not null)
      - `title` (varchar(255), not null)
      - `key_signature` (varchar(16), optional)
      - `lyrics` (text, not null)
  2. Security
    - Enable RLS on `songs` table
    - Add policy for authenticated users to read all songs
    - Add policy for authenticated users to create, update, and delete songs
*/

CREATE TABLE IF NOT EXISTS songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_artist VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  key_signature VARCHAR(16),
  lyrics TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read songs"
  ON songs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage songs"
  ON songs
  FOR ALL
  TO authenticated
  USING (true);
