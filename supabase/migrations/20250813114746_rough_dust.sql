/*
  # User Management Enhancements

  1. New Tables
    - Add performance_note field to songs table for better song management
    - Add indexes for better user management queries

  2. Security Updates
    - Add admin-only policies for user management
    - Ensure proper RLS for user operations

  3. Performance Optimizations
    - Add indexes for frequently queried fields
    - Optimize user management queries
*/

-- Add performance_note to songs table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'songs' AND column_name = 'performance_note'
    ) THEN
        ALTER TABLE songs ADD COLUMN performance_note text DEFAULT '';
    END IF;
END $$;

-- Add admin policies for user management
CREATE POLICY "Admins can manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users current_user 
      WHERE current_user.id = (select auth.uid()) 
      AND current_user.user_level = 3
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_user_level_email ON users(user_level, email);
CREATE INDEX IF NOT EXISTS idx_songs_performance_note ON songs(performance_note) WHERE performance_note IS NOT NULL AND performance_note != '';

-- Create function to sync user data between auth.users and public.users
CREATE OR REPLACE FUNCTION sync_user_profile(
  user_id uuid,
  user_name text DEFAULT NULL,
  user_email text DEFAULT NULL,
  user_role text DEFAULT NULL,
  user_level integer DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Update public.users
  UPDATE users 
  SET 
    name = COALESCE(user_name, name),
    email = COALESCE(user_email, email),
    role = COALESCE(user_role, role),
    user_level = COALESCE(user_level, users.user_level)
  WHERE id = user_id;
  
  -- If user doesn't exist in public.users, create it
  IF NOT FOUND THEN
    INSERT INTO users (id, name, email, role, user_level)
    VALUES (
      user_id, 
      COALESCE(user_name, 'User'), 
      COALESCE(user_email, ''), 
      COALESCE(user_role, ''), 
      COALESCE(user_level, 1)
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;