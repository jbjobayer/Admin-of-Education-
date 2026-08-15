import React, { createContext, useContext, useState, useEffect } from "react";
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

interface AdminDataContextType {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Data Collections
  subjects: SubjectConfig[];
  questions: Question[];
  exams: Exam[];
  submissions: ExamSubmission[];
  courses: Course[];
  jobCirculars: JobCircular[];
  payments: PaymentTransaction[];
  profiles: Profile[];
  appSettings: AppSettings;

  // Question CRUD
  addQuestion: (q: Omit<Question, "id" | "created_at">) => Question;
  addBulkQuestions: (qs: Omit<Question, "id" | "created_at">[]) => number;
  updateQuestion: (id: string, q: Partial<Question>) => void;
  deleteQuestion: (id: string) => void;

  // Exam CRUD
  addExam: (exam: Omit<Exam, "id" | "created_at" | "participant_count">) => Exam;
  updateExam: (id: string, exam: Partial<Exam>) => void;
  deleteExam: (id: string) => void;
  toggleExamStatus: (id: string) => void;
  publishExamResult: (id: string) => void;

  // Course CRUD & Granular Buttons
  addCourse: (c: Omit<Course, "id" | "created_at" | "enrolled_count">) => Course;
  updateCourse: (id: string, c: Partial<Course>) => void;
  deleteCourse: (id: string) => void;
  updateCourseButtons: (courseId: string, buttons: CourseButton[]) => void;

  // Subject Hub
  updateSubject: (id: string, sub: Partial<SubjectConfig>) => void;
  toggleSubjectActive: (id: string) => void;
  toggleSubjectPremiumLock: (id: string) => void;
  addSubject: (sub: Omit<SubjectConfig, "id">) => void;

  // Job Circulars
  addJobCircular: (job: Omit<JobCircular, "id" | "created_at">) => JobCircular;
  updateJobCircular: (id: string, job: Partial<JobCircular>) => void;
  deleteJobCircular: (id: string) => void;
  toggleJobHot: (id: string) => void;
  toggleJobActive: (id: string) => void;

  // Payments & Subscription Management
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

  // Preview Modal
  isPreviewModalOpen: boolean;
  setIsPreviewModalOpen: (open: boolean) => void;

  // Notification Toast Helper
  toast: { message: string; type: "success" | "error" | "info" } | null;
  showToast: (message: string, type?: "success" | "error" | "info") => void;

  // Reset to initial mock data
  resetAllData: () => void;
}

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "tamreen_admin_data_v1";

