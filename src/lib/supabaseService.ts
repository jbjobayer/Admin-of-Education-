import { getSupabaseClient } from "./supabase";
import {
  Profile,
  Course,
  CourseTab,
  CourseRoutine,
  CourseSyllabusModule,
  CourseSyllabusItem,
  CourseMaterial,
  Exam,
  CourseExam,
  FreeExam,
  Question,
  CourseEnrollment,
  ExamResult,
  CourseLeaderboardEntry,
} from "../types";

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
  errorObj?: {
    message: string;
    details?: string;
    hint?: string;
    code?: string;
  } | null;
}

/**
 * Validates if a given string is a valid standard UUID v4 format.
 * Prevents PostgreSQL 22P02 "invalid input syntax for type uuid" crashes on temp IDs.
 */
export function isValidUuid(str?: string | null): boolean {
  if (!str || typeof str !== "string") return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str.trim());
}

// -------------------------------------------------------------
// 1. PROFILES (Users & Students)
// -------------------------------------------------------------
export async function dbFetchProfiles(): Promise<ServiceResult<Profile[]>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching profiles:", error);
      return { data: null, error: error.message };
    }
    return { data: (data as Profile[]) || [], error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "প্রোফাইল লোড করতে ব্যর্থ হয়েছে।" };
  }
}

export async function dbUpdateProfile(
  id: string,
  updates: Partial<Profile>
): Promise<ServiceResult<Profile>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  if (!isValidUuid(id)) {
    return { data: null, error: "অবৈধ প্রোফাইল আইডি।" };
  }
  if (!supabase) return { data: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  try {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }
    return { data: data as Profile, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "প্রোফাইল আপডেট করতে ব্যর্থ হয়েছে।" };
  }
}

export async function dbCheckAdminAccess(): Promise<{ isAdmin: boolean; profile: Profile | null; error: string | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { isAdmin: false, profile: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return { isAdmin: false, profile: null, error: "ব্যবহারকারী লগইন করা নেই।" };
    }

    const { data: profile, error: profError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (profError || !profile) {
      return { isAdmin: false, profile: null, error: "প্রোফাইল পাওয়া যায়নি।" };
    }

    const isAdmin = profile.role === "admin" && profile.is_active === true;
    return { isAdmin, profile: profile as Profile, error: null };
  } catch (err: any) {
    return { isAdmin: false, profile: null, error: err?.message || "অনুমোদন যাচাই করতে সমস্যা হয়েছে।" };
  }
}

// -------------------------------------------------------------
// 2. COURSES CRUD
// -------------------------------------------------------------
export async function dbFetchCourses(): Promise<ServiceResult<Course[]>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  try {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    // Also fetch course_exams and questions to resolve linked stats for course cards
    let allExams: any[] = [];
    let allQuestions: any[] = [];
    try {
      // First try course_exams, fallback to exams if table rename pending
      let examsRes = await supabase.from("course_exams").select("id, course_id, title, description, exam_type, total_questions, duration_minutes, total_marks, subject, syllabus, is_published, status");
      if (examsRes.error && examsRes.error.code === "42P01") {
        examsRes = await supabase.from("exams").select("id, course_id, title, description, exam_type, total_questions, duration_minutes, total_marks, subject, syllabus, is_published, status");
      }
      const questionsRes = await supabase.from("questions").select("id, exam_id, free_exam_id, question_text, question, topic, subject_name, subject_id, options, option_a, option_b, option_c, option_d, correct_option, explanation");
      if (examsRes.data) allExams = examsRes.data;
      if (questionsRes.data) allQuestions = questionsRes.data;
    } catch (fetchErr) {
      console.warn("Notice fetching course_exams/questions for courses:", fetchErr);
    }

    const formatted: Course[] = ((data as any[]) || []).map((row) => {
      // Find linked exams for this course
      const linkedExams = allExams.filter((e) => {
        if (e.course_id && e.course_id === row.id) return true;
        if (row.title && e.title && e.title.toLowerCase().includes(row.title.toLowerCase())) return true;
        if (row.course_tag && e.subject && e.subject.toLowerCase().includes(row.course_tag.toLowerCase())) return true;
        return false;
      });

      const linkedExamIds = new Set(linkedExams.map((e) => e.id));
      const linkedQuestions = allQuestions.filter((q) => {
        if (q.exam_id && linkedExamIds.has(q.exam_id)) return true;
        if (q.course_id && q.course_id === row.id) return true;
        return false;
      });

      const computedTotalExams = linkedExams.length || Number(row.total_exams || 0);
      const computedTotalQuestions =
        linkedQuestions.length ||
        linkedExams.reduce((sum, ex) => sum + Number(ex.total_questions || 0), 0) ||
        0;

      return {
        id: row.id,
        title: row.title || "কোর্স",
        slug: row.slug || "",
        subtitle: row.subtitle || row.description || "",
        description: row.description || "",
        instructor_name: row.instructor_name || row.mentor || "",
        instructor_title: row.instructor_title || row.mentor_title || "",
        thumbnail_url: row.thumbnail_url || row.cover_image || "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800",
        banner_url: row.banner_url || "",
        price: Number(row.price ?? row.discount_price ?? 0),
        old_price: Number(row.old_price ?? row.original_price ?? 0),
        is_free: Boolean(row.is_free),
        is_published: row.is_published !== undefined ? Boolean(row.is_published) : true,
        total_students: Number(row.total_students || row.enrolled_count || 0),
        total_exams: computedTotalExams,
        total_questions: computedTotalQuestions,
        total_modules: Number(row.total_modules || 0),
        sort_order: Number(row.sort_order || 0),
        created_at: row.created_at || new Date().toISOString(),
        updated_at: row.updated_at,
        // Linked exam & question entities
        exams: linkedExams as Exam[],
        questions: linkedQuestions as Question[],
        // UI compatibility fields:
        mentor: row.mentor || row.instructor_name || "মুফতি জুবায়ের আহমেদ",
        mentor_title: row.mentor_title || row.instructor_title || "সিনিয়র প্রভাষক, আরবি বিভাগ",
        cover_image: row.cover_image || row.thumbnail_url || "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800",
        original_price: Number(row.original_price ?? row.old_price ?? 1200),
        discount_price: Number(row.discount_price ?? row.price ?? 650),
        course_tag: row.course_tag || "NTRCA Special",
        features: Array.isArray(row.features) ? row.features : ["লাইভ ও রেকর্ডেড ক্লাস", "অধ্যায়ভিত্তিক PDF নোট", "সাপ্তাহিক মডেল টেস্ট", "প্রাইভেট ডিসকাশন গ্রুপ"],
        custom_buttons: Array.isArray(row.custom_buttons) ? row.custom_buttons : [
          { id: "b1", label: "রুটিন ডাউনলোড", action_type: "pdf_url", action_value: "https://example.com/routine.pdf", is_active: true, order: 1, color: "bg-emerald-600 text-white" },
          { id: "b2", label: "সিলেবাস দেখুন", action_type: "pdf_url", action_value: "https://example.com/syllabus.pdf", is_active: true, order: 2, color: "bg-blue-600 text-white" },
        ],
        chapters: Array.isArray(row.chapters) ? row.chapters : [],
        routine: Array.isArray(row.routine) ? row.routine : [],
        syllabus: Array.isArray(row.syllabus) ? row.syllabus : [],
        materials: Array.isArray(row.materials) ? row.materials : [],
        enrolled_count: Number(row.enrolled_count || row.total_students || 0),
        is_active: row.is_active !== undefined ? Boolean(row.is_active) : (row.is_published !== undefined ? Boolean(row.is_published) : true),
        is_featured: Boolean(row.is_featured),
      };
    });

    return { data: formatted, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "কোর্স লোড করতে সমস্যা হয়েছে।" };
  }
}

