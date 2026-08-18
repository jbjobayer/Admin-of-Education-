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

    const formatted: Course[] = ((data as any[]) || []).map((row) => ({
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
      total_exams: Number(row.total_exams || 0),
      total_modules: Number(row.total_modules || 0),
      sort_order: Number(row.sort_order || 0),
      created_at: row.created_at || new Date().toISOString(),
      updated_at: row.updated_at,
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
    }));

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
// 7. EXAMS CRUD
// -------------------------------------------------------------
export async function dbFetchExams(): Promise<ServiceResult<Exam[]>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  try {
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Supabase SELECT 'exams' Error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return {
        data: null,
        error: error.message,
        errorObj: {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        },
      };
    }

    // Also fetch all questions from Supabase questions table to link with exams
    let allQuestionsMap: Record<string, Question[]> = {};
    let allQuestionsList: Question[] = [];
    try {
      const { data: qData, error: qError } = await supabase
        .from("questions")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (!qError && qData) {
        allQuestionsList = (qData as any[]).map((row) => {
          const optionsArr = [
            row.option_a || "",
            row.option_b || "",
            row.option_c || "",
            row.option_d || "",
          ];
          let correctIdx = 0;
          if (row.correct_option === "option_b" || row.correct_option === "b" || row.correct_option === "১") correctIdx = 1;
          else if (row.correct_option === "option_c" || row.correct_option === "c" || row.correct_option === "২") correctIdx = 2;
          else if (row.correct_option === "option_d" || row.correct_option === "d" || row.correct_option === "৩") correctIdx = 3;

          return {
            id: row.id,
            exam_id: row.exam_id || undefined,
            question_number: row.question_number || 1,
            question_text: row.question_text || row.question || "",
            arabic_text: row.arabic_text || undefined,
            option_a: row.option_a || optionsArr[0] || "",
            option_b: row.option_b || optionsArr[1] || "",
            option_c: row.option_c || optionsArr[2] || "",
            option_d: row.option_d || optionsArr[3] || "",
            correct_option: row.correct_option || "option_a",
            explanation: row.explanation || "",
            source: row.source || "",
            marks: Number(row.marks || 1),
            negative_marks: Number(row.negative_marks || 0.25),
            image_url: row.image_url || "",
            sort_order: row.sort_order || 0,
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
          };
        });

        for (const q of allQuestionsList) {
          if (q.exam_id) {
            if (!allQuestionsMap[q.exam_id]) {
              allQuestionsMap[q.exam_id] = [];
            }
            allQuestionsMap[q.exam_id].push(q);
          }
        }
      }
    } catch (errQ) {
      console.warn("Could not batch load questions for exams:", errQ);
    }

    const formatted: Exam[] = ((data as any[]) || []).map((row) => {
      // 1. Check if direct row has questions
      let examQuestions: Question[] = Array.isArray(row.questions) && row.questions.length > 0 ? row.questions : [];
      
      // 2. If not, get questions attached by exam_id in questions table
      if (examQuestions.length === 0 && row.id && allQuestionsMap[row.id]) {
        examQuestions = allQuestionsMap[row.id];
      }

      // 3. If still empty, match questions by subject if available in allQuestionsList
      if (examQuestions.length === 0 && allQuestionsList.length > 0) {
        const subMatch = allQuestionsList.filter(
          (q) =>
            (row.subject && q.subject_name && q.subject_name.toLowerCase().includes(row.subject.toLowerCase())) ||
            (row.subject && q.subject_id && row.subject.includes(q.subject_id))
        );
        if (subMatch.length > 0) {
          examQuestions = subMatch.slice(0, row.total_questions || 10);
        }
      }

      return {
        id: row.id,
        course_id: row.course_id || undefined,
        title: row.title || "মডেল টেস্ট",
        description: row.description || "",
        exam_type: row.exam_type || "model_test",
        total_questions: Number(examQuestions.length || row.total_questions || 0),
        duration_minutes: Number(row.duration_minutes || 30),
        total_marks: Number(row.total_marks || (examQuestions.length > 0 ? examQuestions.length : 50)),
        negative_mark: Number(row.negative_mark ?? row.negative_marking ?? 0.25),
        pass_mark: Number(row.pass_mark ?? row.pass_marks ?? 20),
        exam_date: row.exam_date || row.start_time || new Date().toISOString(),
        is_free: Boolean(row.is_free),
        is_published: row.is_published !== undefined ? Boolean(row.is_published) : true,
        sort_order: Number(row.sort_order || 0),
        created_at: row.created_at || new Date().toISOString(),
        updated_at: row.updated_at,
        // UI compatibility fields:
        category: row.category || (row.exam_type === "live_exam" ? "daily_live" : row.exam_type === "full_test" ? "premium_ntrca" : "weekly_model_test"),
        subject: row.subject || "সাধারণ ও মাদ্রাসা কারিকুলাম",
        syllabus: row.syllabus || row.description || "সম্পূর্ণ সিলেবাস ভিত্তিক মডেল টেস্ট",
        pass_marks: Number(row.pass_marks ?? row.pass_mark ?? 20),
        negative_marking: Number(row.negative_marking ?? row.negative_mark ?? 0.25),
        start_time: row.start_time || row.exam_date || new Date().toISOString(),
        end_time: row.end_time || new Date(Date.now() + 86400000).toISOString(),
        result_published: Boolean(row.result_published),
        status: row.status || (row.is_published ? "live" : "upcoming"),
        questions: examQuestions,
        participant_count: Number(row.participant_count || 0),
        banner_image: row.banner_image || "",
        is_featured: Boolean(row.is_featured),
      };
    });

    return { data: formatted, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "পরীক্ষা তালিকা লোড করতে সমস্যা হয়েছে।" };
  }
}

