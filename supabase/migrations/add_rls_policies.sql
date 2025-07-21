```sql
/*
  # Add RLS Policies

  This migration adds Row Level Security (RLS) policies to the tables
  to enforce access control based on user roles and ownership.

  1.  Policies for `users` table:
      -   Authenticated users can read their own data.
      -   Admins can read all user data.
      -   Admins can update all user data.
  2.  Policies for `songs` table:
      -   Authenticated users can read all songs.
      -   Admins can manage all songs (CRUD).
  3.  Policies for `set_templates` table:
      -   Authenticated users can read all set templates.
      -   Level 2 and 3 users can manage all set templates (CRUD).
      -   Level 1 users can manage set templates they created.
  4.  Policies for `template_songs` table:
      -   Authenticated users can read all template songs.
      -   Level 2 and 3 users can manage all template songs (CRUD).
  5.  Policies for `setlists` table:
      -   Authenticated users can read all setlists.
      -   Level 2 and 3 users can manage all setlists (CRUD).
      -   Level 1 users can manage setlists they created.
  6.  Policies for `setlist_sections` table:
      -   Authenticated users can read all setlist sections.
      -   Level 2 and 3 users can manage all setlist sections (CRUD).
  7.  Policies for `setlist_section_songs` table:
      -   Authenticated users can read all setlist section songs.
      -   Level 2 and 3 users can manage all setlist section songs (CRUD).
*/

-- Policies for users table (already created, but included for completeness)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all user data"
  ON users
  FOR SELECT
  TO authenticated
  USING (user_level = 3);

CREATE POLICY "Admins can update all user data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (user_level = 3);

-- Policies for songs table (already created, but included for completeness)
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read songs"
  ON songs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage songs"
  ON songs
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_level = 3));

-- Policies for set_templates table (already created, but included for completeness)
ALTER TABLE set_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read set templates"
  ON set_templates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Level 2 and 3 users can manage all set templates"
  ON set_templates
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_level >= 2));

CREATE POLICY "Level 1 users can manage set templates they created"
  ON set_templates
  FOR ALL
  TO authenticated
  USING (created_by = auth.uid());

-- Policies for template_songs table (already created, but included for completeness)
ALTER TABLE template_songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read template songs"
  ON template_songs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Level 2 and 3 users can manage all template songs"
  ON template_songs
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_level >= 2));

-- Policies for setlists table (already created, but included for completeness)
ALTER TABLE setlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read setlists"
  ON setlists
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Level 2 and 3 users can manage all setlists"
  ON setlists
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_level >= 2));

CREATE POLICY "Level 1 users can manage setlists they created"
  ON setlists
  FOR ALL
  TO authenticated
  USING (created_by = auth.uid());

-- Policies for setlist_sections table (already created, but included for completeness)
ALTER TABLE setlist_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read setlist sections"
  ON setlist_sections
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Level 2 and 3 users can manage all setlist sections"
  ON setlist_sections
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_level >= 2));

-- Policies for setlist_section_songs table (already created, but included for completeness)
ALTER TABLE setlist_section_songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read setlist section songs"
  ON setlist_section_songs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Level 2 and 3 users can manage all setlist section songs"
  ON setlist_section_songs
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_level >= 2));
```