export async function dbCreateCourse(
  course: Omit<Course, "id" | "created_at" | "updated_at">
): Promise<ServiceResult<Course>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  try {
    const payload = {
      title: course.title,
      slug: course.slug || course.title.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now(),
      subtitle: course.subtitle || "",
      description: course.description || "",
      instructor_name: course.instructor_name || course.mentor || "",
      instructor_title: course.instructor_title || course.mentor_title || "",
      thumbnail_url: course.thumbnail_url || course.cover_image || "",
      banner_url: course.banner_url || "",
      price: Number(course.price ?? course.discount_price ?? 0),
      old_price: Number(course.old_price ?? course.original_price ?? 0),
      is_free: Boolean(course.is_free),
      is_published: course.is_published !== undefined ? course.is_published : true,
      total_students: course.total_students || course.enrolled_count || 0,
      total_exams: course.total_exams || 0,
      total_modules: course.total_modules || 0,
      sort_order: course.sort_order || 0,
    };

    const { data, error } = await supabase
      .from("courses")
      .insert(payload)
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    // Also bootstrap default tabs for this course
    if (data?.id) {
      const defaultTabs = [
        { course_id: data.id, tab_key: "details", tab_title: "বিবরণ", is_enabled: true, sort_order: 1 },
        { course_id: data.id, tab_key: "routine", tab_title: "রুটিন", is_enabled: true, sort_order: 2 },
        { course_id: data.id, tab_key: "syllabus", tab_title: "সিলেবাস", is_enabled: true, sort_order: 3 },
        { course_id: data.id, tab_key: "materials", tab_title: "লেকচার শিট ও PDF", is_enabled: true, sort_order: 4 },
        { course_id: data.id, tab_key: "exams", tab_title: "মডেল টেস্ট ও পরীক্ষা", is_enabled: true, sort_order: 5 },
        { course_id: data.id, tab_key: "leaderboard", tab_title: "লিডারবোর্ড", is_enabled: true, sort_order: 6 },
      ];
      await supabase.from("course_tabs").insert(defaultTabs);
    }

    return { data: data as Course, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "কোর্স তৈরি করা সম্ভব হয়নি।" };
  }
}

export async function dbUpdateCourse(
  id: string,
  course: Partial<Course>
): Promise<ServiceResult<Course>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  if (!isValidUuid(id)) {
    console.warn(`⚠️ Course ID "${id}" is not a valid UUID. Creating new row in 'courses' instead.`);
    return dbCreateCourse(course as any);
  }

  try {
    const payload: any = { ...course };
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;

    // Normalization with DB columns
    if (course.mentor !== undefined) payload.instructor_name = course.mentor;
    if (course.mentor_title !== undefined) payload.instructor_title = course.mentor_title;
    if (course.cover_image !== undefined) payload.thumbnail_url = course.cover_image;
    if (course.discount_price !== undefined) payload.price = Number(course.discount_price);
    if (course.original_price !== undefined) payload.old_price = Number(course.original_price);
    if (course.is_active !== undefined) payload.is_published = course.is_active;

    const { data, error } = await supabase
      .from("courses")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as Course, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "কোর্স আপডেট করতে সমস্যা হয়েছে।" };
  }
}

export async function dbDeleteCourse(id: string): Promise<ServiceResult<boolean>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: false, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  if (!isValidUuid(id)) {
    return { data: true, error: null };
  }

  try {
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) return { data: false, error: error.message };
    return { data: true, error: null };
  } catch (err: any) {
    return { data: false, error: err?.message || "কোর্স মুছে ফেলা যায়নি।" };
  }
}

// -------------------------------------------------------------
// 3. COURSE TABS
// -------------------------------------------------------------
export async function dbFetchCourseTabs(courseId: string): Promise<ServiceResult<CourseTab[]>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  if (!isValidUuid(courseId)) {
    return { data: [], error: null };
  }

  try {
    const { data, error } = await supabase
      .from("course_tabs")
      .select("*")
      .eq("course_id", courseId)
      .order("sort_order", { ascending: true });

    if (error) return { data: null, error: error.message };
    return { data: (data as CourseTab[]) || [], error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "ট্যাব লোড করতে সমস্যা হয়েছে।" };
  }
}

export async function dbUpsertCourseTab(
  tab: Partial<CourseTab> & { course_id: string; tab_key: string; tab_title: string }
): Promise<ServiceResult<CourseTab>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  try {
    const { data, error } = await supabase
      .from("course_tabs")
      .upsert(tab, { onConflict: "course_id,tab_key" })
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as CourseTab, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "ট্যাব সংরক্ষণ করা যায়নি।" };
  }
}

// -------------------------------------------------------------
// 4. COURSE ROUTINES
// -------------------------------------------------------------
export async function dbFetchCourseRoutines(courseId: string): Promise<ServiceResult<CourseRoutine[]>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  try {
    const { data, error } = await supabase
      .from("course_routines")
      .select("*")
      .eq("course_id", courseId)
      .order("sort_order", { ascending: true })
      .order("routine_date", { ascending: true });

    if (error) return { data: null, error: error.message };
    return { data: (data as CourseRoutine[]) || [], error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "রুটিন লোড করতে সমস্যা হয়েছে।" };
  }
}

export async function dbCreateCourseRoutine(
  routine: Omit<CourseRoutine, "id" | "created_at" | "updated_at">
): Promise<ServiceResult<CourseRoutine>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  try {
    const { data, error } = await supabase
      .from("course_routines")
      .insert(routine)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as CourseRoutine, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "রুটিন তৈরি করা সম্ভব হয়নি।" };
  }
}

export async function dbUpdateCourseRoutine(
  id: string,
  routine: Partial<CourseRoutine>
): Promise<ServiceResult<CourseRoutine>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  try {
    const { data, error } = await supabase
      .from("course_routines")
      .update(routine)
      .eq("id", id)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as CourseRoutine, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "রুটিন আপডেট করা যায়নি।" };
  }
}

export async function dbDeleteCourseRoutine(id: string): Promise<ServiceResult<boolean>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: false, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  try {
    const { error } = await supabase.from("course_routines").delete().eq("id", id);
    if (error) return { data: false, error: error.message };
    return { data: true, error: null };
  } catch (err: any) {
    return { data: false, error: err?.message || "রুটিন মুছে ফেলা যায়নি।" };
  }
}

// -------------------------------------------------------------
// 5. COURSE SYLLABUS (Modules & Items)
// -------------------------------------------------------------
export async function dbFetchCourseSyllabus(
  courseId: string
): Promise<ServiceResult<CourseSyllabusModule[]>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  try {
    const { data: modules, error: modError } = await supabase
      .from("course_syllabus_modules")
      .select("*")
      .eq("course_id", courseId)
      .order("sort_order", { ascending: true })
      .order("module_number", { ascending: true });

    if (modError) return { data: null, error: modError.message };

    const moduleIds = (modules || []).map((m) => m.id);
    let items: CourseSyllabusItem[] = [];

    if (moduleIds.length > 0) {
      const { data: itemData, error: itemError } = await supabase
        .from("course_syllabus_items")
        .select("*")
        .in("module_id", moduleIds)
        .order("sort_order", { ascending: true });

      if (!itemError && itemData) {
        items = itemData as CourseSyllabusItem[];
      }
    }

    const fullModules: CourseSyllabusModule[] = (modules || []).map((mod) => ({
      ...mod,
      items: items.filter((item) => item.module_id === mod.id),
    }));

    return { data: fullModules, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "সিলেবাস লোড করতে সমস্যা হয়েছে।" };
  }
}

export async function dbCreateSyllabusModule(
  module: Omit<CourseSyllabusModule, "id" | "created_at" | "items">
): Promise<ServiceResult<CourseSyllabusModule>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  try {
    const { data, error } = await supabase
      .from("course_syllabus_modules")
      .insert(module)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: { ...data, items: [] } as CourseSyllabusModule, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "মডিউল তৈরি করা সম্ভব হয়নি।" };
  }
}

export async function dbCreateSyllabusItem(
  item: Omit<CourseSyllabusItem, "id" | "created_at">
): Promise<ServiceResult<CourseSyllabusItem>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  try {
    const { data, error } = await supabase
      .from("course_syllabus_items")
      .insert(item)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as CourseSyllabusItem, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "সিলেবাস আইটেম তৈরি করা যায়নি।" };
  }
}

export async function dbDeleteSyllabusModule(id: string): Promise<ServiceResult<boolean>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: false, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  try {
    const { error } = await supabase.from("course_syllabus_modules").delete().eq("id", id);
    if (error) return { data: false, error: error.message };
    return { data: true, error: null };
  } catch (err: any) {
    return { data: false, error: err?.message || "মডিউল মুছে ফেলা যায়নি।" };
  }
}

// -------------------------------------------------------------
// 6. COURSE MATERIALS (Lecture Sheets / PDFs)
// -------------------------------------------------------------
export async function dbFetchCourseMaterials(
  courseId?: string
): Promise<ServiceResult<CourseMaterial[]>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  try {
    let query = supabase.from("course_materials").select("*");
    if (courseId) {
      query = query.eq("course_id", courseId);
    }
    const { data, error } = await query
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) return { data: null, error: error.message };
    return { data: (data as CourseMaterial[]) || [], error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "লেকচার শিট লোড করতে সমস্যা হয়েছে।" };
  }
}

