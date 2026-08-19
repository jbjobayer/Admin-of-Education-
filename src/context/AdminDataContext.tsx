import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  Profile,
  Question,
  Exam,
  ExamSubmission,
  Course,
  SubjectConfig,
  JobCircular,
  PaymentTransaction,
  AppSettings,
  SubscriptionPackage,
  CourseButton,
  CourseEnrollment,
  ExamResult,
  CourseTab,
  CourseRoutine,
  CourseSyllabusModule,
  CourseMaterial,
} from "../types";
import {
  initialSubjects,
  initialQuestions,
  initialExams,
  initialCourses,
  initialJobCirculars,
  initialSubscriptionPackages,
  initialPayments,
  initialProfiles,
  initialAppSettings,
  initialSubmissions,
} from "../lib/initialData";
import { getSupabaseClient, getSavedSupabaseConfig, SUPABASE_FIX_RLS_SQL } from "../lib/supabase";
import {
  dbFetchProfiles,
  dbUpdateProfile,
  dbCheckAdminAccess,
  dbFetchCourses,
  dbCreateCourse,
  dbUpdateCourse,
  dbDeleteCourse,
  dbFetchExams,
  dbCreateExam,
  dbUpdateExam,
  dbDeleteExam,
  dbFetchQuestions,
  dbCreateQuestion,
  dbCreateBulkQuestions,
  dbUpdateQuestion,
  dbDeleteQuestion,
  dbFetchEnrollments,
  dbApproveEnrollment,
  dbRejectEnrollment,
  dbFetchExamResults,
  isValidUuid,
  dbAssignQuestionsToExam,
  dbAutoPopulateExamQuestions,
  dbAutoLinkAllEmptyExams,
} from "../lib/supabaseService";

export type AdminTab =
  | "dashboard"
  | "questions"
  | "exams"
  | "courses"
  | "subjects"
  | "jobs"
  | "payments"
  | "app_customizer"
  | "supabase_studio"
  | "student_preview";

const LOCAL_STORAGE_KEY = "tamreen_admin_data_v2";

interface AdminDataContextType {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Supabase Connection & Admin Auth Status
  isSupabaseConnected: boolean;
  isLoadingSupabase: boolean;
  currentAdminProfile: Profile | null;
  refreshFromSupabase: () => Promise<void>;

  // RLS Notice Handling
  hasRlsNotice: boolean;
  setHasRlsNotice: (val: boolean) => void;
  dismissRlsNotice: () => void;
  copyRlsFixSql: () => void;

  // Data Collections (Single Source of Truth)
  subjects: SubjectConfig[];
  questions: Question[];
  exams: Exam[];
  submissions: ExamSubmission[];
  courses: Course[];
  jobCirculars: JobCircular[];
  payments: PaymentTransaction[];
  enrollments: CourseEnrollment[];
  examResults: ExamResult[];
  profiles: Profile[];
  appSettings: AppSettings;

  // Question CRUD (questions table)
  addQuestion: (q: Omit<Question, "id" | "created_at">) => Question;
  addBulkQuestions: (qs: Omit<Question, "id" | "created_at">[]) => number;
  updateQuestion: (id: string, q: Partial<Question>) => void;
  deleteQuestion: (id: string) => void;

  // Exam CRUD (exams table)
  addExam: (exam: Omit<Exam, "id" | "created_at" | "participant_count">) => Exam;
  updateExam: (id: string, exam: Partial<Exam>) => void;
  deleteExam: (id: string) => void;
  toggleExamStatus: (id: string) => void;
  publishExamResult: (id: string) => void;
  assignQuestionsToExam: (examId: string, questionIds: string[]) => Promise<void>;
  autoPopulateExamQuestions: (examId: string, count?: number) => Promise<void>;
  autoLinkAllEmptyExams: () => Promise<void>;

  // Course CRUD & Granular Buttons (courses table)
  addCourse: (c: Omit<Course, "id" | "created_at" | "enrolled_count">) => Course;
  updateCourse: (id: string, c: Partial<Course>) => void;
  deleteCourse: (id: string) => void;
  updateCourseButtons: (courseId: string, buttons: CourseButton[]) => void;
  getCourseExams: (courseId: string) => Exam[];
  getCourseQuestions: (courseId: string) => Question[];
  linkExamToCourse: (examId: string, courseId: string) => Promise<void>;

  // Subject Hub
  updateSubject: (id: string, sub: Partial<SubjectConfig>) => void;
  toggleSubjectActive: (id: string) => void;
  toggleSubjectPremiumLock: (id: string) => void;
  addSubject: (sub: Omit<SubjectConfig, "id">) => SubjectConfig;

  // Job Circulars
  addJobCircular: (job: Omit<JobCircular, "id" | "created_at">) => JobCircular;
  updateJobCircular: (id: string, job: Partial<JobCircular>) => void;
  deleteJobCircular: (id: string) => void;
  toggleJobHot: (id: string) => void;
  toggleJobActive: (id: string) => void;

  // Payments & Enrollment Management (course_enrollments table)
  subscriptionPackages: SubscriptionPackage[];
  submitPayment: (p: {
    user_id: string;
    user_name: string;
    user_phone: string;
    sender_number: string;
    gateway: "bKash" | "Nagad" | "Rocket";
    trx_id: string;
    amount: number;
    plan_id: string;
    plan_name: string;
    screenshot_url?: string;
  }) => PaymentTransaction;
  approvePayment: (paymentId: string, adminNote?: string) => void;
  rejectPayment: (paymentId: string, adminNote?: string) => void;
  updateSubscriptionPackage: (pkgId: string, pkg: Partial<SubscriptionPackage>) => void;
  manuallyActivateUser: (params: {
    phone: string;
    planId: string;
    months: number;
    fullName?: string;
  }) => Profile;

  // App Settings & Broadcasts
  updateAppSettings: (settings: Partial<AppSettings>) => void;
  broadcastEmergencyNotice: (message: string, type: "info" | "warning" | "alert" | "exam_alert") => void;
  toggleLiveExamBanner: (examId: string, active: boolean) => void;
  updateHomeBanner: (bannerId: string, banner: Partial<AppSettings["home_banners"][0]>) => void;
  addHomeBanner: (banner: Omit<AppSettings["home_banners"][0], "id">) => void;
  deleteHomeBanner: (bannerId: string) => void;

