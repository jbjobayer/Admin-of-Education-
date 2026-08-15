import React from "react";
import {
  LayoutDashboard,
  HelpCircle,
  FileCheck,
  CreditCard,
  Smartphone,
  Menu,
} from "lucide-react";
import { useAdminData, AdminTab } from "../context/AdminDataContext";

export const BottomNav: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    payments,
    setIsPreviewModalOpen,
    isMobileDrawerOpen,
    setIsMobileDrawerOpen,
  } = useAdminData();

  const pendingPaymentsCount = payments.filter((p) => p.status === "pending").length;

  const quickNavItems: {
    id: AdminTab | "simulator" | "menu";
    label: string;
    icon: React.ReactNode;
    badge?: number;
    action: () => void;
    isActive: boolean;
  }[] = [
    {
      id: "dashboard",
      label: "ড্যাশবোর্ড",
      icon: <LayoutDashboard className="w-5 h-5" />,
      action: () => setActiveTab("dashboard"),
      isActive: activeTab === "dashboard",
    },
    {
      id: "questions",
      label: "প্রশ্ন ব্যাংক",
      icon: <HelpCircle className="w-5 h-5" />,
      action: () => setActiveTab("questions"),
      isActive: activeTab === "questions",
    },
    {
      id: "exams",
      label: "পরীক্ষা",
      icon: <FileCheck className="w-5 h-5" />,
      action: () => setActiveTab("exams"),
      isActive: activeTab === "exams",
    },
    {
      id: "payments",
      label: "পেমেন্ট",
      icon: <CreditCard className="w-5 h-5" />,
      badge: pendingPaymentsCount > 0 ? pendingPaymentsCount : undefined,
      action: () => setActiveTab("payments"),
      isActive: activeTab === "payments",
    },
    {
      id: "simulator",
      label: "প্রিভিউ",
      icon: <Smartphone className="w-5 h-5" />,
      action: () => setIsPreviewModalOpen(true),
      isActive: activeTab === "student_preview",
    },
    {
      id: "menu",
      label: "মেনু",
      icon: <Menu className="w-5 h-5" />,
      action: () => setIsMobileDrawerOpen((prev) => !prev),
      isActive: isMobileDrawerOpen,
    },
  ];

  return (
    <nav
      id="mobile-bottom-nav"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-1.5 shadow-lg shadow-black/10 transition-colors"
      style={{ paddingBottom: "max(6px, env(safe-area-inset-bottom))" }}
    >
      <div className="grid grid-cols-6 gap-1 max-w-lg mx-auto">
        {quickNavItems.map((item) => (
          <button
            key={item.id}
            onClick={item.action}
            className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all duration-150 relative cursor-pointer ${
              item.isActive
                ? "text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50/80 dark:bg-emerald-950/50"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <div className="relative">
              {item.icon}
              {item.badge !== undefined && (
                <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] leading-tight mt-0.5 truncate max-w-full text-center">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
};