export async function dbCreateExam(
  exam: Omit<Exam, "id" | "created_at" | "updated_at">
): Promise<ServiceResult<Exam>> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn("⚠️ Supabase Client is not connected. (Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).");
    return {
      data: null,
      error: "Supabase ক্লায়েন্ট সংযুক্ত নয়। দয়া করে Supabase Studio ট্যাবে URL ও Anon Key দিন।",
      errorObj: {
        message: "Supabase client not initialized (missing URL or Anon Key).",
        code: "CLIENT_NOT_INITIALIZED",
      },
    };
  }

  try {
    // Map category / exam_type safely to Postgres allowed enum values:
    // 'model_test', 'daily_test', 'chapter_test', 'full_test', 'live_exam'
    let examType = exam.exam_type || "model_test";
    if (exam.category === "daily_live" || examType === "daily_live") examType = "live_exam";
    else if (exam.category === "premium_ntrca" || examType === "premium_ntrca") examType = "full_test";
    else if (exam.category === "free_test") examType = "model_test";
    else if (!["model_test", "daily_test", "chapter_test", "full_test", "live_exam"].includes(examType)) {
      examType = "model_test";
    }

    const payload = {
      course_id: isValidUuid(exam.course_id) ? exam.course_id : null,
      title: (exam.title || "নতুন মডেল টেস্ট").trim(),
      description: (exam.description || exam.syllabus || exam.subject || "").trim(),
      exam_type: examType,
      total_questions: Number(exam.total_questions || (exam.questions ? exam.questions.length : 0)),
      duration_minutes: Number(exam.duration_minutes || 30),
      total_marks: Number(exam.total_marks || (exam.questions ? exam.questions.length : 50)),
      negative_mark: Number(exam.negative_mark ?? exam.negative_marking ?? 0.25),
      pass_mark: Number(exam.pass_mark ?? exam.pass_marks ?? 20),
      exam_date: exam.exam_date || exam.start_time || new Date().toISOString(),
      is_free: Boolean(exam.is_free || exam.category === "free_test"),
      is_published: exam.is_published !== undefined ? Boolean(exam.is_published) : true,
      sort_order: Number(exam.sort_order || 0),
    };

    console.log("🚀 Executing Supabase INSERT into 'exams':", payload);

    const { data, error } = await supabase.from("exams").insert(payload).select().single();

    if (error) {
      console.error("❌ Supabase INSERT 'exams' Error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        payload,
      });
      return {
        data: null,
        error: error.message,
        errorObj: {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        },
      };
    }

    console.log("✅ Supabase Exam row created successfully in 'exams' table:", data);

    // If there are questions attached to this exam, insert them into 'questions' table
    if (exam.questions && Array.isArray(exam.questions) && exam.questions.length > 0 && data?.id) {
      try {
        const questionPayloads = exam.questions.map((q, idx) => {
          const optA = q.option_a || (q.options ? q.options[0] : "") || "ক";
          const optB = q.option_b || (q.options ? q.options[1] : "") || "খ";
          const optC = q.option_c || (q.options ? q.options[2] : "") || "গ";
          const optD = q.option_d || (q.options ? q.options[3] : "") || "ঘ";

          let correctOpt = q.correct_option || "option_a";
          if (q.correct_index !== undefined) {
            const mapIdx: Record<number, string> = { 0: "option_a", 1: "option_b", 2: "option_c", 3: "option_d" };
            correctOpt = mapIdx[q.correct_index] || "option_a";
          }

          return {
            exam_id: data.id,
            question_number: q.question_number || idx + 1,
            question_text: (q.question_text || q.question || "").trim(),
            option_a: optA,
            option_b: optB,
            option_c: optC,
            option_d: optD,
            correct_option: correctOpt,
            explanation: q.explanation || "",
            marks: Number(q.marks || 1),
            negative_marks: Number(q.negative_marks || payload.negative_mark || 0.25),
            image_url: q.image_url || null,
            sort_order: idx,
          };
        });

        console.log(`🚀 Executing Supabase Bulk INSERT into 'questions' for exam ${data.id}:`, questionPayloads.length);
        const { error: qError } = await supabase.from("questions").insert(questionPayloads);
        if (qError) {
          console.error("❌ Supabase INSERT 'questions' for exam failed:", {
            message: qError.message,
            details: qError.details,
            hint: qError.hint,
            code: qError.code,
          });
        } else {
          console.log(`✅ Supabase ${questionPayloads.length} questions attached to exam ${data.id} successfully.`);
        }
      } catch (qErr) {
        console.error("Exception inserting exam questions:", qErr);
      }
    }

    const createdExam: Exam = {
      ...exam,
      ...data,
      questions: exam.questions || [],
    };

    return { data: createdExam, error: null };
  } catch (err: any) {
    console.error("❌ Unexpected Exception in dbCreateExam:", err);
    return {
      data: null,
      error: err?.message || "পরীক্ষা তৈরি করা সম্ভব হয়নি।",
      errorObj: {
        message: err?.message || "Unexpected exception",
        code: "UNEXPECTED_ERROR",
      },
    };
  }
}

