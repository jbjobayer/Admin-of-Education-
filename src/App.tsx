import React, { useState } from "react";
import { AdminDataProvider, useAdminData } from "./context/AdminDataContext";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { BottomNav } from "./components/BottomNav";
import { DashboardOverview } from "./components/tabs/DashboardOverview";
import { QuestionBankHub } from "./components/tabs/QuestionBankHub";
import { ExamModelTestManager } from "./components/tabs/ExamModelTestManager";
import { CourseBatchManager } from "./components/tabs/CourseBatchManager";
import { SubjectConfigHub } from "./components/tabs/SubjectConfigHub";
import { JobCircularManager } from "./components/tabs/JobCircularManager";
import { PaymentSubscriptionManager } from "./components/tabs/PaymentSubscriptionManager";
import { GlobalAppCustomizer } from "./components/tabs/GlobalAppCustomizer";
import { SupabaseSqlStudio } from "./components/tabs/SupabaseSqlStudio";
import { StudentAppPreviewTab } from "./components/tabs/StudentAppPreviewTab";
import { LiveAppPreviewModal } from "./components/modals/LiveAppPreviewModal";
import { AiQuestionGeneratorModal } from "./components/modals/AiQuestionGeneratorModal";
import { EmergencyNoticeModal } from "./components/modals/EmergencyNoticeModal";
import { QuestionFormModal } from "./components/modals/QuestionFormModal";
import { BulkPasteParserModal } from "./components/modals/BulkPasteParserModal";
import { ExamFormModal } from "./components/modals/ExamFormModal";
import { CourseFormModal } from "./components/modals/CourseFormModal";
import { JobCircularModal } from "./components/modals/JobCircularModal";
import { Question, Exam, Course, JobCircular } from "./types";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

