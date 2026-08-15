import React, { useState } from "react";
import {
  LayoutDashboard,
  HelpCircle,
  FileCheck,
  BookOpen,
  FolderTree,
  Briefcase,
  CreditCard,
  Sliders,
  Database,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  X,
} from "lucide-react";
import { useAdminData, AdminTab } from "../context/AdminDataContext";

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    payments,
    exams,
    resetAllData,
    isMobileDrawerOpen,
    setIsMobileDrawerOpen,
  } = useAdminData();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const pendingPaymentsCount = payments.filter((p) => p.status === "pending").length;
  const liveExamsCount = exams.filter((e) => e.status === "live").length;

  const navItems: {
    id: AdminTab;
    labelBn: string;
    labelEn: string;
    icon: React.ReactNode;
    badge?: number | string;
    badgeColor?: string;
  }[] = [
    {
      id: "dashboard",
      labelBn: "ড্যাশবোর্ড ওভারভিউ",
      labelEn: "Dashboard Overview",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: "questions",
      labelBn: "প্রশ্ন ব্যাংক হাব",
      labelEn: "Question Bank (MCQ)",
      icon: <HelpCircle className="w-5 h-5" />,
    },
    {
      id: "exams",
      labelBn: "পরীক্ষা দিন কন্ট্রোলার",
      labelEn: "Exams & Model Tests",
      icon: <FileCheck className="w-5 h-5" />,
      badge: liveExamsCount > 0 ? `${liveExamsCount} লাইভ` : undefined,
      badgeColor: "bg-amber-500 text-white animate-pulse",
    },
    {
      id: "courses",
      labelBn: "কোর্স ও ব্যাচ ম্যানেজার",
      labelEn: "Courses & Routine",
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      id: "subjects",
      labelBn: "বিষয়ভিত্তিক কনফিগ",
      labelEn: "Subject-wise Hub",
      icon: <FolderTree className="w-5 h-5" />,
    },
    {
      id: "jobs",
      labelBn: "জব সার্কুলার ও বুলেটিন",
      labelEn: "Job Circulars",
      icon: <Briefcase className="w-5 h-5" />,
    },
    {
      id: "payments",
      labelBn: "পেমেন্ট ও মেম্বারশিপ",
      labelEn: "Payments & Subscriptions",
      icon: <CreditCard className="w-5 h-5" />,
      badge: pendingPaymentsCount > 0 ? pendingPaymentsCount : undefined,
      badgeColor: "bg-rose-500 text-white",
    },
    {
      id: "app_customizer",
      labelBn: "ডায়নামিক ব্যানার ও UI",
      labelEn: "App UI & Banners",
      icon: <Sliders className="w-5 h-5" />,
    },
    {
      id: "supabase_studio",
      labelBn: "Supabase ও SQL স্টুডিও",
      labelEn: "Supabase & Database",
      icon: <Database className="w-5 h-5" />,
    },
    {
      id: "student_preview",
      labelBn: "অ্যাপ লাইভ সিমুলেটর",
      labelEn: "Student App Preview",
      icon: <Smartphone className="w-5 h-5" />,
      badge: "লাইভ",
      badgeColor: "bg-emerald-600 text-white",
    },
  ];

  const handleSelectTab = (tabId: AdminTab) => {
    setActiveTab(tabId);
    if (isMobileDrawerOpen) {
      setIsMobileDrawerOpen(false);
    }
  };

  const navContent = (collapsed: boolean, isMobile: boolean = false) => (
    <div className="flex flex-col h-full bg-emerald-950 text-slate-100">
      {/* Brand Header */}
      <div className="h-18 flex items-center justify-between px-4 border-b border-emerald-900/50 flex-shrink-0">
        {!collapsed || isMobile ? (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-emerald-900/40 font-bold text-xl flex-shrink-0">
              ت
            </div>
            <div className="flex flex-col truncate">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-emerald-100 tracking-tight">তামরীন</span>
                <span className="text-xs bg-amber-500/20 text-amber-300 font-semibold px-1.5 py-0.5 rounded border border-amber-500/30">
                  CMS
                </span>
              </div>
              <span className="text-[11px] text-emerald-400/80 truncate font-mono">
                Admin Command Center
              </span>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-amber-500 flex items-center justify-center text-white font-bold text-xl">
            ت
          </div>
        )}

        {isMobile ? (
          <button
            onClick={() => setIsMobileDrawerOpen(false)}
            className="p-2 rounded-xl bg-emerald-900/60 hover:bg-emerald-900 text-emerald-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          <button
            id="sidebar-toggle-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-emerald-900/80 text-emerald-400 hover:text-white transition-colors cursor-pointer"
            title={isCollapsed ? "প্রসারিত করুন" : "সংকুচিত করুন"}
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 overscroll-contain">
        {(!collapsed || isMobile) && (
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-emerald-400/60 font-mono">
            ম্যানেজমেন্ট ও কন্ট্রোল
          </div>
        )}

        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              id={`nav-item-${item.id}`}
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200 cursor-pointer group min-h-[44px] ${
                isActive
                  ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold shadow-md shadow-emerald-950/40"
                  : "text-emerald-100/80 hover:bg-emerald-900/60 hover:text-white"
              }`}
              title={item.labelBn}
            >
              <div
                className={`flex-shrink-0 transition-transform duration-200 ${
                  isActive ? "text-amber-300 scale-105" : "text-emerald-400 group-hover:text-amber-300"
                }`}
              >
                {item.icon}
              </div>

              {(!collapsed || isMobile) && (
                <div className="flex-1 flex items-center justify-between truncate">
                  <div className="flex flex-col truncate">
                    <span className="text-sm truncate leading-snug">{item.labelBn}</span>
                    <span className="text-[10px] text-emerald-400/70 truncate">{item.labelEn}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${
                        item.badgeColor || "bg-emerald-800 text-emerald-200"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer System Status */}
      <div className="p-3 border-t border-emerald-900/50 bg-emerald-950/60 flex-shrink-0">
        {!collapsed || isMobile ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-emerald-300/80">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-mono">সার্ভার: অনলাইন</span>
              </div>
              <span className="text-[10px] bg-emerald-900/80 text-amber-300 px-1.5 py-0.5 rounded font-mono">
                v2.4.0
              </span>
            </div>

            <button
              id="reset-demo-data-btn"
              onClick={() => {
                if (confirm("আপনি কি সমস্ত ডেমো ডেটা রিসেট করতে চান?")) {
                  resetAllData();
                }
              }}
              className="w-full text-[11px] flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-emerald-900/40 hover:bg-emerald-900 text-emerald-300 hover:text-white transition-colors cursor-pointer border border-emerald-800/40 min-h-[38px]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>রিসেট ডেমো ডেটা</span>
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside
        id="admin-sidebar"
        className={`hidden md:flex transition-all duration-300 ease-in-out flex-col flex-shrink-0 border-r border-emerald-900/60 z-30 h-screen ${
          isCollapsed ? "w-20" : "w-72"
        }`}
      >
        {navContent(isCollapsed, false)}
      </aside>

      {/* Mobile Drawer (Visible when isMobileDrawerOpen is true on < md) */}
      {isMobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-4/5 max-w-xs h-full z-50 shadow-2xl animate-in slide-in-from-left duration-200">
            {navContent(false, true)}
          </div>
        </div>
      )}
    </>
  );
};