export async function dbUpdateExam(id: string, exam: Partial<Exam>): Promise<ServiceResult<Exam>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  // If the ID is a temporary local string (e.g. "exam-1786876191136"), insert as a real DB row instead of failing with 22P02
  if (!isValidUuid(id)) {
    console.warn(`⚠️ Exam ID "${id}" is not a valid UUID. Auto-inserting as new exam in Supabase.`);
    return dbCreateExam(exam as any);
  }

  try {
    const payload: any = {};
    if (exam.course_id !== undefined) payload.course_id = isValidUuid(exam.course_id) ? exam.course_id : null;
    if (exam.title !== undefined) payload.title = exam.title.trim();
    if (exam.description !== undefined || exam.syllabus !== undefined || exam.subject !== undefined) {
      payload.description = (exam.description || exam.syllabus || exam.subject || "").trim();
    }
    if (exam.exam_type !== undefined || exam.category !== undefined) {
      let et = exam.exam_type || "model_test";
      if (exam.category === "daily_live" || et === "daily_live") et = "live_exam";
      else if (exam.category === "premium_ntrca" || et === "premium_ntrca") et = "full_test";
      else if (["model_test", "daily_test", "chapter_test", "full_test", "live_exam"].includes(et)) {
        // valid
      } else {
        et = "model_test";
      }
      payload.exam_type = et;
    }
    if (exam.total_questions !== undefined) payload.total_questions = Number(exam.total_questions);
    if (exam.duration_minutes !== undefined) payload.duration_minutes = Number(exam.duration_minutes);
    if (exam.total_marks !== undefined) payload.total_marks = Number(exam.total_marks);
    if (exam.negative_mark !== undefined || exam.negative_marking !== undefined) {
      payload.negative_mark = Number(exam.negative_mark ?? exam.negative_marking ?? 0.25);
    }
    if (exam.pass_mark !== undefined || exam.pass_marks !== undefined) {
      payload.pass_mark = Number(exam.pass_mark ?? exam.pass_marks ?? 20);
    }
    if (exam.exam_date !== undefined || exam.start_time !== undefined) {
      payload.exam_date = exam.exam_date || exam.start_time;
    }
    if (exam.is_free !== undefined) payload.is_free = Boolean(exam.is_free);
    if (exam.is_published !== undefined) payload.is_published = Boolean(exam.is_published);
    if (exam.sort_order !== undefined) payload.sort_order = Number(exam.sort_order);

    console.log(`🚀 Executing Supabase UPDATE on 'exams' (${id}):`, payload);

    const { data, error } = await supabase
      .from("exams")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("❌ Supabase UPDATE 'exams' Error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        payload,
      });
      return {
        data: null,
        error: error.message,
        errorObj: {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        },
      };
    }
    return { data: data as Exam, error: null };
  } catch (err: any) {
    console.error("❌ Unexpected Error in dbUpdateExam:", err);
    return {
      data: null,
      error: err?.message || "পরীক্ষা আপডেট করা যায়নি।",
      errorObj: {
        message: err?.message || "Unexpected exception",
        code: "UNEXPECTED_ERROR",
      },
    };
  }
}

