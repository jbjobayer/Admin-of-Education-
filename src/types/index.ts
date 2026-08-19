export type UserRole = "admin" | "student" | "moderator";

export type SubscriptionPlanId = "free" | "monthly" | "quarterly" | "half_yearly" | "yearly";

export interface Profile {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
  avatar_url?: string;
  role: UserRole;
  is_active?: boolean;
  is_premium?: boolean;
  subscription_plan?: SubscriptionPlanId;
  subscription_expiry?: string;
  madrasah_name?: string;
  district?: string;
  created_at: string;
  updated_at?: string;
}

export type QuestionDifficulty = "Easy" | "Medium" | "Hard";
export type ExamTargetCategory = "NTRCA" | "Dakhil" | "Alim" | "Fazil" | "Kamil" | "Madrasah Directorate" | "BCS" | "General";

export interface Question {
  id: string;
  exam_id?: string | null; // References course_exams.id (for Course Exams)
  free_exam_id?: string | null; // References free_exams.id (for Free Exams / Model Tests)
  question_number?: number;
  question_text?: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correct_option?: string;
  explanation: string;
  marks?: number;
  negative_marks?: number;
  image_url?: string;
  sort_order?: number;
  created_at: string;
  // UI & convenience properties:
  question: string;
  options: string[];
  correct_index: number;
  subject_id: string;
  subject_name: string;
  topic: string;
  arabic_text?: string;
  source?: string;
  difficulty: QuestionDifficulty;
  exam_type: ExamTargetCategory;
  tags?: string[];
  language?: "bn" | "en" | "ar" | "mixed";
  exam_scope?: "course" | "free";
}

export type ExamCategory = "free_test" | "daily_live" | "weekly_model_test" | "monthly_mega" | "premium_ntrca" | "model_test" | "daily_test" | "chapter_test" | "full_test" | "live_exam";
export type ExamStatus = "upcoming" | "live" | "completed" | "archived";

export interface Exam {
  id: string;
  course_id?: string | null; // Mandatory for Course Exam, null for Free Exam
  title: string;
  description?: string;
  exam_type?: "model_test" | "daily_test" | "chapter_test" | "full_test" | "live_exam" | string;
  total_questions?: number;
  duration_minutes: number;
  total_marks: number;
  negative_mark?: number;
  pass_mark?: number;
  exam_date?: string;
  is_free?: boolean;
  is_published?: boolean;
  is_active?: boolean;
  sort_order?: number;
  created_at: string;
  updated_at?: string;
  // UI / helper properties:
  category?: ExamCategory;
  subject?: string;
  syllabus?: string;
  pass_marks?: number;
  negative_marking?: number;
  start_time?: string;
  end_time?: string;
  result_published?: boolean;
  status?: ExamStatus;
  questions?: Question[];
  participant_count?: number;
  banner_image?: string;
  is_featured?: boolean;
  exam_scope?: "course" | "free";
}

export interface CourseExam {
  id: string;
  course_id: string; // Mandatory valid UUID
  title: string;
  description?: string;
  exam_type?: "model_test" | "daily_test" | "chapter_test" | "full_test" | "live_exam" | string;
  total_questions?: number;
  duration_minutes: number;
  total_marks: number;
  negative_mark?: number;
  pass_mark?: number;
  exam_date?: string;
  is_free?: boolean;
  is_published?: boolean;
  sort_order?: number;
  created_at: string;
  updated_at?: string;
  subject?: string;
  syllabus?: string;
  status?: ExamStatus;
  category?: ExamCategory;
  questions?: Question[];
  participant_count?: number;
  exam_scope?: "course";
}

export interface FreeExam {
  id: string;
  title: string;
  description?: string;
  total_marks: number;
  duration_minutes: number;
  created_at: string;
  is_active: boolean;
  subject?: string;
  exam_type?: string;
  total_questions?: number;
  negative_mark?: number;
  pass_mark?: number;
  exam_date?: string;
  is_free?: boolean;
  is_published?: boolean;
  sort_order?: number;
  updated_at?: string;
  syllabus?: string;
  status?: ExamStatus;
  category?: ExamCategory;
  questions?: Question[];
  participant_count?: number;
  exam_scope?: "free";
}

export interface ExamSubmission {
  id: string;
  exam_id: string;
  exam_title: string;
  user_id: string;
  user_name: string;
  user_phone?: string;
  madrasah_name?: string;
  score: number;
  total_marks: number;
  correct_count: number;
  wrong_count: number;
  unanswered_count: number;
  time_taken_seconds: number;
  rank?: number;
  answers: Record<string, number>;
  submitted_at: string;
}

export interface CourseButton {
  id: string;
  label: string;
  action_type: "pdf_url" | "video_url" | "payment_drawer" | "external_link" | "custom_modal";
  action_value: string;
  icon_name?: string;
  is_active: boolean;
  order: number;
  color?: string;
}

export interface CourseChapter {
  id: string;
  title: string;
  lectures_count: number;
  classes: {
    id: string;
    title: string;
    duration: string;
    video_url?: string;
    is_live?: boolean;
    live_time?: string;
    pdf_note_url?: string;
    is_free_preview?: boolean;
  }[];
}

export interface CourseTab {
  id: string;
  course_id: string;
  tab_key: "details" | "routine" | "syllabus" | "materials" | "exams" | "leaderboard";
  tab_title: string;
  is_enabled: boolean;
  sort_order: number;
}

