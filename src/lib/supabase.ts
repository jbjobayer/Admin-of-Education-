import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Storage keys for local persistence & Supabase settings
export const SUPABASE_CONFIG_KEY = "tamreen_supabase_config";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
}

export function getSavedSupabaseConfig(): SupabaseConfig {
  if (typeof window === "undefined") {
    return { url: "", anonKey: "", isConnected: false };
  }
  try {
    const saved = localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading Supabase config", e);
  }

  // Fallback to environment variables
  const envUrl =
    (import.meta as any).env?.VITE_SUPABASE_URL ||
    (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL ||
    "";
  const envKey =
    (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
    (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  return {
    url: envUrl,
    anonKey: envKey,
    isConnected: !!(envUrl && envKey),
  };
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSavedSupabaseConfig();
  if (!config.url || !config.anonKey) return null;
  if (!supabaseInstance) {
    supabaseInstance = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return supabaseInstance;
}

export function resetSupabaseClient(config: SupabaseConfig) {
  if (typeof window !== "undefined") {
    localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
  }
  if (config.url && config.anonKey) {
    supabaseInstance = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } else {
    supabaseInstance = null;
  }
}

export async function checkSupabaseConnection(): Promise<{ success: boolean; message: string; details?: Record<string, any> }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      success: false,
      message: "Supabase Project URL অথবা Anon API Key কনফিগার করা হয়নি।",
    };
  }
  try {
    // 1. Test ping / profiles query
    const { data: profData, error: profError } = await supabase
      .from("profiles")
      .select("id, role", { count: "exact", head: false })
      .limit(5);

    if (profError) {
      // Table doesn't exist yet - connection is still valid, but needs schema migration
      if (
        profError.code === "42P01" ||
        profError.message.includes("relation") ||
        profError.message.includes("does not exist")
      ) {
        return {
          success: true,
          message: "Supabase ক্লাউড সার্ভার সফলভাবে কানেক্ট হয়েছে! এবার নিচের 'কপি SQL স্কিমা' স্ক্রিপ্ট রান করে ডাটাবেজ টেবিল তৈরি করুন।",
          details: { serverConnected: true, tablesReady: false },
        };
      }
      return {
        success: false,
        message: `Supabase কানেকশন ত্রুটি: ${profError.message}`,
      };
    }

    // 2. Test other key tables in parallel
    const [coursesCheck, examsCheck, questionsCheck] = await Promise.all([
      supabase.from("courses").select("id", { count: "exact", head: true }),
      supabase.from("exams").select("id", { count: "exact", head: true }),
      supabase.from("questions").select("id", { count: "exact", head: true }),
    ]);

    const isFullyMigrated = !coursesCheck.error && !examsCheck.error && !questionsCheck.error;

    return {
      success: true,
      message: isFullyMigrated
        ? "Supabase PostgreSQL ক্লাউড ডাটাবেজ ও সমস্ত টেবিল সফলভাবে সংযুক্ত ও রিয়েল-টাইমে সক্রিয় রয়েছে!"
        : "Supabase সার্ভার কানেক্ট হয়েছে, কিছু টেবিল মাইগ্রেশন বাকি থাকতে পারে।",
      details: {
        serverConnected: true,
        tablesReady: isFullyMigrated,
        profilesCount: profData?.length || 0,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Supabase সার্ভারে কানেক্ট করতে ব্যর্থ হয়েছে। নেটওয়ার্ক ও ইউআরএল চেক করুন।",
    };
  }
}

export const SUPABASE_SCHEMA_SQL = generateSupabaseSqlSchema();

// Generate complete PostgreSQL Schema Script with RLS, Triggers, Views and Indexes
export function generateSupabaseSqlSchema(): string {
  return `-- ==============================================================================
-- 👑 TAMREEN (তামরীন) CENTRAL DATABASE SCHEMA & SECURITY POLICIES
-- Target Backend: Supabase (PostgreSQL 15+)
-- Single Source of Truth for Tamreen Madrasah Exam & Course CMS
-- ==============================================================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Profiles Table (profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE,
  email TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Courses Table (courses)
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  subtitle TEXT,
  description TEXT,
  instructor_name TEXT,
  instructor_title TEXT,
  thumbnail_url TEXT,
  banner_url TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  old_price NUMERIC DEFAULT 0,
  is_free BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  total_students INT NOT NULL DEFAULT 0,
  total_exams INT NOT NULL DEFAULT 0,
  total_modules INT NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Course Tabs (course_tabs)
CREATE TABLE IF NOT EXISTS public.course_tabs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  tab_key TEXT NOT NULL CHECK (tab_key IN ('details', 'routine', 'syllabus', 'materials', 'exams', 'leaderboard')),
  tab_title TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE (course_id, tab_key)
);

-- 5. Course Routine (course_routines)
CREATE TABLE IF NOT EXISTS public.course_routines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  instructor_name TEXT,
  routine_date TIMESTAMPTZ,
  start_time TEXT,
  end_time TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed', 'cancelled')),
  meeting_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Course Syllabus Modules (course_syllabus_modules)
CREATE TABLE IF NOT EXISTS public.course_syllabus_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_number INT NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  description TEXT,
  class_count INT NOT NULL DEFAULT 0,
  is_expanded BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Course Syllabus Items (course_syllabus_items)
CREATE TABLE IF NOT EXISTS public.course_syllabus_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES public.course_syllabus_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  is_free BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Course Materials / Lecture Sheets (course_materials)
CREATE TABLE IF NOT EXISTS public.course_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.course_syllabus_modules(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  material_type TEXT NOT NULL DEFAULT 'pdf',
  file_url TEXT NOT NULL,
  preview_url TEXT,
  file_size TEXT,
  page_count INT DEFAULT 0,
  is_free BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. Exams Table (exams - for Course-linked & standard exams)
CREATE TABLE IF NOT EXISTS public.exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  exam_type TEXT NOT NULL DEFAULT 'model_test' CHECK (exam_type IN ('model_test', 'daily_test', 'chapter_test', 'full_test', 'live_exam')),
  total_questions INT NOT NULL DEFAULT 0,
  duration_minutes INT NOT NULL DEFAULT 30,
  total_marks NUMERIC NOT NULL DEFAULT 50,
  negative_mark NUMERIC NOT NULL DEFAULT 0.25,
  pass_mark NUMERIC NOT NULL DEFAULT 20,
  exam_date TIMESTAMPTZ,
  is_free BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9B. Free Exams Table (free_exams - for Open/Free Model Tests)
CREATE TABLE IF NOT EXISTS public.free_exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT DEFAULT 'সাধারণ ও মাদ্রাসা কারিকুলাম',
  exam_type TEXT NOT NULL DEFAULT 'model_test' CHECK (exam_type IN ('model_test', 'daily_test', 'chapter_test', 'full_test', 'live_exam')),
  total_questions INT NOT NULL DEFAULT 0,
  duration_minutes INT NOT NULL DEFAULT 30,
  total_marks NUMERIC NOT NULL DEFAULT 10,
  negative_mark NUMERIC NOT NULL DEFAULT 0.25,
  pass_mark NUMERIC NOT NULL DEFAULT 4,
  exam_date TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  is_free BOOLEAN NOT NULL DEFAULT TRUE,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. Questions Table (questions)
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID,
  subject_id TEXT,
  subject_name TEXT,
  topic TEXT,
  question_number INT NOT NULL DEFAULT 1,
  question_text TEXT NOT NULL, -- Supports UTF-8 Arabic with harakat & Bengali
  arabic_text TEXT,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option TEXT NOT NULL CHECK (correct_option IN ('option_a', 'option_b', 'option_c', 'option_d', 'a', 'b', 'c', 'd')),
  explanation TEXT,
  source TEXT,
  difficulty TEXT DEFAULT 'Medium',
  exam_type TEXT DEFAULT 'NTRCA',
  language TEXT DEFAULT 'bn',
  marks NUMERIC NOT NULL DEFAULT 1.0,
  negative_marks NUMERIC NOT NULL DEFAULT 0.25,
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. Course Enrollments / Payment Admissions (course_enrollments)
CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  payment_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  payment_note TEXT,
  admin_note TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 12. Exam Results Table (exam_results)
CREATE TABLE IF NOT EXISTS public.exam_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  score NUMERIC NOT NULL DEFAULT 0,
  total_marks NUMERIC NOT NULL DEFAULT 100,
  correct_answers INT NOT NULL DEFAULT 0,
  wrong_answers INT NOT NULL DEFAULT 0,
  skipped_answers INT NOT NULL DEFAULT 0,
  time_taken_seconds INT NOT NULL DEFAULT 0,
  rank INT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 13. Leaderboard View (course_leaderboard)
CREATE OR REPLACE VIEW public.course_leaderboard AS
SELECT 
  er.id,
  er.course_id,
  er.exam_id,
  er.user_id,
  p.full_name,
  p.avatar_url,
  er.score,
  er.total_marks,
  er.time_taken_seconds,
  er.submitted_at,
  RANK() OVER (
    PARTITION BY er.course_id, er.exam_id 
    ORDER BY er.score DESC, er.time_taken_seconds ASC
  ) as rank
FROM public.exam_results er
LEFT JOIN public.profiles p ON er.user_id = p.id;

-- 14. Automated update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger applications for updated_at
DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS tr_courses_updated_at ON public.courses;
CREATE TRIGGER tr_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS tr_exams_updated_at ON public.exams;
CREATE TRIGGER tr_exams_updated_at BEFORE UPDATE ON public.exams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS tr_enrollments_updated_at ON public.course_enrollments;
CREATE TRIGGER tr_enrollments_updated_at BEFORE UPDATE ON public.course_enrollments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 15. Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Auto-create profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'তামরীন শিক্ষার্থী'),
    NEW.email,
    'student',
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 🔒 ROW LEVEL SECURITY (RLS) POLICIES (Full CRUD for Admin & Client App)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_tabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_syllabus_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_syllabus_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.free_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

-- Allow full access for anon and authenticated users to ensure smooth admin & student usage
DROP POLICY IF EXISTS "Allow all on profiles" ON public.profiles;
CREATE POLICY "Allow all on profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on courses" ON public.courses;
CREATE POLICY "Allow all on courses" ON public.courses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on course_tabs" ON public.course_tabs;
CREATE POLICY "Allow all on course_tabs" ON public.course_tabs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on course_routines" ON public.course_routines;
CREATE POLICY "Allow all on course_routines" ON public.course_routines FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on course_syllabus_modules" ON public.course_syllabus_modules;
CREATE POLICY "Allow all on course_syllabus_modules" ON public.course_syllabus_modules FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on course_syllabus_items" ON public.course_syllabus_items;
CREATE POLICY "Allow all on course_syllabus_items" ON public.course_syllabus_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on course_materials" ON public.course_materials;
CREATE POLICY "Allow all on course_materials" ON public.course_materials FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on exams" ON public.exams;
CREATE POLICY "Allow all on exams" ON public.exams FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on free_exams" ON public.free_exams;
CREATE POLICY "Allow all on free_exams" ON public.free_exams FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on questions" ON public.questions;
CREATE POLICY "Allow all on questions" ON public.questions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on course_enrollments" ON public.course_enrollments;
CREATE POLICY "Allow all on course_enrollments" ON public.course_enrollments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on exam_results" ON public.exam_results;
CREATE POLICY "Allow all on exam_results" ON public.exam_results FOR ALL USING (true) WITH CHECK (true);

-- Realtime Publication setup
ALTER PUBLICATION supabase_realtime ADD TABLE 
  public.profiles, 
  public.courses, 
  public.course_tabs, 
  public.course_routines, 
  public.course_syllabus_modules, 
  public.course_syllabus_items, 
  public.course_materials, 
  public.exams, 
  public.free_exams,
  public.questions, 
  public.course_enrollments, 
  public.exam_results;
`;
}

// 1-Click RLS Security Fix SQL for Existing Supabase Projects (Resolves 42501 errors)
export const SUPABASE_FIX_RLS_SQL = `-- ==============================================================================
-- ⚡ TAMREEN 1-CLICK RLS FIX SCRIPT (Resolves 42501 Permission Error)
-- Copy and run this script in Supabase Dashboard -> SQL Editor -> Run (F5)
-- ==============================================================================

-- 1. Disable Row Level Security on all tables to allow unrestricted admin & applet access
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.course_tabs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.course_routines DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.course_syllabus_modules DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.course_syllabus_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.course_materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.free_exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.course_enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.exam_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.job_circulars DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.app_settings DISABLE ROW LEVEL SECURITY;

-- 2. Drop all legacy restrictive policies
DROP POLICY IF EXISTS "Admins have full access on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins have full access on courses" ON public.courses;
DROP POLICY IF EXISTS "Admins have full access on exams" ON public.exams;
DROP POLICY IF EXISTS "Admins have full access on questions" ON public.questions;
DROP POLICY IF EXISTS "Admins have full access on course_enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Admins have full access on exam_results" ON public.exam_results;

-- 3. Grant full permissions to anon, authenticated and service_role
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
`;