export const AdminDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("tamreen_dark_mode") === "true";
    }
    return false;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

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
  const [profiles, setProfiles] = useState<Profile[]>(() => {
    return loadLocal("profiles", initialProfiles);
  });
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    return loadLocal("appSettings", initialAppSettings);
  });

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

  // Save to localStorage when state changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_subjects`, JSON.stringify(subjects));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_questions`, JSON.stringify(questions));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_exams`, JSON.stringify(exams));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_submissions`, JSON.stringify(submissions));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_courses`, JSON.stringify(courses));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_jobCirculars`, JSON.stringify(jobCirculars));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_payments`, JSON.stringify(payments));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_profiles`, JSON.stringify(profiles));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_appSettings`, JSON.stringify(appSettings));
  }, [subjects, questions, exams, submissions, courses, jobCirculars, payments, profiles, appSettings]);

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

  // Question Actions
  const addQuestion = (q: Omit<Question, "id" | "created_at">): Question => {
    const newQuestion: Question = {
      ...q,
      id: `q-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
    };
    setQuestions((prev) => [newQuestion, ...prev]);

    // Update subject question count
    setSubjects((prev) =>
      prev.map((s) => (s.id === q.subject_id ? { ...s, question_count: s.question_count + 1 } : s))
    );

    showToast("প্রশ্ন সফলভাবে প্রশ্ন ব্যাংকে যুক্ত করা হয়েছে!");
    return newQuestion;
  };

  const addBulkQuestions = (qs: Omit<Question, "id" | "created_at">[]): number => {
    const newItems: Question[] = qs.map((q, idx) => ({
      ...q,
      id: `q-bulk-${Date.now()}-${idx}`,
      created_at: new Date().toISOString(),
    }));
    setQuestions((prev) => [...newItems, ...prev]);
    showToast(`${newItems.length}টি প্রশ্ন সফলভাবে যুক্ত হয়েছে!`);
    return newItems.length;
  };

  const updateQuestion = (id: string, q: Partial<Question>) => {
    setQuestions((prev) => prev.map((item) => (item.id === id ? { ...item, ...q } : item)));
    showToast("প্রশ্ন সফলভাবে আপডেট করা হয়েছে!");
  };

  const deleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((item) => item.id !== id));
    showToast("প্রশ্ন সফলভাবে মুছে ফেলা হয়েছে!", "info");
  };

  // Exam Actions
  const addExam = (exam: Omit<Exam, "id" | "created_at" | "participant_count">): Exam => {
    const newExam: Exam = {
      ...exam,
      id: `exam-${Date.now()}`,
      participant_count: 0,
      created_at: new Date().toISOString(),
    };
    setExams((prev) => [newExam, ...prev]);
    showToast("নতুন মডেল টেস্ট/পরীক্ষা তৈরি সম্পন্ন হয়েছে!");
    return newExam;
  };

  const updateExam = (id: string, exam: Partial<Exam>) => {
    setExams((prev) => prev.map((item) => (item.id === id ? { ...item, ...exam } : item)));
    showToast("পরীক্ষার তথ্য ও প্যারামিটার আপডেট করা হয়েছে!");
  };

  const deleteExam = (id: string) => {
    setExams((prev) => prev.filter((item) => item.id !== id));
    showToast("পরীক্ষা মুছে ফেলা হয়েছে!", "info");
  };

  const toggleExamStatus = (id: string) => {
    setExams((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextStatus = item.status === "live" ? "upcoming" : "live";
        return { ...item, status: nextStatus };
      })
    );
    showToast("পরীক্ষার স্ট্যাটাস পরিবর্তিত হয়েছে!");
  };

  const publishExamResult = (id: string) => {
    setExams((prev) =>
      prev.map((item) => (item.id === id ? { ...item, result_published: true, status: "completed" } : item))
    );
    showToast("পরীক্ষার ফলাফল ও মেরিট তালিকা প্রকাশ করা হয়েছে!");
  };

  // Course Actions
  const addCourse = (c: Omit<Course, "id" | "created_at" | "enrolled_count">): Course => {
    const newCourse: Course = {
      ...c,
      id: `crs-${Date.now()}`,
      enrolled_count: 0,
      created_at: new Date().toISOString(),
    };
    setCourses((prev) => [newCourse, ...prev]);
    showToast("নতুন কোর্স ও ব্যাচ যুক্ত করা হয়েছে!");
    return newCourse;
  };

  const updateCourse = (id: string, c: Partial<Course>) => {
    setCourses((prev) => prev.map((item) => (item.id === id ? { ...item, ...c } : item)));
    showToast("কোর্সের তথ্য সফলভাবে আপডেট হয়েছে!");
  };

  const deleteCourse = (id: string) => {
    setCourses((prev) => prev.filter((item) => item.id !== id));
    showToast("কোর্স মুছে ফেলা হয়েছে!", "info");
  };

  const updateCourseButtons = (courseId: string, buttons: CourseButton[]) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === courseId ? { ...c, custom_buttons: buttons } : c))
    );
    showToast("কোর্সের বাটন কনফিগারেশন আপডেট করা হয়েছে!");
  };

  // Subject Actions
  const updateSubject = (id: string, sub: Partial<SubjectConfig>) => {
    setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, ...sub } : s)));
    showToast("বিষয় কনফিগারেশন আপডেট করা হয়েছে!");
  };

  const toggleSubjectActive = (id: string) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_active: !s.is_active } : s))
    );
    showToast("বিষয়ের দৃশ্যমানতা টগল করা হয়েছে!");
  };

  const toggleSubjectPremiumLock = (id: string) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_premium_only: !s.is_premium_only } : s))
    );
    showToast("প্রিমিয়াম লক টগল করা হয়েছে!");
  };

  const addSubject = (sub: Omit<SubjectConfig, "id">) => {
    const newSub: SubjectConfig = {
      ...sub,
      id: `sub-${Date.now()}`,
    };
    setSubjects((prev) => [...prev, newSub]);
    showToast("নতুন বিষয় যুক্ত করা হয়েছে!");
  };

  // Job Circular Actions
  const addJobCircular = (job: Omit<JobCircular, "id" | "created_at">): JobCircular => {
    const newJob: JobCircular = {
      ...job,
      id: `job-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setJobCirculars((prev) => [newJob, ...prev]);
    showToast("নতুন জব সার্কুলার যুক্ত করা হয়েছে!");
    return newJob;
  };

  const updateJobCircular = (id: string, job: Partial<JobCircular>) => {
    setJobCirculars((prev) => prev.map((item) => (item.id === id ? { ...item, ...job } : item)));
    showToast("জব সার্কুলার আপডেট হয়েছে!");
  };

  const deleteJobCircular = (id: string) => {
    setJobCirculars((prev) => prev.filter((item) => item.id !== id));
    showToast("জব সার্কুলার মুছে ফেলা হয়েছে!", "info");
  };

  const toggleJobHot = (id: string) => {
    setJobCirculars((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_hot: !item.is_hot } : item))
    );
    showToast("হট সার্কুলার ফ্ল্যাগ পরিবর্তিত হয়েছে!");
  };

  const toggleJobActive = (id: string) => {
    setJobCirculars((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_active: !item.is_active } : item))
    );
    showToast("সার্কুলারের দৃশ্যমানতা পরিবর্তিত হয়েছে!");
  };

  // Payment Verification & User Activation
  const approvePayment = (paymentId: string, adminNote?: string) => {
    const payment = payments.find((p) => p.id === paymentId);
    if (!payment) return;

    const now = new Date();
    // Calculate expiry date based on plan
    let expiryDays = 30;
    if (payment.plan_id === "quarterly") expiryDays = 90;
    if (payment.plan_id === "half_yearly") expiryDays = 180;
    if (payment.plan_id === "yearly") expiryDays = 365;

    const expiryDate = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000).toISOString();

    setPayments((prev) =>
      prev.map((p) =>
        p.id === paymentId
          ? {
              ...p,
              status: "approved",
              admin_note: adminNote || "TrxID ভেরিফাইড। অ্যাকাউন্ট প্রিমিয়াম এক্টিভেট করা হয়েছে।",
              approved_at: now.toISOString(),
            }
          : p
      )
    );

    // Update user profile or create if not exists
    setProfiles((prev) => {
      const userExists = prev.some((u) => u.id === payment.user_id || u.phone === payment.user_phone);
      if (userExists) {
        return prev.map((u) =>
          u.id === payment.user_id || u.phone === payment.user_phone
            ? {
                ...u,
                is_premium: true,
                subscription_plan: payment.plan_id,
                subscription_expiry: expiryDate,
              }
            : u
        );
      } else {
        const newProfile: Profile = {
          id: payment.user_id || `usr-${Date.now()}`,
          full_name: payment.user_name,
          phone: payment.user_phone,
          role: "student",
          is_premium: true,
          subscription_plan: payment.plan_id,
          subscription_expiry: expiryDate,
          created_at: now.toISOString(),
        };
        return [...prev, newProfile];
      }
    });

    showToast(`পেমেন্ট অনুমোদিত! ${payment.user_name} এর জন্য ${payment.plan_name} সক্রিয় হয়েছে।`);
  };

  const rejectPayment = (paymentId: string, adminNote?: string) => {
    setPayments((prev) =>
      prev.map((p) =>
        p.id === paymentId
          ? {
              ...p,
              status: "rejected",
              admin_note: adminNote || "TrxID সঠিক পাওয়া যায়নি।",
            }
          : p
      )
    );
    showToast("পেমেন্ট বাতিল করা হয়েছে।", "error");
  };

  const updateSubscriptionPackage = (pkgId: string, pkg: Partial<SubscriptionPackage>) => {
    setAppSettings((prev) => ({
      ...prev,
      subscription_packages: prev.subscription_packages.map((item) =>
        item.id === pkgId ? { ...item, ...pkg } : item
      ),
    }));
    showToast("সাবস্ক্রিপশন প্যাকেজের মূল্য ও ফিচার আপডেট হয়েছে!");
  };

  const manuallyActivateUser = (params: {
    phone: string;
    planId: string;
    months: number;
    fullName?: string;
  }): Profile => {
    const now = new Date();
    const expiryDate = new Date(now.getTime() + params.months * 30 * 24 * 60 * 60 * 1000).toISOString();

    let targetProfile: Profile | null = null;

    setProfiles((prev) => {
      const idx = prev.findIndex((p) => p.phone === params.phone);
      if (idx >= 0) {
        const updated = {
          ...prev[idx],
          is_premium: true,
          subscription_plan: params.planId as any,
          subscription_expiry: expiryDate,
          full_name: params.fullName || prev[idx].full_name,
        };
        targetProfile = updated;
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      } else {
        const created: Profile = {
          id: `usr-${Date.now()}`,
          full_name: params.fullName || `শিক্ষার্থী (${params.phone.slice(-4)})`,
          phone: params.phone,
          role: "student",
          is_premium: true,
          subscription_plan: params.planId as any,
          subscription_expiry: expiryDate,
          created_at: now.toISOString(),
        };
        targetProfile = created;
        return [...prev, created];
      }
    });

    showToast(`শিক্ষার্থী ${params.phone} এর জন্য প্রিমিয়াম এক্টিভেশন সম্পন্ন!`);
    return targetProfile!;
  };

  // App Settings Actions
  const updateAppSettings = (settings: Partial<AppSettings>) => {
    setAppSettings((prev) => ({ ...prev, ...settings }));
    showToast("অ্যাপের গ্লোবাল সেটিংস সংরক্ষিত হয়েছে!");
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
    showToast("জরুরি নোটিশ লাইভ অ্যাপে প্রচার করা হয়েছে!");
  };

  const toggleLiveExamBanner = (examId: string, active: boolean) => {
    setAppSettings((prev) => ({
      ...prev,
      live_exam_broadcast_active: active,
      active_broadcast_exam_id: active ? examId : undefined,
    }));
    showToast(active ? "লাইভ পরীক্ষা ব্যানার এক্টিভেট হয়েছে!" : "ব্যানার বন্ধ করা হয়েছে।");
  };

  const updateHomeBanner = (bannerId: string, banner: Partial<AppSettings["home_banners"][0]>) => {
    setAppSettings((prev) => ({
      ...prev,
      home_banners: prev.home_banners.map((b) => (b.id === bannerId ? { ...b, ...banner } : b)),
    }));
    showToast("হোম ব্যানার সফলভাবে আপডেট করা হয়েছে!");
  };

  const addHomeBanner = (banner: Omit<AppSettings["home_banners"][0], "id">) => {
    const newBanner = {
      ...banner,
      id: `bnr-${Date.now()}`,
    };
    setAppSettings((prev) => ({
      ...prev,
      home_banners: [...prev.home_banners, newBanner],
    }));
    showToast("নতুন হোম ব্যানার যুক্ত করা হয়েছে!");
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
    setQuestions(initialQuestions);
    setExams(initialExams);
    setSubmissions(initialSubmissions);
    setCourses(initialCourses);
    setJobCirculars(initialJobCirculars);
    setPayments(initialPayments);
    setProfiles(initialProfiles);
    setAppSettings(initialAppSettings);
    showToast("সকল ডেমো ডেটা সফলভাবে রিস্টোর করা হয়েছে!");
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
        subjects,
        questions,
        exams,
        submissions,
        courses,
        jobCirculars,
        payments,
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
