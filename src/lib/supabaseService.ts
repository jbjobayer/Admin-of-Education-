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

export function getQuestionCorrectIndex(q: any): number {
  if (q.correct_index !== undefined && q.correct_index !== null && q.correct_index !== "") {
    const idx = Number(q.correct_index);
    if (!isNaN(idx) && idx >= 0 && idx <= 3) return idx;
  }
  const raw = String(q.correct_option || "").toLowerCase().trim();
  if (raw === "option_b" || raw === "opt_b" || raw === "b" || raw === "খ" || raw === "২" || raw === "1") return 1;
  if (raw === "option_c" || raw === "opt_c" || raw === "c" || raw === "গ" || raw === "৩" || raw === "2") return 2;
  if (raw === "option_d" || raw === "opt_d" || raw === "d" || raw === "ঘ" || raw === "৪" || raw === "3") return 3;
  return 0;
}

export function normalizeCorrectOption(q: any): string {
  const idx = getQuestionCorrectIndex(q);
  const options = ["option_a", "option_b", "option_c", "option_d"];
  return options[idx];
}

const CORRECT_OPTION_FORMAT_CANDIDATES = [
  // 1. Standard single lowercase letter (most common in strict schemas: 'a', 'b', 'c', 'd')
  ["a", "b", "c", "d"],
  // 2. Full option string ('option_a', 'option_b', 'option_c', 'option_d')
  ["option_a", "option_b", "option_c", "option_d"],
  // 3. Standard single uppercase letter ('A', 'B', 'C', 'D')
  ["A", "B", "C", "D"],
  // 4. 1-based index numbers ('1', '2', '3', '4')
  ["1", "2", "3", "4"],
  // 5. Short option name ('opt_a', 'opt_b', 'opt_c', 'opt_d')
  ["opt_a", "opt_b", "opt_c", "opt_d"],
  // 6. Bengali alphabet ('ক', 'খ', 'গ', 'ঘ')
  ["ক", "খ", "গ", "ঘ"],
  // 7. 0-based index numbers ('0', '1', '2', '3')
  ["0", "1", "2", "3"],
  // 8. Numbered option ('option1', 'option2', 'option3', 'option4')
  ["option1", "option2", "option3", "option4"],
];

/**
 * Standard Batch Question Insertion for Exams
 * Inserts questions into public.questions using the exact created exam UUID.
 * Supports isFree toggle (free_exam_id vs exam_id), multi-format check constraint retries, and column resilience.
 */
