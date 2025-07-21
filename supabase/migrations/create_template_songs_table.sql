/*
  # Create template_songs table

  1. New Tables
    - `template_songs`
      - `template_id` (uuid, foreign key to set_templates, not null)
      - `song_id` (uuid, foreign key to songs, not null)
      - `position` (int, not null)
      - Primary Key: (template_id, song_id)
      - Unique Constraint: (template_id, position)
  2. Security
    - Enable RLS on `template_songs` table
    - Add policy for authenticated users to read all template songs
    - Add policy for authenticated users to create, update, and delete template songs
*/

CREATE TABLE IF NOT EXISTS template_songs (
  template_id uuid NOT NULL REFERENCES set_templates(id) ON DELETE CASCADE,
  song_id uuid NOT NULL REFERENCES songs(id) ON DELETE RESTRICT,
  position INT NOT NULL,
  PRIMARY KEY (template_id, song_id),
  CONSTRAINT uq_template_position UNIQUE (template_id, position)
);

ALTER TABLE template_songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read template songs"
  ON template_songs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage template songs"
  ON template_songs
  FOR ALL
  TO authenticated
  USING (true);