export async function dbCreateCourseMaterial(
  material: Omit<CourseMaterial, "id" | "created_at" | "updated_at">
): Promise<ServiceResult<CourseMaterial>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  try {
    const { data, error } = await supabase
      .from("course_materials")
      .insert(material)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as CourseMaterial, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "লেকচার শিট সংরক্ষণ করা যায়নি।" };
  }
}

export async function dbDeleteCourseMaterial(id: string): Promise<ServiceResult<boolean>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: false, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  try {
    const { error } = await supabase.from("course_materials").delete().eq("id", id);
    if (error) return { data: false, error: error.message };
    return { data: true, error: null };
  } catch (err: any) {
    return { data: false, error: err?.message || "লেকচার শিট মুছে ফেলা যায়নি।" };
  }
}

// -------------------------------------------------------------
// 7. COURSE EXAMS CRUD (`course_exams` table)
// -------------------------------------------------------------
export async function dbFetchCourseExams(courseId?: string): Promise<ServiceResult<CourseExam[]>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  try {
    let query = supabase
      .from("course_exams")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (courseId && isValidUuid(courseId)) {
      query = query.eq("course_id", courseId);
    }

    let { data, error } = await query;

    // Fallback if migration rename is pending
    if (error && (error.code === "42P01" || error.message.includes("does not exist"))) {
      console.warn("course_exams table not found, falling back to exams table with course_id filter");
      let fbQuery = supabase.from("exams").select("*").not("course_id", "is", null);
      if (courseId && isValidUuid(courseId)) {
        fbQuery = fbQuery.eq("course_id", courseId);
      }
      const fbRes = await fbQuery;
      data = fbRes.data;
      error = fbRes.error;
    }

    if (error) {
      console.error("❌ Supabase SELECT 'course_exams' Error:", error);
      return { data: null, error: error.message };
    }

    const formatted: CourseExam[] = ((data as any[]) || []).map((row) => ({
      id: row.id,
      course_id: row.course_id,
      title: row.title || "কোর্স পরীক্ষা",
      description: row.description || "",
      exam_type: row.exam_type || "model_test",
      total_questions: Number(row.total_questions || 0),
      duration_minutes: Number(row.duration_minutes || 30),
      total_marks: Number(row.total_marks || 50),
      negative_mark: Number(row.negative_mark ?? row.negative_marking ?? 0.25),
      pass_mark: Number(row.pass_mark ?? row.pass_marks ?? 20),
      exam_date: row.exam_date || row.start_time || new Date().toISOString(),
      is_free: false,
      is_published: row.is_published !== undefined ? Boolean(row.is_published) : true,
      sort_order: Number(row.sort_order || 0),
      created_at: row.created_at || new Date().toISOString(),
      updated_at: row.updated_at,
      subject: row.subject || "কোর্স বিষয়",
      syllabus: row.syllabus || row.description || "",
      status: row.status || (row.is_published ? "live" : "upcoming"),
      category: row.category || "model_test",
      participant_count: Number(row.participant_count || 0),
      exam_scope: "course",
    }));

    return { data: formatted, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "কোর্স পরীক্ষা লোড করা সম্ভব হয়নি।" };
  }
}

export async function dbCreateCourseExam(
  exam: Partial<CourseExam>
): Promise<ServiceResult<CourseExam>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  // Strict Validation: course_id is MANDATORY and cannot be null
  if (!exam.course_id || !isValidUuid(exam.course_id)) {
    const errMsg = "প্রতিটি Course Exam-এর অবশ্যই একটি valid course_id থাকবে। course_id ছাড়া Course Exam তৈরি করা যাবে না।";
    console.error("❌ dbCreateCourseExam Error:", errMsg, { course_id: exam.course_id });
    return {
      data: null,
      error: errMsg,
      errorObj: { message: errMsg, code: "MISSING_COURSE_ID" },
    };
  }

  try {
    let examType = exam.exam_type || "model_test";
    if (exam.category === "daily_live" || examType === "daily_live") examType = "live_exam";
    else if (exam.category === "premium_ntrca" || examType === "premium_ntrca") examType = "full_test";

    const payload = {
      course_id: exam.course_id,
      title: (exam.title || "নতুন কোর্স পরীক্ষা").trim(),
      description: (exam.description || exam.syllabus || exam.subject || "").trim(),
      exam_type: examType,
      total_questions: Number(exam.total_questions || (exam.questions ? exam.questions.length : 0)),
      duration_minutes: Number(exam.duration_minutes || 30),
      total_marks: Number(exam.total_marks || (exam.questions ? exam.questions.length : 50)),
      negative_mark: Number(exam.negative_mark ?? 0.25),
      pass_mark: Number(exam.pass_mark ?? 20),
      exam_date: exam.exam_date || new Date().toISOString(),
      is_free: false,
      is_published: exam.is_published !== undefined ? Boolean(exam.is_published) : true,
      sort_order: Number(exam.sort_order || 0),
    };

    console.log("🚀 Executing Supabase INSERT into 'course_exams':", payload);

    let { data, error } = await supabase.from("course_exams").insert(payload).select().single();

    // Fallback if table name is still 'exams'
    if (error && (error.code === "42P01" || error.message.includes("does not exist"))) {
      console.warn("course_exams not found, inserting into exams table...");
      const fbRes = await supabase.from("exams").insert(payload).select().single();
      data = fbRes.data;
      error = fbRes.error;
    }

    if (error) {
      console.error("❌ Supabase INSERT 'course_exams' Error:", error);
      return { data: null, error: error.message, errorObj: error };
    }

    // Insert questions if provided
    if (exam.questions && Array.isArray(exam.questions) && exam.questions.length > 0 && data?.id) {
      const qPayloads = exam.questions.map((q, idx) => ({
        exam_id: data.id,
        free_exam_id: null,
        question_number: q.question_number || idx + 1,
        question_text: (q.question_text || q.question || "").trim(),
        option_a: q.option_a || (q.options ? q.options[0] : "") || "ক",
        option_b: q.option_b || (q.options ? q.options[1] : "") || "খ",
        option_c: q.option_c || (q.options ? q.options[2] : "") || "গ",
        option_d: q.option_d || (q.options ? q.options[3] : "") || "ঘ",
        correct_option: q.correct_option || "option_a",
        explanation: q.explanation || "",
        marks: Number(q.marks || 1),
        negative_marks: Number(q.negative_marks || payload.negative_mark || 0.25),
        sort_order: idx,
      }));
      await supabase.from("questions").insert(qPayloads);
    }

    const created: CourseExam = {
      ...exam,
      ...data,
      course_id: exam.course_id,
      questions: exam.questions || [],
      exam_scope: "course",
    };

    return { data: created, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "কোর্স পরীক্ষা তৈরি করা যায়নি।" };
  }
}

export async function dbUpdateCourseExam(
  id: string,
  exam: Partial<CourseExam>
): Promise<ServiceResult<CourseExam>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };
  if (!isValidUuid(id)) return { data: null, error: "অবৈধ Exam UUID" };

  try {
    const payload: any = {};
    if (exam.course_id !== undefined) {
      if (!isValidUuid(exam.course_id)) {
        return { data: null, error: "Course Exam-এ অবশ্যই একটি valid course_id থাকতে হবে।" };
      }
      payload.course_id = exam.course_id;
    }
    if (exam.title !== undefined) payload.title = exam.title.trim();
    if (exam.description !== undefined) payload.description = exam.description.trim();
    if (exam.exam_type !== undefined) payload.exam_type = exam.exam_type;
    if (exam.total_questions !== undefined) payload.total_questions = Number(exam.total_questions);
    if (exam.duration_minutes !== undefined) payload.duration_minutes = Number(exam.duration_minutes);
    if (exam.total_marks !== undefined) payload.total_marks = Number(exam.total_marks);
    if (exam.negative_mark !== undefined) payload.negative_mark = Number(exam.negative_mark);
    if (exam.pass_mark !== undefined) payload.pass_mark = Number(exam.pass_mark);
    if (exam.exam_date !== undefined) payload.exam_date = exam.exam_date;
    if (exam.is_published !== undefined) payload.is_published = Boolean(exam.is_published);
    if (exam.sort_order !== undefined) payload.sort_order = Number(exam.sort_order);

    let { data, error } = await supabase
      .from("course_exams")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error && (error.code === "42P01" || error.message.includes("does not exist"))) {
      const fbRes = await supabase.from("exams").update(payload).eq("id", id).select().single();
      data = fbRes.data;
      error = fbRes.error;
    }

    if (error) return { data: null, error: error.message, errorObj: error };
    return { data: { ...data, exam_scope: "course" } as CourseExam, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "কোর্স পরীক্ষা আপডেট করা যায়নি।" };
  }
}