export async function dbDeleteExam(id: string): Promise<ServiceResult<boolean>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: false, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  if (!isValidUuid(id)) {
    return { data: true, error: null };
  }

  try {
    console.log(`🚀 Executing Supabase DELETE on 'exams' (${id})`);
    const { error } = await supabase.from("exams").delete().eq("id", id);
    if (error) {
      console.error("❌ Supabase DELETE 'exams' Error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return {
        data: false,
        error: error.message,
        errorObj: {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        },
      };
    }
    return { data: true, error: null };
  } catch (err: any) {
    console.error("❌ Unexpected Error in dbDeleteExam:", err);
    return {
      data: false,
      error: err?.message || "পরীক্ষা মুছে ফেলা যায়নি।",
      errorObj: {
        message: err?.message || "Unexpected exception",
        code: "UNEXPECTED_ERROR",
      },
    };
  }
}

// -------------------------------------------------------------
// 8. QUESTIONS CRUD (প্রশ্ন ব্যাংক হাব)
// -------------------------------------------------------------
export async function dbFetchQuestions(examId?: string): Promise<ServiceResult<Question[]>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  try {
    let query = supabase.from("questions").select("*");
    if (examId) {
      if (!isValidUuid(examId)) {
        return { data: [], error: null };
      }
      query = query.eq("exam_id", examId);
    }
    const { data, error } = await query
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) return { data: null, error: error.message };

    // Format into standard Question entity with rich fallback mappings
    const formatted: Question[] = ((data as any[]) || []).map((row) => {
      const optionsArr = [
        row.option_a || "",
        row.option_b || "",
        row.option_c || "",
        row.option_d || "",
      ];
      let correctIdx = 0;
      if (row.correct_option === "option_b" || row.correct_option === "b" || row.correct_option === "১") correctIdx = 1;
      else if (row.correct_option === "option_c" || row.correct_option === "c" || row.correct_option === "২") correctIdx = 2;
      else if (row.correct_option === "option_d" || row.correct_option === "d" || row.correct_option === "৩") correctIdx = 3;

      return {
        id: row.id,
        exam_id: row.exam_id || undefined,
        question_number: row.question_number || 1,
        question_text: row.question_text || row.question || "",
        arabic_text: row.arabic_text || undefined,
        option_a: row.option_a || optionsArr[0] || "",
        option_b: row.option_b || optionsArr[1] || "",
        option_c: row.option_c || optionsArr[2] || "",
        option_d: row.option_d || optionsArr[3] || "",
        correct_option: row.correct_option || "option_a",
        explanation: row.explanation || "",
        source: row.source || "",
        marks: Number(row.marks || 1),
        negative_marks: Number(row.negative_marks || 0.25),
        image_url: row.image_url || "",
        sort_order: row.sort_order || 0,
        created_at: row.created_at || new Date().toISOString(),
        // UI helper properties:
        question: row.question_text || row.question || "",
        options: optionsArr,
        correct_index: correctIdx,
        topic: row.topic || "সাধারণ",
        subject_id: row.subject_id || "sub-1",
        subject_name: row.subject_name || "মাদ্রাসা কারিকুলাম",
        difficulty: row.difficulty || "Medium",
        exam_type: row.exam_type || "NTRCA",
        language: row.language || "bn",
      };
    });

    return { data: formatted, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "প্রশ্ন লোড করতে সমস্যা হয়েছে।" };
  }
}