export async function dbInsertExamQuestions(
  examId: string,
  rawQuestions: (Partial<Question> | any)[],
  isFree: boolean = false
): Promise<ServiceResult<Question[]>> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { data: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };
  }

  if (!examId || !isValidUuid(examId)) {
    const err = `অবৈধ বা অনুপস্থিত Exam UUID: ${examId}`;
    console.error("❌ QUESTION INSERT ERROR: Invalid Exam UUID", { examId });
    return { data: null, error: err, errorObj: { message: err, code: "INVALID_EXAM_UUID" } };
  }

  if (!rawQuestions || !Array.isArray(rawQuestions) || rawQuestions.length === 0) {
    return { data: [], error: null };
  }

  console.log("QUESTION INSERT START", {
    examId,
    isFree,
    questionCount: rawQuestions.length,
    questions: rawQuestions,
  });

  // Prepare normalized base structures
  const baseItems = rawQuestions.map((q, idx) => {
    const qText = (q.question_text || q.question || "").trim();
    const optA = (q.option_a || (q.options ? q.options[0] : "") || "ক").trim();
    const optB = (q.option_b || (q.options ? q.options[1] : "") || "খ").trim();
    const optC = (q.option_c || (q.options ? q.options[2] : "") || "গ").trim();
    const optD = (q.option_d || (q.options ? q.options[3] : "") || "ঘ").trim();
    const correctIdx = getQuestionCorrectIndex(q);

    return {
      question_number: Number(q.question_number || idx + 1),
      question_text: qText || `প্রশ্ন ${idx + 1}`,
      option_a: optA,
      option_b: optB,
      option_c: optC,
      option_d: optD,
      correctIdx,
      explanation: (q.explanation || "").trim(),
      marks: Number(q.marks ?? 1.0),
      negative_marks: Number(q.negative_marks ?? 0.25),
      sort_order: Number(q.sort_order ?? idx),
      arabic_text: q.arabic_text ? q.arabic_text.trim() : null,
      source: q.source ? q.source.trim() : null,
      image_url: q.image_url ? q.image_url.trim() : null,
    };
  });

  // Candidate FK combinations to test:
  // For free exams: primary is free_exam_id, secondary is exam_id
  // For course exams: primary is exam_id, secondary is free_exam_id
  const fkCandidates: Array<Record<string, string | null>> = isFree
    ? [{ free_exam_id: examId, exam_id: null }, { free_exam_id: examId }, { exam_id: examId }]
    : [{ exam_id: examId, free_exam_id: null }, { exam_id: examId }, { free_exam_id: examId }];

  let finalData: any[] | null = null;
  let finalError: any = null;

  // Try FK candidates and Correct Option candidates
  fkLoop: for (const fkObj of fkCandidates) {
    for (let formatIdx = 0; formatIdx < CORRECT_OPTION_FORMAT_CANDIDATES.length; formatIdx++) {
      const format = CORRECT_OPTION_FORMAT_CANDIDATES[formatIdx];

      const payload = baseItems.map((item) => {
        const row: any = {
          ...fkObj,
          question_number: item.question_number,
          question_text: item.question_text,
          option_a: item.option_a,
          option_b: item.option_b,
          option_c: item.option_c,
          option_d: item.option_d,
          correct_option: format[item.correctIdx] || format[0],
          explanation: item.explanation,
          marks: item.marks,
          negative_marks: item.negative_marks,
          sort_order: item.sort_order,
        };

        if (item.arabic_text) row.arabic_text = item.arabic_text;
        if (item.source) row.source = item.source;
        if (item.image_url) row.image_url = item.image_url;

        // Clean out explicit null keys if not supported
        if (row.exam_id === null) delete row.exam_id;
        if (row.free_exam_id === null) delete row.free_exam_id;

        return row;
      });

      console.log(`🚀 Attempting batch question insert (Format: ${format[0]}, FK: ${JSON.stringify(fkObj)}):`, payload.length);
      const res = await supabase.from("questions").insert(payload).select();

      if (!res.error && res.data && res.data.length > 0) {
        console.log("✅ Batch Question Insert Succeeded!", { count: res.data.length, format: format[0] });
        finalData = res.data;
        finalError = null;
        break fkLoop;
      }

      finalError = res.error;
      console.warn(`⚠️ Insert attempt with format ${format[0]} returned:`, res.error?.message, `Code: ${res.error?.code}`);

      // If missing column (42703), retry without non-core columns
      if (res.error && (res.error.code === "42703" || res.error.message?.includes("column") || res.error.message?.includes("does not exist"))) {
        console.warn("⚠️ Column missing, retrying format with strictly minimal columns...");
        const minimalPayload = payload.map((p) => {
          const core: any = {
            question_number: p.question_number,
            question_text: p.question_text,
            option_a: p.option_a,
            option_b: p.option_b,
            option_c: p.option_c,
            option_d: p.option_d,
            correct_option: p.correct_option,
            explanation: p.explanation,
            marks: p.marks,
            negative_marks: p.negative_marks,
            sort_order: p.sort_order,
          };
          if (p.exam_id) core.exam_id = p.exam_id;
          if (p.free_exam_id) core.free_exam_id = p.free_exam_id;
          return core;
        });

        const minRes = await supabase.from("questions").insert(minimalPayload).select();
        if (!minRes.error && minRes.data && minRes.data.length > 0) {
          console.log("✅ Minimal Column Question Insert Succeeded!");
          finalData = minRes.data;
          finalError = null;
          break fkLoop;
        }
        finalError = minRes.error;
      }

      // If it's not a check constraint error (23514), and it's a foreign key error (23503), jump to next FK candidate immediately
      if (res.error && res.error.code === "23503") {
        console.warn("⚠️ Foreign key constraint mismatch, switching FK mode...");
        break; // break inner format loop to try next FK candidate
      }
    }
  }

  // Row-by-Row Fallback if batch insert encountered an isolated row issue
  if (!finalData || finalData.length === 0) {
    console.warn("⚠️ Batch insert did not succeed. Attempting individual row insertion with adaptive format resolution...");
    const individuallyInserted: any[] = [];
    let singleError: any = null;

    for (let i = 0; i < baseItems.length; i++) {
      const item = baseItems[i];
      let inserted = false;

      formatTry: for (let formatIdx = 0; formatIdx < CORRECT_OPTION_FORMAT_CANDIDATES.length; formatIdx++) {
        const format = CORRECT_OPTION_FORMAT_CANDIDATES[formatIdx];
        for (const fkObj of fkCandidates) {
          const singleRow: any = {
            ...fkObj,
            question_number: item.question_number,
            question_text: item.question_text,
            option_a: item.option_a,
            option_b: item.option_b,
            option_c: item.option_c,
            option_d: item.option_d,
            correct_option: format[item.correctIdx] || format[0],
            explanation: item.explanation,
            marks: item.marks,
            negative_marks: item.negative_marks,
            sort_order: item.sort_order,
          };
          if (singleRow.exam_id === null) delete singleRow.exam_id;
          if (singleRow.free_exam_id === null) delete singleRow.free_exam_id;

          const sRes = await supabase.from("questions").insert([singleRow]).select().single();
          if (!sRes.error && sRes.data) {
            individuallyInserted.push(sRes.data);
            inserted = true;
            break formatTry;
          }
          singleError = sRes.error;
        }
      }

      if (!inserted) {
        console.error(`❌ Failed to insert question #${i + 1}:`, singleError);
      }
    }

    if (individuallyInserted.length > 0) {
      finalData = individuallyInserted;
      finalError = null;
    }
  }

  // If still error, format comprehensive error details
  if (finalError || !finalData) {
    const errorDetails = finalError
      ? `Error: ${finalError.message}${finalError.details ? ` | Details: ${finalError.details}` : ""}${finalError.hint ? ` | Hint: ${finalError.hint}` : ""}${finalError.code ? ` | Code: ${finalError.code}` : ""}`
      : "কোনো প্রশ্ন সংরক্ষণ করা সম্ভব হয়নি।";
    console.error("❌ QUESTION INSERT FAILED COMPLETELY:", errorDetails, finalError);
    return {
      data: null,
      error: errorDetails,
      errorObj: finalError,
    };
  }

  const insertedRows = (finalData as any[]) || [];
  const formatted: Question[] = insertedRows.map((row, idx) => {
    const orig = rawQuestions[idx] || {};
    const optArr = [row.option_a || "", row.option_b || "", row.option_c || "", row.option_d || ""];
    let cIdx = 0;
    const co = String(row.correct_option || "").toLowerCase();
    if (co === "option_b" || co === "b" || co === "খ" || co === "1" || co === "২") cIdx = 1;
    else if (co === "option_c" || co === "c" || co === "গ" || co === "2" || co === "৩") cIdx = 2;
    else if (co === "option_d" || co === "d" || co === "ঘ" || co === "3" || co === "৪") cIdx = 3;

    return {
      id: row.id,
      exam_id: row.exam_id,
      free_exam_id: row.free_exam_id,
      question_number: Number(row.question_number || idx + 1),
      question_text: row.question_text || row.question || "",
      arabic_text: row.arabic_text || orig.arabic_text,
      option_a: row.option_a || optArr[0],
      option_b: row.option_b || optArr[1],
      option_c: row.option_c || optArr[2],
      option_d: row.option_d || optArr[3],
      correct_option: row.correct_option || "option_a",
      explanation: row.explanation || orig.explanation || "",
      source: row.source || orig.source || "",
      marks: Number(row.marks ?? 1.0),
      negative_marks: Number(row.negative_marks ?? 0.25),
      image_url: row.image_url || "",
      sort_order: Number(row.sort_order ?? idx),
      created_at: row.created_at || new Date().toISOString(),
      question: row.question_text || row.question || "",
      options: optArr,
      correct_index: cIdx,
      subject_id: orig.subject_id || "sub-1",
      subject_name: orig.subject_name || "",
      topic: orig.topic || "সাধারণ",
      difficulty: orig.difficulty || "Medium",
      exam_type: orig.exam_type || "NTRCA",
      language: orig.language || "bn",
    };
  });

  return { data: formatted, error: null };
}