export async function dbDeleteCourseExam(id: string): Promise<ServiceResult<boolean>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: false, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };
  if (!isValidUuid(id)) return { data: true, error: null };

  try {
    let { error } = await supabase.from("course_exams").delete().eq("id", id);
    if (error && (error.code === "42P01" || error.message.includes("does not exist"))) {
      const fb = await supabase.from("exams").delete().eq("id", id);
      error = fb.error;
    }
    if (error) return { data: false, error: error.message };
    return { data: true, error: null };
  } catch (err: any) {
    return { data: false, error: err?.message || "কোর্স পরীক্ষা মুছে ফেলা যায়নি।" };
  }
}

// -------------------------------------------------------------
// 7.1 FREE EXAMS CRUD (`free_exams` table)
// -------------------------------------------------------------
export async function dbFetchFreeExams(): Promise<ServiceResult<FreeExam[]>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  try {
    const { data, error } = await supabase
      .from("free_exams")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("free_exams query notice:", error.message);
      return { data: [], error: null };
    }

    const formatted: FreeExam[] = ((data as any[]) || []).map((row) => ({
      id: row.id,
      title: row.title || "ফ্রি মডেল টেস্ট",
      description: row.description || "",
      total_marks: Number(row.total_marks || 50),
      duration_minutes: Number(row.duration_minutes || 30),
      created_at: row.created_at || new Date().toISOString(),
      is_active: row.is_active !== undefined ? Boolean(row.is_active) : true,
      subject: row.subject || "সাধারণ বিষয়",
      exam_type: row.exam_type || "model_test",
      total_questions: Number(row.total_questions || 0),
      negative_mark: Number(row.negative_mark || 0.25),
      pass_mark: Number(row.pass_mark || 20),
      exam_date: row.exam_date || row.created_at,
      is_free: true,
      is_published: row.is_published !== undefined ? Boolean(row.is_published) : true,
      sort_order: Number(row.sort_order || 0),
      updated_at: row.updated_at,
      syllabus: row.syllabus || row.description || "",
      status: row.is_active ? "live" : "upcoming",
      category: "free_test",
      participant_count: Number(row.participant_count || 0),
      exam_scope: "free",
    }));

    return { data: formatted, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "ফ্রি পরীক্ষা লোড করা যায়নি।" };
  }
}

export async function dbCreateFreeExam(
  exam: Partial<FreeExam>
): Promise<ServiceResult<FreeExam>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  try {
    const payload = {
      title: (exam.title || "নতুন ফ্রি পরীক্ষা").trim(),
      description: (exam.description || exam.syllabus || exam.subject || "").trim(),
      total_marks: Number(exam.total_marks || (exam.questions ? exam.questions.length : 50)),
      duration_minutes: Number(exam.duration_minutes || 30),
      is_active: exam.is_active !== undefined ? Boolean(exam.is_active) : true,
      is_published: exam.is_published !== undefined ? Boolean(exam.is_published) : true,
      exam_type: exam.exam_type || "model_test",
      total_questions: Number(exam.total_questions || (exam.questions ? exam.questions.length : 0)),
      negative_mark: Number(exam.negative_mark ?? 0.25),
      pass_mark: Number(exam.pass_mark ?? 20),
      exam_date: exam.exam_date || new Date().toISOString(),
      sort_order: Number(exam.sort_order || 0),
    };

    console.log("🚀 Executing Supabase INSERT into 'free_exams':", payload);

    const { data, error } = await supabase.from("free_exams").insert(payload).select().single();

    if (error) {
      console.error("❌ Supabase INSERT 'free_exams' Error:", error);
      return { data: null, error: error.message, errorObj: error };
    }

    // Attach questions if provided
    if (exam.questions && Array.isArray(exam.questions) && exam.questions.length > 0 && data?.id) {
      const qPayloads = exam.questions.map((q, idx) => ({
        free_exam_id: data.id,
        exam_id: null,
        question_number: q.question_number || idx + 1,
        question_text: (q.question_text || q.question || "").trim(),
        option_a: q.option_a || (q.options ? q.options[0] : "") || "ক",
        option_b: q.option_b || (q.options ? q.options[1] : "") || "খ",
        option_c: q.option_c || (q.options ? q.options[2] : "") || "গ",
        option_d: q.option_d || (q.options ? q.options[3] : "") || "ঘ",
        correct_option: q.correct_option || "option_a",
        explanation: q.explanation || "",
        marks: Number(q.marks || 1),
        negative_marks: Number(q.negative_marks || payload.negative_mark || 0.25),
        sort_order: idx,
      }));
      await supabase.from("questions").insert(qPayloads);
    }

    const created: FreeExam = {
      ...exam,
      ...data,
      is_active: data.is_active ?? true,
      questions: exam.questions || [],
      exam_scope: "free",
    };

    return { data: created, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "ফ্রি পরীক্ষা তৈরি করা যায়নি।" };
  }
}

export async function dbUpdateFreeExam(
  id: string,
  exam: Partial<FreeExam>
): Promise<ServiceResult<FreeExam>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };
  if (!isValidUuid(id)) return { data: null, error: "অবৈধ Exam UUID" };

  try {
    const payload: any = {};
    if (exam.title !== undefined) payload.title = exam.title.trim();
    if (exam.description !== undefined) payload.description = exam.description.trim();
    if (exam.total_marks !== undefined) payload.total_marks = Number(exam.total_marks);
    if (exam.duration_minutes !== undefined) payload.duration_minutes = Number(exam.duration_minutes);
    if (exam.is_active !== undefined) payload.is_active = Boolean(exam.is_active);
    if (exam.is_published !== undefined) payload.is_published = Boolean(exam.is_published);
    if (exam.total_questions !== undefined) payload.total_questions = Number(exam.total_questions);
    if (exam.negative_mark !== undefined) payload.negative_mark = Number(exam.negative_mark);
    if (exam.pass_mark !== undefined) payload.pass_mark = Number(exam.pass_mark);
    if (exam.exam_date !== undefined) payload.exam_date = exam.exam_date;
    if (exam.sort_order !== undefined) payload.sort_order = Number(exam.sort_order);

    const { data, error } = await supabase
      .from("free_exams")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) return { data: null, error: error.message, errorObj: error };
    return { data: { ...data, exam_scope: "free" } as FreeExam, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "ফ্রি পরীক্ষা আপডেট করা যায়নি।" };
  }
}

export async function dbDeleteFreeExam(id: string): Promise<ServiceResult<boolean>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: false, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };
  if (!isValidUuid(id)) return { data: true, error: null };

  try {
    const { error } = await supabase.from("free_exams").delete().eq("id", id);
    if (error) return { data: false, error: error.message };
    return { data: true, error: null };
  } catch (err: any) {
    return { data: false, error: err?.message || "ফ্রি পরীক্ষা মুছে ফেলা যায়নি।" };
  }
}

