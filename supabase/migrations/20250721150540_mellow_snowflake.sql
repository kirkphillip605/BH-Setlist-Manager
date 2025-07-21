/*
  # Create set_templates table

  1. New Tables
    - `set_templates`
      - `id` (uuid, primary key)
      - `name` (varchar, not null)
      - `user_id` (uuid, foreign key to users)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `set_templates` table
    - Add policies for users to manage their own set templates
*/

CREATE TABLE IF NOT EXISTS set_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name character varying(255) NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE set_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own set templates"
  ON set_templates
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own set templates"
  ON set_templates
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_set_templates_user_id ON set_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_set_templates_name ON set_templates(name);