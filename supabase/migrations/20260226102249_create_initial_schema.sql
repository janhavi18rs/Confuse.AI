/*
  # Initial Schema for CONFUSE.AI Learning Platform

  ## Overview
  Creates the foundational database structure for a smart education platform that detects
  student confusion through conceptual tests and provides targeted re-teaching.

  ## New Tables
  
  ### `profiles`
  Stores user profile information linked to Supabase auth.users
  - `id` (uuid, primary key) - Links to auth.users
  - `email` (text) - User email
  - `full_name` (text) - User's full name
  - `learning_fingerprint` (text) - Learning style classification
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last profile update

  ### `subjects`
  Defines available learning subjects and topics
  - `id` (uuid, primary key)
  - `name` (text) - Subject name
  - `slug` (text, unique) - URL-friendly identifier
  - `title` (text) - Display title
  - `description` (text) - Subject description
  - `question` (text) - The learning question
  - `data` (text) - Context/data for the question
  - `correct_answer` (text) - The correct answer
  - `ai_help_text` (text) - AI explanation text
  - `video_search_query` (text) - YouTube search query
  - `created_at` (timestamptz)

  ### `learning_sessions`
  Tracks individual learning attempts
  - `id` (uuid, primary key)
  - `user_id` (uuid) - Links to profiles
  - `subject_id` (uuid) - Links to subjects
  - `start_time` (timestamptz) - Session start
  - `end_time` (timestamptz) - Session end (nullable)
  - `attempts` (integer) - Number of answer attempts
  - `time_spent` (integer) - Seconds spent
  - `confusion_score` (integer) - Calculated confusion level (0-100)
  - `is_completed` (boolean) - Whether question was answered correctly
  - `ai_help_shown` (boolean) - Whether AI assistance was triggered
  - `created_at` (timestamptz)

  ### `session_attempts`
  Records each individual answer attempt within a session
  - `id` (uuid, primary key)
  - `session_id` (uuid) - Links to learning_sessions
  - `attempt_number` (integer) - Sequence number
  - `user_answer` (text) - What the user submitted
  - `is_correct` (boolean) - Whether answer was correct
  - `time_from_start` (integer) - Seconds from session start
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only read/write their own data
  - Subjects table is read-only for authenticated users

  ## Indexes
  - Created on foreign keys for query performance
  - Created on user_id fields for dashboard queries
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  learning_fingerprint text DEFAULT 'New Learner',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  question text NOT NULL,
  data text NOT NULL,
  correct_answer text NOT NULL,
  ai_help_text text NOT NULL,
  video_search_query text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view subjects"
  ON subjects FOR SELECT
  TO authenticated
  USING (true);

-- Create learning_sessions table
CREATE TABLE IF NOT EXISTS learning_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  start_time timestamptz DEFAULT now(),
  end_time timestamptz,
  attempts integer DEFAULT 0,
  time_spent integer DEFAULT 0,
  confusion_score integer DEFAULT 0,
  is_completed boolean DEFAULT false,
  ai_help_shown boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON learning_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON learning_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON learning_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create session_attempts table
CREATE TABLE IF NOT EXISTS session_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
  attempt_number integer NOT NULL,
  user_answer text NOT NULL,
  is_correct boolean DEFAULT false,
  time_from_start integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE session_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own session attempts"
  ON session_attempts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM learning_sessions
      WHERE learning_sessions.id = session_attempts.session_id
      AND learning_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own session attempts"
  ON session_attempts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM learning_sessions
      WHERE learning_sessions.id = session_attempts.session_id
      AND learning_sessions.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_learning_sessions_user_id ON learning_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_subject_id ON learning_sessions(subject_id);
CREATE INDEX IF NOT EXISTS idx_session_attempts_session_id ON session_attempts(session_id);

-- Insert default subjects
INSERT INTO subjects (name, slug, title, description, question, data, correct_answer, ai_help_text, video_search_query)
VALUES 
  (
    'Data Structures',
    'data_structures',
    'Binary Search – Find the Target',
    'Learn how binary search efficiently finds elements in sorted arrays',
    'Find the INDEX of 23 using binary search logic (index starts from 0).',
    '[2, 5, 8, 12, 16, 23, 38, 56, 72, 91]',
    '5',
    'Binary search repeatedly checks the middle element and halves the array until the target is found. Remember: array indices start at 0, so the 6th element is at index 5.',
    'binary search explained step by step with example'
  ),
  (
    'Physics',
    'newtons_laws',
    'Newton''s First Law of Motion',
    'Understand the fundamental principle of inertia',
    'What happens to an object if no external force acts on it?',
    'Think about motion and rest.',
    'same state',
    'An object remains at rest or in uniform motion unless acted upon by an external force. This is the law of inertia.',
    'newton first law of motion intuitive explanation'
  ),
  (
    'Database Systems',
    'dbms',
    'Database Normalization',
    'Master the principles of database design and normal forms',
    'Which normal form removes partial dependency?',
    'Options: 1NF, 2NF, 3NF',
    '2nf',
    'Second Normal Form (2NF) removes partial dependency by ensuring all non-key attributes depend on the full primary key, not just part of it.',
    '2nd normal form partial dependency simple explanation'
  )
ON CONFLICT (slug) DO NOTHING;