const AdminDashboardContent: React.FC = () => {
  const { activeTab, isDarkMode, toast, setIsPreviewModalOpen } = useAdminData();
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  // Additional CRUD Modals State
  const [isQuestionFormOpen, setIsQuestionFormOpen] = useState(false);
  const [questionToEdit, setQuestionToEdit] = useState<Question | null>(null);
  const [questionInitialExamId, setQuestionInitialExamId] = useState<string | undefined>(undefined);

  const [isBulkParserOpen, setIsBulkParserOpen] = useState(false);

  const [isExamFormOpen, setIsExamFormOpen] = useState(false);
  const [examToEdit, setExamToEdit] = useState<Exam | null>(null);
  const [examInitialCourseId, setExamInitialCourseId] = useState<string | undefined>(undefined);

  const [isCourseFormOpen, setIsCourseFormOpen] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null);

  const [isJobFormOpen, setIsJobFormOpen] = useState(false);
  const [jobToEdit, setJobToEdit] = useState<JobCircular | null>(null);

  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardOverview
            onOpenAiGenerator={() => setIsAiModalOpen(true)}
            onOpenEmergencyNotice={() => setIsEmergencyModalOpen(true)}
            onOpenNewQuestion={() => {
              setQuestionToEdit(null);
              setIsQuestionFormOpen(true);
            }}
            onOpenNewExam={() => {
              setExamToEdit(null);
              setIsExamFormOpen(true);
            }}
          />
        );
      case "questions":
        return (
          <QuestionBankHub
            onOpenManualForm={(q) => {
              setQuestionToEdit(q || null);
              setIsQuestionFormOpen(true);
            }}
            onOpenBulkParser={() => setIsBulkParserOpen(true)}
            onOpenAiGenerator={() => setIsAiModalOpen(true)}
          />
        );
      case "exams":
        return (
          <ExamModelTestManager
            onOpenExamForm={(e) => {
              setExamToEdit(e || null);
              setIsExamFormOpen(true);
            }}
            onOpenLiveSimulatorForExam={() => {
              setIsPreviewModalOpen(true);
            }}
          />
        );
      case "courses":
        return (
          <CourseBatchManager
            onOpenCourseForm={(c) => {
              setCourseToEdit(c || null);
              setIsCourseFormOpen(true);
            }}
            onOpenExamFormForCourse={(courseId) => {
              setExamToEdit(null);
              setExamInitialCourseId(courseId);
              setIsExamFormOpen(true);
            }}
          />
        );
      case "subjects":
        return <SubjectConfigHub />;
      case "jobs":
        return (
          <JobCircularManager
            onOpenJobForm={(j) => {
              setJobToEdit(j || null);
              setIsJobFormOpen(true);
            }}
          />
        );
      case "payments":
        return <PaymentSubscriptionManager />;
      case "app_customizer":
        return <GlobalAppCustomizer />;
      case "supabase_studio":
        return <SupabaseSqlStudio />;
      case "student_preview":
        return <StudentAppPreviewTab />;
      default:
        return <DashboardOverview
          onOpenAiGenerator={() => setIsAiModalOpen(true)}
          onOpenEmergencyNotice={() => setIsEmergencyModalOpen(true)}
          onOpenNewQuestion={() => {
            setQuestionToEdit(null);
            setIsQuestionFormOpen(true);
          }}
          onOpenNewExam={() => {
            setExamToEdit(null);
            setIsExamFormOpen(true);
          }}
        />;
    }
  };

  return (
    <div className={`min-h-screen flex ${isDarkMode ? "dark" : ""}`}>
      <div className="flex w-full bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen relative">
        {/* Main Collapsible Sidebar & Mobile Drawer */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          {/* Top Sticky Header */}
          <Header
            onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)}
            onOpenAiGeneratorModal={() => setIsAiModalOpen(true)}
          />

          {/* Main Tab Content View */}
          <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 lg:p-8 space-y-4 sm:space-y-6 pb-24 md:pb-8">
            {renderActiveTab()}
          </main>
        </div>

        {/* Mobile Sticky Bottom Navigation Bar */}
        <BottomNav />
      </div>

      {/* Global Modals */}
      <LiveAppPreviewModal />
      <AiQuestionGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />
      <EmergencyNoticeModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
      />
      <QuestionFormModal
        isOpen={isQuestionFormOpen}
        onClose={() => {
          setIsQuestionFormOpen(false);
          setQuestionToEdit(null);
          setQuestionInitialExamId(undefined);
        }}
        questionToEdit={questionToEdit}
        initialExamId={questionInitialExamId}
      />
      <BulkPasteParserModal
        isOpen={isBulkParserOpen}
        onClose={() => setIsBulkParserOpen(false)}
      />
      <ExamFormModal
        isOpen={isExamFormOpen}
        onClose={() => {
          setIsExamFormOpen(false);
          setExamToEdit(null);
          setExamInitialCourseId(undefined);
        }}
        examToEdit={examToEdit}
        initialCourseId={examInitialCourseId}
      />
      <CourseFormModal
        isOpen={isCourseFormOpen}
        onClose={() => {
          setIsCourseFormOpen(false);
          setCourseToEdit(null);
        }}
        courseToEdit={courseToEdit}
      />
      <JobCircularModal
        isOpen={isJobFormOpen}
        onClose={() => {
          setIsJobFormOpen(false);
          setJobToEdit(null);
        }}
        jobToEdit={jobToEdit}
      />

      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 left-4 sm:left-auto z-50 animate-in fade-in slide-in-from-bottom-5">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs sm:text-sm font-medium max-w-md mx-auto ${
              toast.type === "success"
                ? "bg-emerald-900 text-white border-emerald-700 shadow-emerald-950/40"
                : toast.type === "error"
                ? "bg-rose-900 text-white border-rose-700 shadow-rose-950/40"
                : "bg-slate-900 text-white border-slate-700 shadow-slate-950/40"
            }`}
          >
            {toast.type === "success" && (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            )}
            {toast.type === "error" && (
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            )}
            {toast.type === "info" && (
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />
            )}
            <span className="flex-1">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export function App() {
  return (
    <AdminDataProvider>
      <AdminDashboardContent />
    </AdminDataProvider>
  );
}

export default App;
