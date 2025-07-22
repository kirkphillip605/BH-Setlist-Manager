/*
  # Optimize RLS Policies for Performance

  This migration addresses Supabase performance warnings by:
  1. Consolidating multiple permissive policies into single optimized policies
  2. Replacing auth.<function>() with (select auth.<function>()) to prevent re-evaluation
  3. Implementing user level-based access control efficiently
  
  User Levels:
  - Level 1: Read-only access to songs & public content, can update own profile
  - Level 2: Can add/edit songs, view all content, edit own setlists/collections  
  - Level 3: Full admin access to everything
*/

-- Function to get current user's level efficiently
CREATE OR REPLACE FUNCTION auth.user_level()
RETURNS INTEGER
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT user_level FROM public.users WHERE id = auth.uid()),
    1
  );
$$;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users All Access to Users" ON users;

DROP POLICY IF EXISTS "Authenticated users can delete songs" ON songs;
DROP POLICY IF EXISTS "Authenticated users can insert songs" ON songs;
DROP POLICY IF EXISTS "Authenticated users can read songs" ON songs;
DROP POLICY IF EXISTS "Authenticated users can update songs" ON songs;

DROP POLICY IF EXISTS "Users can manage their own setlists" ON setlists;
DROP POLICY IF EXISTS "Users can read own and public setlists" ON setlists;

DROP POLICY IF EXISTS "Users can manage their own song collections" ON song_collections;
DROP POLICY IF EXISTS "Users can read own and public collections" ON song_collections;

DROP POLICY IF EXISTS "Users can manage sets in their own setlists" ON sets;
DROP POLICY IF EXISTS "Users can read public setlist sets" ON sets;
DROP POLICY IF EXISTS "Users can read sets in their own setlists" ON sets;

DROP POLICY IF EXISTS "Users can manage songs in their own sets" ON set_songs;
DROP POLICY IF EXISTS "Users can read public set songs" ON set_songs;
DROP POLICY IF EXISTS "Users can read songs in their own sets" ON set_songs;

DROP POLICY IF EXISTS "Users can manage their own collection songs" ON song_collection_songs;
DROP POLICY IF EXISTS "Users can read public collection songs" ON song_collection_songs;
DROP POLICY IF EXISTS "Users can read their own collection songs" ON song_collection_songs;

-- USERS TABLE POLICIES
CREATE POLICY "users_select_policy" ON users
  FOR SELECT TO authenticated
  USING (
    -- Admin can see all users OR user can see own profile
    auth.user_level() = 3 OR id = (SELECT auth.uid())
  );

CREATE POLICY "users_update_policy" ON users
  FOR UPDATE TO authenticated
  USING (
    -- Admin can update all users OR user can update own profile
    auth.user_level() = 3 OR id = (SELECT auth.uid())
  )
  WITH CHECK (
    auth.user_level() = 3 OR id = (SELECT auth.uid())
  );

CREATE POLICY "users_insert_policy" ON users
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Only admins can create users (through invitation system)
    auth.user_level() = 3
  );

CREATE POLICY "users_delete_policy" ON users
  FOR DELETE TO authenticated
  USING (
    -- Only admins can delete users
    auth.user_level() = 3
  );

-- SONGS TABLE POLICIES
CREATE POLICY "songs_select_policy" ON songs
  FOR SELECT TO authenticated
  USING (
    -- All authenticated users can read songs
    true
  );

CREATE POLICY "songs_insert_policy" ON songs
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Level 2+ can create songs
    auth.user_level() >= 2
  );

CREATE POLICY "songs_update_policy" ON songs
  FOR UPDATE TO authenticated
  USING (
    -- Level 2+ can update songs
    auth.user_level() >= 2
  )
  WITH CHECK (
    auth.user_level() >= 2
  );

CREATE POLICY "songs_delete_policy" ON songs
  FOR DELETE TO authenticated
  USING (
    -- Level 2+ can delete songs
    auth.user_level() >= 2
  );

-- SETLISTS TABLE POLICIES
CREATE POLICY "setlists_select_policy" ON setlists
  FOR SELECT TO authenticated
  USING (
    -- Admin can see all OR Level 2+ can see all OR Level 1 can see public OR owner can see own
    auth.user_level() = 3 OR 
    auth.user_level() >= 2 OR 
    is_public = true OR 
    user_id = (SELECT auth.uid())
  );

CREATE POLICY "setlists_insert_policy" ON setlists
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Any authenticated user can create setlists
    true
  );

CREATE POLICY "setlists_update_policy" ON setlists
  FOR UPDATE TO authenticated
  USING (
    -- Admin can update all OR owner can update own
    auth.user_level() = 3 OR user_id = (SELECT auth.uid())
  )
  WITH CHECK (
    auth.user_level() = 3 OR user_id = (SELECT auth.uid())
  );

CREATE POLICY "setlists_delete_policy" ON setlists
  FOR DELETE TO authenticated
  USING (
    -- Admin can delete all OR owner can delete own
    auth.user_level() = 3 OR user_id = (SELECT auth.uid())
  );

-- SONG_COLLECTIONS TABLE POLICIES
CREATE POLICY "song_collections_select_policy" ON song_collections
  FOR SELECT TO authenticated
  USING (
    -- Admin can see all OR Level 2+ can see all OR Level 1 can see public OR owner can see own
    auth.user_level() = 3 OR 
    auth.user_level() >= 2 OR 
    is_public = true OR 
    user_id = (SELECT auth.uid())
  );