export interface CourseRoutine {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  instructor_name?: string;
  routine_date?: string;
  start_time?: string;
  end_time?: string;
  status: string;
  meeting_url?: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface CourseSyllabusItem {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  video_url?: string;
  is_free: boolean;
  sort_order: number;
  created_at?: string;
}

export interface CourseSyllabusModule {
  id: string;
  course_id: string;
  module_number: number;
  title: string;
  description?: string;
  class_count: number;
  is_expanded?: boolean;
  sort_order: number;
  created_at?: string;
  items?: CourseSyllabusItem[];
}

export interface CourseMaterial {
  id: string;
  course_id: string;
  module_id?: string;
  title: string;
  description?: string;
  material_type: string;
  file_url: string;
  preview_url?: string;
  file_size?: string;
  page_count?: number;
  is_free: boolean;
  is_published: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface Course {
  id: string;
  title: string;
  slug?: string;
  subtitle?: string;
  description?: string;
  instructor_name?: string;
  instructor_title?: string;
  thumbnail_url?: string;
  banner_url?: string;
  price: number;
  old_price?: number;
  is_free: boolean;
  is_published: boolean;
  total_students?: number;
  total_exams?: number;
  total_questions?: number;
  total_modules?: number;
  sort_order?: number;
  created_at: string;
  updated_at?: string;
  // UI legacy / helper fields:
  mentor?: string;
  mentor_title?: string;
  cover_image?: string;
  original_price?: number;
  discount_price?: number;
  course_tag?: "NTRCA Special" | "Hifz Revision" | "Fazil & Kamil Batch" | "Arabi Bhasha & Nahu" | "Primary & NTRCA Special" | string;
  features?: string[];
  custom_buttons?: CourseButton[];
  chapters?: CourseChapter[];
  questions?: Question[];
  exams?: Exam[];
  routine_url?: string;
  syllabus_url?: string;
  enrolled_count?: number;
  is_active?: boolean;
  is_featured?: boolean;
}

export interface CourseEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  amount: number;
  payment_method: string;
  transaction_id: string;
  payment_number: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  payment_note?: string;
  admin_note?: string;
  submitted_at: string;
  approved_at?: string;
  approved_by?: string;
  created_at: string;
  updated_at?: string;
  student_name?: string;
  student_phone?: string;
  student_email?: string;
  course_title?: string;
}

export interface ExamResult {
  id: string;
  user_id: string;
  exam_id: string;
  course_id?: string;
  score: number;
  total_marks: number;
  correct_answers: number;
  wrong_answers: number;
  skipped_answers: number;
  time_taken_seconds: number;
  rank?: number;
  submitted_at: string;
  student_name?: string;
  avatar_url?: string;
  exam_title?: string;
  course_title?: string;
}

export interface CourseLeaderboardEntry {
  id: string;
  course_id?: string;
  exam_id?: string;
  user_id: string;
  full_name: string;
  avatar_url?: string;
  score: number;
  total_marks: number;
  time_taken_seconds: number;
  submitted_at: string;
  rank: number;
}

export interface SubjectConfig {
  id: string;
  name_bn: string;
  name_ar: string;
  icon: string;
  question_count: number;
  is_premium_only: boolean;
  is_active: boolean;
  topics: string[];
  color_accent: string;
  order: number;
}

export interface JobCircular {
  id: string;
  title: string;
  organization: string;
  vacancies: number | string;
  deadline: string;
  apply_link: string;
  is_hot: boolean;
  is_active: boolean;
  educational_req: string;
  details: string;
  pdf_url?: string;
  location?: string;
  created_at: string;
}

export type PaymentGateway = "bKash" | "Nagad" | "Rocket" | "Upay";
export type PaymentStatus = "pending" | "approved" | "rejected";

export interface SubscriptionPackage {
  id: SubscriptionPlanId;
  name_bn: string;
  name_en: string;
  price: number;
  original_price?: number;
  duration_days: number;
  badge?: string;
  discount_tag?: string;
  is_popular?: boolean;
  perks: string[];
  is_active: boolean;
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  user_name: string;
  user_phone: string;
  sender_number?: string;
  gateway: PaymentGateway;
  trx_id: string;
  amount: number;
  plan_id: SubscriptionPlanId;
  plan_name: string;
  status: PaymentStatus;
  slip_url?: string;
  screenshot_url?: string;
  admin_note?: string;
  created_at: string;
  approved_at?: string;
}

export type PaymentRecord = PaymentTransaction;

export interface AppBanner {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  redirect_type?: "exam" | "course" | "job" | "subscription" | "external";
  redirect_target?: string;
  target_url?: string;
  is_active: boolean;
  order: number;
}

export type HomeBanner = AppBanner;

export interface AppSettings {
  app_name: string;
  emergency_notice: {
    enabled: boolean;
    message: string;
    type: "info" | "warning" | "alert" | "exam_alert";
    link?: string;
  };
  marquee_ticker: {
    enabled: boolean;
    text: string;
    speed: number;
  };
  home_banners: AppBanner[];
  subscription_packages: SubscriptionPackage[];
  helpline: {
    phone: string;
    whatsapp: string;
    telegram: string;
    facebook_group: string;
    youtube_channel: string;
    email: string;
  };
  routine_pdf_url: string;
  arabic_font_size_default: "sm" | "md" | "lg" | "xl";
  maintenance_mode: boolean;
  live_exam_broadcast_active: boolean;
  active_broadcast_exam_id?: string;
}
