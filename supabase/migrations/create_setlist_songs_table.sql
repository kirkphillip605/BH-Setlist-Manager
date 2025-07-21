/*
  # Create setlist_songs table

  1. New Tables
    - `setlist_songs`
      - `setlist_id` (uuid, foreign key to setlists, not null)
      - `song_id` (uuid, foreign key to songs, not null)
      - Primary Key: (setlist_id, song_id)
  2. Security
    - Enable RLS on `setlist_songs` table
    - Add policy for authenticated users to read all setlist songs
    - Add policy for authenticated users to create and delete setlist songs
*/

CREATE TABLE IF NOT EXISTS setlist_songs (
  setlist_id uuid NOT NULL REFERENCES setlists(id) ON DELETE CASCADE,
  song_id uuid NOT NULL REFERENCES songs(id) ON DELETE RESTRICT,
  PRIMARY KEY (setlist_id, song_id)
);

ALTER TABLE setlist_songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read setlist songs"
  ON setlist_songs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage setlist songs"
  ON setlist_songs
  FOR ALL
  TO authenticated
  USING (true);
