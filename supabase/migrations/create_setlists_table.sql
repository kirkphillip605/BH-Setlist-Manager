/*
  # Create setlists table

  1. New Tables
    - `setlists`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `name` (varchar(255), unique, not null)
      - `created_at` (timestamp, default now())
  2. Security
    - Enable RLS on `setlists` table
    - Add policy for authenticated users to read all setlists
    - Add policy for authenticated users to create, update, and delete setlists
*/

CREATE TABLE IF NOT EXISTS setlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE setlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read setlists"
  ON setlists
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage setlists"
  ON setlists
  FOR ALL
  TO authenticated
  USING (true);
