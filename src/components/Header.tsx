import React, { useState } from "react";
import {
  Search,
  Megaphone,
  Smartphone,
  Moon,
  Sun,
  Database,
  Bell,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Menu,
  X,
} from "lucide-react";
import { useAdminData } from "../context/AdminDataContext";

interface HeaderProps {
  onOpenEmergencyModal: () => void;
  onOpenAiGeneratorModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenEmergencyModal,
  onOpenAiGeneratorModal,
}) => {
  const {
    activeTab,
    setActiveTab,
    isDarkMode,
    setIsDarkMode,
    searchQuery,
    setSearchQuery,
    setIsPreviewModalOpen,
    isMobileDrawerOpen,
    setIsMobileDrawerOpen,
    appSettings,
    payments,
  } = useAdminData();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSearchExpandedOnMobile, setIsSearchExpandedOnMobile] = useState(false);

  const pendingPayments = payments.filter((p) => p.status === "pending");

  const getTabTitle = () => {
    switch (activeTab) {
      case "dashboard":
        return { titleBn: "ড্যাশবোর্ড ওভারভিউ", subtitle: "রিয়েল-টাইম পরিসংখ্যান ও দ্রুত নিয়ন্ত্রণ" };
      case "questions":
        return { titleBn: "প্রশ্ন ব্যাংক হাব", subtitle: "আরবি হরকত, বাংলা ও ইংরেজি প্রশ্ন ম্যানেজমেন্ট" };
      case "exams":
        return { titleBn: "পরীক্ষা দিন কন্ট্রোলার", subtitle: "লাইভ পরীক্ষা, সাপ্তাহিক টেস্ট ও নেগেটিভ মার্কিং" };
      case "courses":
        return { titleBn: "কোর্স ও ব্যাচ ম্যানেজার", subtitle: "কোর্সের বাটন, ভিডিও লেকচার, রুটিন ও হ্যান্ডনোট" };
      case "subjects":
        return { titleBn: "বিষয়ভিত্তিক কনফিগারেশন", subtitle: "১৫+ ইসলামিক ও জেনারেল বিষয়ের প্রিমিয়াম লক" };
      case "jobs":
        return { titleBn: "জব সার্কুলার ও বুলেটিন", subtitle: "শিক্ষক নিবন্ধন ও সরকারি নিয়োগ বিজ্ঞপ্তি" };
      case "payments":
        return { titleBn: "পেমেন্ট ও মেম্বারশিপ", subtitle: "বিকাশ/নগদ TrxID যাচাই ও অ্যাক্টিভেশন" };
      case "app_customizer":
        return { titleBn: "অ্যাপ UI ও ডায়নামিক ব্যানার", subtitle: "হোম স্লাইডার, মারকুই নোটিশ ও কনফিগ" };
      case "supabase_studio":
        return { titleBn: "Supabase SQL স্টুডিও", subtitle: "ডাটাবেজ স্কিমা মাইগ্রেশন ও ক্লাউড সিঙ্ক" };
      case "student_preview":
        return { titleBn: "অ্যাপ লাইভ সিমুলেটর", subtitle: "শিক্ষার্থী মোবাইল অ্যাপ প্রিভিউ" };
      default:
        return { titleBn: "তামরীন অ্যাডমিন সেন্ট্রাল", subtitle: "Command Center" };
    }
  };

  const currentTabInfo = getTabTitle();

  return (
    <header
      id="admin-header"
      className="h-16 sm:h-18 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-20 transition-colors flex-shrink-0"
    >
      {/* Left Area: Mobile Drawer Toggle & Tab Title */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
        {/* Mobile Hamburger Drawer Toggle */}
        <button
          id="mobile-drawer-toggle-btn"
          onClick={() => setIsMobileDrawerOpen((prev) => !prev)}
          className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
        </button>

        {/* Tab Title (Desktop & Tablet) */}
        <div className="hidden lg:flex flex-col min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white truncate">
            {currentTabInfo.titleBn}
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {currentTabInfo.subtitle}
          </p>
        </div>

        {/* Global Live Search (Responsive) */}
        <div className="relative flex-1 max-w-xs sm:max-w-sm md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="global-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="খুঁজুন (প্রশ্ন, কোর্স, TrxID)..."
            className="w-full pl-8.5 pr-7 py-1.5 sm:py-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Right Area: Action Buttons & Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
        {/* AI Quick Generator Button */}
        <button
          id="header-ai-gen-btn"
          onClick={onOpenAiGeneratorModal}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer shadow-amber-500/20 min-h-[38px]"
        >
          <Sparkles className="w-4 h-4 text-amber-100" />
          <span className="hidden md:inline">AI প্রশ্ন তৈরি</span>
        </button>

        {/* Emergency Broadcast Notice Button */}
        <button
          id="header-emergency-btn"
          onClick={onOpenEmergencyModal}
          className={`inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border min-h-[38px] ${
            appSettings.emergency_notice.enabled
              ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800"
              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
          title="অ্যাপে জরুরি নোটিশ প্রচার"
        >
          <Megaphone className="w-4 h-4 text-rose-500 flex-shrink-0" />
          <span className="hidden lg:inline">জরুরি নোটিশ</span>
        </button>

        {/* Student Mobile App Live Simulator Button */}
        <button
          id="header-simulator-btn"
          onClick={() => setIsPreviewModalOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm shadow-emerald-700/20 transition-all cursor-pointer min-h-[38px]"
          title="শিক্ষার্থী অ্যাপের লাইভ প্রিভিউ"
        >
          <Smartphone className="w-4 h-4 text-emerald-100 flex-shrink-0" />
          <span className="hidden md:inline">লাইভ অ্যাপ</span>
        </button>

        {/* Dark Mode Toggle */}
        <button
          id="dark-mode-toggle-btn"
          onClick={() => setIsDarkMode((prev) => !prev)}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 min-w-[38px] min-h-[38px] flex items-center justify-center"
          title={isDarkMode ? "লাইট মোড" : "ডার্ক মোড"}
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            id="notifications-btn"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 relative min-w-[38px] min-h-[38px] flex items-center justify-center"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {pendingPayments.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {pendingPayments.length}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-full mt-1 w-[calc(100vw-16px)] sm:w-80 max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-sm text-slate-800 dark:text-white">নোটিফিকেশন ও অ্যালার্ট</h3>
                <span className="text-xs text-emerald-600 font-semibold">{pendingPayments.length}টি পেন্ডিং</span>
              </div>
              <div className="py-2 space-y-2 max-h-64 overflow-y-auto overscroll-contain">
                {pendingPayments.length > 0 ? (
                  pendingPayments.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setActiveTab("payments");
                        setIsNotificationsOpen(false);
                      }}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer transition-colors border border-slate-200/60 dark:border-slate-700/60"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-100">{p.user_name}</span>
                        <span className="text-emerald-600 font-bold">৳{p.amount}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {p.gateway} TrxID: <span className="font-mono">{p.trx_id}</span> ({p.plan_name})
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-slate-400">
                    কোনো নতুন পেন্ডিং অ্যালার্ট নেই
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Admin Avatar Pill */}
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
            অ
          </div>
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">সুপার অ্যাডমিন</span>
            <span className="text-[10px] text-emerald-600 font-semibold">তামরীন টিম</span>
          </div>
        </div>
      </div>
    </header>
  );
};
