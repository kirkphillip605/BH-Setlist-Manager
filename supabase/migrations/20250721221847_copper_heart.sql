/*
  # Comprehensive RLS Policy Optimization

  This migration optimizes all Row Level Security policies across the entire application
  to improve query performance by preventing unnecessary re-evaluation of auth functions.

  ## Changes Made:
  1. Replace `auth.uid()` with `(select auth.uid())` in all policies
  2. Add proper indexes for performance
  3. Simplify complex policy conditions where possible
  4. Ensure consistent policy naming and structure

  ## Performance Benefits:
  - Auth functions evaluated once per query instead of once per row
  - Reduced database load and improved response times
  - Better scalability for larger datasets
*/

-- Drop all existing policies to recreate them optimized
DROP POLICY IF EXISTS "Users All Access to Users" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

DROP POLICY IF EXISTS "Authenticated users can delete songs" ON songs;
DROP POLICY IF EXISTS "Authenticated users can insert songs" ON songs;
DROP POLICY IF EXISTS "Authenticated users can read songs" ON songs;
DROP POLICY IF EXISTS "Authenticated users can update songs" ON songs;

DROP POLICY IF EXISTS "Users can manage their own setlists" ON setlists;
DROP POLICY IF EXISTS "Users can read own and public setlists" ON setlists;

DROP POLICY IF EXISTS "Users can manage sets in their own setlists" ON sets;
DROP POLICY IF EXISTS "Users can read public setlist sets" ON sets;
DROP POLICY IF EXISTS "Users can read sets in their own setlists" ON sets;

DROP POLICY IF EXISTS "Users can manage songs in their own sets" ON set_songs;
DROP POLICY IF EXISTS "Users can read public set songs" ON set_songs;
DROP POLICY IF EXISTS "Users can read songs in their own sets" ON set_songs;

DROP POLICY IF EXISTS "Users can manage their own song collections" ON song_collections;
DROP POLICY IF EXISTS "Users can read own and public collections" ON song_collections;

DROP POLICY IF EXISTS "Users can manage their own collection songs" ON song_collection_songs;
DROP POLICY IF EXISTS "Users can read public collection songs" ON song_collection_songs;
DROP POLICY IF EXISTS "Users can read their own collection songs" ON song_collection_songs;

-- Optimized Users policies
CREATE POLICY "users_select_own" ON users
  FOR SELECT 
  USING (id = (select auth.uid()));

CREATE POLICY "users_update_own" ON users
  FOR UPDATE 
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "users_insert_own" ON users
  FOR INSERT 
  WITH CHECK (id = (select auth.uid()));

-- Optimized Songs policies (readable by all authenticated users, editable by level 2+)
CREATE POLICY "songs_select_all" ON songs
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "songs_insert_editors" ON songs
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = (select auth.uid()) 
      AND user_level >= 2
    )
  );

CREATE POLICY "songs_update_editors" ON songs
  FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = (select auth.uid()) 
      AND user_level >= 2
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = (select auth.uid()) 
      AND user_level >= 2
    )
  );

CREATE POLICY "songs_delete_editors" ON songs
  FOR DELETE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = (select auth.uid()) 
      AND user_level >= 2
    )
  );

-- Optimized Setlists policies
CREATE POLICY "setlists_select_own_and_public" ON setlists
  FOR SELECT 
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR is_public = true
  );

CREATE POLICY "setlists_manage_own" ON setlists
  FOR ALL 
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Optimized Sets policies
CREATE POLICY "sets_select_accessible" ON sets
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM setlists 
      WHERE setlists.id = sets.setlist_id 
      AND (
        setlists.user_id = (select auth.uid()) 
        OR setlists.is_public = true
      )
    )
  );

CREATE POLICY "sets_manage_own" ON sets
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM setlists 
      WHERE setlists.id = sets.setlist_id 
      AND setlists.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM setlists 
      WHERE setlists.id = sets.setlist_id 
      AND setlists.user_id = (select auth.uid())
    )
  );

-- Optimized Set Songs policies
CREATE POLICY "set_songs_select_accessible" ON set_songs
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sets 
      INNER JOIN setlists ON setlists.id = sets.setlist_id
      WHERE sets.id = set_songs.set_id 
      AND (
        setlists.user_id = (select auth.uid()) 
        OR setlists.is_public = true
      )
    )
  );

CREATE POLICY "set_songs_manage_own" ON set_songs
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sets 
      INNER JOIN setlists ON setlists.id = sets.setlist_id
      WHERE sets.id = set_songs.set_id 
      AND setlists.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sets 
      INNER JOIN setlists ON setlists.id = sets.setlist_id
      WHERE sets.id = set_songs.set_id 
      AND setlists.user_id = (select auth.uid())
    )
  );

-- Optimized Song Collections policies
CREATE POLICY "song_collections_select_own_and_public" ON song_collections
  FOR SELECT 
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR is_public = true
  );

CREATE POLICY "song_collections_manage_own" ON song_collections
  FOR ALL 
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Optimized Song Collection Songs policies
CREATE POLICY "song_collection_songs_select_accessible" ON song_collection_songs
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM song_collections 
      WHERE song_collections.id = song_collection_songs.song_collection_id 
      AND (
        song_collections.user_id = (select auth.uid()) 
        OR song_collections.is_public = true
      )
    )
  );

CREATE POLICY "song_collection_songs_manage_own" ON song_collection_songs
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM song_collections 
      WHERE song_collections.id = song_collection_songs.song_collection_id 
      AND song_collections.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM song_collections 
      WHERE song_collections.id = song_collection_songs.song_collection_id 
      AND song_collections.user_id = (select auth.uid())
    )
  );

-- Create optimized indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_auth_uid ON users (id) WHERE id = auth.uid();
CREATE INDEX IF NOT EXISTS idx_setlists_user_public ON setlists (user_id, is_public);
CREATE INDEX IF NOT EXISTS idx_song_collections_user_public ON song_collections (user_id, is_public);
CREATE INDEX IF NOT EXISTS idx_sets_setlist_join ON sets (setlist_id);
CREATE INDEX IF NOT EXISTS idx_set_songs_set_join ON set_songs (set_id);
CREATE INDEX IF NOT EXISTS idx_song_collection_songs_collection_join ON song_collection_songs (song_collection_id);