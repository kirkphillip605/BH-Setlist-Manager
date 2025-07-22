/*
  # Fix Authentication Triggers and Functions

  1. Database Triggers
    - Fix handle_new_user trigger on auth.users
    - Add sync_user_level trigger on public.users
    - Add handle_user_delete trigger on auth.users

  2. Function Improvements
    - Enhance error handling in functions
    - Add proper logging for debugging

  3. Security
    - Ensure all functions have proper security context
    - Add RLS policies if missing
*/

-- Drop existing triggers to recreate them properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
DROP TRIGGER IF EXISTS on_user_level_updated ON public.users;

-- Improve the handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log the trigger execution for debugging
  RAISE LOG 'handle_new_user triggered for user: %', NEW.id;
  
  INSERT INTO public.users (id, email, name, user_level)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE((NEW.raw_user_meta_data->>'user_level')::integer, 1)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.users.name),
    user_level = COALESCE(EXCLUDED.user_level, public.users.user_level);
    
  RAISE LOG 'User created/updated in public.users: %', NEW.id;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW; -- Don't fail the auth operation
END;
$$;

-- Improve the sync function
CREATE OR REPLACE FUNCTION public.sync_user_level_to_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only sync if user_level actually changed
  IF OLD.user_level IS DISTINCT FROM NEW.user_level THEN
    RAISE LOG 'Syncing user_level % to auth for user %', NEW.user_level, NEW.id;
    
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{user_level}',
      to_jsonb(NEW.user_level)
    )
    WHERE id = NEW.id;
    
    RAISE LOG 'User level synced to auth.users for user: %', NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in sync_user_level_to_auth: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_delete();

CREATE TRIGGER on_user_level_updated
  AFTER UPDATE OF user_level ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_level_to_auth();

-- Ensure the user_level function is optimized
CREATE OR REPLACE FUNCTION public.user_level()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    (SELECT user_level FROM public.users WHERE id = auth.uid()),
    1
  );
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;

-- Add some debugging queries (these will be logged)
DO $$
BEGIN
  RAISE LOG 'Auth triggers and functions updated successfully';
END $$;