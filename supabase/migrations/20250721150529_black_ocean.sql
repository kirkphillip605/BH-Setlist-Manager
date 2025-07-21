/*
  # Create songs table

  1. New Tables
    - `songs`
      - `id` (uuid, primary key)
      - `original_artist` (varchar, not null)
      - `title` (varchar, not null)
      - `key_signature` (varchar, optional)
      - `lyrics` (text, not null)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `songs` table
    - Add policies for authenticated users to manage songs
*/

CREATE TABLE IF NOT EXISTS songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_artist character varying(255) NOT NULL,
  title character varying(255) NOT NULL,
  key_signature character varying(16) DEFAULT '',
  lyrics text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read songs"
  ON songs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert songs"
  ON songs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update songs"
  ON songs
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete songs"
  ON songs
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(original_artist);
CREATE INDEX IF NOT EXISTS idx_songs_title ON songs(title);
CREATE INDEX IF NOT EXISTS idx_songs_artist_title ON songs(original_artist, title);