  // Preview Modal & Mobile Drawer
  isPreviewModalOpen: boolean;
  setIsPreviewModalOpen: (open: boolean) => void;
  previewExam: Exam | null;
  setPreviewExam: (exam: Exam | null) => void;
  openExamInSimulator: (exam: Exam) => void;
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: (open: boolean | ((prev: boolean) => boolean)) => void;

  // Global Notification Toast Helper
  toast: { message: string; type: "success" | "error" | "info" } | null;
  showToast: (message: string, type?: "success" | "error" | "info") => void;

  // Clear or Reset State
  resetAllData: () => void;
}

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined);

export const AdminDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("tamreen_dark_mode");
      return stored === "true";
    }
    return false;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewExam, setPreviewExam] = useState<Exam | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Supabase Connection & Admin status
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);
  const [isLoadingSupabase, setIsLoadingSupabase] = useState<boolean>(false);
  const [currentAdminProfile, setCurrentAdminProfile] = useState<Profile | null>(null);
  const [hasRlsNotice, setHasRlsNotice] = useState<boolean>(false);

  const dismissRlsNotice = useCallback(() => {
    setHasRlsNotice(false);
  }, []);

  const copyRlsFixSql = useCallback(() => {
    navigator.clipboard.writeText(SUPABASE_FIX_RLS_SQL);
    showToast("⚡ RLS ফিক্স SQL স্ক্রিপ্ট কপি হয়েছে! Supabase SQL Editor-এ পেস্ট করে Run করুন।", "success");
  }, []);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Helper to handle Supabase RLS / Permissions notices gracefully
  const handleSupabaseNotice = useCallback((res: { error?: string | null; errorObj?: any }, label: string) => {
    if (!res.error) return;
    const errMsg = (res.error || "").toLowerCase();
    const errCode = res.errorObj?.code;
    const isRls =
      errCode === "42501" ||
      errMsg.includes("policy") ||
      errMsg.includes("row-level") ||
      errMsg.includes("security") ||
      errMsg.includes("permission denied");

    if (isRls) {
      setHasRlsNotice(true);
      console.warn(`[Supabase RLS Notice] ${label}:`, res.errorObj || res.error);
      showToast(`${label} লোকাল মেমরিতে সেভ হয়েছে। (ক্লাউড সিঙ্কের জন্য RLS ফিক্স প্রয়োজন)`, "info");
    } else {
      console.warn(`[Supabase Sync Notice] ${label}:`, res.errorObj || res.error);
    }
  }, []);

  // Helper to load localStorage
  function loadLocal<T>(key: string, defaultVal: T): T {
    if (typeof window === "undefined") return defaultVal;
    try {
      const stored = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${key}`);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(`Error loading ${key}`, e);
    }
    return defaultVal;
  }

  // State Collections
  const [subjects, setSubjects] = useState<SubjectConfig[]>(() => {
    return loadLocal("subjects", initialSubjects);
  });
  const [questions, setQuestions] = useState<Question[]>(() => {
    return loadLocal("questions", initialQuestions);
  });
  const [exams, setExams] = useState<Exam[]>(() => {
    return loadLocal("exams", initialExams);
  });
  const [submissions, setSubmissions] = useState<ExamSubmission[]>(() => {
    return loadLocal("submissions", initialSubmissions);
  });
  const [courses, setCourses] = useState<Course[]>(() => {
    return loadLocal("courses", initialCourses);
  });
  const [jobCirculars, setJobCirculars] = useState<JobCircular[]>(() => {
    return loadLocal("jobCirculars", initialJobCirculars);
  });
  const [payments, setPayments] = useState<PaymentTransaction[]>(() => {
    return loadLocal("payments", initialPayments);
  });
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>(() => {
    return loadLocal("enrollments", []);
  });
  const [examResults, setExamResults] = useState<ExamResult[]>(() => {
    return loadLocal("examResults", []);
  });
  const [profiles, setProfiles] = useState<Profile[]>(() => {
    return loadLocal("profiles", initialProfiles);
  });
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    return loadLocal("appSettings", initialAppSettings);
  });

  const openExamInSimulator = useCallback((exam: Exam) => {
    let resolvedExam = { ...exam };
    let examQuestions = Array.isArray(resolvedExam.questions) ? [...resolvedExam.questions] : [];

    if (examQuestions.length === 0) {
      const matchingByExamId = questions.filter(
        (q) => (q.exam_id && q.exam_id === exam.id) || (q.free_exam_id && q.free_exam_id === exam.id)
      );
      if (matchingByExamId.length > 0) {
        examQuestions = matchingByExamId;
      } else {
        const matchingBySubject = questions.filter(
          (q) =>
            (q.subject_name && exam.subject && q.subject_name.toLowerCase().includes(exam.subject.toLowerCase())) ||
            (q.subject_id && exam.subject && exam.subject.includes(q.subject_id))
        );
        if (matchingBySubject.length > 0) {
          examQuestions = matchingBySubject.slice(0, exam.total_questions || 10);
        } else if (questions.length > 0) {
          examQuestions = questions.slice(0, exam.total_questions || 10);
        }
      }
      resolvedExam.questions = examQuestions;
      resolvedExam.total_questions = examQuestions.length;
    }

    setPreviewExam(resolvedExam);
    setIsPreviewModalOpen(true);
  }, [questions]);

  // Fetch real data from Supabase
  const refreshFromSupabase = useCallback(async () => {
    const supabase = getSupabaseClient();
    const config = getSavedSupabaseConfig();
    const hasConfig = Boolean(config.url && config.anonKey);
    setIsSupabaseConnected(hasConfig);

    if (!supabase) {
      return;
    }

    setIsLoadingSupabase(true);
    try {
      // 1. Check admin profile
      const authRes = await dbCheckAdminAccess();
      if (authRes.profile) {
        setCurrentAdminProfile(authRes.profile);
      }

      // 2. Fetch all modules in parallel
      const [
        profilesRes,
        coursesRes,
        examsRes,
        questionsRes,
        enrollmentsRes,
        resultsRes,
      ] = await Promise.all([
        dbFetchProfiles(),
        dbFetchCourses(),
        dbFetchExams(),
        dbFetchQuestions(),
        dbFetchEnrollments(),
        dbFetchExamResults(),
      ]);

      if (profilesRes.data && profilesRes.data.length > 0) {
        setProfiles(profilesRes.data);
      }
      if (coursesRes.data && coursesRes.data.length > 0) {
        setCourses(coursesRes.data);
      }
      if (examsRes.data && examsRes.data.length > 0) {
        setExams(examsRes.data);
      }
      if (questionsRes.data) {
        setQuestions((prevLocal) => {
          if (questionsRes.data!.length === 0) {
            // Never wipe local questions if Supabase returned 0 items
            return prevLocal;
          }
          const dbIds = new Set(questionsRes.data!.map((q) => q.id));
          const dbTexts = new Set(questionsRes.data!.map((q) => (q.question_text || q.question || "").trim().toLowerCase()));

          // Keep any unsynced local questions (e.g. temporary IDs not yet in DB)
          const localUnsynced = prevLocal.filter((local) => {
            if (!isValidUuid(local.id)) {
              const text = (local.question_text || local.question || "").trim().toLowerCase();
              return !dbTexts.has(text);
            }
            return !dbIds.has(local.id);
          });

          return [...questionsRes.data!, ...localUnsynced];
        });
      }
      if (enrollmentsRes.data && enrollmentsRes.data.length > 0) {
        setEnrollments(enrollmentsRes.data);
        // Map enrollments to payments state for unified payment/enrollment manager
        const mappedPayments: PaymentTransaction[] = enrollmentsRes.data.map((e) => ({
          id: e.id,
          user_id: e.user_id,
          user_name: e.student_name || "শিক্ষার্থী",
          user_phone: e.student_phone || e.payment_number || "",
          sender_number: e.payment_number,
          gateway: (e.payment_method as any) || "bKash",
          trx_id: e.transaction_id,
          amount: e.amount,
          plan_id: "monthly",
          plan_name: e.course_title || "কোর্স প্যাকেজ",
          status: e.status === "approved" ? "approved" : e.status === "rejected" ? "rejected" : "pending",
          admin_note: e.admin_note,
          created_at: e.created_at,
          approved_at: e.approved_at,
        }));
        setPayments(mappedPayments);
      }
      if (resultsRes.data && resultsRes.data.length > 0) {
        setExamResults(resultsRes.data);
      }

      setIsSupabaseConnected(true);
    } catch (error) {
      console.error("Error refreshing from Supabase:", error);
    } finally {
      setIsLoadingSupabase(false);
    }
  }, []);

  // Initial load & Realtime subscriptions
  useEffect(() => {
    refreshFromSupabase();

    const supabase = getSupabaseClient();
    if (!supabase) return;

    // Listen to Realtime Postgres Changes
    const channel = supabase
      .channel("tamreen-admin-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "questions" }, () => {
        dbFetchQuestions().then((res) => {
          if (res.data && res.data.length > 0) {
            setQuestions((prevLocal) => {
              const dbIds = new Set(res.data!.map((q) => q.id));
              const localUnsynced = prevLocal.filter((l) => !isValidUuid(l.id) && !dbIds.has(l.id));
              return [...res.data!, ...localUnsynced];
            });
          }
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "courses" }, () => {
        dbFetchCourses().then((res) => {
          if (res.data && res.data.length > 0) setCourses(res.data);
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "exams" }, () => {
        dbFetchExams().then((res) => {
          if (res.data && res.data.length > 0) setExams(res.data);
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "course_enrollments" }, () => {
        dbFetchEnrollments().then((res) => {
          if (res.data && res.data.length > 0) {
            setEnrollments(res.data);
            showToast("নতুন ভর্তি আবেদন আপডেট হয়েছে!", "info");
          }
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        dbFetchProfiles().then((res) => {
          if (res.data && res.data.length > 0) setProfiles(res.data);
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshFromSupabase]);

  // Save to localStorage as secondary backup
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_subjects`, JSON.stringify(subjects));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_questions`, JSON.stringify(questions));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_exams`, JSON.stringify(exams));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_submissions`, JSON.stringify(submissions));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_courses`, JSON.stringify(courses));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_jobCirculars`, JSON.stringify(jobCirculars));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_payments`, JSON.stringify(payments));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_enrollments`, JSON.stringify(enrollments));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_examResults`, JSON.stringify(examResults));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_profiles`, JSON.stringify(profiles));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_appSettings`, JSON.stringify(appSettings));
  }, [subjects, questions, exams, submissions, courses, jobCirculars, payments, enrollments, examResults, profiles, appSettings]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("tamreen_dark_mode", String(isDarkMode));
      if (isDarkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [isDarkMode]);

  // -------------------------------------------------------------
  // Question CRUD (questions table)
  // -------------------------------------------------------------
  const addQuestion = (q: Omit<Question, "id" | "created_at">): Question => {
    const tempId = `q-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const optA = (q.option_a || (q.options ? q.options[0] : "") || "").trim();
    const optB = (q.option_b || (q.options ? q.options[1] : "") || "").trim();
    const optC = (q.option_c || (q.options ? q.options[2] : "") || "").trim();
    const optD = (q.option_d || (q.options ? q.options[3] : "") || "").trim();
    const qText = (q.question_text || q.question || "").trim();

    const newQuestion: Question = {
      ...q,
      id: tempId,
      created_at: new Date().toISOString(),
      question: qText,
      question_text: qText,
      arabic_text: q.arabic_text || undefined,
      option_a: optA,
      option_b: optB,
      option_c: optC,
      option_d: optD,
      options: [optA, optB, optC, optD],
      correct_index: q.correct_index !== undefined ? q.correct_index : 0,
      topic: q.topic || "সাধারণ",
      subject_id: q.subject_id || "sub-1",
      subject_name: q.subject_name || "মাদ্রাসা কারিকুলাম",
      source: q.source || "",
      difficulty: q.difficulty || "Medium",
      exam_type: q.exam_type || "NTRCA",
      language: q.language || "bn",
    };

    // Optimistic state update
    setQuestions((prev) => [newQuestion, ...prev]);

    // Update subject question count
    setSubjects((prev) =>
      prev.map((s) => (s.id === q.subject_id ? { ...s, question_count: (s.question_count || 0) + 1 } : s))
    );

    // Update exam questions array in local state if assigned to an exam
    const targetExamId = q.exam_id || q.free_exam_id;
    if (targetExamId) {
      setExams((prev) =>
        prev.map((e) => {
          if (e.id === targetExamId) {
            const currentQs = Array.isArray(e.questions) ? e.questions : [];
            return {
              ...e,
              questions: [newQuestion, ...currentQs],
              total_questions: currentQs.length + 1,
            };
          }
          return e;
        })
      );
    }

    // Direct Supabase Insert
    dbCreateQuestion(q)
      .then((res) => {
        if (res.error) {
          console.error("❌ Supabase Question Insert Error:", res.error, res.errorObj);
          showToast(`প্রশ্ন সংরক্ষণ করা যায়নি: ${res.error}`, "error");
          // Revert optimistic insert
          setQuestions((prev) => prev.filter((item) => item.id !== tempId));
          if (targetExamId) {
            setExams((prev) =>
              prev.map((e) => {
                if (e.id === targetExamId) {
                  const currentQs = Array.isArray(e.questions) ? e.questions : [];
                  return {
                    ...e,
                    questions: currentQs.filter((item) => item.id !== tempId),
                    total_questions: Math.max(0, currentQs.length - 1),
                  };
                }
                return e;
              })
            );
          }
        } else if (res.data) {
          console.log("✅ Question successfully inserted into Supabase public.questions:", res.data);
          const realItem = res.data;
          // Replace tempId with actual DB UUID
          setQuestions((prev) => prev.map((item) => (item.id === tempId ? realItem : item)));
          if (targetExamId) {
            setExams((prev) =>
              prev.map((e) => {
                if (e.id === targetExamId) {
                  const currentQs = Array.isArray(e.questions) ? e.questions : [];
                  return {
                    ...e,
                    questions: currentQs.map((item) => (item.id === tempId ? realItem : item)),
                  };
                }
                return e;
              })
            );
          }
          showToast("প্রশ্ন সফলভাবে সংরক্ষণ হয়েছে।", "success");
        }
      })
      .catch((err) => {
        console.error("❌ Unexpected Error creating question:", err);
        showToast(`প্রশ্ন সংরক্ষণ করা যায়নি: ${err?.message || "ব্যর্থ হয়েছে"}`, "error");
        setQuestions((prev) => prev.filter((item) => item.id !== tempId));
      });

    return newQuestion;
  };

  const addBulkQuestions = (qs: Omit<Question, "id" | "created_at">[]): number => {
    const tempPrefix = `q-bulk-${Date.now()}-`;
    const newItems: Question[] = qs.map((q, idx) => {
      const optA = (q.option_a || (q.options ? q.options[0] : "") || "").trim();
      const optB = (q.option_b || (q.options ? q.options[1] : "") || "").trim();
      const optC = (q.option_c || (q.options ? q.options[2] : "") || "").trim();
      const optD = (q.option_d || (q.options ? q.options[3] : "") || "").trim();
      const qText = (q.question_text || q.question || "").trim();

      return {
        ...q,
        id: `${tempPrefix}${idx}`,
        created_at: new Date().toISOString(),
        question: qText,
        question_text: qText,
        arabic_text: q.arabic_text || undefined,
        option_a: optA,
        option_b: optB,
        option_c: optC,
        option_d: optD,
        options: [optA, optB, optC, optD],
        correct_index: q.correct_index !== undefined ? q.correct_index : 0,
        topic: q.topic || "সাধারণ",
        subject_id: q.subject_id || "sub-1",
        subject_name: q.subject_name || "মাদ্রাসা কারিকুলাম",
        source: q.source || "",
        difficulty: q.difficulty || "Medium",
        exam_type: q.exam_type || "NTRCA",
        language: q.language || "bn",
      };
    });

    setQuestions((prev) => [...newItems, ...prev]);

    // Asynchronous Bulk Insert to Supabase
    dbCreateBulkQuestions(qs)
      .then((res) => {
        if (res.error) {
          console.error("❌ Supabase Bulk Insert Error:", res.error, res.errorObj);
          showToast(`বাল্ক প্রশ্ন সংরক্ষণ করা যায়নি: ${res.error}`, "error");
          const tempIds = new Set(newItems.map((n) => n.id));
          setQuestions((prev) => prev.filter((p) => !tempIds.has(p.id)));
        } else if (res.data && res.data.length > 0) {
          console.log(`✅ ${res.data.length} questions bulk inserted into Supabase public.questions`);
          setQuestions((prev) => {
            const tempIds = new Set(newItems.map((n) => n.id));
            const remaining = prev.filter((p) => !tempIds.has(p.id));
            return [...res.data!, ...remaining];
          });
          showToast(`${res.data.length}টি প্রশ্ন সফলভাবে সংরক্ষণ হয়েছে।`, "success");
        }
      })
      .catch((err) => {
        console.error("❌ Unexpected Error bulk creating questions:", err);
        showToast(`বাল্ক প্রশ্ন সংরক্ষণ করা যায়নি: ${err?.message || "ব্যর্থ হয়েছে"}`, "error");
        const tempIds = new Set(newItems.map((n) => n.id));
        setQuestions((prev) => prev.filter((p) => !tempIds.has(p.id)));
      });

    return newItems.length;
  };

  const updateQuestion = (id: string, q: Partial<Question>) => {
    setQuestions((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...q };
          if (q.question_text || q.question) {
            updated.question = q.question_text || q.question || item.question;
            updated.question_text = q.question_text || q.question || item.question_text;
          }
          if (q.options) {
            updated.options = q.options;
            updated.option_a = q.options[0] || item.option_a;
            updated.option_b = q.options[1] || item.option_b;
            updated.option_c = q.options[2] || item.option_c;
            updated.option_d = q.options[3] || item.option_d;
          }
          return updated;
        }
        return item;
      })
    );

    // Asynchronous Supabase update
    dbUpdateQuestion(id, q)
      .then((res) => {
        if (res.error) {
          console.error("❌ Supabase Question Update Error:", res.error, res.errorObj);
          showToast(`প্রশ্ন আপডেট করা যায়নি: ${res.error}`, "error");
        } else if (res.data) {
          console.log("✅ Question updated in Supabase:", res.data);
          setQuestions((prev) => prev.map((item) => (item.id === id ? res.data! : item)));
          showToast("প্রশ্ন সফলভাবে আপডেট ও সংরক্ষিত হয়েছে!", "success");
        }
      })
      .catch((err) => {
        console.error("❌ Error updating question:", err);
        showToast(`প্রশ্ন আপডেট করা যায়নি: ${err?.message || "ব্যর্থ হয়েছে"}`, "error");
      });
  };

  const deleteQuestion = (id: string) => {
    const previousQuestions = [...questions];
    setQuestions((prev) => prev.filter((item) => item.id !== id));

    // Asynchronous Supabase delete
    dbDeleteQuestion(id)
      .then((res) => {
        if (res.error) {
          console.error("❌ Supabase Question Delete Error:", res.error, res.errorObj);
          showToast(`প্রশ্ন মুছে ফেলা যায়নি: ${res.error}`, "error");
          setQuestions(previousQuestions);
        } else {
          console.log(`✅ Question ${id} deleted from Supabase`);
          showToast("প্রশ্নটি সফলভাবে মুছে ফেলা হয়েছে!", "info");
        }
      })
      .catch((err) => {
        console.error("❌ Error deleting question:", err);
        showToast(`প্রশ্ন মুছে ফেলা যায়নি: ${err?.message || "ব্যর্থ হয়েছে"}`, "error");
        setQuestions(previousQuestions);
      });
  };

  // -------------------------------------------------------------
  // Exam CRUD (exams table)
  // -------------------------------------------------------------
  const addExam = (exam: Omit<Exam, "id" | "created_at" | "participant_count">): Exam => {
    const tempId = `exam-${Date.now()}`;
    const newExam: Exam = {
      ...exam,
      id: tempId,
      participant_count: 0,
      created_at: new Date().toISOString(),
      status: exam.status || "upcoming",
      is_published: exam.is_published !== undefined ? exam.is_published : true,
    };
    // Optimistic UI state update
    setExams((prev) => [newExam, ...prev]);

    // Asynchronous Supabase Insert
    dbCreateExam(exam)
      .then((res) => {
        if (res.error) {
          handleSupabaseNotice(res, "পরীক্ষা");
        } else if (res.data) {
          setExams((prev) => prev.map((e) => (e.id === tempId ? res.data! : e)));
          showToast("নতুন পরীক্ষা সফলভাবে তৈরি ও Supabase ক্লাউডে সিঙ্ক হয়েছে!", "success");
        }
      })
      .catch((err) => {
        console.error("Error creating exam in Supabase:", err);
      });

    return newExam;
  };

  const updateExam = (id: string, exam: Partial<Exam>) => {
    setExams((prev) => prev.map((e) => (e.id === id ? { ...e, ...exam } : e)));

    dbUpdateExam(id, exam)
      .then((res) => {
        if (res.error) {
          handleSupabaseNotice(res, "পরীক্ষা আপডেট");
        } else {
          showToast("পরীক্ষার তথ্য আপডেট ও সিঙ্ক করা হয়েছে!", "success");
        }
      })
      .catch((err) => console.error("Error updating exam:", err));
  };

  const deleteExam = (id: string) => {
    setExams((prev) => prev.filter((e) => e.id !== id));
    dbDeleteExam(id)
      .then((res) => {
        if (res.error) {
          handleSupabaseNotice(res, "পরীক্ষা ডিলিট");
        } else {
          showToast("পরীক্ষাটি সফলভাবে মুছে ফেলা হয়েছে!", "info");
        }
      })
      .catch((err) => console.error("Error deleting exam:", err));
  };

  const toggleExamStatus = (id: string) => {
    let targetExam = exams.find((e) => e.id === id);
    if (!targetExam) return;

    const nextStatus = targetExam.status === "live" ? "completed" : targetExam.status === "upcoming" ? "live" : "upcoming";
    const updatedExam = { ...targetExam, status: nextStatus };

    setExams((prev) => prev.map((e) => (e.id === id ? updatedExam : e)));

    dbUpdateExam(id, updatedExam)
      .then((res) => {
        if (res.data && res.data.id !== id) {
          setExams((prev) => prev.map((e) => (e.id === id ? res.data! : e)));
        }
      })
      .catch((err) => console.error("Error updating exam status:", err));

    showToast("পরীক্ষার স্ট্যাটাস পরিবর্তিত হয়েছে!");
  };

  const publishExamResult = (id: string) => {
    let targetExam = exams.find((e) => e.id === id);
    if (!targetExam) return;

    const updatedExam = { ...targetExam, result_published: true, status: "completed" as const };
    setExams((prev) => prev.map((e) => (e.id === id ? updatedExam : e)));

    dbUpdateExam(id, updatedExam)
      .then((res) => {
        if (res.data && res.data.id !== id) {
          setExams((prev) => prev.map((e) => (e.id === id ? res.data! : e)));
        }
      })
      .catch((err) => console.error("Error publishing exam result:", err));

    showToast("পরীক্ষার ফলাফল ও মেরিট তালিকা প্রকাশ করা হয়েছে!");
  };

  const assignQuestionsToExam = async (examId: string, questionIds: string[]) => {
    const targetExam = exams.find((e) => e.id === examId);
    const isFree = Boolean(targetExam?.is_free || targetExam?.exam_scope === "free" || !targetExam?.course_id);

    // 1. Optimistically update local questions state
    setQuestions((prev) =>
      prev.map((q) => {
        if (questionIds.includes(q.id)) {
          return {
            ...q,
            exam_id: isFree ? null : examId,
            free_exam_id: isFree ? examId : null,
            exam_scope: isFree ? ("free" as const) : ("course" as const),
          };
        }
        return q;
      })
    );

    // 2. Optimistically update local exams state with the assigned questions
    const assignedObjs = questions.filter((q) => questionIds.includes(q.id));
    setExams((prev) =>
      prev.map((e) => {
        if (e.id === examId) {
          const currentQs = Array.isArray(e.questions) ? e.questions : [];
          const existingIds = new Set(currentQs.map((q) => q.id));
          const newOnes = assignedObjs.filter((q) => !existingIds.has(q.id));
          const combined = [...currentQs, ...newOnes];
          return {
            ...e,
            questions: combined,
            total_questions: combined.length,
            total_marks: combined.length > 0 ? combined.length : e.total_marks,
          };
        }
        return e;
      })
    );

    // 3. Push to Supabase
    try {
      const res = await dbAssignQuestionsToExam(examId, questionIds, isFree);
      if (res.error) {
        showToast(`Supabase সিঙ্ক সতর্কতা: ${res.error}`, "info");
      } else {
        showToast(`সফলভাবে ${questionIds.length}টি প্রশ্ন পরীক্ষায় সংযুক্ত ও Supabase-এ সিঙ্ক হয়েছে!`, "success");
      }
    } catch (err: any) {
      console.error("Error assigning questions to exam:", err);
      showToast("প্রশ্ন লিংকিং সম্পন্ন হয়েছে (লোকাল মেমোরি)।", "info");
    }
  };

  const autoPopulateExamQuestions = async (examId: string, count: number = 10) => {
    const targetExam = exams.find((e) => e.id === examId);
    const isFree = Boolean(targetExam?.is_free || targetExam?.exam_scope === "free" || !targetExam?.course_id);
    const subjectHint = targetExam?.subject || targetExam?.title || "";

    // Local matching
    let matched = questions.filter(
      (q) =>
        (q.subject_name && subjectHint && subjectHint.toLowerCase().includes(q.subject_name.toLowerCase())) ||
        (q.topic && subjectHint && subjectHint.toLowerCase().includes(q.topic.toLowerCase()))
    );
    if (matched.length === 0) {
      matched = questions.slice(0, count);
    } else {
      matched = matched.slice(0, count);
    }

    const idsToAssign = matched.map((q) => q.id);
    if (idsToAssign.length > 0) {
      await assignQuestionsToExam(examId, idsToAssign);
    } else {
      showToast("প্রশ্ন ব্যাংকে পর্যাপ্ত প্রশ্ন নেই। দয়া করে প্রথমে প্রশ্ন ব্যাংক থেকে কিছু প্রশ্ন তৈরি করুন।", "error");
    }

    // Call Supabase auto-populate as well
    try {
      await dbAutoPopulateExamQuestions(examId, count, subjectHint, isFree);
    } catch (e) {
      console.warn("Supabase auto populate notice:", e);
    }
  };

  const autoLinkAllEmptyExams = async () => {
    showToast("সকল খালি পরীক্ষায় প্রশ্ন লিংক ও Supabase-এ পুশ করা হচ্ছে...", "info");
    try {
      // 1. Local update for all exams with 0 questions
      setExams((prevExams) => {
        return prevExams.map((ex) => {
          const currentQs = Array.isArray(ex.questions) ? ex.questions : [];
          if (currentQs.length === 0) {
            let matched = questions.filter(
              (q) =>
                (ex.subject && q.subject_name && ex.subject.toLowerCase().includes(q.subject_name.toLowerCase())) ||
                (ex.title && q.topic && ex.title.toLowerCase().includes(q.topic.toLowerCase()))
            );
            if (matched.length === 0) {
              matched = questions.slice(0, 10);
            } else {
              matched = matched.slice(0, 10);
            }
            return {
              ...ex,
              questions: matched,
              total_questions: matched.length,
              total_marks: matched.length > 0 ? matched.length : ex.total_marks,
            };
          }
          return ex;
        });
      });

      // 2. Supabase Cloud Sync
      const res = await dbAutoLinkAllEmptyExams();
      if (res.error) {
        showToast(`সিঙ্ক সমাপ্ত (লোকাল মেমোরি আপডেট সম্পন্ন): ${res.error}`, "info");
      } else {
        showToast(
          `সম্পন্ন! ${res.data?.fixedExams || 0}টি পরীক্ষায় সর্বমোট ${res.data?.totalQuestionsLinked || 0}টি প্রশ্ন সংযুক্ত হয়েছে!`,
          "success"
        );
      }
    } catch (err: any) {
      console.error("Error in autoLinkAllEmptyExams:", err);
      showToast("সকল পরীক্ষায় অটো-লিংক সম্পন্ন হয়েছে।", "success");
    }
  };

  // -------------------------------------------------------------
  // Course CRUD (courses table)
  // -------------------------------------------------------------
  const addCourse = (c: Omit<Course, "id" | "created_at" | "enrolled_count">): Course => {
    const tempId = `course-${Date.now()}`;
    const newCourse: Course = {
      ...c,
      id: tempId,
      enrolled_count: 0,
      created_at: new Date().toISOString(),
      is_published: c.is_published !== undefined ? c.is_published : true,
      price: c.price ?? c.discount_price ?? 0,
    };
    setCourses((prev) => [newCourse, ...prev]);

    dbCreateCourse(c)
      .then((res) => {
        if (res.data) {
          setCourses((prev) => prev.map((item) => (item.id === tempId ? res.data! : item)));
        }
      })
      .catch((err) => console.error("Error creating course:", err));

    showToast("নতুন কোর্স সফলভাবে যুক্ত হয়েছে!");
    return newCourse;
  };

  const updateCourse = (id: string, c: Partial<Course>) => {
    setCourses((prev) => prev.map((item) => (item.id === id ? { ...item, ...c } : item)));
    dbUpdateCourse(id, c).catch((err) => console.error("Error updating course:", err));
    showToast("কোর্সের তথ্য সফলভাবে আপডেট হয়েছে!");
  };

  const deleteCourse = (id: string) => {
    setCourses((prev) => prev.filter((item) => item.id !== id));
    dbDeleteCourse(id).catch((err) => console.error("Error deleting course:", err));
    showToast("কোর্সটি সফলভাবে মুছে ফেলা হয়েছে!", "info");
  };

  const updateCourseButtons = (courseId: string, buttons: CourseButton[]) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === courseId ? { ...c, custom_buttons: buttons } : c))
    );
    dbUpdateCourse(courseId, { custom_buttons: buttons }).catch((err) => console.error(err));
    showToast("কোর্স অ্যাকশন বাটন কনফিগারেশন সংরক্ষিত হয়েছে!");
  };

  const getCourseExams = useCallback(
    (courseId: string): Exam[] => {
      const course = courses.find((c) => c.id === courseId);
      return exams.filter((ex) => {
        if (ex.course_id && ex.course_id === courseId) return true;
        if (course?.title && ex.title && ex.title.toLowerCase().includes(course.title.toLowerCase())) return true;
        if (course?.course_tag && ex.subject && ex.subject.toLowerCase().includes(course.course_tag.toLowerCase())) return true;
        return false;
      });
    },
    [courses, exams]
  );

  const getCourseQuestions = useCallback(
    (courseId: string): Question[] => {
      const courseExamsList = getCourseExams(courseId);
      const examIds = new Set(courseExamsList.map((e) => e.id));
      return questions.filter((q) => {
        if (q.exam_id && examIds.has(q.exam_id)) return true;
        if ((q as any).course_id && (q as any).course_id === courseId) return true;
        return false;
      });
    },
    [getCourseExams, questions]
  );

  const linkExamToCourse = useCallback(
    async (examId: string, courseId: string) => {
      setExams((prev) => prev.map((e) => (e.id === examId ? { ...e, course_id: courseId } : e)));
      const res = await dbUpdateExam(examId, { course_id: courseId });
      handleSupabaseNotice(res, "পরীক্ষা কোর্সে লিঙ্ক করা হয়েছে");
      showToast("কোর্সের সাথে পরীক্ষা সফলভাবে সংযুক্ত হয়েছে!", "success");
    },
    [handleSupabaseNotice, showToast]
  );

  // -------------------------------------------------------------
  // Subject Hub Actions
  // -------------------------------------------------------------
  const updateSubject = (id: string, sub: Partial<SubjectConfig>) => {
    setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, ...sub } : s)));
    showToast("বিষয় কনফিগারেশন আপডেট হয়েছে!");
  };

  const toggleSubjectActive = (id: string) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_active: !s.is_active } : s))
    );
    showToast("বিষয় সক্রিয়তা স্ট্যাটাস পরিবর্তিত হয়েছে!");
  };

  const toggleSubjectPremiumLock = (id: string) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_premium_only: !s.is_premium_only } : s))
    );
    showToast("বিষয় প্রিমিয়াম লক স্ট্যাটাস পরিবর্তিত হয়েছে!");
  };

  const addSubject = (sub: Omit<SubjectConfig, "id">): SubjectConfig => {
    const newSub: SubjectConfig = {
      ...sub,
      id: `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    setSubjects((prev) => [...prev, newSub]);
    showToast(`"${newSub.name_bn}" বিষয় সফলভাবে যুক্ত হয়েছে!`);
    return newSub;
  };

  // -------------------------------------------------------------
  // Job Circulars Actions
  // -------------------------------------------------------------
  const addJobCircular = (job: Omit<JobCircular, "id" | "created_at">): JobCircular => {
    const newJob: JobCircular = {
      ...job,
      id: `job-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setJobCirculars((prev) => [newJob, ...prev]);
    showToast("নিয়োগ বিজ্ঞপ্তি সফলভাবে প্রকাশ করা হয়েছে!");
    return newJob;
  };

  const updateJobCircular = (id: string, job: Partial<JobCircular>) => {
    setJobCirculars((prev) => prev.map((j) => (j.id === id ? { ...j, ...job } : j)));
    showToast("নিয়োগ বিজ্ঞপ্তি আপডেট করা হয়েছে!");
  };

  const deleteJobCircular = (id: string) => {
    setJobCirculars((prev) => prev.filter((j) => j.id !== id));
    showToast("নিয়োগ বিজ্ঞপ্তি মুছে ফেলা হয়েছে!", "info");
  };

  const toggleJobHot = (id: string) => {
    setJobCirculars((prev) =>
      prev.map((j) => (j.id === id ? { ...j, is_hot: !j.is_hot } : j))
    );
  };

  const toggleJobActive = (id: string) => {
    setJobCirculars((prev) =>
      prev.map((j) => (j.id === id ? { ...j, is_active: !j.is_active } : j))
    );
  };

  // -------------------------------------------------------------
  // Payments & Course Enrollments (course_enrollments table)
  // -------------------------------------------------------------
  const subscriptionPackages = appSettings.subscription_packages;

  const submitPayment = (p: {
    user_id: string;
    user_name: string;
    user_phone: string;
    sender_number: string;
    gateway: "bKash" | "Nagad" | "Rocket";
    trx_id: string;
    amount: number;
    plan_id: string;
    plan_name: string;
    screenshot_url?: string;
  }): PaymentTransaction => {
    const newP: PaymentTransaction = {
      id: `trx-${Date.now()}`,
      user_id: p.user_id,
      user_name: p.user_name,
      user_phone: p.user_phone,
      sender_number: p.sender_number,
      gateway: p.gateway,
      trx_id: p.trx_id,
      amount: p.amount,
      plan_id: p.plan_id as any,
      plan_name: p.plan_name,
      status: "pending",
      screenshot_url: p.screenshot_url,
      created_at: new Date().toISOString(),
    };

    setPayments((prev) => [newP, ...prev]);
    showToast("পেমেন্ট ভেরিফিকেশনের জন্য সাবমিট করা হয়েছে!");
    return newP;
  };

  const approvePayment = (paymentId: string, adminNote?: string) => {
    const target = payments.find((p) => p.id === paymentId);
    setPayments((prev) =>
      prev.map((p) =>
        p.id === paymentId
          ? {
              ...p,
              status: "approved",
              approved_at: new Date().toISOString(),
              admin_note: adminNote || p.admin_note,
            }
          : p
      )
    );

    // Asynchronously approve enrollment in Supabase
    dbApproveEnrollment(paymentId, currentAdminProfile?.id).catch((err) =>
      console.error("Error approving enrollment in Supabase:", err)
    );

    // If user exists, grant premium status
    if (target) {
      setProfiles((prev) =>
        prev.map((prof) =>
          prof.id === target.user_id || prof.phone === target.user_phone
            ? {
                ...prof,
                is_premium: true,
                subscription_plan: target.plan_id,
                subscription_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              }
            : prof
        )
      );
      if (target.user_id) {
        dbUpdateProfile(target.user_id, {
          is_premium: true,
          subscription_plan: target.plan_id,
          subscription_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }).catch((err) => console.error(err));
      }
    }

    showToast("অনুমোদন সফল হয়েছে! শিক্ষার্থীর কোর্স এক্সেস সক্রিয় করা হয়েছে।", "success");
  };

  const rejectPayment = (paymentId: string, adminNote?: string) => {
    setPayments((prev) =>
      prev.map((p) =>
        p.id === paymentId
          ? {
              ...p,
              status: "rejected",
              admin_note: adminNote || p.admin_note,
            }
          : p
      )
    );

    dbRejectEnrollment(paymentId, currentAdminProfile?.id, adminNote).catch((err) =>
      console.error("Error rejecting enrollment:", err)
    );

    showToast("আবেদন বাতিল করা হয়েছে।", "info");
  };

  const updateSubscriptionPackage = (pkgId: string, pkg: Partial<SubscriptionPackage>) => {
    setAppSettings((prev) => ({
      ...prev,
      subscription_packages: prev.subscription_packages.map((item) =>
        item.id === pkgId ? { ...item, ...pkg } : item
      ),
    }));
    showToast("প্যাকেজ রেট আপডেট হয়েছে!");
  };

  const manuallyActivateUser = (params: {
    phone: string;
    planId: string;
    months: number;
    fullName?: string;
  }): Profile => {
    const existing = profiles.find((p) => p.phone === params.phone);
    const expiryDate = new Date(Date.now() + params.months * 30 * 24 * 60 * 60 * 1000).toISOString();

    if (existing) {
      const updated = {
        ...existing,
        is_premium: true,
        subscription_plan: params.planId as any,
        subscription_expiry: expiryDate,
        full_name: params.fullName || existing.full_name,
      };
      setProfiles((prev) => prev.map((p) => (p.id === existing.id ? updated : p)));
      dbUpdateProfile(existing.id, updated).catch((err) => console.error(err));
      showToast(`শিক্ষার্থী (${params.phone}) সফলভাবে সক্রিয় করা হয়েছে!`);
      return updated;
    } else {
      const newProf: Profile = {
        id: `user-${Date.now()}`,
        phone: params.phone,
        full_name: params.fullName || `শিক্ষার্থী ${params.phone.slice(-4)}`,
        role: "student",
        is_active: true,
        is_premium: true,
        subscription_plan: params.planId as any,
        subscription_expiry: expiryDate,
        created_at: new Date().toISOString(),
      };
      setProfiles((prev) => [newProf, ...prev]);
      showToast(`নতুন শিক্ষার্থী (${params.phone}) তৈরি ও সক্রিয় করা হয়েছে!`);
      return newProf;
    }
  };

  // -------------------------------------------------------------
  // App Settings & Broadcasts
  // -------------------------------------------------------------
  const updateAppSettings = (settings: Partial<AppSettings>) => {
    setAppSettings((prev) => ({ ...prev, ...settings }));
    showToast("সিস্টেম কনফিগারেশন সংরক্ষিত হয়েছে!");
  };

  const broadcastEmergencyNotice = (
    message: string,
    type: "info" | "warning" | "alert" | "exam_alert"
  ) => {
    setAppSettings((prev) => ({
      ...prev,
      emergency_notice: {
        enabled: true,
        message,
        type,
      },
    }));
    showToast("জরুরি নোটিশ লাইভ অ্যাপে ব্রডকাস্ট করা হয়েছে!", "success");
  };

  const toggleLiveExamBanner = (examId: string, active: boolean) => {
    setAppSettings((prev) => ({
      ...prev,
      live_exam_broadcast_active: active,
      active_broadcast_exam_id: active ? examId : undefined,
    }));
    showToast(
      active
        ? "লাইভ মেগা পরীক্ষার জরুরি পপআপ নোটিশ সক্রিয় করা হয়েছে!"
        : "জরুরি নোটিশ নিষ্ক্রিয় করা হয়েছে।"
    );
  };

  const updateHomeBanner = (bannerId: string, banner: Partial<AppSettings["home_banners"][0]>) => {
    setAppSettings((prev) => ({
      ...prev,
      home_banners: prev.home_banners.map((b) => (b.id === bannerId ? { ...b, ...banner } : b)),
    }));
    showToast("ব্যানার আপডেট হয়েছে!");
  };

  const addHomeBanner = (banner: Omit<AppSettings["home_banners"][0], "id">) => {
    const newBanner = {
      ...banner,
      id: `banner-${Date.now()}`,
    };
    setAppSettings((prev) => ({
      ...prev,
      home_banners: [...prev.home_banners, newBanner],
    }));
    showToast("নতুন ব্যানার যুক্ত হয়েছে!");
  };

  const deleteHomeBanner = (bannerId: string) => {
    setAppSettings((prev) => ({
      ...prev,
      home_banners: prev.home_banners.filter((b) => b.id !== bannerId),
    }));
    showToast("ব্যানার মুছে ফেলা হয়েছে!", "info");
  };

  const resetAllData = () => {
    setSubjects(initialSubjects);
    setQuestions([]);
    setExams([]);
    setSubmissions([]);
    setCourses([]);
    setJobCirculars([]);
    setPayments([]);
    setEnrollments([]);
    setProfiles([]);
    setAppSettings(initialAppSettings);
    if (typeof window !== "undefined") {
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_questions`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_exams`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_courses`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_payments`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_enrollments`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_profiles`);
    }
    showToast("সকল ডাটা রিসেট করা হয়েছে!", "info");
  };

  return (
    <AdminDataContext.Provider
      value={{
        activeTab,
        setActiveTab,
        isDarkMode,
        setIsDarkMode,
        searchQuery,
        setSearchQuery,

        isSupabaseConnected,
        isLoadingSupabase,
        currentAdminProfile,
        refreshFromSupabase,

        hasRlsNotice,
        setHasRlsNotice,
        dismissRlsNotice,
        copyRlsFixSql,

        subjects,
        questions,
        exams,
        submissions,
        courses,
        jobCirculars,
        payments,
        enrollments,
        examResults,
        profiles,
        appSettings,

        addQuestion,
        addBulkQuestions,
        updateQuestion,
        deleteQuestion,

        addExam,
        updateExam,
        deleteExam,
        toggleExamStatus,
        publishExamResult,
        assignQuestionsToExam,
        autoPopulateExamQuestions,
        autoLinkAllEmptyExams,

        addCourse,
        updateCourse,
        deleteCourse,
        updateCourseButtons,
        getCourseExams,
        getCourseQuestions,
        linkExamToCourse,

        updateSubject,
        toggleSubjectActive,
        toggleSubjectPremiumLock,
        addSubject,

        addJobCircular,
        updateJobCircular,
        deleteJobCircular,
        toggleJobHot,
        toggleJobActive,

        subscriptionPackages,
        submitPayment,
        approvePayment,
        rejectPayment,
        updateSubscriptionPackage,
        manuallyActivateUser,

        updateAppSettings,
        broadcastEmergencyNotice,
        toggleLiveExamBanner,
        updateHomeBanner,
        addHomeBanner,
        deleteHomeBanner,

        isPreviewModalOpen,
        setIsPreviewModalOpen,
        previewExam,
        setPreviewExam,
        openExamInSimulator,
        isMobileDrawerOpen,
        setIsMobileDrawerOpen,

        toast,
        showToast,
        resetAllData,
      }}
    >
      {children}
    </AdminDataContext.Provider>
  );
};

export const useAdminData = () => {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error("useAdminData must be used within an AdminDataProvider");
  }
  return context;
};
