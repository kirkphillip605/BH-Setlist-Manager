/*
  # Optimize RLS Policies for Performance

  1. Performance Optimization
    - Replace `auth.uid()` with `(select auth.uid())` in RLS policies
    - This prevents re-evaluation of the function for each row
    - Significantly improves query performance at scale

  2. Updated Policies
    - Optimizes all existing RLS policies across all tables
    - Maintains same security model while improving performance
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

DROP POLICY IF EXISTS "Authenticated users can read songs" ON songs;
DROP POLICY IF EXISTS "Authenticated users can insert songs" ON songs;
DROP POLICY IF EXISTS "Authenticated users can update songs" ON songs;
DROP POLICY IF EXISTS "Authenticated users can delete songs" ON songs;

DROP POLICY IF EXISTS "Users can manage their own setlists" ON setlists;
DROP POLICY IF EXISTS "Users can read own and public setlists" ON setlists;

DROP POLICY IF EXISTS "Users can manage their own song collections" ON song_collections;
DROP POLICY IF EXISTS "Users can read own and public collections" ON song_collections;

DROP POLICY IF EXISTS "Users can manage sets in their own setlists" ON sets;
DROP POLICY IF EXISTS "Users can read sets in their own setlists" ON sets;
DROP POLICY IF EXISTS "Users can read public setlist sets" ON sets;

DROP POLICY IF EXISTS "Users can manage songs in their own sets" ON set_songs;
DROP POLICY IF EXISTS "Users can read songs in their own sets" ON set_songs;
DROP POLICY IF EXISTS "Users can read public set songs" ON set_songs;

DROP POLICY IF EXISTS "Users can manage their own collection songs" ON song_collection_songs;
DROP POLICY IF EXISTS "Users can read their own collection songs" ON song_collection_songs;
DROP POLICY IF EXISTS "Users can read public collection songs" ON song_collection_songs;

-- Create optimized policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id);

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

CREATE POLICY "Users can manage their own setlists"
  ON setlists
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can read own and public setlists"
  ON setlists
  FOR SELECT
  TO authenticated
  USING (((select auth.uid()) = user_id) OR (is_public = true));

CREATE POLICY "Users can manage their own song collections"
  ON song_collections
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can read own and public collections"
  ON song_collections
  FOR SELECT
  TO authenticated
  USING (((select auth.uid()) = user_id) OR (is_public = true));

CREATE POLICY "Users can manage sets in their own setlists"
  ON sets
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM setlists
    WHERE setlists.id = sets.setlist_id
    AND setlists.user_id = (select auth.uid())
  ));

CREATE POLICY "Users can read sets in their own setlists"
  ON sets
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM setlists
    WHERE setlists.id = sets.setlist_id
    AND setlists.user_id = (select auth.uid())
  ));

CREATE POLICY "Users can read public setlist sets"
  ON sets
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM setlists
    WHERE setlists.id = sets.setlist_id
    AND ((setlists.user_id = (select auth.uid())) OR (setlists.is_public = true))
  ));

CREATE POLICY "Users can manage songs in their own sets"
  ON set_songs
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sets
    JOIN setlists ON setlists.id = sets.setlist_id
    WHERE sets.id = set_songs.set_id
    AND setlists.user_id = (select auth.uid())
  ));

CREATE POLICY "Users can read songs in their own sets"
  ON set_songs
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sets
    JOIN setlists ON setlists.id = sets.setlist_id
    WHERE sets.id = set_songs.set_id
    AND setlists.user_id = (select auth.uid())
  ));

CREATE POLICY "Users can read public set songs"
  ON set_songs
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sets
    JOIN setlists ON setlists.id = sets.setlist_id
    WHERE sets.id = set_songs.set_id
    AND ((setlists.user_id = (select auth.uid())) OR (setlists.is_public = true))
  ));

CREATE POLICY "Users can manage their own collection songs"
  ON song_collection_songs
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM song_collections
    WHERE song_collections.id = song_collection_songs.song_collection_id
    AND song_collections.user_id = (select auth.uid())
  ));

CREATE POLICY "Users can read their own collection songs"
  ON song_collection_songs
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM song_collections
    WHERE song_collections.id = song_collection_songs.song_collection_id
    AND song_collections.user_id = (select auth.uid())
  ));

CREATE POLICY "Users can read public collection songs"
  ON song_collection_songs
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM song_collections
    WHERE song_collections.id = song_collection_songs.song_collection_id
    AND ((song_collections.user_id = (select auth.uid())) OR (song_collections.is_public = true))
  ));