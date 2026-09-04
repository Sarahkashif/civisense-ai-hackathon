-- CiviSense AI — Supabase Database Schema (Idempotent)
-- Run this SQL in your Supabase SQL Editor to create all required tables and policies.
-- Safe to run multiple times: drops existing policies before recreating.

-- ============================================================
-- 1. USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT ('user-' || floor(extract(epoch from now()) * 1000)::text || '-' || floor(random() * 9000 + 1000)::text),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. COMPLAINTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS complaints (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  selected_category TEXT,
  analysis_category TEXT NOT NULL,
  final_category TEXT NOT NULL,
  location TEXT NOT NULL,
  image_data TEXT,
  voice_transcript TEXT,
  status TEXT NOT NULL DEFAULT 'Submitted',
  priority TEXT NOT NULL DEFAULT 'Medium',
  priority_score INTEGER NOT NULL DEFAULT 50,
  priority_explanation TEXT NOT NULL DEFAULT '',
  duplicate_status TEXT NOT NULL DEFAULT 'No likely duplicate',
  duplicate_of TEXT,
  support_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status_history JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- Index for faster user-scoped queries
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints(priority);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at DESC);

-- ============================================================
-- 3. TABLE-LEVEL GRANTS (required for anon role access)
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.complaints TO anon;

-- ============================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (safe even if they don't exist yet)
DROP POLICY IF EXISTS "Allow public signup" ON users;
DROP POLICY IF EXISTS "Allow read own user" ON users;
DROP POLICY IF EXISTS "Allow public read all complaints" ON complaints;
DROP POLICY IF EXISTS "Allow insert complaints" ON complaints;
DROP POLICY IF EXISTS "Allow update complaints" ON complaints;

-- Users: anyone can insert (signup)
CREATE POLICY "Allow public signup" ON users
  FOR INSERT WITH CHECK (true);

-- Users: anyone can read by email (for login lookup)
CREATE POLICY "Allow read own user" ON users
  FOR SELECT USING (true);

-- Complaints: anyone can read all (for Authority Dashboard)
CREATE POLICY "Allow public read all complaints" ON complaints
  FOR SELECT USING (true);

-- Complaints: anyone can insert (authenticated users via app)
CREATE POLICY "Allow insert complaints" ON complaints
  FOR INSERT WITH CHECK (true);

-- Complaints: anyone can update (for status updates from authority dashboard)
CREATE POLICY "Allow update complaints" ON complaints
  FOR UPDATE USING (true);