CREATE POLICY "song_collections_insert_policy" ON song_collections
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Any authenticated user can create collections
    true
  );

CREATE POLICY "song_collections_update_policy" ON song_collections
  FOR UPDATE TO authenticated
  USING (
    -- Admin can update all OR owner can update own
    auth.user_level() = 3 OR user_id = (SELECT auth.uid())
  )
  WITH CHECK (
    auth.user_level() = 3 OR user_id = (SELECT auth.uid())
  );

CREATE POLICY "song_collections_delete_policy" ON song_collections
  FOR DELETE TO authenticated
  USING (
    -- Admin can delete all OR owner can delete own
    auth.user_level() = 3 OR user_id = (SELECT auth.uid())
  );

-- SETS TABLE POLICIES
CREATE POLICY "sets_select_policy" ON sets
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM setlists 
      WHERE setlists.id = sets.setlist_id 
      AND (
        -- Admin can see all OR Level 2+ can see all OR Level 1 can see public OR owner can see own
        auth.user_level() = 3 OR
        auth.user_level() >= 2 OR
        setlists.is_public = true OR
        setlists.user_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY "sets_insert_policy" ON sets
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM setlists 
      WHERE setlists.id = sets.setlist_id 
      AND (
        -- Admin can create in any setlist OR owner can create in own setlist
        auth.user_level() = 3 OR
        setlists.user_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY "sets_update_policy" ON sets
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM setlists 
      WHERE setlists.id = sets.setlist_id 
      AND (
        auth.user_level() = 3 OR
        setlists.user_id = (SELECT auth.uid())
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM setlists 
      WHERE setlists.id = sets.setlist_id 
      AND (
        auth.user_level() = 3 OR
        setlists.user_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY "sets_delete_policy" ON sets
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM setlists 
      WHERE setlists.id = sets.setlist_id 
      AND (
        auth.user_level() = 3 OR
        setlists.user_id = (SELECT auth.uid())
      )
    )
  );

-- SET_SONGS TABLE POLICIES
CREATE POLICY "set_songs_select_policy" ON set_songs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sets 
      JOIN setlists ON setlists.id = sets.setlist_id
      WHERE sets.id = set_songs.set_id 
      AND (
        -- Admin can see all OR Level 2+ can see all OR Level 1 can see public OR owner can see own
        auth.user_level() = 3 OR
        auth.user_level() >= 2 OR
        setlists.is_public = true OR
        setlists.user_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY "set_songs_insert_policy" ON set_songs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sets 
      JOIN setlists ON setlists.id = sets.setlist_id
      WHERE sets.id = set_songs.set_id 
      AND (
        auth.user_level() = 3 OR
        setlists.user_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY "set_songs_update_policy" ON set_songs
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sets 
      JOIN setlists ON setlists.id = sets.setlist_id
      WHERE sets.id = set_songs.set_id 
      AND (
        auth.user_level() = 3 OR
        setlists.user_id = (SELECT auth.uid())
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sets 
      JOIN setlists ON setlists.id = sets.setlist_id
      WHERE sets.id = set_songs.set_id 
      AND (
        auth.user_level() = 3 OR
        setlists.user_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY "set_songs_delete_policy" ON set_songs
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sets 
      JOIN setlists ON setlists.id = sets.setlist_id
      WHERE sets.id = set_songs.set_id 
      AND (
        auth.user_level() = 3 OR
        setlists.user_id = (SELECT auth.uid())
      )
    )
  );

-- SONG_COLLECTION_SONGS TABLE POLICIES
CREATE POLICY "song_collection_songs_select_policy" ON song_collection_songs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM song_collections 
      WHERE song_collections.id = song_collection_songs.song_collection_id 
      AND (
        -- Admin can see all OR Level 2+ can see all OR Level 1 can see public OR owner can see own
        auth.user_level() = 3 OR
        auth.user_level() >= 2 OR
        song_collections.is_public = true OR
        song_collections.user_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY "song_collection_songs_insert_policy" ON song_collection_songs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM song_collections 
      WHERE song_collections.id = song_collection_songs.song_collection_id 
      AND (
        auth.user_level() = 3 OR
        song_collections.user_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY "song_collection_songs_update_policy" ON song_collection_songs
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM song_collections 
      WHERE song_collections.id = song_collection_songs.song_collection_id 
      AND (
        auth.user_level() = 3 OR
        song_collections.user_id = (SELECT auth.uid())
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM song_collections 
      WHERE song_collections.id = song_collection_songs.song_collection_id 
      AND (
        auth.user_level() = 3 OR
        song_collections.user_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY "song_collection_songs_delete_policy" ON song_collection_songs
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM song_collections 
      WHERE song_collections.id = song_collection_songs.song_collection_id 
      AND (
        auth.user_level() = 3 OR
        song_collections.user_id = (SELECT auth.uid())
      )
    )
  );

-- Add performance indexes for the auth function calls
CREATE INDEX IF NOT EXISTS idx_users_auth_uid ON users(id) WHERE id = auth.uid();
CREATE INDEX IF NOT EXISTS idx_setlists_user_public ON setlists(user_id, is_public);
CREATE INDEX IF NOT EXISTS idx_song_collections_user_public ON song_collections(user_id, is_public);
CREATE INDEX IF NOT EXISTS idx_users_user_level ON users(user_level) WHERE user_level IN (2, 3);