export async function dbCreateQuestion(
  q: Partial<Question> & { exam_id?: string; question_text?: string; question?: string }
): Promise<ServiceResult<Question>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  try {
    const qText = (q.question_text || q.question || "").trim();
    if (!qText) {
      return { data: null, error: "প্রশ্নের বিবরণ দেওয়া আবশ্যক।" };
    }

    const optA = q.option_a || (q.options ? q.options[0] : "") || "ক";
    const optB = q.option_b || (q.options ? q.options[1] : "") || "খ";
    const optC = q.option_c || (q.options ? q.options[2] : "") || "গ";
    const optD = q.option_d || (q.options ? q.options[3] : "") || "ঘ";

    let correctOpt = q.correct_option || "option_a";
    if (q.correct_index !== undefined) {
      const mapIdx: Record<number, string> = { 0: "option_a", 1: "option_b", 2: "option_c", 3: "option_d" };
      correctOpt = mapIdx[q.correct_index] || "option_a";
    }

    const targetExamId = isValidUuid(q.exam_id) ? q.exam_id : null;

    // Try rich payload first
    const richPayload: any = {
      question_number: q.question_number || 1,
      question_text: qText,
      arabic_text: q.arabic_text || null,
      option_a: optA,
      option_b: optB,
      option_c: optC,
      option_d: optD,
      correct_option: correctOpt,
      explanation: q.explanation || "",
      source: q.source || null,
      subject_id: q.subject_id || "sub-1",
      subject_name: q.subject_name || "মাদ্রাসা কারিকুলাম",
      topic: q.topic || "সাধারণ",
      difficulty: q.difficulty || "Medium",
      exam_type: q.exam_type || "NTRCA",
      language: q.language || "bn",
      marks: Number(q.marks || 1),
      negative_marks: Number(q.negative_marks || 0.25),
      image_url: q.image_url || null,
      sort_order: q.sort_order || 0,
    };
    if (targetExamId) {
      richPayload.exam_id = targetExamId;
    }

    let insertRes = await supabase.from("questions").insert(richPayload).select().single();

    // Fallback if custom columns don't exist in Supabase yet (42703)
    if (insertRes.error && (insertRes.error.code === "42703" || insertRes.error.message.includes("column"))) {
      const basePayload: any = {
        question_number: q.question_number || 1,
        question_text: qText,
        option_a: optA,
        option_b: optB,
        option_c: optC,
        option_d: optD,
        correct_option: correctOpt,
        explanation: q.explanation || "",
        marks: Number(q.marks || 1),
        negative_marks: Number(q.negative_marks || 0.25),
        image_url: q.image_url || null,
        sort_order: q.sort_order || 0,
      };
      if (targetExamId) {
        basePayload.exam_id = targetExamId;
      }
      insertRes = await supabase.from("questions").insert(basePayload).select().single();
    }

    if (insertRes.error) {
      return { data: null, error: insertRes.error.message, errorObj: insertRes.error };
    }

    const data = insertRes.data;
    const formatted: Question = {
      id: data.id,
      exam_id: data.exam_id || q.exam_id,
      question_number: data.question_number || 1,
      question_text: data.question_text || qText,
      arabic_text: data.arabic_text || q.arabic_text,
      option_a: data.option_a || optA,
      option_b: data.option_b || optB,
      option_c: data.option_c || optC,
      option_d: data.option_d || optD,
      correct_option: data.correct_option || correctOpt,
      explanation: data.explanation || q.explanation || "",
      source: data.source || q.source || "",
      marks: Number(data.marks || q.marks || 1),
      negative_marks: Number(data.negative_marks || q.negative_marks || 0.25),
      image_url: data.image_url || q.image_url || "",
      sort_order: data.sort_order || 0,
      created_at: data.created_at || new Date().toISOString(),
      question: data.question_text || qText,
      options: [data.option_a || optA, data.option_b || optB, data.option_c || optC, data.option_d || optD],
      correct_index:
        data.correct_option === "option_b" || data.correct_option === "b"
          ? 1
          : data.correct_option === "option_c" || data.correct_option === "c"
          ? 2
          : data.correct_option === "option_d" || data.correct_option === "d"
          ? 3
          : 0,
      topic: data.topic || q.topic || "সাধারণ",
      subject_id: data.subject_id || q.subject_id || "sub-1",
      subject_name: data.subject_name || q.subject_name || "মাদ্রাসা কারিকুলাম",
      difficulty: data.difficulty || q.difficulty || "Medium",
      exam_type: data.exam_type || q.exam_type || "NTRCA",
      language: data.language || q.language || "bn",
    };

    return { data: formatted, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "প্রশ্ন তৈরি করা সম্ভব হয়নি।" };
  }
}

