/*
  # Add public visibility and improve permissions

  1. Database Changes
    - Add `is_public` fields to setlists and song_collections tables
    - Update RLS policies to allow reading public content
    - Add indexes for public content queries

  2. Security Updates
    - Allow all authenticated users to read public setlists and collections
    - Maintain existing write permissions (owners only)
*/

-- Add is_public fields
ALTER TABLE setlists ADD COLUMN is_public boolean DEFAULT false;
ALTER TABLE song_collections ADD COLUMN is_public boolean DEFAULT false;

-- Add indexes for public content queries
CREATE INDEX idx_setlists_public ON setlists (is_public) WHERE is_public = true;
CREATE INDEX idx_song_collections_public ON song_collections (is_public) WHERE is_public = true;

-- Update RLS policies for setlists to allow reading public content
DROP POLICY IF EXISTS "Users can read their own setlists" ON setlists;
CREATE POLICY "Users can read own and public setlists"
  ON setlists
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_public = true);

-- Update RLS policies for song_collections to allow reading public content
DROP POLICY IF EXISTS "Users can read their own song collections" ON song_collections;
CREATE POLICY "Users can read own and public collections"
  ON song_collections
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_public = true);

-- Allow reading public collection songs
CREATE POLICY "Users can read public collection songs"
  ON song_collection_songs
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM song_collections
    WHERE song_collections.id = song_collection_songs.song_collection_id
    AND (song_collections.user_id = auth.uid() OR song_collections.is_public = true)
  ));

-- Allow reading public setlist sets
CREATE POLICY "Users can read public setlist sets"
  ON sets
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM setlists
    WHERE setlists.id = sets.setlist_id
    AND (setlists.user_id = auth.uid() OR setlists.is_public = true)
  ));

-- Allow reading public set songs
CREATE POLICY "Users can read public set songs"
  ON set_songs
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sets
    JOIN setlists ON setlists.id = sets.setlist_id
    WHERE sets.id = set_songs.set_id
    AND (setlists.user_id = auth.uid() OR setlists.is_public = true)
  ));