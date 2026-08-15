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
    appSettings,
    payments,
  } = useAdminData();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const pendingPayments = payments.filter((p) => p.status === "pending");

  const getTabTitle = () => {
    switch (activeTab) {
      case "dashboard":
        return { titleBn: "ড্যাশবোর্ড ওভারভিউ ও লাইভ অ্যানালিটিক্স", subtitle: "রিয়েল-টাইম পরিসংখ্যান ও দ্রুত নিয়ন্ত্রণ" };
      case "questions":
        return { titleBn: "প্রশ্ন ব্যাংক হাব (MCQ Management)", subtitle: "আরবি হরকত, বাংলা ও ইংরেজি প্রশ্ন ম্যানেজমেন্ট ও AI জেনারেটর" };
      case "exams":
        return { titleBn: "পরীক্ষা দিন কন্ট্রোলার (Exams & Model Tests)", subtitle: "লাইভ পরীক্ষা, সাপ্তাহিক মডেল টেস্ট ও নেগেটিভ মার্কিং নিয়ন্ত্রণ" };
      case "courses":
        return { titleBn: "কোর্স ও ব্যাচ ম্যানেজার (Course CMS)", subtitle: "কোর্সের বাটন, ভিডিও লেকচার, রুটিন ও পিডিএফ হ্যান্ডনোট" };
      case "subjects":
        return { titleBn: "বিষয়ভিত্তিক প্রস্তুতি কনফিগারেশন", subtitle: "১৫+ ইসলামিক ও জেনারেল বিষয়ের প্রিমিয়াম লক ও কনটেন্ট" };
      case "jobs":
        return { titleBn: "জব সার্কুলার ও বুলেটিন ম্যানেজার", subtitle: "শিক্ষক নিবন্ধন ও সরকারি মাদরাসার নিয়োগ বিজ্ঞপ্তি" };
      case "payments":
        return { titleBn: "পেমেন্ট ভেরিফিকেশন ও মেম্বারশিপ হাব", subtitle: "বিকাশ/নগদ TrxID যাচাই ও ১-ক্লিকে প্রিমিয়াম অ্যাক্টিভেশন" };
      case "app_customizer":
        return { titleBn: "গ্লোবাল অ্যাপ UI ও ডায়নামিক ব্যানার", subtitle: "হোম স্লাইডার, মারকুই নোটিশ ও সোশ্যাল চ্যানেল কনফিগ" };
      case "supabase_studio":
        return { titleBn: "Supabase ও PostgreSQL SQL স্টুডিও", subtitle: "ডাটাবেজ স্কিমা মাইগ্রেশন, RLS সিকিউরিটি ও ক্লাউড সিঙ্ক" };
      case "student_preview":
        return { titleBn: "শিক্ষার্থী মোবাইল অ্যাপ লাইভ সিমুলেটর", subtitle: "অ্যাডমিনের পরিবর্তনের বাস্তব ফলাফল মোবাইল প্রিভিউতে দেখুন" };
      default:
        return { titleBn: "তামরীন অ্যাডমিন সেন্ট্রাল", subtitle: "Command Center" };
    }
  };

  const currentTabInfo = getTabTitle();

  return (
    <header
      id="admin-header"
      className="h-18 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between gap-4 sticky top-0 z-20 transition-colors"
    >
      {/* Tab Title & Search */}
      <div className="flex items-center gap-6 flex-1 min-w-0">
        <div className="hidden lg:flex flex-col min-w-0">
          <h1 className="text-lg font-bold text-slate-800 dark:text-white truncate">
            {currentTabInfo.titleBn}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {currentTabInfo.subtitle}
          </p>
        </div>

        {/* Global Live Search */}
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="global-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="প্রশ্ন, পরীক্ষা, কোর্স বা TrxID খুঁজুন..."
            className="w-full pl-9.5 pr-4 py-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        {/* AI Quick Generator Button */}
        <button
          id="header-ai-gen-btn"
          onClick={onOpenAiGeneratorModal}
          className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer shadow-amber-500/20"
        >
          <Sparkles className="w-4 h-4 text-amber-100 animate-spin-slow" />
          <span>AI প্রশ্ন তৈরি</span>
        </button>

        {/* Emergency Broadcast Notice Button */}
        <button
          id="header-emergency-btn"
          onClick={onOpenEmergencyModal}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
            appSettings.emergency_notice.enabled
              ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800"
              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
          title="অ্যাপে জরুরি নোটিশ প্রচার"
        >
          <Megaphone className="w-4 h-4 text-rose-500 animate-bounce" />
          <span className="hidden md:inline">জরুরি নোটিশ</span>
        </button>

        {/* Student Mobile App Live Simulator Button */}
        <button
          id="header-simulator-btn"
          onClick={() => setIsPreviewModalOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm shadow-emerald-700/20 transition-all cursor-pointer"
          title="শিক্ষার্থী অ্যাপের লাইভ প্রিভিউ"
        >
          <Smartphone className="w-4 h-4 text-emerald-200" />
          <span className="hidden sm:inline">স্টুডেন্ট ভিউ</span>
        </button>

        {/* Dark Mode Toggle */}
        <button
          id="dark-mode-toggle-btn"
          onClick={() => setIsDarkMode((prev) => !prev)}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
          title={isDarkMode ? "লাইট মোড" : "ডার্ক মোড"}
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            id="notifications-btn"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 relative"
          >
            <Bell className="w-4 h-4" />
            {pendingPayments.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {pendingPayments.length}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-sm text-slate-800 dark:text-white">নোটিফিকেশন ও অ্যালার্ট</h3>
                <span className="text-xs text-emerald-600 font-semibold">{pendingPayments.length}টি পেন্ডিং</span>
              </div>
              <div className="py-2 space-y-2 max-h-64 overflow-y-auto">
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

        {/* Admin Profile Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-sm">
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
