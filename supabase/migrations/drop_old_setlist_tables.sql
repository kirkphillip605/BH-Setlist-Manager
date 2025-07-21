/*
  # Drop old setlist tables

  1. Changes
    - Drop `setlist_songs` table
    - Drop `setlist_sets` table
  2. Important Notes
    - This migration removes the old setlist structure to make way for a more flexible design.
    - Data in these tables will be lost if they exist.
*/

DROP TABLE IF EXISTS setlist_songs;
DROP TABLE IF EXISTS setlist_sets;