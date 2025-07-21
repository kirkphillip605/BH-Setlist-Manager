/*
  # Create setlist_section_songs table

  1. New Tables
    - `setlist_section_songs`
      - `setlist_section_id` (uuid, foreign key to setlist_sections, not null)
      - `song_id` (uuid, foreign key to songs, not null)
      - `position` (int, not null) - Order of song within the section
      - Primary Key: (setlist_section_id, song_id)
      - Unique Constraint: (setlist_section_id, position)
  2. Security
    - Enable RLS on `setlist_section_songs` table
    - Add policy for authenticated users to read all setlist section songs
    - Add policy for authenticated users to create, update, and delete setlist section songs
*/

CREATE TABLE IF NOT EXISTS setlist_section_songs (
  setlist_section_id uuid NOT NULL REFERENCES setlist_sections(id) ON DELETE CASCADE,
  song_id uuid NOT NULL REFERENCES songs(song_id) ON DELETE RESTRICT,
  position INT NOT NULL,
  PRIMARY KEY (setlist_section_id, song_id),
  CONSTRAINT uq_setlist_section_song_position UNIQUE (setlist_section_id, position)
);

ALTER TABLE setlist_section_songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read setlist section songs"
  ON setlist_section_songs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage setlist section songs"
  ON setlist_section_songs
  FOR ALL
  TO authenticated
  USING (true);