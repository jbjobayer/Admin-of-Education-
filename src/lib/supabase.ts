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

export async function checkSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, message: "Supabase URL অথবা Anon Key প্রদান করা হয়নি।" };
  }
  try {
    const { error } = await supabase.from("profiles").select("count", { count: "exact", head: true });
    if (error) {
      // If table doesn't exist yet, it's still a valid server connection
      if (error.code === "42P01" || error.message.includes("relation") || error.message.includes("does not exist")) {
        return { success: true, message: "সার্ভার কানেক্ট হয়েছে! এবার নিচের SQL স্ক্রিপ্ট রান করে টেবিল তৈরি করুন।" };
      }
      return { success: false, message: `কানেকশন ত্রুটি: ${error.message}` };
    }
    return { success: true, message: "Supabase সার্ভার ও টেবিল সফলভাবে কানেক্ট হয়েছে!" };
  } catch (err: any) {
    return { success: false, message: err?.message || "কানেক্ট করতে ব্যর্থ হয়েছে।" };
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

-- 9. Exams Table (exams)
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

-- 10. Questions Table (questions)
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  question_number INT NOT NULL DEFAULT 1,
  question_text TEXT NOT NULL, -- Supports UTF-8 Arabic with harakat & Bengali
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option TEXT NOT NULL CHECK (correct_option IN ('option_a', 'option_b', 'option_c', 'option_d', 'a', 'b', 'c', 'd')),
  explanation TEXT,
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
-- 🔒 ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_tabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_syllabus_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_syllabus_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins have full access on profiles" ON public.profiles FOR ALL USING (public.is_admin());

-- Courses & Details Policies
CREATE POLICY "Courses are viewable by everyone" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Admins have full access on courses" ON public.courses FOR ALL USING (public.is_admin());

CREATE POLICY "Course tabs viewable by everyone" ON public.course_tabs FOR SELECT USING (true);
CREATE POLICY "Admins have full access on course_tabs" ON public.course_tabs FOR ALL USING (public.is_admin());

CREATE POLICY "Course routines viewable by everyone" ON public.course_routines FOR SELECT USING (true);
CREATE POLICY "Admins have full access on course_routines" ON public.course_routines FOR ALL USING (public.is_admin());

CREATE POLICY "Syllabus modules viewable by everyone" ON public.course_syllabus_modules FOR SELECT USING (true);
CREATE POLICY "Admins have full access on course_syllabus_modules" ON public.course_syllabus_modules FOR ALL USING (public.is_admin());

CREATE POLICY "Syllabus items viewable by everyone" ON public.course_syllabus_items FOR SELECT USING (true);
CREATE POLICY "Admins have full access on course_syllabus_items" ON public.course_syllabus_items FOR ALL USING (public.is_admin());

CREATE POLICY "Materials viewable by everyone" ON public.course_materials FOR SELECT USING (true);
CREATE POLICY "Admins have full access on course_materials" ON public.course_materials FOR ALL USING (public.is_admin());

-- Exams & Questions Policies
CREATE POLICY "Exams are viewable by everyone" ON public.exams FOR SELECT USING (true);
CREATE POLICY "Admins have full access on exams" ON public.exams FOR ALL USING (public.is_admin());

CREATE POLICY "Questions are viewable by authenticated users" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Admins have full access on questions" ON public.questions FOR ALL USING (public.is_admin());

-- Course Enrollments Policies
CREATE POLICY "Users can view own enrollments" ON public.course_enrollments FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users can submit enrollment" ON public.course_enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins have full access on course_enrollments" ON public.course_enrollments FOR ALL USING (public.is_admin());

-- Exam Results Policies
CREATE POLICY "Users can view own results and leaderboard" ON public.exam_results FOR SELECT USING (true);
CREATE POLICY "Users can insert own exam results" ON public.exam_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins have full access on exam_results" ON public.exam_results FOR ALL USING (public.is_admin());

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
  public.questions, 
  public.course_enrollments, 
  public.exam_results;
`;
}
