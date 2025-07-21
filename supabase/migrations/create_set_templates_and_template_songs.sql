/*
  # Create set_templates and template_songs tables

  1. New Tables
    - `set_templates`
      - `template_id` (uuid, primary key, default gen_random_uuid())
      - `name` (text, unique, not null) - Name of the template (e.g., "Sunday Service", "Acoustic Gig")
      - `description` (text) - Optional description
      - `created_at` (timestamptz, default now())
      - `user_id` (uuid, references auth.users(id)) - Foreign key to auth.users for RLS
    - `template_songs`
      - `template_song_id` (uuid, primary key, default gen_random_uuid())
      - `template_id` (uuid, not null, references set_templates(template_id))
      - `song_id` (uuid, not null, references songs(song_id))
      - `position` (integer, not null) - Order of the song within the template
      - `notes` (text) - Specific notes for this song in this template (e.g., "Key of G", "Shortened bridge")
      - `created_at` (timestamptz, default now())
  2. Constraints
    - `set_templates`: Unique constraint on `name`.
    - `template_songs`:
      - Unique constraint on `(template_id, song_id)` to prevent a song from appearing twice in the same template.
      - Unique constraint on `(template_id, position)` to ensure unique ordering within a template.
  3. Security
    - Enable RLS on `set_templates` table
    - Add policies for authenticated users to manage their own `set_templates`
    - Enable RLS on `template_songs` table
    - Add policies for authenticated users to manage `template_songs` associated with their `set_templates`
*/

CREATE TABLE IF NOT EXISTS set_templates (
  template_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE set_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view their own set templates."
  ON set_templates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create set templates."
  ON set_templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own set templates."
  ON set_templates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own set templates."
  ON set_templates FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


CREATE TABLE IF NOT EXISTS template_songs (
  template_song_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES set_templates(template_id) ON DELETE CASCADE,
  song_id uuid NOT NULL REFERENCES songs(song_id) ON DELETE CASCADE,
  position integer NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_template_song UNIQUE (template_id, song_id),
  CONSTRAINT unique_template_position UNIQUE (template_id, position)
);

ALTER TABLE template_songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view songs in their own templates."
  ON template_songs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM set_templates
      WHERE set_templates.template_id = template_songs.template_id
      AND set_templates.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can add songs to their own templates."
  ON template_songs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM set_templates
      WHERE set_templates.template_id = template_songs.template_id
      AND set_templates.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can update songs in their own templates."
  ON template_songs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM set_templates
      WHERE set_templates.template_id = template_songs.template_id
      AND set_templates.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM set_templates
      WHERE set_templates.template_id = template_songs.template_id
      AND set_templates.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can delete songs from their own templates."
  ON template_songs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM set_templates
      WHERE set_templates.template_id = template_songs.template_id
      AND set_templates.user_id = auth.uid()
    )
  );