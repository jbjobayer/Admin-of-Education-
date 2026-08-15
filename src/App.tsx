import React, { useState } from "react";
import { AdminDataProvider, useAdminData } from "./context/AdminDataContext";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
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
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const AdminDashboardContent: React.FC = () => {
  const { activeTab, isDarkMode, toast } = useAdminData();
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardOverview />;
      case "questions":
        return <QuestionBankHub onOpenAiModal={() => setIsAiModalOpen(true)} />;
      case "exams":
        return <ExamModelTestManager />;
      case "courses":
        return <CourseBatchManager />;
      case "subjects":
        return <SubjectConfigHub />;
      case "jobs":
        return <JobCircularManager />;
      case "payments":
        return <PaymentSubscriptionManager />;
      case "app_customizer":
        return <GlobalAppCustomizer />;
      case "supabase_studio":
        return <SupabaseSqlStudio />;
      case "student_preview":
        return <StudentAppPreviewTab />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className={`min-h-screen flex ${isDarkMode ? "dark" : ""}`}>
      <div className="flex w-full bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen">
        {/* Main Collapsible Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          {/* Top Sticky Header */}
          <Header
            onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)}
            onOpenAiGeneratorModal={() => setIsAiModalOpen(true)}
          />

          {/* Main Tab Content View */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
            {renderActiveTab()}
          </main>
        </div>
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

      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm font-medium ${
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
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AdminDataProvider>
      <AdminDashboardContent />
    </AdminDataProvider>
  );
}
