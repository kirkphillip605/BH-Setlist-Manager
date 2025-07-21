/*
  # Create setlist_songs junction table

  1. New Tables
    - `setlist_songs`
      - `setlist_id` (uuid, foreign key to setlists)
      - `song_id` (uuid, foreign key to songs)
      - `song_order` (integer, default 0)
      - Primary key: (setlist_id, song_id)

  2. Security
    - Enable RLS on `setlist_songs` table
    - Add policies based on setlist ownership
*/

CREATE TABLE IF NOT EXISTS setlist_songs (
  setlist_id uuid NOT NULL REFERENCES setlists(id) ON DELETE CASCADE,
  song_id uuid NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  song_order integer NOT NULL DEFAULT 0,
  CONSTRAINT setlist_songs_pkey PRIMARY KEY (setlist_id, song_id)
);

ALTER TABLE setlist_songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own setlist songs"
  ON setlist_songs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM setlists
      WHERE setlists.id = setlist_songs.setlist_id
      AND setlists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own setlist songs"
  ON setlist_songs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM setlists
      WHERE setlists.id = setlist_songs.setlist_id
      AND setlists.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_setlist_songs_setlist_id ON setlist_songs(setlist_id);
CREATE INDEX IF NOT EXISTS idx_setlist_songs_song_id ON setlist_songs(song_id);
CREATE INDEX IF NOT EXISTS idx_setlist_songs_order ON setlist_songs(setlist_id, song_order);