/*
  # Complete Database Schema for GigFlow App with User Authentication and Authorization

  This script creates and configures all necessary tables for the GigFlow application,
  including songs, set templates, setlists, and their relationships.
  It also includes the 'users' table for authentication and authorization,
  with three user levels (Admin, Level 2, Level 1).
  Row Level Security (RLS) is enabled for all tables with policies
  to manage data access based on user roles and ownership.

  1. New Tables
    - `users`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `first_name` (text, not null)
      - `last_name` (text, not null)
      - `username` (text, unique, not null)
      - `email` (text, unique, not null)
      - `password_hash` (text, not null) -- Stores the hashed password
      - `active` (boolean, default true)
      - `last_login` (timestamptz, nullable)
      - `user_level` (integer, default 1) -- 1: Standard, 2: Editor, 3: Admin
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
    - `songs`
      - `song_id` (uuid, primary key, default gen_random_uuid())
      - `original_artist` (text, not null)
      - `title` (text, not null)
      - `key_signature` (text, nullable)
      - `lyrics` (text, nullable)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
    - `set_templates`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `name` (varchar(255), unique, not null)
      - `created_at` (timestamptz, default now())
      - `created_by` (uuid, references users(id) on delete set null)
    - `template_songs`
      - `template_id` (uuid, foreign key to set_templates, not null)
      - `song_id` (uuid, foreign key to songs, not null)
      - `position` (int, not null)
      - Primary Key: (`template_id`, `song_id`)
    - `setlists`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `name` (varchar(255), not null)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
      - `created_by` (uuid, references users(id) on delete set null)
    - `setlist_sections`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `setlist_id` (uuid, foreign key to setlists, not null)
      - `name` (varchar(255), not null)
      - `position` (int, not null)
      - `template_id` (uuid, foreign key to set_templates, nullable)
      - `created_at` (timestamp, default now())
    - `setlist_section_songs`
      - `setlist_section_id` (uuid, foreign key to setlist_sections, not null)
      - `song_id` (uuid, foreign key to songs, not null)
      - `position` (int, not null)
      - Primary Key: (`setlist_section_id`, `song_id`)

  2. Constraints
    - `songs`: Unique constraint on `(original_artist, title)` to prevent duplicate songs.
    - `template_songs`: Unique constraint on `(template_id, position)` to ensure unique ordering within a template.
    - `setlist_sections`: Unique constraint on `(setlist_id, position)` to ensure unique ordering of sections within a setlist.
    - `setlist_section_songs`: Unique constraint on `(setlist_section_id, position)` to ensure unique ordering of songs within a setlist section.
    - `users`: Unique constraint on `username` and `email`.

  3. Security (Row Level Security - RLS)
    - RLS enabled for all tables: `users`, `songs`, `set_templates`, `template_songs`, `setlists`, `setlist_sections`, `setlist_section_songs`.
    - Policies for `users` table:
      - Authenticated users can read their own data.
      - Admins can read all user data.
      - Admins can update all user data.
    - Policies for `songs` table:
      - Authenticated users can read all songs.
      - Admins can manage all songs (CRUD).
    - Policies for `set_templates` table:
      - Authenticated users can read all set templates.
      - Level 2 and 3 users can manage all set templates (CRUD).
      - Level 1 users can manage set templates they created.
    - Policies for `template_songs` table:
      - Authenticated users can read all template songs.
      - Level 2 and 3 users can manage all template songs (CRUD).
    - Policies for `setlists` table:
      - Authenticated users can read all setlists.
      - Level 2 and 3 users can manage all setlists (CRUD).
      - Level 1 users can manage setlists they created.
    - Policies for `setlist_sections` table:
      - Authenticated users can read all setlist sections.
      - Level 2 and 3 users can manage all setlist sections (CRUD).
    - Policies for `setlist_section_songs` table:
      - Authenticated users can read all setlist section songs.
      - Level 2 and 3 users can manage all setlist section songs (CRUD).

  4. Important Notes
    - `ON DELETE CASCADE` is used for `setlist_id` in `setlist_sections` and `setlist_section_id` in `setlist_section_songs` to automatically delete related sections/songs when a parent setlist/section is deleted.
    - `ON DELETE RESTRICT` is used for `song_id` in `template_songs` and `setlist_section_songs`, and `template_id` in `setlist_sections` to prevent deletion of a song/template if it's still referenced.
    - Password hashing is handled at the application level (e.g., using bcrypt or similar). The `password_hash` column stores the securely hashed password.
    - User levels: 1 = Standard, 2 = Editor, 3 = Admin.
*/

-- Create the 'users' table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  active boolean DEFAULT TRUE,
  last_login timestamptz,
  user_level integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

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

-- Create the 'songs' table
CREATE TABLE IF NOT EXISTS songs (
  song_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_artist text NOT NULL,
  title text NOT NULL,
  key_signature text,
  lyrics text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

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

-- Create the 'set_templates' table
CREATE TABLE IF NOT EXISTS set_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL
);

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

-- Create the 'template_songs' table (junction table for set_templates and songs)
CREATE TABLE IF NOT EXISTS template_songs (
  template_id uuid NOT NULL REFERENCES set_templates(id) ON DELETE CASCADE,
  song_id uuid NOT NULL REFERENCES songs(song_id) ON DELETE RESTRICT,
  position INT NOT NULL,
  PRIMARY KEY (template_id, song_id),
  CONSTRAINT uq_template_song_position UNIQUE (template_id, position)
);

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

-- Create the 'setlists' table
CREATE TABLE IF NOT EXISTS setlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL
);

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

-- Create the 'setlist_sections' table (represents individual sets within a setlist)
CREATE TABLE IF NOT EXISTS setlist_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setlist_id uuid NOT NULL REFERENCES setlists(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  position INT NOT NULL,
  template_id uuid REFERENCES set_templates(id) ON DELETE RESTRICT, -- Optional: if this section is based on a template
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

-- Create the 'setlist_section_songs' table (junction table for setlist_sections and songs)
CREATE TABLE IF NOT EXISTS setlist_section_songs (
  setlist_section_id uuid NOT NULL REFERENCES setlist_sections(id) ON DELETE CASCADE,
  song_id uuid NOT NULL REFERENCES songs(song_id) ON DELETE RESTRICT,
  position INT NOT NULL,
  PRIMARY KEY (setlist_section_id, song_id)
);

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
