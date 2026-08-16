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
import { getSupabaseClient, getSavedSupabaseConfig } from "../lib/supabase";
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

  // Course CRUD & Granular Buttons (courses table)
  addCourse: (c: Omit<Course, "id" | "created_at" | "enrolled_count">) => Course;
  updateCourse: (id: string, c: Partial<Course>) => void;
  deleteCourse: (id: string) => void;
  updateCourseButtons: (courseId: string, buttons: CourseButton[]) => void;

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
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Supabase Connection & Admin status
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);
  const [isLoadingSupabase, setIsLoadingSupabase] = useState<boolean>(false);
  const [currentAdminProfile, setCurrentAdminProfile] = useState<Profile | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

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
    const newQuestion: Question = {
      ...q,
      id: tempId,
      created_at: new Date().toISOString(),
      question: q.question_text || q.question,
      question_text: q.question_text || q.question,
      arabic_text: q.arabic_text || undefined,
      options: q.options || [q.option_a || "", q.option_b || "", q.option_c || "", q.option_d || ""],
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

    // Asynchronous Supabase Insert
    dbCreateQuestion(q)
      .then((res) => {
        if (res.error) {
          console.warn("Supabase insert notice:", res.error);
        } else if (res.data) {
          // Replace tempId with actual DB UUID
          setQuestions((prev) => prev.map((item) => (item.id === tempId ? res.data! : item)));
        }
      })
      .catch((err) => {
        console.error("Error creating question:", err);
      });

    showToast("প্রশ্ন সফলভাবে প্রশ্ন ব্যাংকে যুক্ত ও সংরক্ষিত হয়েছে!", "success");
    return newQuestion;
  };

  const addBulkQuestions = (qs: Omit<Question, "id" | "created_at">[]): number => {
    const tempPrefix = `q-bulk-${Date.now()}-`;
    const newItems: Question[] = qs.map((q, idx) => ({
      ...q,
      id: `${tempPrefix}${idx}`,
      created_at: new Date().toISOString(),
      question: q.question_text || q.question,
      question_text: q.question_text || q.question,
      arabic_text: q.arabic_text || undefined,
      options: q.options || [q.option_a || "", q.option_b || "", q.option_c || "", q.option_d || ""],
      correct_index: q.correct_index !== undefined ? q.correct_index : 0,
      topic: q.topic || "সাধারণ",
      subject_id: q.subject_id || "sub-1",
      subject_name: q.subject_name || "মাদ্রাসা কারিকুলাম",
      source: q.source || "",
      difficulty: q.difficulty || "Medium",
      exam_type: q.exam_type || "NTRCA",
      language: q.language || "bn",
    }));

    setQuestions((prev) => [...newItems, ...prev]);

    // Asynchronous Bulk Insert to Supabase
    dbCreateBulkQuestions(qs)
      .then((res) => {
        if (res.error) {
          console.warn("Supabase bulk insert notice:", res.error);
        } else if (res.data && res.data.length > 0) {
          setQuestions((prev) => {
            const tempIds = new Set(newItems.map((n) => n.id));
            const remaining = prev.filter((p) => !tempIds.has(p.id));
            return [...res.data!, ...remaining];
          });
        }
      })
      .catch((err) => {
        console.error("Error bulk creating questions:", err);
      });

    showToast(`${newItems.length}টি প্রশ্ন সফলভাবে যুক্ত ও সংরক্ষিত হয়েছে!`, "success");
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
          console.warn("Supabase question update notice:", res.error);
        } else if (res.data && res.data.id !== id) {
          setQuestions((prev) => prev.map((item) => (item.id === id ? res.data! : item)));
        }
      })
      .catch((err) => console.error("Error updating question:", err));

    showToast("প্রশ্ন সফলভাবে আপডেট ও সংরক্ষিত হয়েছে!", "success");
  };

  const deleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((item) => item.id !== id));

    // Asynchronous Supabase delete
    dbDeleteQuestion(id)
      .then((res) => {
        if (res.error) {
          console.warn("Supabase question delete notice:", res.error);
        }
      })
      .catch((err) => console.error("Error deleting question:", err));

    showToast("প্রশ্নটি সফলভাবে মুছে ফেলা হয়েছে!", "info");
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
          console.error("❌ Supabase Exam Creation Error:", res.errorObj || res.error);
          showToast(`Supabase এরর (${res.errorObj?.code || "Insert Failed"}): ${res.error}`, "error");
        } else if (res.data) {
          setExams((prev) => prev.map((e) => (e.id === tempId ? res.data! : e)));
          showToast("নতুন পরীক্ষা সফলভাবে Supabase ডাটাবেজে তৈরি ও সিঙ্ক হয়েছে!", "success");
        }
      })
      .catch((err) => {
        console.error("Error creating exam in Supabase:", err);
        showToast("পরীক্ষা তৈরি করার সময় অপ্রত্যাশিত ত্রুটি ঘটেছে।", "error");
      });

    return newExam;
  };

  const updateExam = (id: string, exam: Partial<Exam>) => {
    setExams((prev) => prev.map((e) => (e.id === id ? { ...e, ...exam } : e)));

    dbUpdateExam(id, exam)
      .then((res) => {
        if (res.error) {
          console.error("❌ Supabase Exam Update Error:", res.errorObj || res.error);
          showToast(`Supabase এরর (${res.errorObj?.code || "Update Failed"}): ${res.error}`, "error");
        } else {
          showToast("পরীক্ষার তথ্য Supabase ডাটাবেজে আপডেট করা হয়েছে!", "success");
        }
      })
      .catch((err) => console.error("Error updating exam:", err));
  };

  const deleteExam = (id: string) => {
    setExams((prev) => prev.filter((e) => e.id !== id));
    dbDeleteExam(id)
      .then((res) => {
        if (res.error) {
          console.error("❌ Supabase Exam Delete Error:", res.errorObj || res.error);
          showToast(`Supabase এরর (${res.errorObj?.code || "Delete Failed"}): ${res.error}`, "error");
        } else {
          showToast("পরীক্ষাটি Supabase ডাটাবেজ থেকে মুছে ফেলা হয়েছে!", "info");
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

        addCourse,
        updateCourse,
        deleteCourse,
        updateCourseButtons,

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
