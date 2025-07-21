/*
  # Create setlist_sections table

  1. New Tables
    - `setlist_sections`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `setlist_id` (uuid, foreign key to setlists, not null)
      - `name` (varchar(255), not null) - Name of the set (e.g., "Set 1", "Acoustic Set")
      - `position` (int, not null) - Order within the setlist
      - `template_id` (uuid, foreign key to set_templates, nullable) - Optional: if this section is based on a template
      - `created_at` (timestamp, default now())
  2. Security
    - Enable RLS on `setlist_sections` table
    - Add policy for authenticated users to read all setlist sections
    - Add policy for authenticated users to create, update, and delete setlist sections
  3. Constraints
    - Unique constraint on `(setlist_id, position)` to ensure unique ordering within a setlist.
*/

CREATE TABLE IF NOT EXISTS setlist_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setlist_id uuid NOT NULL REFERENCES setlists(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  position INT NOT NULL,
  template_id uuid REFERENCES set_templates(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_setlist_section_position UNIQUE (setlist_id, position)
);

ALTER TABLE setlist_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read setlist sections"
  ON setlist_sections
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage setlist sections"
  ON setlist_sections
  FOR ALL
  TO authenticated
  USING (true);