// -------------------------------------------------------------
// 7.2 UNIFIED EXAMS CRUD (Fetches & Routes both Course & Free Exams)
// -------------------------------------------------------------
export async function dbFetchExams(): Promise<ServiceResult<Exam[]>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  try {
    // 1. Fetch from course_exams and free_exams concurrently
    const [courseExamsRes, freeExamsRes, questionsRes] = await Promise.all([
      dbFetchCourseExams(),
      dbFetchFreeExams(),
      supabase.from("questions").select("*").order("sort_order", { ascending: true }),
    ]);

    const allQuestions: Question[] = ((questionsRes.data as any[]) || []).map((row, idx) => {
      const optionsArr = [
        row.option_a || "",
        row.option_b || "",
        row.option_c || "",
        row.option_d || "",
      ];
      let correctIdx = 0;
      const co = String(row.correct_option || "").toLowerCase().trim();
      if (co === "option_b" || co === "b" || co === "খ" || co === "১" || co === "1") correctIdx = 1;
      else if (co === "option_c" || co === "c" || co === "গ" || co === "২" || co === "2") correctIdx = 2;
      else if (co === "option_d" || co === "d" || co === "ঘ" || co === "৩" || co === "3") correctIdx = 3;

      return {
        id: row.id,
        exam_id: row.exam_id || undefined,
        free_exam_id: row.free_exam_id || undefined,
        question_number: Number(row.question_number || idx + 1),
        question_text: row.question_text || row.question || "",
        arabic_text: row.arabic_text || undefined,
        option_a: row.option_a || optionsArr[0] || "",
        option_b: row.option_b || optionsArr[1] || "",
        option_c: row.option_c || optionsArr[2] || "",
        option_d: row.option_d || optionsArr[3] || "",
        correct_option: row.correct_option || "option_a",
        explanation: row.explanation || "",
        source: row.source || "",
        marks: Number(row.marks ?? 1),
        negative_marks: Number(row.negative_marks ?? 0.25),
        image_url: row.image_url || "",
        sort_order: Number(row.sort_order ?? idx),
        created_at: row.created_at || new Date().toISOString(),
        question: row.question_text || row.question || "",
        options: optionsArr,
        correct_index: correctIdx,
        topic: row.topic || "সাধারণ",
        subject_id: row.subject_id || "sub-1",
        subject_name: row.subject_name || "মাদ্রাসা কারিকুলাম",
        difficulty: row.difficulty || "Medium",
        exam_type: row.exam_type || "NTRCA",
        language: row.language || "bn",
        exam_scope: row.free_exam_id ? "free" : "course",
      };
    });

    const courseExams = courseExamsRes.data || [];
    const freeExams = freeExamsRes.data || [];

    const unifiedList: Exam[] = [];

    // Map Course Exams
    for (const ce of courseExams) {
      const linkedQs = allQuestions.filter((q) => q.exam_id === ce.id);
      unifiedList.push({
        id: ce.id,
        course_id: ce.course_id,
        title: ce.title,
        description: ce.description,
        exam_type: ce.exam_type,
        total_questions: linkedQs.length || ce.total_questions || 0,
        duration_minutes: ce.duration_minutes,
        total_marks: ce.total_marks,
        negative_mark: ce.negative_mark,
        pass_mark: ce.pass_mark,
        exam_date: ce.exam_date,
        is_free: false,
        is_published: ce.is_published,
        sort_order: ce.sort_order,
        created_at: ce.created_at,
        updated_at: ce.updated_at,
        category: ce.category || "model_test",
        subject: ce.subject || "কোর্স পরীক্ষা",
        syllabus: ce.syllabus || ce.description || "",
        pass_marks: ce.pass_mark,
        negative_marking: ce.negative_mark,
        start_time: ce.exam_date,
        status: ce.status || "live",
        questions: linkedQs,
        participant_count: ce.participant_count || 0,
        exam_scope: "course",
      });
    }

    // Map Free Exams
    for (const fe of freeExams) {
      const linkedQs = allQuestions.filter((q) => q.free_exam_id === fe.id);
      unifiedList.push({
        id: fe.id,
        course_id: null,
        title: fe.title,
        description: fe.description,
        exam_type: fe.exam_type || "model_test",
        total_questions: linkedQs.length || fe.total_questions || 0,
        duration_minutes: fe.duration_minutes,
        total_marks: fe.total_marks,
        negative_mark: fe.negative_mark || 0.25,
        pass_mark: fe.pass_mark || 20,
        exam_date: fe.exam_date || fe.created_at,
        is_free: true,
        is_published: fe.is_published ?? true,
        sort_order: fe.sort_order || 0,
        created_at: fe.created_at,
        updated_at: fe.updated_at,
        category: "free_test",
        subject: fe.subject || "ফ্রি মডেল টেস্ট",
        syllabus: fe.syllabus || fe.description || "",
        pass_marks: fe.pass_mark || 20,
        negative_marking: fe.negative_mark || 0.25,
        start_time: fe.exam_date,
        status: fe.is_active ? "live" : "upcoming",
        questions: linkedQs,
        participant_count: fe.participant_count || 0,
        exam_scope: "free",
      });
    }

    return { data: unifiedList, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "পরীক্ষা তালিকা লোড করা সম্ভব হয়নি।" };
  }
}

export async function dbCreateExam(
  exam: Omit<Exam, "id" | "created_at" | "updated_at">
): Promise<ServiceResult<Exam>> {
  // If course_id is present and valid, save in course_exams table
  if (exam.course_id && isValidUuid(exam.course_id)) {
    const res = await dbCreateCourseExam({
      ...exam,
      course_id: exam.course_id,
    } as any);
    if (res.error) return { data: null, error: res.error, errorObj: res.errorObj };
    return { data: res.data as any, error: null };
  }

  // Otherwise, save in free_exams table
  const res = await dbCreateFreeExam({
    ...exam,
    is_active: true,
  } as any);
  if (res.error) return { data: null, error: res.error, errorObj: res.errorObj };
  return { data: res.data as any, error: null };
}

export async function dbUpdateExam(id: string, exam: Partial<Exam>): Promise<ServiceResult<Exam>> {
  if (!isValidUuid(id)) {
    return dbCreateExam(exam as any);
  }

  // Try updating course_exams if course_id is present
  if (exam.course_id && isValidUuid(exam.course_id)) {
    const res = await dbUpdateCourseExam(id, exam as any);
    if (res.data) return { data: res.data as any, error: null };
  }

  // Try free_exams
  const feRes = await dbUpdateFreeExam(id, exam as any);
  if (feRes.data) return { data: feRes.data as any, error: null };

  // Fallback to course_exams without course_id change
  const ceRes = await dbUpdateCourseExam(id, exam as any);
  if (ceRes.data) return { data: ceRes.data as any, error: null };

  return { data: null, error: feRes.error || ceRes.error || "পরীক্ষা আপডেট করা সম্ভব হয়নি।" };
}

export async function dbDeleteExam(id: string): Promise<ServiceResult<boolean>> {
  if (!isValidUuid(id)) return { data: true, error: null };

  const [ceRes, feRes] = await Promise.all([
    dbDeleteCourseExam(id),
    dbDeleteFreeExam(id),
  ]);

  return { data: ceRes.data || feRes.data, error: null };
}

// -------------------------------------------------------------
// 8. QUESTIONS CRUD (Dual FK: `exam_id` vs `free_exam_id`)
// -------------------------------------------------------------
export async function dbFetchQuestions(
  examId?: string,
  freeExamId?: string
): Promise<ServiceResult<Question[]>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  try {
    let query = supabase.from("questions").select("*");

    if (examId && isValidUuid(examId)) {
      query = query.eq("exam_id", examId);
    } else if (freeExamId && isValidUuid(freeExamId)) {
      query = query.eq("free_exam_id", freeExamId);
    }

    const { data, error } = await query
      .order("question_number", { ascending: true })
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("❌ Supabase SELECT 'questions' Error:", error);
      return { data: null, error: error.message, errorObj: error };
    }

    const formatted: Question[] = ((data as any[]) || []).map((row, idx) => {
      const optionsArr = [
        row.option_a || "",
        row.option_b || "",
        row.option_c || "",
        row.option_d || "",
      ];
      let correctIdx = 0;
      const co = String(row.correct_option || "").toLowerCase().trim();
      if (co === "option_b" || co === "b" || co === "খ" || co === "১" || co === "1") correctIdx = 1;
      else if (co === "option_c" || co === "c" || co === "গ" || co === "২" || co === "2") correctIdx = 2;
      else if (co === "option_d" || co === "d" || co === "ঘ" || co === "৩" || co === "3") correctIdx = 3;

      return {
        id: row.id,
        exam_id: row.exam_id || undefined,
        free_exam_id: row.free_exam_id || undefined,
        question_number: Number(row.question_number || idx + 1),
        question_text: row.question_text || row.question || "",
        arabic_text: row.arabic_text || undefined,
        option_a: row.option_a || optionsArr[0] || "",
        option_b: row.option_b || optionsArr[1] || "",
        option_c: row.option_c || optionsArr[2] || "",
        option_d: row.option_d || optionsArr[3] || "",
        correct_option: row.correct_option || "option_a",
        explanation: row.explanation || "",
        source: row.source || "",
        marks: Number(row.marks ?? 1),
        negative_marks: Number(row.negative_marks ?? 0.25),
        image_url: row.image_url || "",
        sort_order: Number(row.sort_order ?? idx),
        created_at: row.created_at || new Date().toISOString(),
        question: row.question_text || row.question || "",
        options: optionsArr,
        correct_index: correctIdx,
        topic: row.topic || "সাধারণ",
        subject_id: row.subject_id || "sub-1",
        subject_name: row.subject_name || "মাদ্রাসা কারিকুলাম",
        difficulty: row.difficulty || "Medium",
        exam_type: row.exam_type || "NTRCA",
        language: row.language || "bn",
        exam_scope: row.free_exam_id ? "free" : "course",
      };
    });

    return { data: formatted, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "প্রশ্ন লোড করতে সমস্যা হয়েছে।" };
  }
}

