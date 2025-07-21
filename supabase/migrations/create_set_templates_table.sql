/*
  # Create set_templates table

  1. New Tables
    - `set_templates`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `name` (varchar(255), unique, not null)
      - `created_at` (timestamp, default now())
  2. Security
    - Enable RLS on `set_templates` table
    - Add policy for authenticated users to read all set templates
    - Add policy for authenticated users to create, update, and delete set templates
*/

CREATE TABLE IF NOT EXISTS set_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE set_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read set templates"
  ON set_templates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage set templates"
  ON set_templates
  FOR ALL
  TO authenticated
  USING (true);