export async function saveOrUpdateExamQuestions(
  examId: string,
  rawQuestions: (Partial<Question> | any)[],
  isFree: boolean = false
): Promise<{ success: boolean; data: Question[]; error?: string; errorObj?: any }> {
  const res = await dbInsertExamQuestions(examId, rawQuestions, isFree);
  if (res.error || !res.data) {
    return { success: false, data: [], error: res.error || "প্রশ্ন সংরক্ষণ ব্যর্থ", errorObj: res.errorObj };
  }
  return { success: true, data: res.data };
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

    // Persist and link questions into public.questions
    let syncedQuestions = exam.questions || [];
    if (exam.questions && Array.isArray(exam.questions) && exam.questions.length > 0 && data?.id) {
      const qRes = await dbInsertExamQuestions(data.id, exam.questions);
      if (qRes.error) {
        console.error("❌ Questions failed to insert for course exam:", qRes.error);
        return {
          data: null,
          error: `পরীক্ষা তৈরি সম্পন্ন হলেও প্রশ্ন যুক্ত করতে ব্যর্থ হয়েছে: ${qRes.error}`,
          errorObj: qRes.errorObj,
        };
      }
      if (qRes.data && qRes.data.length > 0) {
        syncedQuestions = qRes.data;
      }
    }

    const created: CourseExam = {
      ...exam,
      ...data,
      course_id: exam.course_id,
      questions: syncedQuestions,
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

    // Sync questions if provided
    let syncedQuestions = exam.questions;
    if (exam.questions && Array.isArray(exam.questions)) {
      payload.total_questions = exam.questions.length;
      payload.total_marks = exam.questions.length > 0 ? exam.questions.length : (payload.total_marks || 50);

      const qRes = await saveOrUpdateExamQuestions(id, exam.questions, false);
      if (qRes.success && qRes.data.length > 0) {
        syncedQuestions = qRes.data;
      }
    }

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
    return { data: { ...data, exam_scope: "course", questions: syncedQuestions || exam.questions } as CourseExam, error: null };
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

    // Attach/link questions if provided
    let syncedQuestions = exam.questions || [];
    if (exam.questions && Array.isArray(exam.questions) && exam.questions.length > 0 && data?.id) {
      const qRes = await dbInsertExamQuestions(data.id, exam.questions, true);
      if (qRes.error) {
        console.error("❌ Questions failed to insert for free exam:", qRes.error);
        return {
          data: null,
          error: `ফ্রি পরীক্ষা তৈরি সম্পন্ন হলেও প্রশ্ন যুক্ত করতে ব্যর্থ হয়েছে: ${qRes.error}`,
          errorObj: qRes.errorObj,
        };
      }
      if (qRes.data && qRes.data.length > 0) {
        syncedQuestions = qRes.data;
      }
    }

    const created: FreeExam = {
      ...exam,
      ...data,
      is_active: data.is_active ?? true,
      questions: syncedQuestions,
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

    // Sync questions if provided
    let syncedQuestions = exam.questions;
    if (exam.questions && Array.isArray(exam.questions)) {
      payload.total_questions = exam.questions.length;
      payload.total_marks = exam.questions.length > 0 ? exam.questions.length : (payload.total_marks || 50);

      const qRes = await saveOrUpdateExamQuestions(id, exam.questions, true);
      if (qRes.success && qRes.data.length > 0) {
        syncedQuestions = qRes.data;
      }
    }

    const { data, error } = await supabase
      .from("free_exams")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) return { data: null, error: error.message, errorObj: error };
    return { data: { ...data, exam_scope: "free", questions: syncedQuestions || exam.questions } as FreeExam, error: null };
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
        subject_name: row.subject_name || "",
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
      const linkedQs = allQuestions.filter((q) => q.exam_id === ce.id || q.free_exam_id === ce.id);
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
      const linkedQs = allQuestions.filter((q) => q.free_exam_id === fe.id || q.exam_id === fe.id);
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
        subject_name: row.subject_name || "",
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
  if (!supabase) return { data: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়। Settings থেকে সংযোগ নিশ্চিত করুন।" };

  try {
    const hasExamId = q.exam_id && isValidUuid(q.exam_id);
    const hasFreeExamId = q.free_exam_id && isValidUuid(q.free_exam_id);

    // 1. Validate question text
    const qText = (q.question_text || q.question || "").trim();
    if (!qText) {
      const errMsg = "প্রশ্নের বিবরণ দেওয়া আবশ্যক।";
      return {
        data: null,
        error: errMsg,
        errorObj: { message: errMsg, code: "MISSING_QUESTION_TEXT" },
      };
    }

    // 2. Validate options
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

    const correctOpt = normalizeCorrectOption(q);

    // Strict payload based on exam type:
    // Course Exam: exam_id = ID, free_exam_id = null
    // Free Exam / Model Test: exam_id = null, free_exam_id = ID
    // Standalone: exam_id = null, free_exam_id = null
    const targetExamId = hasExamId ? q.exam_id : null;
    const targetFreeExamId = hasFreeExamId ? q.free_exam_id : null;

    const payload: any = {
      exam_id: targetExamId,
      free_exam_id: targetFreeExamId,
      question_number: Number(q.question_number || 1),
      question_text: qText,
      arabic_text: q.arabic_text || null,
      option_a: optA,
      option_b: optB,
      option_c: optC,
      option_d: optD,
      correct_option: correctOpt,
      explanation: (q.explanation || "").trim(),
      source: q.source || null,
      topic: q.topic || "সাধারণ",
      subject_id: q.subject_id || "sub-1",
      subject_name: q.subject_name || "",
      difficulty: q.difficulty || "Medium",
      exam_type: q.exam_type || "NTRCA",
      language: q.language || "bn",
      marks: Number(q.marks ?? 1),
      negative_marks: Number(q.negative_marks ?? 0.25),
      image_url: q.image_url || null,
      sort_order: Number(q.sort_order ?? 0),
    };

    if (q.id && isValidUuid(q.id)) {
      payload.id = q.id;
    }

    console.log("🚀 Executing Supabase INSERT into public.questions:", payload);

    let { data, error } = await supabase.from("questions").upsert(payload).select().single();

    // Handle column missing / schema cache missing (e.g. arabic_text, free_exam_id)
    if (error && (error.code === "42703" || error.code === "PGRST204" || error.message?.includes("schema cache") || error.message?.includes("column") || error.message?.includes("does not exist"))) {
      console.warn("⚠️ Column missing in schema, attempting adaptive payload strip:", error.message);
      let currentPayload = { ...payload };

      if (error.message.includes("arabic_text")) {
        // If question_text was empty or placeholder and arabic_text had the text, preserve it
        if (!currentPayload.question_text || currentPayload.question_text.startsWith("প্রশ্ন")) {
          currentPayload.question_text = currentPayload.arabic_text || currentPayload.question_text;
        }
        delete currentPayload.arabic_text;
      }
      if (error.message.includes("free_exam_id")) {
        if (!currentPayload.exam_id && targetFreeExamId) {
          currentPayload.exam_id = targetFreeExamId;
        }
        delete currentPayload.free_exam_id;
      }
      if (error.message.includes("subject_name")) delete currentPayload.subject_name;
      if (error.message.includes("topic")) delete currentPayload.topic;
      if (error.message.includes("source")) delete currentPayload.source;
      if (error.message.includes("language")) delete currentPayload.language;
      if (error.message.includes("image_url")) delete currentPayload.image_url;

      const retryRes = await supabase.from("questions").upsert(currentPayload).select().single();
      data = retryRes.data;
      error = retryRes.error;

      // If still fails with missing column, retry with ultra-minimal core columns
      if (error && (error.code === "42703" || error.code === "PGRST204" || error.message?.includes("schema cache") || error.message?.includes("column"))) {
        const corePayload: any = {
          question_number: payload.question_number,
          question_text: payload.question_text || payload.arabic_text || "প্রশ্ন",
          option_a: payload.option_a,
          option_b: payload.option_b,
          option_c: payload.option_c,
          option_d: payload.option_d,
          correct_option: payload.correct_option,
          explanation: payload.explanation,
          marks: payload.marks,
          negative_marks: payload.negative_marks,
          sort_order: payload.sort_order,
        };
        if (payload.exam_id) corePayload.exam_id = payload.exam_id;
        const minRetry = await supabase.from("questions").upsert(corePayload).select().single();
        data = minRetry.data;
        error = minRetry.error;
      }
    }

    // Handle check constraint (23514) on correct_option representation
    if (error && (error.code === "23514" || error.message?.includes("check constraint") || error.message?.includes("correct_option"))) {
      console.warn("⚠️ Check constraint on correct_option, trying candidate formats:", error.message);
      const cIdx = getQuestionCorrectIndex(q);
      for (const format of CORRECT_OPTION_FORMAT_CANDIDATES) {
        const altPayload: any = {
          ...payload,
          correct_option: format[cIdx] || format[0],
        };
        // Clean out known missing columns if identified earlier
        if (error.message?.includes("arabic_text")) delete altPayload.arabic_text;
        if (error.message?.includes("free_exam_id")) delete altPayload.free_exam_id;

        const retryRes = await supabase.from("questions").upsert(altPayload).select().single();
        if (!retryRes.error && retryRes.data) {
          data = retryRes.data;
          error = null;
          console.log(`✅ Question inserted successfully with format: ${format[0]}`);
          break;
        }
        error = retryRes.error;
      }
    }

    if (error) {
      console.error("❌ Supabase INSERT 'questions' Error:", error);
      return { data: null, error: error.message, errorObj: error };
    }

    if (!data) {
      return { data: null, error: "ডাটাবেজ থেকে কোনো রেসপন্স পাওয়া যায়নি।" };
    }

    const row = data;
    const formatted: Question = {
      id: row.id,
      exam_id: row.exam_id || (targetExamId ?? undefined),
      free_exam_id: row.free_exam_id || (targetFreeExamId ?? undefined),
      question_number: Number(row.question_number || payload.question_number),
      question_text: row.question_text || qText,
      arabic_text: row.arabic_text || q.arabic_text,
      option_a: row.option_a || optA,
      option_b: row.option_b || optB,
      option_c: row.option_c || optC,
      option_d: row.option_d || optD,
      correct_option: row.correct_option || correctOpt,
      explanation: row.explanation || payload.explanation,
      source: row.source || q.source || "",
      marks: Number(row.marks ?? payload.marks),
      negative_marks: Number(row.negative_marks ?? payload.negative_marks),
      image_url: row.image_url || "",
      sort_order: Number(row.sort_order ?? payload.sort_order),
      created_at: row.created_at || new Date().toISOString(),
      question: row.question_text || qText,
      options: [row.option_a || optA, row.option_b || optB, row.option_c || optC, row.option_d || optD],
      correct_index:
        row.correct_option === "option_b" || row.correct_option === "B" || row.correct_option === "b" || row.correct_option === "2"
          ? 1
          : row.correct_option === "option_c" || row.correct_option === "C" || row.correct_option === "c" || row.correct_option === "3"
          ? 2
          : row.correct_option === "option_d" || row.correct_option === "D" || row.correct_option === "d" || row.correct_option === "4"
          ? 3
          : 0,
      topic: row.topic || q.topic || "সাধারণ",
      subject_id: row.subject_id || q.subject_id || "sub-1",
      subject_name: row.subject_name || q.subject_name || "",
      difficulty: row.difficulty || q.difficulty || "Medium",
      exam_type: row.exam_type || q.exam_type || "NTRCA",
      language: row.language || q.language || "bn",
      exam_scope: (row.free_exam_id || targetFreeExamId) ? "free" : "course",
    };

    console.log("✅ Successfully inserted Question row into Supabase:", formatted.id);
    return { data: formatted, error: null };
  } catch (err: any) {
    console.error("❌ Exception during dbCreateQuestion:", err);
    return { data: null, error: err?.message || "প্রশ্ন তৈরি করা সম্ভব হয়নি।" };
  }
}

export async function dbCreateBulkQuestions(
  qs: Partial<Question>[]
): Promise<ServiceResult<Question[]>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়। Settings থেকে সংযোগ নিশ্চিত করুন।" };

  try {
    if (qs.length === 0) return { data: [], error: null };

    const payloads = qs.map((q, idx) => {
      const hasExamId = q.exam_id && isValidUuid(q.exam_id);
      const hasFreeExamId = q.free_exam_id && isValidUuid(q.free_exam_id);

      const optA = (q.option_a || (q.options ? q.options[0] : "") || "ক").trim();
      const optB = (q.option_b || (q.options ? q.options[1] : "") || "খ").trim();
      const optC = (q.option_c || (q.options ? q.options[2] : "") || "গ").trim();
      const optD = (q.option_d || (q.options ? q.options[3] : "") || "ঘ").trim();
      const correctOpt = normalizeCorrectOption(q);

      const item: any = {
        exam_id: hasExamId ? q.exam_id : null,
        free_exam_id: hasFreeExamId ? q.free_exam_id : null,
        question_number: Number(q.question_number || idx + 1),
        question_text: (q.question_text || q.question || `প্রশ্ন ${idx + 1}`).trim(),
        arabic_text: q.arabic_text || null,
        option_a: optA,
        option_b: optB,
        option_c: optC,
        option_d: optD,
        correct_option: correctOpt,
        explanation: (q.explanation || "").trim(),
        source: q.source || null,
        topic: q.topic || "সাধারণ",
        subject_id: q.subject_id || "sub-1",
        subject_name: q.subject_name || "",
        difficulty: q.difficulty || "Medium",
        exam_type: q.exam_type || "NTRCA",
        language: q.language || "bn",
        marks: Number(q.marks ?? 1),
        negative_marks: Number(q.negative_marks ?? 0.25),
        image_url: q.image_url || null,
        sort_order: Number(q.sort_order ?? idx),
      };

      if (q.id && isValidUuid(q.id)) {
        item.id = q.id;
      }
      return item;
    });

    console.log(`🚀 Executing Supabase Bulk UPSERT on 'questions' (${payloads.length} items)`);

    let { data, error } = await supabase.from("questions").upsert(payloads).select();

    // Check constraint retry if needed
    if (error && (error.code === "23514" || error.message?.includes("check constraint") || error.message?.includes("correct_option"))) {
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
      const retryRes = await supabase.from("questions").upsert(altPayloads).select();
      data = retryRes.data;
      error = retryRes.error;
    }

    // Missing column or schema cache missing retry (e.g. arabic_text, free_exam_id, subject_name)
    if (error && (error.code === "42703" || error.code === "PGRST204" || error.message?.includes("schema cache") || error.message?.includes("column") || error.message?.includes("does not exist"))) {
      console.warn("⚠️ Bulk Insert encountered missing column / schema cache issue. Retrying with adaptive column stripping:", error.message);
      
      const fallbackPayloads = payloads.map((p) => {
        const item: any = { ...p };
        if (error.message.includes("arabic_text") || error.message.includes("schema cache")) {
          if (!item.question_text || item.question_text.startsWith("প্রশ্ন")) {
            item.question_text = item.arabic_text || item.question_text;
          }
          delete item.arabic_text;
        }
        if (error.message.includes("free_exam_id")) {
          if (!item.exam_id && item.free_exam_id) item.exam_id = item.free_exam_id;
          delete item.free_exam_id;
        }
        if (error.message.includes("subject_name")) delete item.subject_name;
        if (error.message.includes("topic")) delete item.topic;
        if (error.message.includes("source")) delete item.source;
        if (error.message.includes("language")) delete item.language;
        if (error.message.includes("image_url")) delete item.image_url;
        return item;
      });

      const retryRes = await supabase.from("questions").upsert(fallbackPayloads).select();
      data = retryRes.data;
      error = retryRes.error;

      // If still failing, strip ALL non-standard columns down to essential core
      if (error && (error.code === "42703" || error.code === "PGRST204" || error.message?.includes("schema cache") || error.message?.includes("column"))) {
        console.warn("⚠️ Retrying bulk insert with absolute minimal columns...");
        const minPayloads = payloads.map((p) => {
          const core: any = {
            question_number: p.question_number,
            question_text: p.question_text || p.arabic_text || "প্রশ্ন",
            option_a: p.option_a,
            option_b: p.option_b,
            option_c: p.option_c,
            option_d: p.option_d,
            correct_option: p.correct_option,
            explanation: p.explanation,
            marks: p.marks,
            negative_marks: p.negative_marks,
            sort_order: p.sort_order,
          };
          if (p.exam_id) core.exam_id = p.exam_id;
          if (p.id) core.id = p.id;
          return core;
        });
        const minRes = await supabase.from("questions").upsert(minPayloads).select();
        data = minRes.data;
        error = minRes.error;
      }
    }

    if (error) {
      console.error("❌ Supabase Bulk Insert Error:", error);
      return { data: null, error: error.message, errorObj: error };
    }

    const formatted: Question[] = ((data as any[]) || []).map((row, idx) => {
      const original = qs[idx] || {};
      return {
        id: row.id,
        exam_id: row.exam_id,
        free_exam_id: row.free_exam_id,
        question_number: Number(row.question_number || idx + 1),
        question_text: row.question_text,
        arabic_text: row.arabic_text || original.arabic_text,
        option_a: row.option_a,
        option_b: row.option_b,
        option_c: row.option_c,
        option_d: row.option_d,
        correct_option: row.correct_option,
        explanation: row.explanation || original.explanation || "",
        source: row.source || original.source || "",
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
        topic: row.topic || original.topic || "সাধারণ",
        subject_id: row.subject_id || original.subject_id || "sub-1",
        subject_name: row.subject_name || original.subject_name || "",
        difficulty: row.difficulty || original.difficulty || "Medium",
        exam_type: row.exam_type || original.exam_type || "NTRCA",
        language: row.language || original.language || "bn",
        exam_scope: row.free_exam_id ? "free" : "course",
      };
    });

    console.log(`✅ Bulk upserted ${formatted.length} questions into Supabase.`);
    return { data: formatted, error: null };
  } catch (err: any) {
    console.error("❌ Exception in dbCreateBulkQuestions:", err);
    return { data: null, error: err?.message || "বাল্ক প্রশ্ন সংরক্ষণ করা সম্ভব হয়নি।" };
  }
}

export async function dbSyncAllLocalQuestionsToSupabase(
  questions: Question[],
  exams: Exam[]
): Promise<ServiceResult<{ syncedQuestionsCount: number; syncedExamsCount: number; message: string }>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  try {
    let syncedQuestionsCount = 0;
    let syncedExamsCount = 0;

    // 1. Sync questions attached to each exam
    for (const ex of exams) {
      const isFree = Boolean(ex.is_free || ex.exam_scope === "free" || !ex.course_id);
      const exQuestions = Array.isArray(ex.questions) && ex.questions.length > 0
        ? ex.questions
        : questions.filter((q) => q.exam_id === ex.id || q.free_exam_id === ex.id);

      if (exQuestions.length > 0 && isValidUuid(ex.id)) {
        const res = await saveOrUpdateExamQuestions(ex.id, exQuestions, isFree);
        if (res.success) {
          syncedQuestionsCount += res.data.length || exQuestions.length;
          syncedExamsCount++;
        }
      }
    }

    // 2. Also sync unassigned questions from global question bank
    const unassigned = questions.filter(
      (q) => !q.exam_id && !q.free_exam_id
    );
    if (unassigned.length > 0) {
      const res = await dbCreateBulkQuestions(unassigned);
      if (res.data) {
        syncedQuestionsCount += res.data.length;
      }
    }

    return {
      data: {
        syncedQuestionsCount,
        syncedExamsCount,
        message: `${syncedQuestionsCount}টি প্রশ্ন এবং ${syncedExamsCount}টি পরীক্ষা সফলভাবে Supabase-এ সিঙ্ক ও সংরক্ষিত হয়েছে।`,
      },
      error: null,
    };
  } catch (err: any) {
    return { data: null, error: err?.message || "সব প্রশ্ন সিঙ্ক করতে সমস্যা হয়েছে।" };
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

    if (q.arabic_text !== undefined) payload.arabic_text = q.arabic_text ? q.arabic_text.trim() : null;
    if (q.subject_id !== undefined) payload.subject_id = q.subject_id;
    if (q.subject_name !== undefined) payload.subject_name = q.subject_name;
    if (q.topic !== undefined) payload.topic = q.topic;
    if (q.source !== undefined) payload.source = q.source;
    if (q.language !== undefined) payload.language = q.language;
    if (q.difficulty !== undefined) payload.difficulty = q.difficulty;
    if (q.exam_type !== undefined) payload.exam_type = q.exam_type;

    let { data, error } = await supabase
      .from("questions")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    // Column missing retry for update
    if (error && (error.code === "42703" || error.code === "PGRST204" || error.message?.includes("schema cache") || error.message?.includes("column") || error.message?.includes("does not exist"))) {
      const cleanPayload = { ...payload };
      if (error.message.includes("arabic_text") || error.message.includes("schema cache")) delete cleanPayload.arabic_text;
      if (error.message.includes("free_exam_id")) delete cleanPayload.free_exam_id;
      if (error.message.includes("subject_name")) delete cleanPayload.subject_name;
      if (error.message.includes("topic")) delete cleanPayload.topic;
      if (error.message.includes("source")) delete cleanPayload.source;
      if (error.message.includes("language")) delete cleanPayload.language;
      if (error.message.includes("image_url")) delete cleanPayload.image_url;

      const retryRes = await supabase.from("questions").update(cleanPayload).eq("id", id).select().single();
      data = retryRes.data;
      error = retryRes.error;
    }

    if (error && (error.code === "23514" || error.message.includes("check constraint") || error.message.includes("correct_option"))) {
      const cIdx = getQuestionCorrectIndex(q);
      for (const format of CORRECT_OPTION_FORMAT_CANDIDATES) {
        payload.correct_option = format[cIdx] || format[0];
        const retryRes = await supabase.from("questions").update(payload).eq("id", id).select().single();
        if (!retryRes.error && retryRes.data) {
          data = retryRes.data;
          error = null;
          break;
        }
        error = retryRes.error;
      }
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
      subject_name: q.subject_name || "",
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

      let { error } = await supabase
        .from("questions")
        .update(updatePayload)
        .in("id", validQIds);

      // Fallback if free_exam_id column does not exist on older DB schema
      if (error && (error.code === "42703" || error.message?.includes("does not exist") || error.message?.includes("free_exam_id"))) {
        const fbPayload = { exam_id: examId };
        const retry = await supabase.from("questions").update(fbPayload).in("id", validQIds);
        error = retry.error;
      }

      if (error) {
        console.error("❌ dbAssignQuestionsToExam error:", error);
        return { data: false, error: error.message };
      }
    }

    // Also update total_questions count on the target exam table
    const targetTable = isFreeExam ? "free_exams" : "course_exams";
    let { error: countErr } = await supabase
      .from(targetTable)
      .update({ total_questions: questionIds.length, total_marks: questionIds.length })
      .eq("id", examId);

    if (countErr) {
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