export async function dbCreateQuestion(
  q: Partial<Question> & { exam_id?: string | null; free_exam_id?: string | null; question_text?: string; question?: string }
): Promise<ServiceResult<Question>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  try {
    // 1. Validate target exam (must have exam_id OR free_exam_id)
    const hasExamId = q.exam_id && isValidUuid(q.exam_id);
    const hasFreeExamId = q.free_exam_id && isValidUuid(q.free_exam_id);

    if (!hasExamId && !hasFreeExamId) {
      const errMsg = "অনুগ্রহ করে একটি কোর্স পরীক্ষা অথবা ফ্রি মডেল টেস্ট নির্বাচন করুন।";
      return {
        data: null,
        error: errMsg,
        errorObj: { message: errMsg, code: "MISSING_EXAM_LINK" },
      };
    }

    // 2. Validate question text
    const qText = (q.question_text || q.question || "").trim();
    if (!qText) {
      const errMsg = "প্রশ্নের বিবরণ দেওয়া আবশ্যক।";
      return {
        data: null,
        error: errMsg,
        errorObj: { message: errMsg, code: "MISSING_QUESTION_TEXT" },
      };
    }

    // 3. Validate options
    const optA = (q.option_a || (q.options ? q.options[0] : "") || "").trim();
    const optB = (q.option_b || (q.options ? q.options[1] : "") || "").trim();
    const optC = (q.option_c || (q.options ? q.options[2] : "") || "").trim();
    const optD = (q.option_d || (q.options ? q.options[3] : "") || "").trim();

    if (!optA || !optB || !optC || !optD) {
      const errMsg = "দয়া করে ৪টি বিকল্প (ক, খ, গ, ঘ) অবশ্যই পূরণ করুন।";
      return {
        data: null,
        error: errMsg,
        errorObj: { message: errMsg, code: "MISSING_OPTIONS" },
      };
    }

    let correctOpt = q.correct_option || "option_a";
    if (q.correct_index !== undefined) {
      const mapIdx: Record<number, string> = { 0: "option_a", 1: "option_b", 2: "option_c", 3: "option_d" };
      correctOpt = mapIdx[q.correct_index] || "option_a";
    }

    const payload: any = {
      exam_id: hasExamId ? q.exam_id : null,
      free_exam_id: hasFreeExamId ? q.free_exam_id : null,
      question_number: Number(q.question_number || 1),
      question_text: qText,
      option_a: optA,
      option_b: optB,
      option_c: optC,
      option_d: optD,
      correct_option: correctOpt,
      explanation: (q.explanation || "").trim(),
      marks: Number(q.marks ?? 1),
      negative_marks: Number(q.negative_marks ?? 0.25),
      image_url: q.image_url || null,
      sort_order: Number(q.sort_order ?? 0),
    };

    console.log("🚀 Executing Supabase INSERT on 'questions':", payload);

    let { data, error } = await supabase.from("questions").insert(payload).select().single();

    // Check constraint retry if needed
    if (error && (error.code === "23514" || error.message.includes("check constraint") || error.message.includes("correct_option"))) {
      const letterMap: Record<string, string> = {
        option_a: "A",
        option_b: "B",
        option_c: "C",
        option_d: "D",
      };
      payload.correct_option = letterMap[correctOpt] || "A";
      const retryRes = await supabase.from("questions").insert(payload).select().single();
      data = retryRes.data;
      error = retryRes.error;
    }

    if (error) {
      console.error("❌ Supabase INSERT 'questions' Error:", error);
      return { data: null, error: error.message, errorObj: error };
    }

    const row = data;
    const formatted: Question = {
      id: row.id,
      exam_id: row.exam_id,
      free_exam_id: row.free_exam_id,
      question_number: Number(row.question_number || payload.question_number),
      question_text: row.question_text || qText,
      arabic_text: q.arabic_text,
      option_a: row.option_a || optA,
      option_b: row.option_b || optB,
      option_c: row.option_c || optC,
      option_d: row.option_d || optD,
      correct_option: row.correct_option || correctOpt,
      explanation: row.explanation || payload.explanation,
      source: q.source || "",
      marks: Number(row.marks ?? payload.marks),
      negative_marks: Number(row.negative_marks ?? payload.negative_marks),
      image_url: row.image_url || "",
      sort_order: Number(row.sort_order ?? payload.sort_order),
      created_at: row.created_at || new Date().toISOString(),
      question: row.question_text || qText,
      options: [row.option_a || optA, row.option_b || optB, row.option_c || optC, row.option_d || optD],
      correct_index:
        row.correct_option === "option_b" || row.correct_option === "B" || row.correct_option === "b"
          ? 1
          : row.correct_option === "option_c" || row.correct_option === "C" || row.correct_option === "c"
          ? 2
          : row.correct_option === "option_d" || row.correct_option === "D" || row.correct_option === "d"
          ? 3
          : 0,
      topic: q.topic || "সাধারণ",
      subject_id: q.subject_id || "sub-1",
      subject_name: q.subject_name || "মাদ্রাসা কারিকুলাম",
      difficulty: q.difficulty || "Medium",
      exam_type: q.exam_type || "NTRCA",
      language: q.language || "bn",
      exam_scope: row.free_exam_id ? "free" : "course",
    };

    return { data: formatted, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "প্রশ্ন তৈরি করা সম্ভব হয়নি।" };
  }
}

export async function dbCreateBulkQuestions(
  qs: Partial<Question>[]
): Promise<ServiceResult<Question[]>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  try {
    if (qs.length === 0) return { data: [], error: null };

    const payloads = qs.map((q, idx) => {
      const hasExamId = q.exam_id && isValidUuid(q.exam_id);
      const hasFreeExamId = q.free_exam_id && isValidUuid(q.free_exam_id);

      const optA = (q.option_a || (q.options ? q.options[0] : "") || "ক").trim();
      const optB = (q.option_b || (q.options ? q.options[1] : "") || "খ").trim();
      const optC = (q.option_c || (q.options ? q.options[2] : "") || "গ").trim();
      const optD = (q.option_d || (q.options ? q.options[3] : "") || "ঘ").trim();

      let correctOpt = q.correct_option || "option_a";
      if (q.correct_index !== undefined) {
        const mapIdx: Record<number, string> = { 0: "option_a", 1: "option_b", 2: "option_c", 3: "option_d" };
        correctOpt = mapIdx[q.correct_index] || "option_a";
      }

      return {
        exam_id: hasExamId ? q.exam_id : null,
        free_exam_id: hasFreeExamId ? q.free_exam_id : null,
        question_number: Number(q.question_number || idx + 1),
        question_text: (q.question_text || q.question || "").trim(),
        option_a: optA,
        option_b: optB,
        option_c: optC,
        option_d: optD,
        correct_option: correctOpt,
        explanation: (q.explanation || "").trim(),
        marks: Number(q.marks ?? 1),
        negative_marks: Number(q.negative_marks ?? 0.25),
        image_url: q.image_url || null,
        sort_order: Number(q.sort_order ?? idx),
      };
    });

    console.log(`🚀 Executing Supabase Bulk INSERT on 'questions' (${payloads.length} items)`);

    let { data, error } = await supabase.from("questions").insert(payloads).select();

    if (error && (error.code === "23514" || error.message.includes("check constraint") || error.message.includes("correct_option"))) {
      const letterMap: Record<string, string> = {
        option_a: "A",
        option_b: "B",
        option_c: "C",
        option_d: "D",
      };
      const altPayloads = payloads.map((p) => ({
        ...p,
        correct_option: letterMap[p.correct_option] || "A",
      }));
      const retryRes = await supabase.from("questions").insert(altPayloads).select();
      data = retryRes.data;
      error = retryRes.error;
    }

    if (error) return { data: null, error: error.message, errorObj: error };

    const formatted: Question[] = ((data as any[]) || []).map((row, idx) => {
      const original = qs[idx] || {};
      return {
        id: row.id,
        exam_id: row.exam_id,
        free_exam_id: row.free_exam_id,
        question_number: Number(row.question_number || idx + 1),
        question_text: row.question_text,
        arabic_text: original.arabic_text,
        option_a: row.option_a,
        option_b: row.option_b,
        option_c: row.option_c,
        option_d: row.option_d,
        correct_option: row.correct_option,
        explanation: row.explanation || original.explanation || "",
        source: original.source || "",
        marks: Number(row.marks ?? original.marks ?? 1),
        negative_marks: Number(row.negative_marks ?? original.negative_marks ?? 0.25),
        image_url: row.image_url || "",
        sort_order: Number(row.sort_order ?? idx),
        created_at: row.created_at || new Date().toISOString(),
        question: row.question_text,
        options: [row.option_a, row.option_b, row.option_c, row.option_d],
        correct_index:
          row.correct_option === "option_b" || row.correct_option === "B" || row.correct_option === "b"
            ? 1
            : row.correct_option === "option_c" || row.correct_option === "C" || row.correct_option === "c"
            ? 2
            : row.correct_option === "option_d" || row.correct_option === "D" || row.correct_option === "d"
            ? 3
            : 0,
        topic: original.topic || "সাধারণ",
        subject_id: original.subject_id || "sub-1",
        subject_name: original.subject_name || "মাদ্রাসা কারিকুলাম",
        difficulty: original.difficulty || "Medium",
        exam_type: original.exam_type || "NTRCA",
        language: original.language || "bn",
        exam_scope: row.free_exam_id ? "free" : "course",
      };
    });

    return { data: formatted, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "বাল্ক প্রশ্ন সংরক্ষণ করা সম্ভব হয়নি।" };
  }
}

