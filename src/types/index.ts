export type UserRole = "admin" | "student" | "moderator";

export type SubscriptionPlanId = "free" | "monthly" | "quarterly" | "half_yearly" | "yearly";

export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  role: UserRole;
  is_premium: boolean;
  subscription_plan?: SubscriptionPlanId;
  subscription_expiry?: string;
  madrasah_name?: string;
  district?: string;
  avatar_url?: string;
  created_at: string;
}

export type QuestionDifficulty = "Easy" | "Medium" | "Hard";
export type ExamTargetCategory = "NTRCA" | "Dakhil" | "Alim" | "Fazil" | "Kamil" | "Madrasah Directorate" | "BCS" | "General";

export interface Question {
  id: string;
  subject_id: string;
  subject_name: string;
  topic: string;
  question: string;
  arabic_text?: string;
  options: string[];
  correct_index: number;
  explanation: string;
  source: string;
  difficulty: QuestionDifficulty;
  exam_type: ExamTargetCategory;
  tags?: string[];
  created_at: string;
}

export type ExamCategory = "free_test" | "daily_live" | "weekly_model_test" | "monthly_mega" | "premium_ntrca";
export type ExamStatus = "upcoming" | "live" | "completed" | "archived";

export interface Exam {
  id: string;
  title: string;
  category: ExamCategory;
  subject: string;
  syllabus: string;
  duration_minutes: number;
  total_marks: number;
  pass_marks?: number;
  negative_marking: number; // e.g., 0.25, 0.50, 0
  start_time: string;
  end_time: string;
  result_published: boolean;
  status: ExamStatus;
  questions: Question[];
  participant_count: number;
  banner_image?: string;
  is_featured?: boolean;
  created_at: string;
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
  answers: Record<string, number>; // questionId -> selectedIndex
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

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  cover_image: string;
  mentor: string;
  mentor_title: string;
  mentor_avatar?: string;
  original_price: number;
  discount_price: number;
  course_tag: "NTRCA Special" | "Hifz Revision" | "Fazil & Kamil Batch" | "Arabi Bhasha & Nahu" | "Primary & NTRCA Special";
  features: string[];
  custom_buttons: CourseButton[];
  chapters: CourseChapter[];
  routine_url?: string;
  syllabus_url?: string;
  enrolled_count: number;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
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
