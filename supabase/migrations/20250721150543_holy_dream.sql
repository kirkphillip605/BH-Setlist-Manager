/*
  # Create set_template_songs junction table

  1. New Tables
    - `set_template_songs`
      - `set_template_id` (uuid, foreign key to set_templates)
      - `song_id` (uuid, foreign key to songs)
      - `song_order` (integer, default 0)
      - Primary key: (set_template_id, song_id)

  2. Security
    - Enable RLS on `set_template_songs` table
    - Add policies based on set template ownership
*/

CREATE TABLE IF NOT EXISTS set_template_songs (
  set_template_id uuid NOT NULL REFERENCES set_templates(id) ON DELETE CASCADE,
  song_id uuid NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  song_order integer NOT NULL DEFAULT 0,
  CONSTRAINT set_template_songs_pkey PRIMARY KEY (set_template_id, song_id)
);

ALTER TABLE set_template_songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own template songs"
  ON set_template_songs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM set_templates
      WHERE set_templates.id = set_template_songs.set_template_id
      AND set_templates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own template songs"
  ON set_template_songs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM set_templates
      WHERE set_templates.id = set_template_songs.set_template_id
      AND set_templates.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_set_template_songs_template_id ON set_template_songs(set_template_id);
CREATE INDEX IF NOT EXISTS idx_set_template_songs_song_id ON set_template_songs(song_id);
CREATE INDEX IF NOT EXISTS idx_set_template_songs_order ON set_template_songs(set_template_id, song_order);