export async function dbUpdateQuestion(
  id: string,
  q: Partial<Question>
): Promise<ServiceResult<Question>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  if (!isValidUuid(id)) {
    return dbCreateQuestion(q as any);
  }

  try {
    const payload: any = {};
    if (q.exam_id !== undefined) {
      payload.exam_id = isValidUuid(q.exam_id) ? q.exam_id : null;
    }
    if (q.free_exam_id !== undefined) {
      payload.free_exam_id = isValidUuid(q.free_exam_id) ? q.free_exam_id : null;
    }
    if (q.question_number !== undefined) payload.question_number = Number(q.question_number);
    if (q.question_text !== undefined || q.question !== undefined) {
      payload.question_text = (q.question_text || q.question || "").trim();
    }
    if (q.option_a !== undefined) payload.option_a = q.option_a.trim();
    if (q.option_b !== undefined) payload.option_b = q.option_b.trim();
    if (q.option_c !== undefined) payload.option_c = q.option_c.trim();
    if (q.option_d !== undefined) payload.option_d = q.option_d.trim();

    if (q.options && q.options.length >= 4) {
      payload.option_a = (q.options[0] || "").trim();
      payload.option_b = (q.options[1] || "").trim();
      payload.option_c = (q.options[2] || "").trim();
      payload.option_d = (q.options[3] || "").trim();
    }

    if (q.correct_option !== undefined) {
      payload.correct_option = q.correct_option;
    } else if (q.correct_index !== undefined) {
      const mapIdx: Record<number, string> = { 0: "option_a", 1: "option_b", 2: "option_c", 3: "option_d" };
      payload.correct_option = mapIdx[q.correct_index] || "option_a";
    }

    if (q.explanation !== undefined) payload.explanation = q.explanation.trim();
    if (q.marks !== undefined) payload.marks = Number(q.marks);
    if (q.negative_marks !== undefined) payload.negative_marks = Number(q.negative_marks);
    if (q.image_url !== undefined) payload.image_url = q.image_url;
    if (q.sort_order !== undefined) payload.sort_order = Number(q.sort_order);

    let { data, error } = await supabase
      .from("questions")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error && (error.code === "23514" || error.message.includes("check constraint") || error.message.includes("correct_option"))) {
      const letterMap: Record<string, string> = {
        option_a: "A",
        option_b: "B",
        option_c: "C",
        option_d: "D",
      };
      payload.correct_option = letterMap[payload.correct_option] || "A";
      const retryRes = await supabase.from("questions").update(payload).eq("id", id).select().single();
      data = retryRes.data;
      error = retryRes.error;
    }

    if (error) return { data: null, error: error.message, errorObj: error };

    const row = data;
    const formatted: Question = {
      ...row,
      question: row.question_text,
      options: [row.option_a, row.option_b, row.option_c, row.option_d],
      correct_index:
        row.correct_option === "option_b" || row.correct_option === "B" || row.correct_option === "b"
          ? 1
          : row.correct_option === "option_c" || row.correct_option === "C" || row.correct_option === "c"
          ? 2
          : row.correct_option === "option_d" || row.correct_option === "D" || row.correct_option === "d"
          ? 3
          : 0,
      topic: q.topic || "সাধারণ",
      subject_id: q.subject_id || "sub-1",
      subject_name: q.subject_name || "মাদ্রাসা কারিকুলাম",
      exam_scope: row.free_exam_id ? "free" : "course",
    };

    return { data: formatted, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "প্রশ্ন আপডেট করা যায়নি।" };
  }
}

export async function dbDeleteQuestion(id: string): Promise<ServiceResult<boolean>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: false, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };
  if (!isValidUuid(id)) return { data: true, error: null };

  try {
    const { error } = await supabase.from("questions").delete().eq("id", id);
    if (error) return { data: false, error: error.message };
    return { data: true, error: null };
  } catch (err: any) {
    return { data: false, error: err?.message || "প্রশ্ন মুছে ফেলা যায়নি।" };
  }
}

// -------------------------------------------------------------
// 8.1 DIRECT COUNT UTILITIES
// -------------------------------------------------------------
export async function dbCountQuestions(): Promise<number> {
  const supabase = getSupabaseClient();
  if (!supabase) return 0;
  try {
    const { count, error } = await supabase
      .from("questions")
      .select("*", { count: "exact", head: true });
    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
}

export async function dbCountCourseExams(): Promise<number> {
  const supabase = getSupabaseClient();
  if (!supabase) return 0;
  try {
    const { count } = await supabase
      .from("course_exams")
      .select("*", { count: "exact", head: true });
    return count || 0;
  } catch {
    return 0;
  }
}

export async function dbCountFreeExams(): Promise<number> {
  const supabase = getSupabaseClient();
  if (!supabase) return 0;
  try {
    const { count } = await supabase
      .from("free_exams")
      .select("*", { count: "exact", head: true });
    return count || 0;
  } catch {
    return 0;
  }
}

// -------------------------------------------------------------
// 9. COURSE ENROLLMENTS (কোর্স ভর্তি আবেদন ও পেমেন্ট)
// -------------------------------------------------------------
export async function dbFetchEnrollments(): Promise<ServiceResult<CourseEnrollment[]>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  try {
    const { data, error } = await supabase
      .from("course_enrollments")
      .select(`
        *,
        profiles:user_id (full_name, phone, email),
        courses:course_id (title)
      `)
      .order("created_at", { ascending: false });

    if (error) return { data: null, error: error.message };

    const formatted: CourseEnrollment[] = ((data as any[]) || []).map((row) => ({
      id: row.id,
      user_id: row.user_id,
      course_id: row.course_id,
      amount: Number(row.amount || 0),
      payment_method: row.payment_method || "bKash",
      transaction_id: row.transaction_id || "",
      payment_number: row.payment_number || "",
      status: row.status || "pending",
      payment_note: row.payment_note || "",
      admin_note: row.admin_note || "",
      submitted_at: row.submitted_at || row.created_at || new Date().toISOString(),
      approved_at: row.approved_at,
      approved_by: row.approved_by,
      created_at: row.created_at || new Date().toISOString(),
      updated_at: row.updated_at,
      student_name: row.profiles?.full_name || "তামরীন শিক্ষার্থী",
      student_phone: row.profiles?.phone || row.payment_number || "",
      student_email: row.profiles?.email || "",
      course_title: row.courses?.title || "কোর্স প্যাকেজ",
    }));

    return { data: formatted, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "ভর্তি আবেদন লোড করতে সমস্যা হয়েছে।" };
  }
}

export async function dbApproveEnrollment(
  id: string,
  adminId?: string
): Promise<ServiceResult<CourseEnrollment>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  try {
    const payload: any = {
      status: "approved",
      approved_at: new Date().toISOString(),
    };
    if (adminId) payload.approved_by = adminId;

    const { data, error } = await supabase
      .from("course_enrollments")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as CourseEnrollment, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "আবেদন অনুমোদন করতে ব্যর্থ হয়েছে।" };
  }
}

export async function dbRejectEnrollment(
  id: string,
  adminId?: string,
  adminNote?: string
): Promise<ServiceResult<CourseEnrollment>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  try {
    const payload: any = {
      status: "rejected",
    };
    if (adminId) payload.approved_by = adminId;
    if (adminNote) payload.admin_note = adminNote;

    const { data, error } = await supabase
      .from("course_enrollments")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as CourseEnrollment, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "আবেদন বাতিল করতে ব্যর্থ হয়েছে।" };
  }
}

