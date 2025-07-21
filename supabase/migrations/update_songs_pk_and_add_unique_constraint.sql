/*
  # Update songs table primary key and add unique constraint

  1. Modified Tables
    - `songs`
      - Renamed `id` column to `song_id` (uuid, primary key, default gen_random_uuid())
      - Added a unique constraint on `(original_artist, title)` to prevent duplicate songs.
  2. Security
    - Updated RLS policies to reference `song_id` instead of `id`.
*/

-- Rename the primary key column from 'id' to 'song_id'
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'songs' AND column_name = 'id') THEN
    ALTER TABLE songs RENAME COLUMN id TO song_id;
  END IF;
END $$;

-- Add a unique constraint on original_artist and title
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'songs_original_artist_title_key') THEN
    ALTER TABLE songs ADD CONSTRAINT songs_original_artist_title_key UNIQUE (original_artist, title);
  END IF;
END $$;

-- Re-enable RLS (if it was disabled during migration, though it should persist)
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- Update RLS policies to use song_id
-- Drop existing policies if they refer to 'id'
DROP POLICY IF EXISTS "Authenticated users can read songs" ON songs;
DROP POLICY IF EXISTS "Authenticated users can manage songs" ON songs;

-- Recreate policies with song_id
CREATE POLICY "Authenticated users can read songs"
  ON songs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage songs"
  ON songs
  FOR ALL
  TO authenticated
  USING (true);