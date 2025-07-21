/*
# Auto-create user profile on signup

1. Database Trigger Function
   - `handle_new_user()` function that runs after auth.users INSERT
   - Automatically creates a record in public.users table
   - Uses the auth user's ID as the primary key

2. Trigger Setup
   - Trigger `on_auth_user_created` fires after INSERT on auth.users
   - Calls handle_new_user() function automatically

3. User Profile Creation
   - Copies id, email from auth.users
   - Sets default name from email or user_metadata
   - Sets default user_level to 1
*/

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, user_level)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    1
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically call the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();