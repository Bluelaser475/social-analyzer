/*
  # Create scan_history table for Social Analyzer

  ## Overview
  This migration creates a table to store scan history from the Social Analyzer API.
  Each record represents a completed scan for a username across social media platforms.

  ## New Tables
  1. `scan_history`
    - `id` (uuid, primary key) - Unique identifier for each scan
    - `username` (text, not null) - The username that was scanned
    - `scan_parameters` (jsonb, not null) - Parameters used for the scan (websites, method, filter, top)
    - `results` (jsonb, not null) - The complete scan results from the Python scanner
    - `created_at` (timestamptz, default now()) - Timestamp when the scan was performed

  ## Security
  - Enable RLS on `scan_history` table
  - Add policy for public read access (since scans are not user-specific in this implementation)
  - Add policy for public insert access (to allow API to save scans)

  ## Indexes
  - Create index on username for faster lookups
  - Create index on created_at for sorting by date

  ## Notes
  - All scan data is stored in jsonb format for flexibility
  - No authentication required for basic MVP, but can be added later
*/

CREATE TABLE IF NOT EXISTS scan_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  scan_parameters jsonb NOT NULL DEFAULT '{}'::jsonb,
  results jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to scan history"
  ON scan_history
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert access to scan history"
  ON scan_history
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_scan_history_username ON scan_history(username);
CREATE INDEX IF NOT EXISTS idx_scan_history_created_at ON scan_history(created_at DESC);
