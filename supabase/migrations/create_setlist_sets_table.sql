/*
  # Create setlist_sets table

  1. New Tables
    - `setlist_sets`
      - `setlist_id` (uuid, foreign key to setlists, not null)
      - `template_id` (uuid, foreign key to set_templates, not null)
      - `position` (int, not null)
      - Primary Key: (setlist_id, template_id)
      - Unique Constraint: (setlist_id, position)
  2. Security
    - Enable RLS on `setlist_sets` table
    - Add policy for authenticated users to read all setlist sets
    - Add policy for authenticated users to create, update, and delete setlist sets
*/

CREATE TABLE IF NOT EXISTS setlist_sets (
  setlist_id uuid NOT NULL REFERENCES setlists(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES set_templates(id) ON DELETE RESTRICT,
  position INT NOT NULL,
  PRIMARY KEY (setlist_id, template_id),
  CONSTRAINT uq_setlist_position UNIQUE (setlist_id, position)
);

ALTER TABLE setlist_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read setlist sets"
  ON setlist_sets
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage setlist sets"
  ON setlist_sets
  FOR ALL
  TO authenticated
  USING (true);
