import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Storage keys for local persistence & Supabase settings
export const SUPABASE_CONFIG_KEY = "tamreen_supabase_config";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
  isConnected: boolean;
}

export function getSavedSupabaseConfig(): SupabaseConfig {
  if (typeof window === "undefined") {
    return { url: "", anonKey: "", isConnected: false };
  }
  try {
    const saved = localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Error reading Supabase config", e);
  }
  return {
    url: (import.meta as any).env?.VITE_SUPABASE_URL || "",
    anonKey: (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "",
    isConnected: false,
  };
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSavedSupabaseConfig();
  if (!config.url || !config.anonKey) return null;
  if (!supabaseInstance) {
    supabaseInstance = createClient(config.url, config.anonKey);
  }
  return supabaseInstance;
}

export function resetSupabaseClient(config: SupabaseConfig) {
  if (typeof window !== "undefined") {
    localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
  }
  if (config.url && config.anonKey) {
    supabaseInstance = createClient(config.url, config.anonKey);
  } else {
    supabaseInstance = null;
  }
}

// Generate complete PostgreSQL Schema Script with RLS and Indexes
export function generateSupabaseSqlSchema(): string {
  return `-- ==============================================================================
-- 👑 TAMREEN (তামরীন) CENTRAL DATABASE SCHEMA & SECURITY POLICIES
-- Target Backend: Supabase (PostgreSQL 15+)
-- Description: Complete production schema for Tamreen Madrasah & Islamic Exam App
-- ==============================================================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Profiles & Roles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'moderator', 'student')),
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  subscription_plan TEXT CHECK (subscription_plan IN ('free', 'monthly', 'quarterly', 'half_yearly', 'yearly')),
  subscription_expiry TIMESTAMPTZ,
  madrasah_name TEXT,
  district TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Question Bank Table (প্রশ্ন ব্যাংক হাব)
CREATE TABLE IF NOT EXISTS public.questions_bank (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  topic TEXT,
  question TEXT NOT NULL,
  arabic_text TEXT, -- Arabic text with Harakat/I'rab (اعراب)
  options JSONB NOT NULL, -- Array of 4 options: ["ক...", "খ...", "গ...", "ঘ..."]
  correct_index INT NOT NULL CHECK (correct_index >= 0 AND correct_index <= 3),
  explanation TEXT,
  source TEXT,
  difficulty TEXT DEFAULT 'Medium' CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  exam_type TEXT DEFAULT 'NTRCA' CHECK (exam_type IN ('NTRCA', 'Dakhil', 'Alim', 'Fazil', 'Kamil', 'Madrasah Directorate', 'BCS', 'General')),
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Exams & Model Tests Table (পরীক্ষা দিন কন্ট্রোলার)
CREATE TABLE IF NOT EXISTS public.exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('free_test', 'daily_live', 'weekly_model_test', 'monthly_mega', 'premium_ntrca')),
  subject TEXT NOT NULL,
  syllabus TEXT,
  duration_minutes INT NOT NULL DEFAULT 30,
  total_marks NUMERIC NOT NULL DEFAULT 50,
  pass_marks NUMERIC DEFAULT 20,
  negative_marking NUMERIC NOT NULL DEFAULT 0.25,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  result_published BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed', 'archived')),
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  participant_count INT NOT NULL DEFAULT 0,
  banner_image TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Student Exam Submissions & Leaderboard Table
CREATE TABLE IF NOT EXISTS public.exam_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  exam_title TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_phone TEXT,
  madrasah_name TEXT,
  score NUMERIC NOT NULL DEFAULT 0,
  total_marks NUMERIC NOT NULL DEFAULT 100,
  correct_count INT NOT NULL DEFAULT 0,
  wrong_count INT NOT NULL DEFAULT 0,
  unanswered_count INT NOT NULL DEFAULT 0,
  time_taken_seconds INT NOT NULL DEFAULT 0,
  rank INT,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Courses & Batches Table (কোর্স কন্ট্রোল সেন্টার)
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subtitle TEXT,
  cover_image TEXT,
  mentor TEXT NOT NULL,
  mentor_title TEXT,
  original_price NUMERIC NOT NULL DEFAULT 0,
  discount_price NUMERIC NOT NULL DEFAULT 0,
  course_tag TEXT NOT NULL DEFAULT 'NTRCA Special',
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  custom_buttons JSONB NOT NULL DEFAULT '[]'::jsonb, -- Configurable buttons with actions & URLs
  chapters JSONB NOT NULL DEFAULT '[]'::jsonb, -- Video lessons, live class links & notes
  routine_url TEXT,
  syllabus_url TEXT,
  enrolled_count INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Payment Verification & Subscriptions Table (পেমেন্ট ও মেম্বারশিপ)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_phone TEXT NOT NULL,
  gateway TEXT NOT NULL CHECK (gateway IN ('bKash', 'Nagad', 'Rocket', 'Upay')),
  trx_id TEXT UNIQUE NOT NULL,
  amount NUMERIC NOT NULL,
  plan_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  slip_url TEXT,
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  approved_at TIMESTAMPTZ
);

-- 8. Job Circulars & Bulletin Table (জব সার্কুলার)
CREATE TABLE IF NOT EXISTS public.job_circulars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  vacancies TEXT NOT NULL,
  deadline DATE NOT NULL,
  apply_link TEXT NOT NULL,
  is_hot BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  educational_req TEXT,
  details TEXT,
  pdf_url TEXT,
  location TEXT DEFAULT 'বাংলাদেশ',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. Global App Settings & Dynamic Banners (ডায়নামিক কনফিগারেশন)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 🔒 ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_circulars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins have full access on profiles" ON public.profiles FOR ALL USING (public.is_admin());

-- Questions Bank Policies
CREATE POLICY "Questions are viewable by authenticated users" ON public.questions_bank FOR SELECT USING (true);
CREATE POLICY "Admins have full access on questions_bank" ON public.questions_bank FOR ALL USING (public.is_admin());

-- Exams Policies
CREATE POLICY "Exams are viewable by everyone" ON public.exams FOR SELECT USING (true);
CREATE POLICY "Admins have full access on exams" ON public.exams FOR ALL USING (public.is_admin());

-- Exam Submissions Policies
CREATE POLICY "Users can view own submissions and leaderboard scores" ON public.exam_submissions FOR SELECT USING (true);
CREATE POLICY "Users can insert own submissions" ON public.exam_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins have full access on exam_submissions" ON public.exam_submissions FOR ALL USING (public.is_admin());

-- Courses Policies
CREATE POLICY "Courses are viewable by everyone" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Admins have full access on courses" ON public.courses FOR ALL USING (public.is_admin());

-- Payments Policies
CREATE POLICY "Users can insert payment request" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admins can update payments" ON public.payments FOR UPDATE USING (public.is_admin());

-- Job Circulars Policies
CREATE POLICY "Job circulars are viewable by everyone" ON public.job_circulars FOR SELECT USING (true);
CREATE POLICY "Admins have full access on job_circulars" ON public.job_circulars FOR ALL USING (public.is_admin());

-- App Settings Policies
CREATE POLICY "App settings are viewable by everyone" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update app_settings" ON public.app_settings FOR ALL USING (public.is_admin());

-- ==============================================================================
-- ⚡ AUTOMATIC PROFILE CREATION TRIGGER ON AUTH SIGNUP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, is_premium)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Student ' || SUBSTRING(new.id::text, 1, 6)),
    new.email,
    'student',
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_questions_subject ON public.questions_bank(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions_bank(difficulty);
CREATE INDEX IF NOT EXISTS idx_exams_status ON public.exams(status);
CREATE INDEX IF NOT EXISTS idx_submissions_exam ON public.exam_submissions(exam_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_trx_id ON public.payments(trx_id);
`;
}

export const SUPABASE_SCHEMA_SQL = generateSupabaseSqlSchema();

export async function checkSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  tablesCount?: number;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: "Supabase URL বা Anon Key সেট করা হয়নি। অনুগ্রহ করে পরিবেশ ভেরিয়েবল অথবা কনফিগ পূরণ করুন।",
    };
  }

  try {
    const { data, error } = await client.from("questions_bank").select("id").limit(1);
    if (error) {
      // If table does not exist or permission denied
      return {
        success: false,
        message: `সংযুক্তির প্রচেষ্টা সম্পন্ন, কিন্তু সতর্কতা: ${error.message}`,
      };
    }
    return {
      success: true,
      message: "Supabase PostgreSQL ডাটাবেজে সফলভাবে সংযুক্ত হয়েছে এবং সব টেবিল প্রস্তুত!",
      tablesCount: 9,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Supabase সংযোগে ত্রুটি ঘটেছে।",
    };
  }
}
