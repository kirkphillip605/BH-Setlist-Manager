/*
  # Restructure Setlist Model: Setlists → Sets → Songs with Song Collections

  1. New Tables
    - `sets` - Individual sets within setlists
      - `id` (uuid, primary key)
      - `setlist_id` (uuid, foreign key to setlists)
      - `name` (text)
      - `set_order` (integer)
      - `created_at` (timestamp)
    - `set_songs` - Songs within sets
      - `set_id` (uuid, foreign key to sets)
      - `song_id` (uuid, foreign key to songs)  
      - `song_order` (integer)

  2. Renamed Tables
    - `set_templates` → `song_collections`
    - `set_template_songs` → `song_collection_songs`

  3. Data Migration
    - Create default sets for existing setlists
    - Migrate setlist_songs to set_songs

  4. Security
    - Enable RLS on new tables
    - Add appropriate policies
*/

-- Step 1: Rename set_templates to song_collections
ALTER TABLE set_templates RENAME TO song_collections;
ALTER TABLE set_template_songs RENAME TO song_collection_songs;

-- Update foreign key constraint names
ALTER TABLE song_collection_songs DROP CONSTRAINT set_template_songs_set_template_id_fkey;
ALTER TABLE song_collection_songs DROP CONSTRAINT set_template_songs_song_id_fkey;
ALTER TABLE song_collection_songs RENAME COLUMN set_template_id TO song_collection_id;

ALTER TABLE song_collection_songs 
ADD CONSTRAINT song_collection_songs_song_collection_id_fkey 
FOREIGN KEY (song_collection_id) REFERENCES song_collections(id) ON DELETE CASCADE;

ALTER TABLE song_collection_songs 
ADD CONSTRAINT song_collection_songs_song_id_fkey 
FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE;

-- Update constraint and index names
ALTER TABLE song_collection_songs DROP CONSTRAINT set_template_songs_pkey;
ALTER TABLE song_collection_songs ADD CONSTRAINT song_collection_songs_pkey PRIMARY KEY (song_collection_id, song_id);

DROP INDEX IF EXISTS idx_set_template_songs_template_id;
DROP INDEX IF EXISTS idx_set_template_songs_song_id;
DROP INDEX IF EXISTS idx_set_template_songs_order;

CREATE INDEX idx_song_collection_songs_collection_id ON song_collection_songs(song_collection_id);
CREATE INDEX idx_song_collection_songs_song_id ON song_collection_songs(song_id);
CREATE INDEX idx_song_collection_songs_order ON song_collection_songs(song_collection_id, song_order);

-- Update RLS policies for song_collections
DROP POLICY IF EXISTS "Users can manage their own set templates" ON song_collections;
DROP POLICY IF EXISTS "Users can read their own set templates" ON song_collections;

CREATE POLICY "Users can manage their own song collections"
  ON song_collections
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read their own song collections"
  ON song_collections
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Update RLS policies for song_collection_songs
DROP POLICY IF EXISTS "Users can manage their own template songs" ON song_collection_songs;
DROP POLICY IF EXISTS "Users can read their own template songs" ON song_collection_songs;

CREATE POLICY "Users can manage their own collection songs"
  ON song_collection_songs
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM song_collections 
    WHERE song_collections.id = song_collection_songs.song_collection_id 
    AND song_collections.user_id = auth.uid()
  ));

CREATE POLICY "Users can read their own collection songs"
  ON song_collection_songs
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM song_collections 
    WHERE song_collections.id = song_collection_songs.song_collection_id 
    AND song_collections.user_id = auth.uid()
  ));

-- Step 2: Create sets table
CREATE TABLE IF NOT EXISTS sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setlist_id uuid NOT NULL REFERENCES setlists(id) ON DELETE CASCADE,
  name text NOT NULL,
  set_order integer DEFAULT 1 NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for sets
CREATE INDEX idx_sets_setlist_id ON sets(setlist_id);
CREATE INDEX idx_sets_order ON sets(setlist_id, set_order);

-- Enable RLS for sets
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage sets in their own setlists"
  ON sets
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM setlists 
    WHERE setlists.id = sets.setlist_id 
    AND setlists.user_id = auth.uid()
  ));

CREATE POLICY "Users can read sets in their own setlists"
  ON sets
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM setlists 
    WHERE setlists.id = sets.setlist_id 
    AND setlists.user_id = auth.uid()
  ));

-- Step 3: Create set_songs table
CREATE TABLE IF NOT EXISTS set_songs (
  set_id uuid NOT NULL REFERENCES sets(id) ON DELETE CASCADE,
  song_id uuid NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  song_order integer DEFAULT 1 NOT NULL,
  PRIMARY KEY (set_id, song_id)
);

-- Create indexes for set_songs
CREATE INDEX idx_set_songs_set_id ON set_songs(set_id);
CREATE INDEX idx_set_songs_song_id ON set_songs(song_id);
CREATE INDEX idx_set_songs_order ON set_songs(set_id, song_order);

-- Enable RLS for set_songs
ALTER TABLE set_songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage songs in their own sets"
  ON set_songs
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sets 
    JOIN setlists ON setlists.id = sets.setlist_id
    WHERE sets.id = set_songs.set_id 
    AND setlists.user_id = auth.uid()
  ));

CREATE POLICY "Users can read songs in their own sets"
  ON set_songs
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sets 
    JOIN setlists ON setlists.id = sets.setlist_id
    WHERE sets.id = set_songs.set_id 
    AND setlists.user_id = auth.uid()
  ));

-- Step 4: Migrate existing data
-- For each existing setlist that has songs, create a default set and migrate the songs
DO $$
DECLARE
    setlist_record RECORD;
    new_set_id uuid;
BEGIN
    -- Loop through setlists that have songs
    FOR setlist_record IN 
        SELECT DISTINCT s.id, s.name, s.user_id
        FROM setlists s
        INNER JOIN setlist_songs ss ON s.id = ss.setlist_id
    LOOP
        -- Create a default set for this setlist
        INSERT INTO sets (setlist_id, name, set_order)
        VALUES (setlist_record.id, 'Set 1', 1)
        RETURNING id INTO new_set_id;
        
        -- Migrate songs from setlist_songs to set_songs
        INSERT INTO set_songs (set_id, song_id, song_order)
        SELECT new_set_id, song_id, song_order
        FROM setlist_songs
        WHERE setlist_id = setlist_record.id;
    END LOOP;
END $$;

-- Step 5: Drop old setlist_songs table
DROP TABLE IF EXISTS setlist_songs;