export async function dbCreateBulkQuestions(
  qs: Partial<Question>[]
): Promise<ServiceResult<Question[]>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  try {
    if (qs.length === 0) return { data: [], error: null };

    const buildPayloads = (rich: boolean) =>
      qs.map((q, idx) => {
        const optA = q.option_a || (q.options ? q.options[0] : "") || "ক";
        const optB = q.option_b || (q.options ? q.options[1] : "") || "খ";
        const optC = q.option_c || (q.options ? q.options[2] : "") || "গ";
        const optD = q.option_d || (q.options ? q.options[3] : "") || "ঘ";

        let correctOpt = q.correct_option || "option_a";
        if (q.correct_index !== undefined) {
          const mapIdx: Record<number, string> = { 0: "option_a", 1: "option_b", 2: "option_c", 3: "option_d" };
          correctOpt = mapIdx[q.correct_index] || "option_a";
        }

        const resolvedExamId = isValidUuid(q.exam_id) ? q.exam_id : null;

        const baseObj: any = {
          question_number: q.question_number || idx + 1,
          question_text: (q.question_text || q.question || "").trim(),
          option_a: optA,
          option_b: optB,
          option_c: optC,
          option_d: optD,
          correct_option: correctOpt,
          explanation: q.explanation || "",
          marks: Number(q.marks || 1),
          negative_marks: Number(q.negative_marks || 0.25),
          sort_order: idx,
        };
        if (resolvedExamId) {
          baseObj.exam_id = resolvedExamId;
        }

        if (rich) {
          return {
            ...baseObj,
            arabic_text: q.arabic_text || null,
            source: q.source || null,
            subject_id: q.subject_id || "sub-1",
            subject_name: q.subject_name || "মাদ্রাসা কারিকুলাম",
            topic: q.topic || "সাধারণ",
            difficulty: q.difficulty || "Medium",
            exam_type: q.exam_type || "NTRCA",
            language: q.language || "bn",
          };
        }
        return baseObj;
      });

    let insertRes = await supabase.from("questions").insert(buildPayloads(true)).select();

    // Fallback if rich columns missing
    if (insertRes.error && (insertRes.error.code === "42703" || insertRes.error.message.includes("column"))) {
      insertRes = await supabase.from("questions").insert(buildPayloads(false)).select();
    }

    if (insertRes.error) {
      return { data: null, error: insertRes.error.message, errorObj: insertRes.error };
    }

    const formatted: Question[] = ((insertRes.data as any[]) || []).map((row, idx) => {
      const original = qs[idx] || {};
      return {
        id: row.id,
        exam_id: row.exam_id || original.exam_id,
        question_number: row.question_number || idx + 1,
        question_text: row.question_text,
        arabic_text: row.arabic_text || original.arabic_text,
        option_a: row.option_a,
        option_b: row.option_b,
        option_c: row.option_c,
        option_d: row.option_d,
        correct_option: row.correct_option,
        explanation: row.explanation || original.explanation || "",
        source: row.source || original.source || "",
        marks: Number(row.marks || original.marks || 1),
        negative_marks: Number(row.negative_marks || original.negative_marks || 0.25),
        sort_order: row.sort_order || idx,
        created_at: row.created_at || new Date().toISOString(),
        question: row.question_text,
        options: [row.option_a, row.option_b, row.option_c, row.option_d],
        correct_index:
          row.correct_option === "option_b" || row.correct_option === "b"
            ? 1
            : row.correct_option === "option_c" || row.correct_option === "c"
            ? 2
            : row.correct_option === "option_d" || row.correct_option === "d"
            ? 3
            : 0,
        topic: row.topic || original.topic || "সাধারণ",
        subject_id: row.subject_id || original.subject_id || "sub-1",
        subject_name: row.subject_name || original.subject_name || "মাদ্রাসা কারিকুলাম",
        difficulty: row.difficulty || original.difficulty || "Medium",
        exam_type: row.exam_type || original.exam_type || "NTRCA",
        language: row.language || original.language || "bn",
      };
    });

    return { data: formatted, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "বাল্ক প্রশ্ন সংরক্ষণ করা যায়নি।" };
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
    if (q.question_text !== undefined || q.question !== undefined) {
      payload.question_text = (q.question_text || q.question || "").trim();
    }
    if (q.arabic_text !== undefined) payload.arabic_text = q.arabic_text;
    if (q.option_a !== undefined) payload.option_a = q.option_a;
    if (q.option_b !== undefined) payload.option_b = q.option_b;
    if (q.option_c !== undefined) payload.option_c = q.option_c;
    if (q.option_d !== undefined) payload.option_d = q.option_d;

    if (q.options && q.options.length >= 4) {
      payload.option_a = q.options[0];
      payload.option_b = q.options[1];
      payload.option_c = q.options[2];
      payload.option_d = q.options[3];
    }

    if (q.correct_option !== undefined) {
      payload.correct_option = q.correct_option;
    } else if (q.correct_index !== undefined) {
      const mapIdx: Record<number, string> = { 0: "option_a", 1: "option_b", 2: "option_c", 3: "option_d" };
      payload.correct_option = mapIdx[q.correct_index] || "option_a";
    }

    if (q.explanation !== undefined) payload.explanation = q.explanation;
    if (q.source !== undefined) payload.source = q.source;
    if (q.subject_id !== undefined) payload.subject_id = q.subject_id;
    if (q.subject_name !== undefined) payload.subject_name = q.subject_name;
    if (q.topic !== undefined) payload.topic = q.topic;
    if (q.difficulty !== undefined) payload.difficulty = q.difficulty;
    if (q.exam_type !== undefined) payload.exam_type = q.exam_type;
    if (q.language !== undefined) payload.language = q.language;
    if (q.marks !== undefined) payload.marks = Number(q.marks);
    if (q.negative_marks !== undefined) payload.negative_marks = Number(q.negative_marks);
    if (q.image_url !== undefined) payload.image_url = q.image_url;
    if (q.sort_order !== undefined) payload.sort_order = q.sort_order;

    let updateRes = await supabase
      .from("questions")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    // Fallback if some columns not present in Supabase
    if (updateRes.error && (updateRes.error.code === "42703" || updateRes.error.message.includes("column"))) {
      const corePayload: any = {
        question_text: payload.question_text,
        option_a: payload.option_a,
        option_b: payload.option_b,
        option_c: payload.option_c,
        option_d: payload.option_d,
        correct_option: payload.correct_option,
        explanation: payload.explanation,
        marks: payload.marks,
        negative_marks: payload.negative_marks,
      };
      Object.keys(corePayload).forEach((k) => corePayload[k] === undefined && delete corePayload[k]);
      updateRes = await supabase.from("questions").update(corePayload).eq("id", id).select().single();
    }

    if (updateRes.error) return { data: null, error: updateRes.error.message };

    const data = updateRes.data;
    const formatted: Question = {
      ...data,
      question: data.question_text,
      options: [data.option_a, data.option_b, data.option_c, data.option_d],
      correct_index:
        data.correct_option === "option_b" || data.correct_option === "b"
          ? 1
          : data.correct_option === "option_c" || data.correct_option === "c"
          ? 2
          : data.correct_option === "option_d" || data.correct_option === "d"
          ? 3
          : 0,
      topic: data.topic || q.topic || "সাধারণ",
      subject_id: data.subject_id || q.subject_id || "sub-1",
      subject_name: data.subject_name || q.subject_name || "মাদ্রাসা কারিকুলাম",
    };

    return { data: formatted, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "প্রশ্ন আপডেট করা যায়নি।" };
  }
}

export async function dbDeleteQuestion(id: string): Promise<ServiceResult<boolean>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: false, error: "Supabase ক্লায়েন্ট সংযুক্ত নয়।" };

  if (!isValidUuid(id)) {
    return { data: true, error: null };
  }

  try {
    const { error } = await supabase.from("questions").delete().eq("id", id);
    if (error) return { data: false, error: error.message };
    return { data: true, error: null };
  } catch (err: any) {
    return { data: false, error: err?.message || "প্রশ্ন মুছে ফেলা যায়নি।" };
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
      profiles:user_id (full_name, avatar_url),
      exams:exam_id (title),
      courses:course_id (title)
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
      exam_title: row.exams?.title || "মডেল টেস্ট",
      course_title: row.courses?.title,
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