// -------------------------------------------------------------
// 10. EXAM RESULTS & LEADERBOARD
// -------------------------------------------------------------
export async function dbFetchExamResults(
  examId?: string,
  courseId?: string
): Promise<ServiceResult<ExamResult[]>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  try {
    let query = supabase.from("exam_results").select(`
      *,
      profiles:user_id (full_name, avatar_url)
    `);

    if (examId) query = query.eq("exam_id", examId);
    if (courseId) query = query.eq("course_id", courseId);

    const { data, error } = await query
      .order("score", { ascending: false })
      .order("time_taken_seconds", { ascending: true });

    if (error) return { data: null, error: error.message };

    const formatted: ExamResult[] = ((data as any[]) || []).map((row, idx) => ({
      id: row.id,
      user_id: row.user_id,
      exam_id: row.exam_id,
      course_id: row.course_id,
      score: Number(row.score || 0),
      total_marks: Number(row.total_marks || 100),
      correct_answers: Number(row.correct_answers || 0),
      wrong_answers: Number(row.wrong_answers || 0),
      skipped_answers: Number(row.skipped_answers || 0),
      time_taken_seconds: Number(row.time_taken_seconds || 0),
      rank: row.rank || idx + 1,
      submitted_at: row.submitted_at || new Date().toISOString(),
      student_name: row.profiles?.full_name || "তামরীন শিক্ষার্থী",
      avatar_url: row.profiles?.avatar_url,
      exam_title: row.exam_title || "মডেল টেস্ট",
      course_title: row.course_title,
    }));

    return { data: formatted, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "ফলাফল লোড করতে সমস্যা হয়েছে।" };
  }
}

export async function dbFetchLeaderboard(
  courseId?: string,
  examId?: string
): Promise<ServiceResult<CourseLeaderboardEntry[]>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  try {
    let query = supabase.from("course_leaderboard").select("*");
    if (courseId) query = query.eq("course_id", courseId);
    if (examId) query = query.eq("exam_id", examId);

    const { data, error } = await query.order("rank", { ascending: true }).limit(50);
    if (error) return { data: null, error: error.message };
    return { data: (data as CourseLeaderboardEntry[]) || [], error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "লিডারবোর্ড লোড করতে সমস্যা হয়েছে।" };
  }
}

// -------------------------------------------------------------
// 12. EXAM & QUESTION LINKING OPERATIONS
// -------------------------------------------------------------
export async function dbAssignQuestionsToExam(
  examId: string,
  questionIds: string[],
  isFreeExam: boolean = false
): Promise<ServiceResult<boolean>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: false, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };
  if (!isValidUuid(examId)) return { data: false, error: "অবৈধ Exam ID" };
  if (!questionIds || questionIds.length === 0) return { data: true, error: null };

  try {
    const validQIds = questionIds.filter(isValidUuid);
    if (validQIds.length > 0) {
      const updatePayload = isFreeExam
        ? { free_exam_id: examId, exam_id: null }
        : { exam_id: examId, free_exam_id: null };

      const { error } = await supabase
        .from("questions")
        .update(updatePayload)
        .in("id", validQIds);

      if (error) {
        console.error("❌ dbAssignQuestionsToExam error:", error);
        return { data: false, error: error.message };
      }
    }

    // Also update total_questions count on the target exam table
    const targetTable = isFreeExam ? "free_exams" : "course_exams";
    const { error: countErr } = await supabase
      .from(targetTable)
      .update({ total_questions: questionIds.length, total_marks: questionIds.length })
      .eq("id", examId);

    if (countErr && targetTable === "course_exams") {
      await supabase
        .from("exams")
        .update({ total_questions: questionIds.length, total_marks: questionIds.length })
        .eq("id", examId);
    }

    return { data: true, error: null };
  } catch (err: any) {
    return { data: false, error: err?.message || "প্রশ্ন লিংকিং ব্যর্থ হয়েছে।" };
  }
}

export async function dbAutoPopulateExamQuestions(
  examId: string,
  count: number = 10,
  subjectHint?: string,
  isFreeExam: boolean = false
): Promise<ServiceResult<{ linkedCount: number }>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };
  if (!isValidUuid(examId)) return { data: null, error: "অবৈধ Exam ID" };

  try {
    // 1. Fetch available questions from Supabase questions table
    let query = supabase.from("questions").select("id, subject_name, topic, question_text");
    const { data: allQuestions, error: fetchErr } = await query.limit(100);

    if (fetchErr) return { data: null, error: fetchErr.message };
    if (!allQuestions || allQuestions.length === 0) {
      return { data: null, error: "প্রশ্ন ব্যাংকে পর্যাপ্ত প্রশ্ন পাওয়া যায়নি।" };
    }

    // 2. Prioritize questions matching subject if provided
    let candidateIds: string[] = [];
    if (subjectHint) {
      const matched = allQuestions.filter(
        (q) =>
          (q.subject_name && subjectHint.toLowerCase().includes(q.subject_name.toLowerCase())) ||
          (q.topic && subjectHint.toLowerCase().includes(q.topic.toLowerCase()))
      );
      candidateIds = matched.map((q) => q.id);
    }

    if (candidateIds.length < count) {
      const rest = allQuestions.map((q) => q.id).filter((id) => !candidateIds.includes(id));
      candidateIds = [...candidateIds, ...rest];
    }

    const selectedIds = candidateIds.slice(0, count);
    if (selectedIds.length === 0) {
      return { data: { linkedCount: 0 }, error: null };
    }

    const updatePayload = isFreeExam
      ? { free_exam_id: examId, exam_id: null }
      : { exam_id: examId, free_exam_id: null };

    const { error: updateErr } = await supabase
      .from("questions")
      .update(updatePayload)
      .in("id", selectedIds);

    if (updateErr) return { data: null, error: updateErr.message };

    // Update exam total_questions count
    const targetTable = isFreeExam ? "free_exams" : "course_exams";
    await supabase
      .from(targetTable)
      .update({ total_questions: selectedIds.length, total_marks: selectedIds.length })
      .eq("id", examId);

    return { data: { linkedCount: selectedIds.length }, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "অটো-লিংকিং ব্যর্থ হয়েছে।" };
  }
}

export async function dbAutoLinkAllEmptyExams(): Promise<ServiceResult<{ fixedExams: number; totalQuestionsLinked: number }>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  try {
    const [cExRes, fExRes, qRes] = await Promise.all([
      dbFetchCourseExams(),
      dbFetchFreeExams(),
      supabase.from("questions").select("id, exam_id, free_exam_id, subject_name, topic"),
    ]);

    const allQuestions = qRes.data || [];
    if (allQuestions.length === 0) {
      return { data: { fixedExams: 0, totalQuestionsLinked: 0 }, error: null };
    }

    let fixedExams = 0;
    let totalQuestionsLinked = 0;

    // Link empty course exams
    for (const ex of (cExRes.data || [])) {
      const alreadyLinked = allQuestions.filter((q) => q.exam_id === ex.id);
      if (alreadyLinked.length === 0) {
        let matched = allQuestions.filter(
          (q) =>
            (ex.subject && q.subject_name && ex.subject.toLowerCase().includes(q.subject_name.toLowerCase())) ||
            (ex.title && q.topic && ex.title.toLowerCase().includes(q.topic.toLowerCase()))
        );
        if (matched.length === 0) matched = allQuestions.slice(0, 10);
        else matched = matched.slice(0, 10);

        const idsToLink = matched.map((q) => q.id);
        if (idsToLink.length > 0) {
          await supabase.from("questions").update({ exam_id: ex.id }).in("id", idsToLink);
          await supabase.from("course_exams").update({ total_questions: idsToLink.length, total_marks: idsToLink.length }).eq("id", ex.id);
          fixedExams++;
          totalQuestionsLinked += idsToLink.length;
        }
      }
    }

    // Link empty free exams
    for (const fe of (fExRes.data || [])) {
      const alreadyLinked = allQuestions.filter((q) => q.free_exam_id === fe.id);
      if (alreadyLinked.length === 0) {
        let matched = allQuestions.filter(
          (q) =>
            (fe.subject && q.subject_name && fe.subject.toLowerCase().includes(q.subject_name.toLowerCase())) ||
            (fe.title && q.topic && fe.title.toLowerCase().includes(q.topic.toLowerCase()))
        );
        if (matched.length === 0) matched = allQuestions.slice(0, 10);
        else matched = matched.slice(0, 10);

        const idsToLink = matched.map((q) => q.id);
        if (idsToLink.length > 0) {
          await supabase.from("questions").update({ free_exam_id: fe.id }).in("id", idsToLink);
          await supabase.from("free_exams").update({ total_questions: idsToLink.length, total_marks: idsToLink.length }).eq("id", fe.id);
          fixedExams++;
          totalQuestionsLinked += idsToLink.length;
        }
      }
    }

    return { data: { fixedExams, totalQuestionsLinked }, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "সকল পরীক্ষায় অটো-লিংক করা সম্ভব হয়নি।" };
  }
}

