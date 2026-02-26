import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  learning_fingerprint: string;
  created_at: string;
  updated_at: string;
};

export type Subject = {
  id: string;
  name: string;
  slug: string;
  title: string;
  description: string | null;
  question: string;
  data: string;
  correct_answer: string;
  ai_help_text: string;
  video_search_query: string;
  created_at: string;
};

export type LearningSession = {
  id: string;
  user_id: string;
  subject_id: string;
  start_time: string;
  end_time: string | null;
  attempts: number;
  time_spent: number;
  confusion_score: number;
  is_completed: boolean;
  ai_help_shown: boolean;
  created_at: string;
};

export type SessionAttempt = {
  id: string;
  session_id: string;
  attempt_number: number;
  user_answer: string;
  is_correct: boolean;
  time_from_start: number;
  created_at: string;
};
